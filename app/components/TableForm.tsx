'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Column } from '../utils/types';
import { tableTemplates, TableTemplate } from '../utils/tableTemplates';

interface TableFormProps {
  onSave: (tableName: string, columns: Column[], tableType?: string, tableComment?: string) => void;
  onCancel: () => void;
  existingTables?: { id: string; label: string; columns: Column[] }[];
  initialValues?: {
    tableName: string;
    columns: Column[];
    tableType?: string;
    tableComment?: string;
  };
}

export default function TableForm({ onSave, onCancel, existingTables = [], initialValues }: TableFormProps) {
  const [formMode, setFormMode] = useState<'custom' | 'template'>(initialValues ? 'custom' : 'custom');
  const [selectedTemplate, setSelectedTemplate] = useState<TableTemplate | null>(null);
  
  const [tableName, setTableName] = useState(initialValues?.tableName || '');
  const [tableType, setTableType] = useState<'TABLE' | 'VIEW' | 'MATERIALIZED_VIEW' | 'DYNAMIC_TABLE' | 'ICEBERG_TABLE'>(
    (initialValues?.tableType as any) || 'TABLE'
  );
  const [tableComment, setTableComment] = useState(initialValues?.tableComment || '');
  
  const [columns, setColumns] = useState<Column[]>(
    initialValues?.columns || [
      {
        id: uuidv4(),
        name: '',
        dataType: 'VARCHAR',
        isPrimaryKey: false,
        isForeignKey: false,
        isNullable: true,
        comment: '',
      },
    ]
  );

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
        comment: '',
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
      alert('Please enter a name');
      return;
    }
    
    let columnsToSave: Column[] = [];
    
    if (formMode === 'custom') {
      if (columns.some((col) => !col.name.trim())) {
        alert('All columns must have a name');
        return;
      }
      
      columnsToSave = columns;
    } else if (formMode === 'template' && selectedTemplate) {
      columnsToSave = selectedTemplate.getColumns(tableName);
    }
    
    onSave(tableName, columnsToSave, tableType, tableComment);
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

  // Helper function to get display name for object type
  const getObjectTypeDisplayName = (type: string) => {
    switch (type) {
      case 'VIEW': return 'View';
      case 'MATERIALIZED_VIEW': return 'Materialized View';
      case 'DYNAMIC_TABLE': return 'Dynamic Table';
      case 'ICEBERG_TABLE': return 'Iceberg Table';
      default: return 'Table';
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="tableName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Name
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
        
        <div>
          <label htmlFor="objectType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Object Type
          </label>
          <select
            id="objectType"
            value={tableType}
            onChange={(e) => setTableType(e.target.value as any)}
            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-900 dark:text-white text-sm"
          >
            <option value="TABLE">Table</option>
            <option value="VIEW">View</option>
            <option value="MATERIALIZED_VIEW">Materialized View</option>
            <option value="DYNAMIC_TABLE">Dynamic Table</option>
            <option value="ICEBERG_TABLE">Iceberg Table</option>
          </select>
        </div>
      </div>
      
      <div>
        <label htmlFor="tableComment" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Table Comment
        </label>
        <input
          type="text"
          id="tableComment"
          value={tableComment}
          onChange={(e) => setTableComment(e.target.value)}
          placeholder="Add a comment for the table..."
          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-900 dark:text-white text-sm"
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
          Custom
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
                    <select
                      value={column.referencedTable || ''}
                      onChange={(e) => updateColumn(column.id, 'referencedTable', e.target.value)}
                      className="block w-full border border-gray-300 dark:border-gray-600 rounded shadow-sm dark:bg-gray-900 dark:text-white text-sm"
                    >
                      <option value="">Select Table</option>
                      {existingTables.map((table) => (
                        <option key={table.id} value={table.label}>
                          {table.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={column.referencedColumn || ''}
                      onChange={(e) => updateColumn(column.id, 'referencedColumn', e.target.value)}
                      className="block w-full border border-gray-300 dark:border-gray-600 rounded shadow-sm dark:bg-gray-900 dark:text-white text-sm"
                      disabled={!column.referencedTable}
                    >
                      <option value="">Select Column</option>
                      {column.referencedTable && existingTables
                        .find((table) => table.label === column.referencedTable)
                        ?.columns.map((col) => (
                          <option key={col.id} value={col.name}>
                            {col.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="mt-2">
                  <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">
                    Column Comment
                  </label>
                  <input 
                    type="text" 
                    value={column.comment || ''}
                    onChange={(e) => updateColumn(column.id, 'comment', e.target.value)}
                    placeholder="Optional column comment"
                    className="w-full p-1 text-xs border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
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
          Create {getObjectTypeDisplayName(tableType)}
        </button>
      </div>
    </form>
  );
} 