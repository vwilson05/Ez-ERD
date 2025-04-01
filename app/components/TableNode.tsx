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
  };
  selected: boolean;
}

export default function TableNode({ id, data, selected }: TableNodeProps) {
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editedColumn, setEditedColumn] = useState<Column | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumn, setNewColumn] = useState<Column>({
    id: '',
    name: '',
    dataType: 'VARCHAR',
    isPrimaryKey: false,
    isForeignKey: false,
    isNullable: true
  });

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
      isNullable: true
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
      isNullable: true
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

  return (
    <div className={`border-2 rounded-md overflow-hidden ${
      selected ? 'border-primary-dark dark:border-primary-light' : 'border-gray-300 dark:border-gray-600'
    } bg-white dark:bg-gray-800 shadow-md min-w-[250px] relative`}>
      {/* Connection handles - one in the center of each side */}
      <Handle
        type="source"
        position={Position.Top}
        id={`${id}-top`}
        className="w-3 h-3 !bg-blue-500 !border-2"
        style={{ left: '50%' }}
      />
      
      <Handle
        type="source"
        position={Position.Left}
        id={`${id}-left`}
        className="w-3 h-3 !bg-blue-500 !border-2"
        style={{ top: '50%' }}
      />
      
      <Handle
        type="target"
        position={Position.Right}
        id={`${id}-right`}
        className="w-3 h-3 !bg-green-500 !border-2"
        style={{ top: '50%' }}
      />
      
      <Handle
        type="target"
        position={Position.Bottom}
        id={`${id}-bottom`}
        className="w-3 h-3 !bg-green-500 !border-2"
        style={{ left: '50%' }}
      />
      
      {/* Table Header */}
      <div className="bg-gray-100 dark:bg-gray-700 p-2 font-semibold border-b border-gray-300 dark:border-gray-600">
        {data.label}
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