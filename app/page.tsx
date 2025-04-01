'use client';

import { useState, useEffect } from 'react';
import ERDCanvas from './components/ERDCanvas';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import { EdgeType, NodeType } from './utils/types';
import DDLGenerator from './utils/DDLGenerator';
import SnowflakeConnection from './components/SnowflakeConnection';

export default function Home() {
  const [nodes, setNodes] = useState<NodeType[]>([]);
  const [edges, setEdges] = useState<EdgeType[]>([]);
  const [ddl, setDDL] = useState<string>('');
  const [editableDDL, setEditableDDL] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'erd' | 'ddl'>('erd');
  const [isDDLModified, setIsDDLModified] = useState(false);

  // Initialize editable DDL with initial DDL
  useEffect(() => {
    setEditableDDL(ddl);
  }, [ddl]);

  // Generate DDL whenever nodes or edges change
  useEffect(() => {
    if (nodes.length > 0) {
      const generator = new DDLGenerator(nodes, edges);
      const generatedDDL = generator.generateSnowflakeDDL();
      setDDL(generatedDDL);
      // Reset modification flag when nodes/edges change
      setIsDDLModified(false);
    } else {
      setDDL('');
    }
  }, [nodes, edges]);

  // Handle DDL editing
  const handleDDLChange = (newDDL: string) => {
    setEditableDDL(newDDL);
    setIsDDLModified(newDDL !== ddl);
  };

  // Apply DDL changes and update ERD
  const applyDDLChanges = () => {
    // Update the DDL state
    setDDL(editableDDL);
    setIsDDLModified(false);
    
    // This would ideally parse the DDL and update nodes and edges
    // For now we'll show an alert, but in the future this could be implemented
    alert('In a complete implementation, this would parse the DDL and update the ERD');
  };

  return (
    <main className="flex flex-col h-screen">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          nodes={nodes} 
          setNodes={setNodes} 
          edges={edges} 
          setEdges={setEdges} 
          ddl={ddl} 
          setDDL={setDDL}
          setActiveTab={setActiveTab}
        />
        <div className="flex-1 flex flex-col">
          <div className="border-b dark:border-gray-700 py-2 px-4 flex space-x-4 bg-gray-100 dark:bg-gray-800">
            <button
              onClick={() => setActiveTab('erd')}
              className={`px-4 py-2 text-sm rounded-md ${
                activeTab === 'erd'
                  ? 'bg-primary-light text-white'
                  : 'text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              ERD Designer
            </button>
            <button
              onClick={() => setActiveTab('ddl')}
              className={`px-4 py-2 text-sm rounded-md ${
                activeTab === 'ddl'
                  ? 'bg-primary-light text-white'
                  : 'text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              DDL & Execution
            </button>
          </div>
          
          <div className="flex-1 overflow-hidden">
            {activeTab === 'erd' ? (
              <div className="h-full bg-gray-50 dark:bg-gray-900">
                <ERDCanvas nodes={nodes} setNodes={setNodes} edges={edges} setEdges={setEdges} />
              </div>
            ) : (
              <div className="h-full overflow-auto p-6 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-2xl font-semibold mb-4">Snowflake DDL Execution</h2>
                  
                  {nodes.length > 0 ? (
                    <>
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-medium">Edit DDL</h3>
                          {isDDLModified && (
                            <button 
                              onClick={applyDDLChanges} 
                              className="px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded"
                            >
                              Apply Changes
                            </button>
                          )}
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-md border dark:border-gray-700 shadow-sm">
                          <textarea 
                            className="w-full h-64 p-3 font-mono text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-0 focus:ring-0 focus:outline-none resize-none"
                            value={editableDDL}
                            onChange={(e) => handleDDLChange(e.target.value)}
                          />
                        </div>
                        <div className="mt-3 flex space-x-3">
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(editableDDL);
                              alert('DDL copied to clipboard!');
                            }}
                            className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded"
                          >
                            Copy to Clipboard
                          </button>
                          <button 
                            onClick={() => {
                              setEditableDDL(ddl);
                              setIsDDLModified(false);
                            }}
                            className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded"
                            disabled={!isDDLModified}
                          >
                            Reset Changes
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <SnowflakeConnection 
                          ddl={editableDDL} 
                          onExecutionComplete={(result) => {
                            if (result.status === 'success') {
                              alert('DDL executed successfully in Snowflake!');
                            }
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-4 rounded text-sm">
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">No DDL Generated</p>
                      <p className="mt-1 text-yellow-700 dark:text-yellow-300">
                        Create tables in the ERD Designer first, then the DDL will be automatically generated.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 