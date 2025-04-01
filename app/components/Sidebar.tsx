'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { NodeType, EdgeType, Column, ERDNode } from '../utils/types';
import DDLGenerator from '../utils/DDLGenerator';
import TableForm from './TableForm';
import AIPrompt from './AIPrompt';
import SnowflakeConnection from './SnowflakeConnection';
import { Editor } from '@monaco-editor/react';

interface SidebarProps {
  nodes: ERDNode[];
  setNodes: (nodes: ERDNode[]) => void;
  edges: EdgeType[];
  setEdges: (edges: EdgeType[]) => void;
  ddl: string;
  setDDL: (ddl: string) => void;
  setActiveTab?: (tab: 'erd' | 'ddl') => void;
}

export default function Sidebar({ nodes, setNodes, edges, setEdges, ddl, setDDL, setActiveTab }: SidebarProps) {
  const [activeTab, setActiveTabState] = useState<'tables' | 'ai' | 'import' | 'export' | 'snowflake'>('tables');
  const [showCreateTable, setShowCreateTable] = useState(false);
  const [importDDL, setImportDDL] = useState('');
  const [importJson, setImportJson] = useState('');
  const [editableDDL, setEditableDDL] = useState(ddl);
  const [showNewTableForm, setShowNewTableForm] = useState(false);
  const [editingTable, setEditingTable] = useState<NodeType | null>(null);
  const [isEditorDirty, setIsEditorDirty] = useState(false);
  
  // Keep the editable DDL in sync with the actual DDL
  useEffect(() => {
    setEditableDDL(ddl);
  }, [ddl]);
  
  // Filter nodes to only include tables
  const tables = useMemo(() => 
    nodes.filter(node => node.type === 'table') as NodeType[],
  [nodes]);

  // Handle editor content change
  const handleEditorChange = useCallback((value: string) => {
    setIsEditorDirty(true);
    setDDL(value);
  }, [setDDL]);

  // Delete a table node
  const handleDeleteTable = useCallback((nodeId: string) => {
    if (window.confirm('Are you sure you want to delete this object? This cannot be undone.')) {
      // Remove the node
      const updatedNodes = nodes.filter(node => node.id !== nodeId);
      setNodes(updatedNodes);
      
      // Remove connected edges
      const updatedEdges = edges.filter(
        edge => edge.source !== nodeId && edge.target !== nodeId
      );
      setEdges(updatedEdges);
    }
  }, [nodes, edges, setNodes, setEdges]);

  // Open the edit form for a table
  const handleEditTable = useCallback((table: NodeType) => {
    setEditingTable(table);
  }, []);

  // Handle saving the edited table
  const handleSaveEditedTable = useCallback((tableName: string, columns: Column[], tableType?: string, tableComment?: string) => {
    if (editingTable) {
      const updatedNodes = nodes.map(node => 
        node.id === editingTable.id 
          ? {
              ...node,
              data: {
                ...node.data,
                label: tableName,
                columns: columns,
                ...(tableType ? { tableType } : {}),
                ...(tableComment !== undefined ? { comment: tableComment } : {})
              }
            }
          : node
      ) as ERDNode[];
      
      setNodes(updatedNodes);
      setEditingTable(null);
    }
  }, [editingTable, nodes, setNodes]);

  const addNewTable = (tableName: string, columns: Column[], tableType?: string) => {
    const newNode: NodeType = {
      id: uuidv4(),
      type: 'table',
      position: { 
        x: Math.random() * 300, 
        y: Math.random() * 300
      },
      data: {
        label: tableName,
        columns: columns,
        tableType: tableType as 'TABLE' | 'VIEW' | 'MATERIALIZED_VIEW' | 'DYNAMIC_TABLE' | 'ICEBERG_TABLE'
      },
    };
    
    setNodes([...nodes, newNode]);
    setShowCreateTable(false);
    
    // Generate DDL after adding a new table
    setTimeout(() => generateDDL(), 100);
  };
  
  const generateDDL = () => {
    if (nodes.length === 0) {
      setDDL('');
      return;
    }
    
    const tableNodes = nodes.filter(node => node.type === 'table');
    if (tableNodes.length === 0) {
      setDDL('');
      return;
    }
    
    const ddlGenerator = new DDLGenerator(nodes, edges);
    const generatedDDL = ddlGenerator.generateSnowflakeDDL();
    setDDL(generatedDDL);
  };
  
  // Function to handle importing DDL
  const handleImportDDL = () => {
    // In a real implementation, this would parse the DDL and create nodes/edges
    alert('DDL import functionality would be implemented here');
    setImportDDL('');
  };
  
  // Function to handle DDL changes
  const handleDDLChange = (newDDL: string) => {
    setEditableDDL(newDDL);
  };
  
  // Function to apply DDL changes
  const applyDDLChanges = () => {
    setDDL(editableDDL);
    // In a full implementation, we would parse the DDL here and update the nodes/edges
    alert('In a complete implementation, this would parse the DDL and update the ERD');
  };
  
  // Function to save the current ERD as JSON
  const saveProject = () => {
    try {
      const project = {
        nodes,
        edges,
        ddl
      };
      
      const jsonString = JSON.stringify(project, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create download link and trigger click
      const a = document.createElement('a');
      a.href = url;
      a.download = `ezerd-project-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Failed to save project');
    }
  };
  
  // Function to load a saved project
  const loadProject = () => {
    try {
      if (!importJson.trim()) {
        alert('Please paste your project JSON');
        return;
      }
      
      const project = JSON.parse(importJson);
      
      // Validate project data
      if (!project.nodes || !Array.isArray(project.nodes) || !project.edges || !Array.isArray(project.edges)) {
        throw new Error('Invalid project format');
      }
      
      // Update state with proper type
      setNodes(project.nodes as ERDNode[]);
      setEdges(project.edges);
      
      // Either use saved DDL or regenerate
      if (project.ddl) {
        setDDL(project.ddl);
      } else {
        const ddlGenerator = new DDLGenerator(project.nodes, project.edges);
        setDDL(ddlGenerator.generateSnowflakeDDL());
      }
      
      // Reset form and switch to tables tab
      setImportJson('');
      setActiveTabState('tables');
      
      alert('Project loaded successfully');
    } catch (error) {
      console.error('Error loading project:', error);
      alert('Failed to load project: Invalid JSON format');
    }
  };
  
  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col h-full">
      <div className="border-b dark:border-gray-700">
        <nav className="flex overflow-x-auto p-2 space-x-2">
          <button
            onClick={() => setActiveTabState('tables')}
            className={`px-3 py-1.5 text-sm rounded-md ${
              activeTab === 'tables'
                ? 'bg-primary-light dark:bg-primary-dark text-white'
                : 'text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Tables
          </button>
          <button
            onClick={() => setActiveTabState('ai')}
            className={`px-3 py-1.5 text-sm rounded-md ${
              activeTab === 'ai'
                ? 'bg-primary-light dark:bg-primary-dark text-white'
                : 'text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            AI Assistant
          </button>
          <button
            onClick={() => setActiveTabState('import')}
            className={`px-3 py-1.5 text-sm rounded-md ${
              activeTab === 'import'
                ? 'bg-primary-light dark:bg-primary-dark text-white'
                : 'text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Import
          </button>
          <button
            onClick={() => setActiveTabState('export')}
            className={`px-3 py-1.5 text-sm rounded-md ${
              activeTab === 'export'
                ? 'bg-primary-light dark:bg-primary-dark text-white'
                : 'text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Export
          </button>
          <button
            onClick={() => setActiveTabState('snowflake')}
            className={`px-3 py-1.5 text-sm rounded-md ${
              activeTab === 'snowflake'
                ? 'bg-primary-light dark:bg-primary-dark text-white'
                : 'text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Snowflake
          </button>
        </nav>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'tables' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold dark:text-white">Objects</h3>
              <button
                onClick={() => setShowNewTableForm(true)}
                className="bg-primary-light hover:bg-primary dark:bg-primary-dark hover:dark:bg-primary text-white px-3 py-1 rounded text-sm"
              >
                Add Object
              </button>
            </div>
            
            <div className="space-y-2">
              {tables.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No objects added yet. Click "Add Object" to create your first table or view.</p>
              ) : (
                tables.map((table) => (
                  <div
                    key={table.id}
                    className="p-2 border rounded-md border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 group"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{table.data.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {table.data.tableType || 'TABLE'} • {table.data.columns.length} columns
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEditTable(table)}
                          className="p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Edit object"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteTable(table.id)}
                          className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete object"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {tables.length > 0 && (
                <button
                  onClick={generateDDL}
                  className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm"
                >
                  Generate Snowflake DDL
                </button>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'ai' && (
          <AIPrompt 
            nodes={nodes} 
            setNodes={setNodes} 
            edges={edges} 
            setEdges={setEdges} 
            setDDL={setDDL}
            setActiveTab={setActiveTab} 
          />
        )}
        
        {activeTab === 'import' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold dark:text-white">Import</h3>
            
            <div className="border-b pb-4 mb-4">
              <h4 className="font-medium text-sm mb-2">Load Saved Project</h4>
              <textarea
                className="w-full h-40 p-2 border rounded dark:border-gray-600 bg-white dark:bg-gray-900 text-sm font-mono"
                placeholder="Paste saved project JSON here..."
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
              />
              <button
                onClick={loadProject}
                className="w-full mt-2 bg-primary-light hover:bg-primary dark:bg-primary-dark hover:dark:bg-primary text-white px-3 py-2 rounded text-sm"
                disabled={!importJson.trim()}
              >
                Load Project
              </button>
            </div>
            
            <div>
              <h4 className="font-medium text-sm mb-2">Import DDL</h4>
              <textarea
                className="w-full h-40 p-2 border rounded dark:border-gray-600 bg-white dark:bg-gray-900 text-sm font-mono"
                placeholder="Paste Snowflake DDL here..."
                value={importDDL}
                onChange={(e) => setImportDDL(e.target.value)}
              />
              <button
                onClick={handleImportDDL}
                className="w-full mt-2 bg-primary-light hover:bg-primary dark:bg-primary-dark hover:dark:bg-primary text-white px-3 py-2 rounded text-sm"
                disabled={!importDDL.trim()}
              >
                Import DDL
              </button>
            </div>
          </div>
        )}
        
        {activeTab === 'export' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold dark:text-white">Export</h3>
            
            <div className="border-b pb-4 mb-4">
              <h4 className="font-medium text-sm mb-2">Save Project</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Save your current ERD design as a JSON file that you can load later.
              </p>
              <button
                onClick={saveProject}
                className="w-full bg-primary-light hover:bg-primary dark:bg-primary-dark hover:dark:bg-primary text-white px-3 py-2 rounded text-sm"
                disabled={nodes.length === 0}
              >
                Download Project JSON
              </button>
            </div>
            
            <div>
              <h4 className="font-medium text-sm mb-2">View Generated DDL</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Go to the DDL & Execution tab to view, edit, and execute the generated Snowflake DDL.
              </p>
              <button
                onClick={() => setActiveTab?.('ddl')}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm"
                disabled={nodes.length === 0}
              >
                Go to DDL & Execution
              </button>
            </div>
          </div>
        )}
        
        {activeTab === 'snowflake' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold dark:text-white">Snowflake Integration</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Connect to your Snowflake account to execute the generated DDL. Your credentials are stored securely in your browser.
            </p>
            <SnowflakeConnection 
              ddl={ddl}
              onExecutionComplete={(result) => {
                if (result.status === 'success') {
                  alert('DDL executed successfully in Snowflake!');
                }
              }}
            />
          </div>
        )}
      </div>

      {showNewTableForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Create New Object</h2>
            
            <TableForm
              onSave={(tableName, columns, tableType, tableComment) => {
                // Create a new table node
                const newNode: NodeType = {
                  id: `table-${Date.now()}`,
                  type: 'table',
                  position: { x: 100, y: 100 },
                  data: {
                    label: tableName,
                    columns: columns,
                    tableType: tableType as 'TABLE' | 'VIEW' | 'MATERIALIZED_VIEW' | 'DYNAMIC_TABLE' | 'ICEBERG_TABLE',
                    comment: tableComment
                  }
                };
                
                // Update nodes by creating a new array
                setNodes([...nodes, newNode]);
                setShowNewTableForm(false);
              }}
              onCancel={() => setShowNewTableForm(false)}
              existingTables={tables.map(node => ({
                id: node.id,
                label: node.data.label,
                columns: node.data.columns
              }))}
            />
          </div>
        </div>
      )}

      {editingTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Edit Object</h2>
            
            <TableForm
              onSave={handleSaveEditedTable}
              onCancel={() => setEditingTable(null)}
              existingTables={tables.map(node => ({
                id: node.id,
                label: node.data.label,
                columns: node.data.columns
              }))}
              initialValues={{
                tableName: editingTable.data.label,
                columns: editingTable.data.columns,
                tableType: editingTable.data.tableType,
                tableComment: editingTable.data.comment
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
} 