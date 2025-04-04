'use client';

import React, { useEffect, useState } from 'react';
import { EdgeType } from '../utils/types';

interface RelationshipTypeSelectorProps {
  edge: EdgeType;
  onSelect: (edgeId: string, type: 'one-to-one' | 'one-to-many' | 'many-to-many') => void;
  onClose: () => void;
}

type RelationshipOption = {
  value: 'one-to-one' | 'one-to-many' | 'many-to-many';
  label: string;
  description: string;
  icon: string;
};

const relationshipOptions: RelationshipOption[] = [
  {
    value: 'one-to-one',
    label: 'One-to-One',
    description: 'Each record in table A relates to one record in table B',
    icon: '1:1'
  },
  {
    value: 'one-to-many',
    label: 'One-to-Many',
    description: 'Each record in table A relates to many records in table B',
    icon: '1:N'
  },
  {
    value: 'many-to-many',
    label: 'Many-to-Many',
    description: 'Many records in table A relate to many records in table B',
    icon: 'N:N'
  }
];

export default function RelationshipTypeSelector({ edge, onSelect, onClose }: RelationshipTypeSelectorProps) {
  const [sourceColumnInfo, setSourceColumnInfo] = useState<string | null>(null);
  const [targetColumnInfo, setTargetColumnInfo] = useState<string | null>(null);
  
  // Extract column information from handles if it's a column-to-column connection
  useEffect(() => {
    if (edge.sourceHandle && edge.targetHandle) {
      const isColumnConnection = edge.sourceHandle.includes('-col-') && edge.targetHandle.includes('-col-');
      
      if (isColumnConnection) {
        // Extract column IDs from handles
        const sourceHandleParts = edge.sourceHandle.split('-col-');
        const targetHandleParts = edge.targetHandle.split('-col-');
        
        if (sourceHandleParts.length > 1 && targetHandleParts.length > 1) {
          const sourceNodeId = sourceHandleParts[0];
          const targetNodeId = targetHandleParts[0];
          
          const sourceColId = sourceHandleParts[1].split('-')[0];
          const targetColId = targetHandleParts[1].split('-')[0];
          
          // Try to extract column info from data attributes in handles
          // This would need to be set when creating the handles in TableNode
          const sourceColumnName = document.querySelector(`[id="${edge.sourceHandle}"]`)?.getAttribute('data-column-name');
          const targetColumnName = document.querySelector(`[id="${edge.targetHandle}"]`)?.getAttribute('data-column-name');
          
          if (sourceColumnName) {
            setSourceColumnInfo(`${sourceColumnName} (${sourceNodeId})`);
          }
          
          if (targetColumnName) {
            setTargetColumnInfo(`${targetColumnName} (${targetNodeId})`);
          }
        }
      }
    }
  }, [edge.sourceHandle, edge.targetHandle]);
  
  const isColumnConnection = edge.sourceHandle?.includes('-col-') && edge.targetHandle?.includes('-col-');

  return (
    <div className="w-80">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">Select Relationship Type</h3>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        {isColumnConnection && (sourceColumnInfo || targetColumnInfo) ? (
          <>
            <span className="font-bold">Column relationship:</span><br/>
            {sourceColumnInfo && <div className="mb-1">Source: <span className="font-medium">{sourceColumnInfo}</span></div>}
            {targetColumnInfo && <div>Target: <span className="font-medium">{targetColumnInfo}</span></div>}
          </>
        ) : (
          <>
            Relationship between tables: <span className="font-medium">{edge.source}</span> and <span className="font-medium">{edge.target}</span>
          </>
        )}
      </div>
      
      <div className="space-y-2">
        {relationshipOptions.map((option) => (
          <div
            key={option.value}
            className={`p-2 border rounded cursor-pointer transition-colors ${
              edge.data.relationshipType === option.value
                ? 'border-primary-dark bg-primary-light bg-opacity-10'
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            onClick={() => onSelect(edge.id, option.value)}
          >
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded mr-2 font-mono text-sm">
                {option.icon}
              </div>
              <div>
                <div className="font-medium text-sm">{option.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {option.description}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 