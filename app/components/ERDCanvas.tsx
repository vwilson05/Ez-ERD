'use client';

import { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  EdgeChange,
  NodeChange,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import TableNode from './TableNode';
import { NodeType, EdgeType, Column } from '../utils/types';
import RelationshipTypeSelector from './RelationshipTypeSelector';

// Define custom node types
const nodeTypes = {
  table: TableNode,
};

interface ERDCanvasProps {
  nodes: NodeType[];
  setNodes: (nodes: NodeType[]) => void;
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
  const [reactFlowNodes, setReactFlowNodes, onNodesChange] = useNodesState(nodes);
  const [reactFlowEdges, setReactFlowEdges, onEdgesChange] = useEdgesState(edges);
  const [selectedEdge, setSelectedEdge] = useState<EdgeType | null>(null);

  // Handle column changes in a table node
  const handleColumnsChange = useCallback((nodeId: string, columns: Column[]) => {
    // Update the parent component's state
    const updatedNodes = nodes.map(node => 
      node.id === nodeId 
        ? { ...node, data: { ...node.data, columns } } 
        : node
    );
    setNodes(updatedNodes);
    
    // Update ReactFlow's state
    setReactFlowNodes(nodes => 
      nodes.map(node => 
        node.id === nodeId 
          ? { ...node, data: { ...node.data, columns, onColumnsChange: (cols: Column[]) => handleColumnsChange(nodeId, cols) } } 
          : node
      )
    );
  }, [nodes, setNodes, setReactFlowNodes]);

  // Prepare nodes with callback
  useEffect(() => {
    const nodesWithCallback = nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onColumnsChange: (columns: Column[]) => handleColumnsChange(node.id, columns)
      }
    }));
    setReactFlowNodes(nodesWithCallback);
  }, [nodes, setReactFlowNodes, handleColumnsChange]);

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
    setNodes(reactFlowNodes as NodeType[]);
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

  return (
    <div className="h-full w-full bg-surface-light dark:bg-surface-dark rounded-lg overflow-hidden relative">
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
      >
        <Background />
        <Controls />
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
  );
} 