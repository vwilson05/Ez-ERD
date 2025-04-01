'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Column } from '../utils/types';
import { tableTemplates, TableTemplate } from '../utils/tableTemplates';

interface TableFormProps {
  onSave: (tableName: string, columns: Column[]) => void;
  onCancel: () => void;
}

export default function TableForm({ onSave, onCancel }: TableFormProps) {
  const [formMode, setFormMode] = useState<'custom' | 'template'>('custom');
  const [selectedTemplate, setSelectedTemplate] = useState<TableTemplate | null>(null);
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState<Column[]>([
    {
      id: uuidv4(),
      name: '',
      dataType: 'VARCHAR',
      isPrimaryKey: false,
      isForeignKey: false,
      isNullable: true,
    },
  ]);

  // Group templates by category
  const groupedTemplates = tableTemplates.reduce<Record<string, TableTemplate[]>>((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {});

  const addColumn = () => {
    setColumns([
      ...columns,
      {
        id: uuidv4(),
        name: '',
        dataType: 'VARCHAR',
        isPrimaryKey: false,
        isForeignKey: false,
        isNullable: true,
      },
    ]);
  };

  const removeColumn = (id: string) => {
    setColumns(columns.filter((column) => column.id !== id));
  };

  const updateColumn = (id: string, field: keyof Column, value: any) => {
    setColumns(
      columns.map((column) =>
        column.id === id ? { ...column, [field]: value } : column
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!tableName.trim()) {
      alert('Please enter a table name');
      return;
    }
    
    let columnsToSave: Column[] = [];
    
    if (formMode === 'custom') {
      if (columns.some((col) => !col.name.trim())) {
        alert('All columns must have a name');
        return;
      }
      
      // Check if at least one primary key exists
      if (!columns.some((col) => col.isPrimaryKey)) {
        alert('Table must have at least one primary key');
        return;
      }
      
      columnsToSave = columns;
    } else if (formMode === 'template' && selectedTemplate) {
      columnsToSave = selectedTemplate.getColumns(tableName);
    }
    
    onSave(tableName, columnsToSave);
  };

  const handleTemplateSelect = (template: TableTemplate) => {
    setSelectedTemplate(template);
  };

  const handleModeChange = (mode: 'custom' | 'template') => {
    setFormMode(mode);
    if (mode === 'custom') {
      setSelectedTemplate(null);
    }
  };

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="tableName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Table Name
        </label>
        <input
          type="text"
          id="tableName"
          value={tableName}
          onChange={(e) => setTableName(e.target.value)}
          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-900 dark:text-white text-sm"
          required
        />
      </div>
      
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
        <button
          type="button"
          className={`py-2 px-4 text-sm font-medium ${
            formMode === 'custom'
              ? 'border-b-2 border-primary-dark dark:border-primary-light text-primary-dark dark:text-primary-light'
              : 'text-gray-500 dark:text-gray-400'
          }`}
          onClick={() => handleModeChange('custom')}
        >
          Custom Table
        </button>
        <button
          type="button"
          className={`py-2 px-4 text-sm font-medium ${
            formMode === 'template'
              ? 'border-b-2 border-primary-dark dark:border-primary-light text-primary-dark dark:text-primary-light'
              : 'text-gray-500 dark:text-gray-400'
          }`}
          onClick={() => handleModeChange('template')}
        >
          Use Template
        </button>
      </div>
      
      {formMode === 'custom' ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Columns
          </label>
          
          <div className="space-y-3">
            {columns.map((column, index) => (
              <div key={column.id} className="flex flex-col space-y-2 p-2 border rounded dark:border-gray-700">
                <div className="flex justify-between">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Column {index + 1}</span>
                  {columns.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeColumn(column.id)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <input
                  type="text"
                  placeholder="Column Name"
                  value={column.name}
                  onChange={(e) => updateColumn(column.id, 'name', e.target.value)}
                  className="block w-full border border-gray-300 dark:border-gray-600 rounded shadow-sm dark:bg-gray-900 dark:text-white text-sm"
                  required
                />
                
                <select
                  value={column.dataType}
                  onChange={(e) => updateColumn(column.id, 'dataType', e.target.value)}
                  className="block w-full border border-gray-300 dark:border-gray-600 rounded shadow-sm dark:bg-gray-900 dark:text-white text-sm"
                >
                  {snowflakeDataTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                
                <div className="flex space-x-4">
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={column.isPrimaryKey}
                      onChange={(e) => updateColumn(column.id, 'isPrimaryKey', e.target.checked)}
                      className="mr-1"
                    />
                    Primary Key
                  </label>
                  
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={column.isForeignKey}
                      onChange={(e) => updateColumn(column.id, 'isForeignKey', e.target.checked)}
                      className="mr-1"
                    />
                    Foreign Key
                  </label>
                  
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={column.isNullable}
                      onChange={(e) => updateColumn(column.id, 'isNullable', e.target.checked)}
                      className="mr-1"
                    />
                    Nullable
                  </label>
                </div>
                
                {column.isForeignKey && (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Referenced Table"
                      value={column.referencedTable || ''}
                      onChange={(e) => updateColumn(column.id, 'referencedTable', e.target.value)}
                      className="block w-full border border-gray-300 dark:border-gray-600 rounded shadow-sm dark:bg-gray-900 dark:text-white text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Referenced Column"
                      value={column.referencedColumn || ''}
                      onChange={(e) => updateColumn(column.id, 'referencedColumn', e.target.value)}
                      className="block w-full border border-gray-300 dark:border-gray-600 rounded shadow-sm dark:bg-gray-900 dark:text-white text-sm"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <button
            type="button"
            onClick={addColumn}
            className="mt-2 text-sm text-primary-dark dark:text-primary-light flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Column
          </button>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select a Template
          </label>
          
          <div className="space-y-4">
            {Object.entries(groupedTemplates).map(([category, templates]) => (
              <div key={category} className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{category}</h3>
                <div className="grid grid-cols-1 gap-2">
                  {templates.map((template) => (
                    <div
                      key={template.name}
                      className={`p-3 border rounded cursor-pointer ${
                        selectedTemplate?.name === template.name
                          ? 'border-primary-dark dark:border-primary-light bg-primary-light/10 dark:bg-primary-dark/10'
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <div className="font-medium text-sm dark:text-white">{template.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {template.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {selectedTemplate && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preview of {selectedTemplate.name}
              </h4>
              <div className="text-xs overflow-auto max-h-40">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      <th className="p-1 text-left">Column</th>
                      <th className="p-1 text-left">Type</th>
                      <th className="p-1 text-left">PK</th>
                      <th className="p-1 text-left">FK</th>
                      <th className="p-1 text-left">Nullable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTemplate.getColumns('PREVIEW').map((col) => (
                      <tr key={col.id} className="border-t border-gray-200 dark:border-gray-600">
                        <td className="p-1">{col.name}</td>
                        <td className="p-1">{col.dataType}</td>
                        <td className="p-1">{col.isPrimaryKey ? '✓' : ''}</td>
                        <td className="p-1">{col.isForeignKey ? '✓' : ''}</td>
                        <td className="p-1">{col.isNullable ? '✓' : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Note: Table-specific columns will be customized based on your table name.
              </p>
            </div>
          )}
        </div>
      )}
      
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded dark:text-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm bg-primary-light hover:bg-primary dark:bg-primary-dark hover:dark:bg-primary text-white rounded"
          disabled={formMode === 'template' && !selectedTemplate}
        >
          Save Table
        </button>
      </div>
    </form>
  );
} 