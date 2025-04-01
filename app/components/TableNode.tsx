'use client';

import { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Column } from '../utils/types';
import { v4 as uuidv4 } from 'uuid';

interface TableNodeProps extends NodeProps {
  id: string;
  data: {
    label: string;
    columns: Column[];
    onColumnsChange?: (columns: Column[]) => void;
    tableType?: 'TABLE' | 'VIEW' | 'MATERIALIZED_VIEW' | 'DYNAMIC_TABLE' | 'ICEBERG_TABLE';
    onDelete?: (nodeId: string) => void;
    comment?: string;
    tags?: string[];
    onCommentChange?: (comment: string) => void;
    onTagsChange?: (tags: string[]) => void;
  };
  selected: boolean;
}

export default function TableNode({ id, data, selected }: TableNodeProps) {
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editedColumn, setEditedColumn] = useState<Column | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [editedComment, setEditedComment] = useState(data.comment || '');
  const [editedTags, setEditedTags] = useState(data.tags?.join(', ') || '');
  const [newColumn, setNewColumn] = useState<Column>({
    id: '',
    name: '',
    dataType: 'VARCHAR',
    isPrimaryKey: false,
    isForeignKey: false,
    isNullable: true,
    comment: '',
    tags: []
  });

  // Helper to get display type name
  const getDisplayTypeName = (type?: string) => {
    if (!type) return 'Table';
    
    switch (type) {
      case 'VIEW': return 'View';
      case 'MATERIALIZED_VIEW': return 'Materialized View';
      case 'DYNAMIC_TABLE': return 'Dynamic Table';
      case 'ICEBERG_TABLE': return 'Iceberg Table';
      default: return 'Table';
    }
  };

  // Get header color based on object type
  const getHeaderColor = () => {
    switch (data.tableType) {
      case 'VIEW': return 'bg-teal-100 dark:bg-teal-800';
      case 'MATERIALIZED_VIEW': return 'bg-purple-100 dark:bg-purple-800';
      case 'DYNAMIC_TABLE': return 'bg-amber-100 dark:bg-amber-800';
      case 'ICEBERG_TABLE': return 'bg-cyan-100 dark:bg-cyan-800';
      default: return 'bg-gray-100 dark:bg-gray-700';
    }
  };

  // Get icon for the object type
  const getObjectTypeIcon = () => {
    switch (data.tableType) {
      case 'VIEW':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        );
      case 'MATERIALIZED_VIEW':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'DYNAMIC_TABLE':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'ICEBERG_TABLE':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
    }
  };

  const startEditing = (column: Column) => {
    setEditingColumnId(column.id);
    setEditedColumn({...column});
  };

  const saveColumnEdit = () => {
    if (editedColumn) {
      const updatedColumns = data.columns.map(col => 
        col.id === editingColumnId ? editedColumn : col
      );
      data.onColumnsChange?.(updatedColumns);
    }
    setEditingColumnId(null);
    setEditedColumn(null);
  };

  const cancelEditing = () => {
    setEditingColumnId(null);
    setEditedColumn(null);
  };

  const addNewColumn = () => {
    const columnToAdd = {
      ...newColumn,
      id: uuidv4()
    };
    const updatedColumns = [...data.columns, columnToAdd];
    data.onColumnsChange?.(updatedColumns);
    setIsAddingColumn(false);
    setNewColumn({
      id: '',
      name: '',
      dataType: 'VARCHAR',
      isPrimaryKey: false,
      isForeignKey: false,
      isNullable: true,
      comment: '',
      tags: []
    });
  };

  const cancelAddingColumn = () => {
    setIsAddingColumn(false);
    setNewColumn({
      id: '',
      name: '',
      dataType: 'VARCHAR',
      isPrimaryKey: false,
      isForeignKey: false,
      isNullable: true,
      comment: '',
      tags: []
    });
  };

  const handleEditChange = (field: keyof Column, value: string | boolean) => {
    if (editedColumn) {
      setEditedColumn({
        ...editedColumn,
        [field]: value
      });
    }
  };

  const handleNewColumnChange = (field: keyof Column, value: string | boolean) => {
    setNewColumn({
      ...newColumn,
      [field]: value
    });
  };

  const deleteColumn = (columnId: string) => {
    const updatedColumns = data.columns.filter(col => col.id !== columnId);
    data.onColumnsChange?.(updatedColumns);
  };

  const handleTagsChange = (tagsString: string, isNewColumn: boolean) => {
    const tagsArray = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
    
    if (isNewColumn) {
      setNewColumn({
        ...newColumn,
        tags: tagsArray
      });
    } else if (editedColumn) {
      setEditedColumn({
        ...editedColumn,
        tags: tagsArray
      });
    }
  };

  return (
    <div className={`border-2 rounded-md overflow-hidden ${
      selected ? 'border-primary-dark dark:border-primary-light' : 'border-gray-300 dark:border-gray-600'
    } bg-white dark:bg-gray-800 shadow-md min-w-[250px] relative !z-10`}>
      {/* Connection handles - one in the center of each side */}
      <Handle
        type="source"
        position={Position.Top}
        id={`${id}-top`}
        className="!absolute !w-2 !h-2 !bg-white !border-0 !rounded-full !z-[9999] !shadow-sm"
        style={{ left: '50%', top: '0px', transform: 'translate(-50%, -50%)' }}
      />
      
      <Handle
        type="source"
        position={Position.Left}
        id={`${id}-left`}
        className="!absolute !w-2 !h-2 !bg-white !border-0 !rounded-full !z-[9999] !shadow-sm"
        style={{ top: '50%', left: '0px', transform: 'translate(-50%, -50%)' }}
      />
      
      <Handle
        type="target"
        position={Position.Right}
        id={`${id}-right`}
        className="!absolute !w-2 !h-2 !bg-white !border-0 !rounded-full !z-[9999] !shadow-sm"
        style={{ top: '50%', right: '0px', transform: 'translate(50%, -50%)' }}
      />
      
      <Handle
        type="target"
        position={Position.Bottom}
        id={`${id}-bottom`}
        className="!absolute !w-2 !h-2 !bg-white !border-0 !rounded-full !z-[9999] !shadow-sm"
        style={{ left: '50%', bottom: '0px', transform: 'translate(-50%, 50%)' }}
      />
      
      {/* Table Header */}
      <div className={`p-2 font-semibold border-b border-gray-300 dark:border-gray-600 ${getHeaderColor()}`}>
        <div className="flex items-center justify-between">
          <span>{data.label}</span>
          <div className="flex items-center">
            <div className="flex items-center text-xs text-gray-700 dark:text-gray-300 mr-2">
              {getObjectTypeIcon()}
              <span className="ml-1">{getDisplayTypeName(data.tableType)}</span>
            </div>
            {data.onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Are you sure you want to delete "${data.label}"? This action cannot be undone.`)) {
                    if (data.onDelete) {
                      data.onDelete(id);
                    }
                  }
                }}
                className="text-red-500 hover:text-red-700 p-1"
                title="Delete object"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="mt-2 flex items-center space-x-2">
          {isEditingComment ? (
            <div className="flex-1">
              <input
                type="text"
                value={editedComment}
                onChange={(e) => setEditedComment(e.target.value)}
                onBlur={() => {
                  setIsEditingComment(false);
                  data.onCommentChange?.(editedComment);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditingComment(false);
                    data.onCommentChange?.(editedComment);
                  }
                }}
                placeholder="Add a comment..."
                className="w-full p-1 text-xs border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                autoFocus
              />
            </div>
          ) : (
            <button
              onClick={() => setIsEditingComment(true)}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              {data.comment || 'Add comment'}
            </button>
          )}
          <div className="flex-1">
            <input
              type="text"
              value={editedTags}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedTags(e.target.value)}
              onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                const tags = e.target.value.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag);
                data.onTagsChange?.(tags);
              }}
              placeholder="Add tags (comma separated)..."
              className="w-full p-1 text-xs border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>
      
      {/* Columns */}
      <div className="p-2 space-y-1 overflow-y-auto">
        {data.columns.map((column) => (
          <div key={column.id} className="relative group">
            {editingColumnId === column.id ? (
              <div className="p-2 border border-blue-300 dark:border-blue-500 rounded bg-blue-50 dark:bg-gray-700 space-y-2">
                <div className="flex items-center">
                  <input 
                    type="text" 
                    value={editedColumn?.name || ''}
                    onChange={(e) => handleEditChange('name', e.target.value)}
                    className="flex-1 p-1 text-sm border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <select 
                    value={editedColumn?.dataType || ''}
                    onChange={(e) => handleEditChange('dataType', e.target.value)}
                    className="ml-2 p-1 text-xs border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="VARCHAR">VARCHAR</option>
                    <option value="NUMBER">NUMBER</option>
                    <option value="INTEGER">INTEGER</option>
                    <option value="FLOAT">FLOAT</option>
                    <option value="BOOLEAN">BOOLEAN</option>
                    <option value="DATE">DATE</option>
                    <option value="TIMESTAMP">TIMESTAMP</option>
                    <option value="VARIANT">VARIANT</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={editedColumn?.isPrimaryKey || false}
                      onChange={(e) => handleEditChange('isPrimaryKey', e.target.checked)}
                      className="mr-1"
                    />
                    PK
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={editedColumn?.isForeignKey || false}
                      onChange={(e) => handleEditChange('isForeignKey', e.target.checked)}
                      className="mr-1"
                    />
                    FK
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={editedColumn?.isNullable || false}
                      onChange={(e) => handleEditChange('isNullable', e.target.checked)}
                      className="mr-1"
                    />
                    NULL
                  </label>
                </div>
                <div className="mt-2">
                  <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">
                    Comment
                  </label>
                  <input 
                    type="text" 
                    value={editedColumn?.comment || ''}
                    onChange={(e) => handleEditChange('comment', e.target.value)}
                    placeholder="Optional column comment"
                    className="w-full p-1 text-xs border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="mt-2">
                  <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">
                    Tags (comma separated)
                  </label>
                  <input 
                    type="text" 
                    value={editedColumn?.tags?.join(', ') || ''}
                    onChange={(e) => handleTagsChange(e.target.value, false)}
                    placeholder="tag1, tag2, tag3"
                    className="w-full p-1 text-xs border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex justify-end space-x-1">
                  <button 
                    onClick={cancelEditing}
                    className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={saveColumnEdit}
                    className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div 
                className="flex items-center text-sm p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                onClick={() => startEditing(column)}
              >
                <div className="flex-1 flex items-center">
                  <span className={`mr-2 ${column.isPrimaryKey ? 'font-semibold' : ''}`}>
                    {column.name}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                    {column.dataType}
                  </span>
                </div>
                <div className="flex space-x-1">
                  {column.isPrimaryKey && (
                    <span className="text-yellow-500 text-xs" title="Primary Key">PK</span>
                  )}
                  {column.isForeignKey && (
                    <span className="text-blue-500 text-xs" title="Foreign Key">FK</span>
                  )}
                  {column.isNullable && (
                    <span className="text-gray-400 text-xs" title="Nullable">NULL</span>
                  )}
                  {column.comment && (
                    <span className="text-green-500 text-xs" title={column.comment}>📝</span>
                  )}
                  {column.tags && column.tags.length > 0 && (
                    <span className="text-purple-500 text-xs" title={column.tags.join(', ')}>🏷️</span>
                  )}
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteColumn(column.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 ml-1 text-red-500 hover:text-red-700"
                  title="Delete column"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}

        {isAddingColumn ? (
          <div className="p-2 border border-green-300 dark:border-green-600 rounded bg-green-50 dark:bg-gray-700 space-y-2 mt-2">
            <div className="flex items-center">
              <input 
                type="text" 
                value={newColumn.name}
                onChange={(e) => handleNewColumnChange('name', e.target.value)}
                placeholder="Column name"
                className="flex-1 p-1 text-sm border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <select 
                value={newColumn.dataType}
                onChange={(e) => handleNewColumnChange('dataType', e.target.value)}
                className="ml-2 p-1 text-xs border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="VARCHAR">VARCHAR</option>
                <option value="NUMBER">NUMBER</option>
                <option value="INTEGER">INTEGER</option>
                <option value="FLOAT">FLOAT</option>
                <option value="BOOLEAN">BOOLEAN</option>
                <option value="DATE">DATE</option>
                <option value="TIMESTAMP">TIMESTAMP</option>
                <option value="VARIANT">VARIANT</option>
              </select>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={newColumn.isPrimaryKey}
                  onChange={(e) => handleNewColumnChange('isPrimaryKey', e.target.checked)}
                  className="mr-1"
                />
                PK
              </label>
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={newColumn.isForeignKey}
                  onChange={(e) => handleNewColumnChange('isForeignKey', e.target.checked)}
                  className="mr-1"
                />
                FK
              </label>
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={newColumn.isNullable}
                  onChange={(e) => handleNewColumnChange('isNullable', e.target.checked)}
                  className="mr-1"
                />
                NULL
              </label>
            </div>
            <div className="mt-2">
              <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">
                Comment
              </label>
              <input 
                type="text" 
                value={newColumn.comment || ''}
                onChange={(e) => handleNewColumnChange('comment', e.target.value)}
                placeholder="Optional column comment"
                className="w-full p-1 text-xs border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div className="mt-2">
              <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">
                Tags (comma separated)
              </label>
              <input 
                type="text" 
                value={newColumn.tags?.join(', ') || ''}
                onChange={(e) => handleTagsChange(e.target.value, true)}
                placeholder="tag1, tag2, tag3"
                className="w-full p-1 text-xs border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex justify-end space-x-1">
              <button 
                onClick={cancelAddingColumn}
                className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded"
              >
                Cancel
              </button>
              <button 
                onClick={addNewColumn}
                disabled={!newColumn.name.trim()}
                className="px-2 py-1 text-xs bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:hover:bg-green-300 text-white rounded"
              >
                Add
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setIsAddingColumn(true)}
            className="w-full mt-2 p-1 text-xs flex items-center justify-center border border-dashed border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Column
          </button>
        )}
      </div>
    </div>
  );
} 