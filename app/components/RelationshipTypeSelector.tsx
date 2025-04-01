'use client';

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
        Relationship between tables: <span className="font-medium">{edge.source}</span> and <span className="font-medium">{edge.target}</span>
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