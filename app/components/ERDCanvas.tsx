'use client';

import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  EdgeChange,
  NodeChange,
  Panel,
  useReactFlow,
  Node,
  ReactFlowProvider,
  NodeTypes,
  EdgeTypes,
  OnConnect
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toPng, toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';
import TableNode from './TableNode';
import DomainNode from './DomainNode';
import { NodeType, EdgeType, Column, DomainNodeType, ERDNode } from '../utils/types';
import RelationshipTypeSelector from './RelationshipTypeSelector';
import { tableTemplates, TableTemplate } from '../utils/tableTemplates';
import { v4 as uuidv4 } from 'uuid';
import TableForm from './TableForm';

// Define custom node types
const nodeTypes = {
  table: TableNode,
  domain: DomainNode,
};

interface ERDCanvasProps {
  nodes: ERDNode[];
  setNodes: React.Dispatch<React.SetStateAction<ERDNode[]>>;
  edges: EdgeType[];
  setEdges: (edges: EdgeType[]) => void;
}

// Default edge settings for a cleaner look with curved bezier edges
const defaultEdgeOptions = {
  type: 'bezier',
  style: { strokeWidth: 2 },
  animated: false
};

export default function ERDCanvas({ nodes, setNodes, edges, setEdges }: ERDCanvasProps) {
  // Convert our nodes and edges to ReactFlow format
  const [reactFlowNodes, setReactFlowNodes, onNodesChange] = useNodesState(nodes as Node[]);
  const [reactFlowEdges, setReactFlowEdges, onEdgesChange] = useEdgesState(edges);
  const [selectedEdge, setSelectedEdge] = useState<EdgeType | null>(null);
  const [showTableCreationModal, setShowTableCreationModal] = useState(false);
  const [newTablePosition, setNewTablePosition] = useState({ x: 0, y: 0 });
  const [tableCreationMode, setTableCreationMode] = useState<'custom' | 'template'>('custom');
  const [selectedTemplate, setSelectedTemplate] = useState<TableTemplate | null>(null);
  const [newTableName, setNewTableName] = useState('');
  const [tableType, setTableType] = useState<'TABLE' | 'VIEW' | 'DYNAMIC_TABLE' | 'ICEBERG_TABLE'>('TABLE');
  const [newTableColumns, setNewTableColumns] = useState<Column[]>([
    {
      id: uuidv4(),
      name: '',
      dataType: 'VARCHAR',
      isPrimaryKey: false,
      isForeignKey: false,
      isNullable: true,
    },
  ]);
  const reactFlowInstance = useReactFlow();
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [newDomainPosition, setNewDomainPosition] = useState({ x: 0, y: 0 });
  const [newDomainData, setNewDomainData] = useState({
    label: '',
    color: '#3b82f6', // Default blue color
    opacity: 0.3
  });
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  // Handle node deletion
  const handleNodeDelete = useCallback((nodeId: string) => {
    // Remove the node from the parent component's state
    const updatedNodes = nodes.filter(node => node.id !== nodeId);
    setNodes(updatedNodes);
    
    // Remove any edges connected to this node
    const updatedEdges = edges.filter(
      edge => edge.source !== nodeId && edge.target !== nodeId
    );
    setEdges(updatedEdges);
  }, [nodes, edges, setNodes, setEdges]);

  // Handle comment changes in nodes
  const handleCommentChange = useCallback((nodeId: string, comment: string) => {
    const updatedNodes = nodes.map(node => 
      node.id === nodeId 
        ? { ...node, data: { ...node.data, comment } } 
        : node
    ) as ERDNode[];
    
    setNodes(updatedNodes);
    
    // Update ReactFlow's state
    setReactFlowNodes(nodes => 
      nodes.map(node => 
        node.id === nodeId 
          ? { ...node, data: { ...node.data, comment } } 
          : node
      )
    );
  }, [nodes, setNodes, setReactFlowNodes]);

  // Handle column changes in a table node
  const handleColumnsChange = useCallback((nodeId: string, columns: Column[], tableType?: string) => {
    console.log(`Updating node ${nodeId} with tableType: ${tableType || 'not provided'}`);
    
    // Update the parent component's state
    const updatedNodes = nodes.map(node => {
      if (node.id === nodeId && node.type === 'table') {
        console.log(`Before update: Node ${nodeId} tableType=${node.data.tableType || 'undefined'}`);
        
        // Create updated node with new columns and tableType if provided
        const updatedNode = { 
          ...node, 
          // For type changes, recreate the entire data object to ensure React detects the change
          data: { 
            ...node.data, 
            columns,
            // Always update tableType when provided
            ...(tableType !== undefined ? { tableType } : {}),
          }
        };
        
        console.log(`After update: Node ${nodeId} tableType=${updatedNode.data.tableType || 'undefined'}`);
        return updatedNode;
      }
      return node;
    }) as ERDNode[];
    
    // Force a complete update by creating a new nodes array
    // This ensures React detects the change and triggers a re-render
    setNodes([...updatedNodes]);
    
    // Update ReactFlow's state with a completely new node object
    setReactFlowNodes(prevNodes => {
      return prevNodes.map(node => {
        if (node.id === nodeId) {
          // Force a complete node replacement to ensure the changes are detected
          const newNode = { 
            ...node, 
            data: { 
              ...node.data, 
              columns,
              // Always update tableType when provided
              ...(tableType !== undefined ? { tableType } : {}),
              // Reattach all callbacks
              onColumnsChange: (cols: Column[], type?: string) => handleColumnsChange(nodeId, cols, type),
              onDelete: (nodeId: string) => handleNodeDelete(nodeId),
              onCommentChange: (comment: string) => handleCommentChange(nodeId, comment),
              // Add a timestamp to force rerender
              _updateTimestamp: Date.now()
            } 
          };
          return newNode;
        }
        return node;
      });
    });
  }, [nodes, setNodes, setReactFlowNodes, handleNodeDelete, handleCommentChange]);

  // Prepare nodes with callbacks
  useEffect(() => {
    const nodesWithCallback = nodes.map(node => {
      if (node.type === 'table') {
        return {
          ...node,
          data: {
            ...node.data,
            onColumnsChange: (columns: Column[], tableType?: string) => handleColumnsChange(node.id, columns, tableType),
            onDelete: (nodeId: string) => handleNodeDelete(nodeId),
            onCommentChange: (comment: string) => handleCommentChange(node.id, comment)
          }
        };
      } else if (node.type === 'domain') {
        return {
          ...node,
          data: {
            ...node.data,
            onDelete: (nodeId: string) => handleNodeDelete(nodeId)
          }
        };
      }
      return node;
    });
    setReactFlowNodes(nodesWithCallback as Node[]);
  }, [nodes, setReactFlowNodes, handleColumnsChange, handleNodeDelete, handleCommentChange]);

  // Handle connections between nodes
  const onConnect = useCallback(
    (params: Connection) => {
      // Guard against null source or target
      if (!params.source || !params.target) return;
      
      const newEdge = {
        ...params,
        id: `e${params.source}-${params.target}-${Date.now()}`,
        type: 'bezier',
        data: { relationshipType: 'one-to-many' },
      } as Edge;
      
      setReactFlowEdges((eds) => addEdge(newEdge, eds));
      
      // Also update the parent component's state with proper typing
      const newEdgeForState: EdgeType = {
        id: newEdge.id,
        source: newEdge.source,
        target: newEdge.target,
        sourceHandle: newEdge.sourceHandle || '',
        targetHandle: newEdge.targetHandle || '',
        type: 'relationship',
        data: { relationshipType: 'one-to-many' }
      };
      
      setEdges([...edges, newEdgeForState]);
      setSelectedEdge(newEdgeForState);
    },
    [edges, setEdges, setReactFlowEdges]
  );

  // Handle edge selection
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    const foundEdge = edges.find(e => e.id === edge.id);
    if (foundEdge) {
      setSelectedEdge(foundEdge);
    }
  }, [edges]);

  // Handle relationship type change
  const updateRelationshipType = useCallback((edgeId: string, type: 'one-to-one' | 'one-to-many' | 'many-to-many') => {
    // Update the parent component's state
    const updatedEdges = edges.map(edge => 
      edge.id === edgeId 
        ? { ...edge, data: { ...edge.data, relationshipType: type } } 
        : edge
    );
    setEdges(updatedEdges);
    
    // Update ReactFlow's state
    setReactFlowEdges(edges => 
      edges.map(edge => 
        edge.id === edgeId 
          ? { ...edge, data: { ...edge.data, relationshipType: type } } 
          : edge
      )
    );
    
    setSelectedEdge(null);
  }, [edges, setEdges, setReactFlowEdges]);

  // Sync ReactFlow state with parent component
  const onNodeDragStop = useCallback(() => {
    setNodes(reactFlowNodes as ERDNode[]);
  }, [reactFlowNodes, setNodes]);

  // Handle changes to nodes and edges
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      // Close relationship selector if open
      setSelectedEdge(null);
    },
    [onNodesChange]
  );

  // Remove double-click handler and update context menu handler
  const onCanvasContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    
    // Get the position in the flow where the user right-clicked
    const reactFlowBounds = event.currentTarget.getBoundingClientRect();
    const position = reactFlowInstance.project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });
    
    setNewTablePosition(position);
    setNewDomainPosition(position);
    
    // Show context menu
    const containerRect = reactFlowWrapper.current?.getBoundingClientRect();
    if (containerRect) {
      const menuX = event.clientX - containerRect.left;
      const menuY = event.clientY - containerRect.top;
      
      setContextMenuPosition({ x: menuX, y: menuY });
      setShowContextMenu(true);
    }
  }, [reactFlowInstance]);
  
  const handleContextMenuOption = useCallback((option: 'table' | 'domain') => {
    setShowContextMenu(false);
    
    if (option === 'table') {
      // Reset form state
      setTableCreationMode('custom');
      setSelectedTemplate(null);
      setNewTableName('');
      setTableType('TABLE');
      setNewTableColumns([
        {
          id: uuidv4(),
          name: '',
          dataType: 'VARCHAR',
          isPrimaryKey: false,
          isForeignKey: false,
          isNullable: true,
        },
      ]);
      setShowTableCreationModal(true);
    } else if (option === 'domain') {
      setNewDomainData({
        label: '',
        color: '#3b82f6',
        opacity: 0.3
      });
      setShowDomainModal(true);
    }
  }, []);

  // Export functions
  const exportAsPng = useCallback(() => {
    if (!reactFlowWrapper.current) return;
    
    const isDarkMode = document.documentElement.classList.contains('dark');
    const bgColor = isDarkMode ? '#111827' : '#ffffff';
    
    toPng(reactFlowWrapper.current, { 
      backgroundColor: bgColor,
      quality: 1,
      pixelRatio: 2
    })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = 'erd-diagram.png';
        link.href = dataUrl;
        link.click();
        setShowExportOptions(false);
      })
      .catch((error) => {
        console.error('Error exporting as PNG:', error);
      });
  }, []);
  
  const exportAsPdf = useCallback(() => {
    if (!reactFlowWrapper.current) return;
    
    const isDarkMode = document.documentElement.classList.contains('dark');
    const bgColor = isDarkMode ? '#111827' : '#ffffff';
    
    toJpeg(reactFlowWrapper.current, { 
      backgroundColor: bgColor,
      quality: 0.95,
      pixelRatio: 2
    })
      .then((dataUrl) => {
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px'
        });
        
        const imgProps = pdf.getImageProperties(dataUrl);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('erd-diagram.pdf');
        setShowExportOptions(false);
      })
      .catch((error) => {
        console.error('Error exporting as PDF:', error);
      });
  }, []);

  // Group templates by category
  const groupedTemplates = useMemo(() => {
    return tableTemplates.reduce<Record<string, TableTemplate[]>>((acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = [];
      }
      acc[template.category].push(template);
      return acc;
    }, {});
  }, []);
  
  const addNewColumn = useCallback(() => {
    setNewTableColumns([
      ...newTableColumns,
      {
        id: uuidv4(),
        name: '',
        dataType: 'VARCHAR',
        isPrimaryKey: false,
        isForeignKey: false,
        isNullable: true,
      },
    ]);
  }, [newTableColumns]);
  
  const removeColumn = useCallback((id: string) => {
    setNewTableColumns(newTableColumns.filter((column) => column.id !== id));
  }, [newTableColumns]);
  
  const updateColumn = useCallback((id: string, field: keyof Column, value: any) => {
    setNewTableColumns(
      newTableColumns.map((column) =>
        column.id === id ? { ...column, [field]: value } : column
      )
    );
  }, [newTableColumns]);
  
  const createTable = useCallback(() => {
    if (!newTableName.trim()) {
      alert('Please enter a table name');
      return;
    }
    
    let columnsToSave: Column[] = [];
    
    if (tableCreationMode === 'custom') {
      if (newTableColumns.some((col) => !col.name.trim())) {
        alert('All columns must have a name');
        return;
      }
      
      // Primary key is now optional for all types
      
      columnsToSave = newTableColumns;
    } else if (tableCreationMode === 'template' && selectedTemplate) {
      columnsToSave = selectedTemplate.getColumns(newTableName);
    }
    
    // Create a new table node
    const newNode: NodeType = {
      id: `table-${Date.now()}`,
      type: 'table',
      position: newTablePosition,
      data: {
        label: newTableName,
        columns: columnsToSave,
        tableType: tableType as 'TABLE' | 'VIEW' | 'MATERIALIZED_VIEW' | 'DYNAMIC_TABLE' | 'ICEBERG_TABLE'
      }
    };
    
    setNodes(prevNodes => [...prevNodes, newNode]);
    setShowTableCreationModal(false);
  }, [tableCreationMode, selectedTemplate, newTableName, newTableColumns, newTablePosition, setNodes, tableType]);
  
  const snowflakeDataTypes = [
    'VARCHAR',
    'CHAR',
    'NUMBER',
    'DECIMAL',
    'NUMERIC',
    'INT',
    'INTEGER',
    'BIGINT',
    'SMALLINT',
    'FLOAT',
    'FLOAT4',
    'FLOAT8',
    'DOUBLE',
    'DOUBLE PRECISION',
    'REAL',
    'DATE',
    'DATETIME',
    'TIME',
    'TIMESTAMP',
    'TIMESTAMP_LTZ',
    'TIMESTAMP_NTZ',
    'TIMESTAMP_TZ',
    'BOOLEAN',
    'VARIANT',
    'OBJECT',
    'ARRAY',
    'BINARY',
    'TEXT',
  ];

  // Function to create a new domain node
  const createDomainNode = useCallback(() => {
    if (!newDomainData.label) return;
    
    const newNode: DomainNodeType = {
      id: `domain-${Date.now()}`,
      type: 'domain',
      position: newDomainPosition,
      style: { width: 300, height: 200 },
      data: {
        label: newDomainData.label,
        color: newDomainData.color,
        opacity: newDomainData.opacity,
        onDelete: (nodeId: string) => handleNodeDelete(nodeId)
      }
    };
    
    setNodes(prevNodes => [...prevNodes, newNode]);
    setShowDomainModal(false);
  }, [newDomainPosition, newDomainData, setNodes, handleNodeDelete]);

  return (
    <div className="h-full w-full bg-surface-light dark:bg-gray-900 rounded-lg overflow-hidden relative">
      <div ref={reactFlowWrapper} className="h-full w-full [&_.react-flow__node-domain]:!z-[-1000] [&_.react-flow__node-table]:!z-10">
        <ReactFlow
          nodes={reactFlowNodes}
          edges={reactFlowEdges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onEdgeClick={onEdgeClick}
          onPaneClick={() => {
            // Close context menu and export options on pane click
            setShowContextMenu(false);
            setShowExportOptions(false);
          }}
          onContextMenu={onCanvasContextMenu}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          fitViewOptions={{ 
            padding: 0.2,
            minZoom: 0.5,
            maxZoom: 2
          }}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          minZoom={0.2}
          maxZoom={4}
          elementsSelectable={true}
          nodesConnectable={true}
          style={{ background: 'var(--surface-light)' }}
          className="dark:bg-gray-900 [&_.react-flow__handle]:!visible [&_.react-flow__handle]:opacity-100 [&_.react-flow__handle]:pointer-events-auto"
        >
          <Background color="#888" gap={16} />
          <Controls />
          
          {/* Reset View Button */}
          <Panel position="bottom-left" className="ml-12 mb-2">
            <button
              onClick={() => {
                reactFlowInstance.setViewport({ x: 0, y: 0, zoom: 1 });
                reactFlowInstance.fitView({ padding: 0.2, maxZoom: 1 });
              }}
              className="bg-white dark:bg-gray-800 p-2 rounded shadow hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Reset view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </Panel>
          
          {/* Export button */}
          <Panel position="top-right" className="bg-white dark:bg-gray-800 rounded shadow-md flex">
            <button
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Export diagram"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            
            <button
              onClick={() => setShowDomainModal(true)}
              className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded ml-1"
              title="Add domain box"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            
            {showExportOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded shadow-lg z-10">
                <button
                  onClick={exportAsPng}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Export as PNG
                </button>
                <button
                  onClick={exportAsPdf}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Export as PDF
                </button>
              </div>
            )}
          </Panel>
          
          {/* Context Menu */}
          {showContextMenu && (
            <div 
              className="absolute bg-white dark:bg-gray-800 shadow-lg rounded-md overflow-hidden z-50 w-48"
              style={{ 
                left: `${contextMenuPosition.x}px`, 
                top: `${contextMenuPosition.y}px`
              }}
            >
              <button
                onClick={() => handleContextMenuOption('table')}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Create Table/View
              </button>
              <button
                onClick={() => handleContextMenuOption('domain')}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Create Domain Box
              </button>
            </div>
          )}
          
          {selectedEdge && (
            <Panel position="top-center" className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg">
              <RelationshipTypeSelector 
                edge={selectedEdge} 
                onSelect={updateRelationshipType}
                onClose={() => setSelectedEdge(null)}
              />
            </Panel>
          )}
        </ReactFlow>
      </div>
      
      {showTableCreationModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Create New Object</h2>
            
            <TableForm
              onSave={(tableName: string, columns: Column[], tableType?: string, tableComment?: string) => {
                // Create a new table node
                const newNode: NodeType = {
                  id: `table-${Date.now()}`,
                  type: 'table',
                  position: newTablePosition,
                  data: {
                    label: tableName,
                    columns: columns,
                    tableType: tableType as 'TABLE' | 'VIEW' | 'MATERIALIZED_VIEW' | 'DYNAMIC_TABLE' | 'ICEBERG_TABLE',
                    comment: tableComment
                  }
                };
                
                setNodes(prevNodes => [...prevNodes, newNode]);
                setShowTableCreationModal(false);
              }}
              onCancel={() => setShowTableCreationModal(false)}
              existingTables={nodes.filter(node => node.type === 'table').map(node => ({
                id: node.id,
                label: node.data.label,
                columns: node.data.columns
              }))}
            />
          </div>
        </div>
      )}
      
      {showDomainModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Create Domain Box</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Domain Name
              </label>
              <input 
                type="text" 
                value={newDomainData.label}
                onChange={(e) => setNewDomainData({...newDomainData, label: e.target.value})}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter domain name"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color
              </label>
              <div className="flex items-center">
                <input 
                  type="color" 
                  value={newDomainData.color}
                  onChange={(e) => setNewDomainData({...newDomainData, color: e.target.value})}
                  className="p-1 border border-gray-300 dark:border-gray-600 rounded h-10 w-16"
                />
                <span className="ml-2 text-gray-700 dark:text-gray-300">
                  {newDomainData.color}
                </span>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Opacity: {Math.round(newDomainData.opacity * 100)}%
              </label>
              <input 
                type="range" 
                min="0.1" 
                max="0.5" 
                step="0.05"
                value={newDomainData.opacity}
                onChange={(e) => setNewDomainData({...newDomainData, opacity: parseFloat(e.target.value)})}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => setShowDomainModal(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
              >
                Cancel
              </button>
              <button 
                onClick={createDomainNode}
                disabled={!newDomainData.label.trim()}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 rounded text-white"
              >
                Create Domain
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 