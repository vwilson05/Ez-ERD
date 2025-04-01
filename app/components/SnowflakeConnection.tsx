'use client';

import { useState, useEffect } from 'react';
import { useSnowflake } from '../utils/useSnowflake';
import { SnowflakeCredentials, SnowflakeExecutionResult } from '../utils/types';

export default function SnowflakeConnection({
  ddl,
  onExecutionComplete
}: {
  ddl: string;
  onExecutionComplete?: (result: SnowflakeExecutionResult) => void;
}) {
  const {
    credentials,
    isConnected,
    isTestingConnection,
    connectionError,
    isExecuting,
    saveCredentials,
    clearCredentials,
    testConnection,
    executeSQL
  } = useSnowflake();

  const [formData, setFormData] = useState<SnowflakeCredentials>({
    accountIdentifier: '',
    username: '',
    password: '',
    role: '',
    warehouse: '',
    database: '',
    schema: '',
    authType: 'password',
    privateKey: '',
    privateKeyPass: ''
  });

  const [showConnectionForm, setShowConnectionForm] = useState(!isConnected);
  const [executionResult, setExecutionResult] = useState<SnowflakeExecutionResult | null>(null);

  // Initialize form with saved credentials
  useEffect(() => {
    if (credentials) {
      setFormData({
        ...credentials,
        // Don't expose sensitive info in the form
        password: credentials.password ? '••••••••' : '',
        privateKey: credentials.privateKey ? '••••••••' : '',
        privateKeyPass: credentials.privateKeyPass ? '••••••••' : ''
      });
    }
  }, [credentials]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Don't update masked fields if they haven't changed
    const updatedCredentials = { ...formData };
    if (credentials?.password && formData.password === '••••••••') {
      updatedCredentials.password = credentials.password;
    }
    if (credentials?.privateKey && formData.privateKey === '••••••••') {
      updatedCredentials.privateKey = credentials.privateKey;
    }
    if (credentials?.privateKeyPass && formData.privateKeyPass === '••••••••') {
      updatedCredentials.privateKeyPass = credentials.privateKeyPass;
    }
    
    saveCredentials(updatedCredentials);
    const success = await testConnection();
    
    if (success) {
      setShowConnectionForm(false);
    }
  };

  const handleExecuteDDL = async () => {
    if (!ddl.trim()) return;
    
    const result = await executeSQL(ddl);
    setExecutionResult(result);
    
    if (onExecutionComplete) {
      onExecutionComplete(result);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h2 className="text-xl font-semibold mb-4">Snowflake Connection</h2>
      
      {isConnected ? (
        <div className="mb-4">
          <div className="bg-green-100 text-green-800 p-3 rounded mb-3 flex justify-between items-center">
            <span>
              <span className="font-medium">Connected to Snowflake:</span> {credentials?.accountIdentifier} as {credentials?.username}
            </span>
            <div>
              <button 
                onClick={() => setShowConnectionForm(!showConnectionForm)} 
                className="px-2 py-1 text-sm bg-white border border-gray-300 rounded mr-2 hover:bg-gray-50"
              >
                {showConnectionForm ? 'Hide Settings' : 'Show Settings'}
              </button>
              <button 
                onClick={clearCredentials} 
                className="px-2 py-1 text-sm bg-white border border-red-300 text-red-600 rounded hover:bg-red-50"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      ) : (
        connectionError && (
          <div className="bg-red-100 text-red-800 p-3 rounded mb-3">
            <span className="font-medium">Connection failed:</span> {connectionError}
          </div>
        )
      )}
      
      {showConnectionForm && (
        <form onSubmit={handleSubmit} className="space-y-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Account Identifier */}
            <div>
              <label htmlFor="accountIdentifier" className="block text-sm font-medium text-gray-700 mb-1">
                Account Identifier <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="accountIdentifier"
                name="accountIdentifier"
                value={formData.accountIdentifier}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded text-gray-900"
                placeholder="xy12345.us-east-1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Format: orgname-accountname or account locator</p>
            </div>
            
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded text-gray-900"
                required
              />
            </div>
            
            {/* Authentication Type */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Authentication Method</label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="authType"
                    value="password"
                    checked={formData.authType === 'password'}
                    onChange={handleInputChange}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Password</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="authType"
                    value="keypair"
                    checked={formData.authType === 'keypair'}
                    onChange={handleInputChange}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Key Pair</span>
                </label>
              </div>
            </div>
            
            {/* Password or Private Key based on auth type */}
            {formData.authType === 'password' ? (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded text-gray-900"
                  required={formData.authType === 'password'}
                />
              </div>
            ) : (
              <>
                <div className="md:col-span-2">
                  <label htmlFor="privateKey" className="block text-sm font-medium text-gray-700 mb-1">
                    Private Key <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="privateKey"
                    name="privateKey"
                    value={formData.privateKey}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded text-gray-900"
                    rows={4}
                    placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                    required={formData.authType === 'keypair'}
                  />
                </div>
                <div>
                  <label htmlFor="privateKeyPass" className="block text-sm font-medium text-gray-700 mb-1">
                    Private Key Passphrase
                  </label>
                  <input
                    type="password"
                    id="privateKeyPass"
                    name="privateKeyPass"
                    value={formData.privateKeyPass}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded text-gray-900"
                  />
                </div>
              </>
            )}
            
            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <input
                type="text"
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded text-gray-900"
                placeholder="ACCOUNTADMIN"
              />
            </div>
            
            {/* Warehouse */}
            <div>
              <label htmlFor="warehouse" className="block text-sm font-medium text-gray-700 mb-1">
                Warehouse
              </label>
              <input
                type="text"
                id="warehouse"
                name="warehouse"
                value={formData.warehouse}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded text-gray-900"
                placeholder="COMPUTE_WH"
              />
            </div>
            
            {/* Database */}
            <div>
              <label htmlFor="database" className="block text-sm font-medium text-gray-700 mb-1">
                Database
              </label>
              <input
                type="text"
                id="database"
                name="database"
                value={formData.database}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded text-gray-900"
              />
            </div>
            
            {/* Schema */}
            <div>
              <label htmlFor="schema" className="block text-sm font-medium text-gray-700 mb-1">
                Schema
              </label>
              <input
                type="text"
                id="schema"
                name="schema"
                value={formData.schema}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded text-gray-900"
                placeholder="PUBLIC"
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isTestingConnection}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center disabled:bg-blue-400"
            >
              {isTestingConnection ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Testing Connection...
                </>
              ) : (
                'Save & Test Connection'
              )}
            </button>
          </div>
        </form>
      )}
      
      {isConnected && (
        <div className="border-t pt-4 mt-4">
          <h3 className="text-lg font-medium mb-3">Execute DDL</h3>
          
          <div className="bg-gray-100 p-3 rounded mb-3 overflow-auto max-h-96">
            <pre className="text-sm whitespace-pre-wrap">{ddl}</pre>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleExecuteDDL}
              disabled={isExecuting || !ddl.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center disabled:bg-green-400"
            >
              {isExecuting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Executing...
                </>
              ) : (
                'Execute in Snowflake'
              )}
            </button>
          </div>
          
          {executionResult && (
            <div className={`mt-4 p-3 rounded ${
              executionResult.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <h4 className="font-medium mb-2">{executionResult.status === 'success' ? 'Success' : 'Error'}</h4>
              <p>{executionResult.message}</p>
              {executionResult.error && <p className="mt-1 font-medium">Error: {executionResult.error}</p>}
              
              {executionResult.columns && executionResult.rows && (
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-300 mt-2">
                    <thead>
                      <tr>
                        {executionResult.columns.map((col, i) => (
                          <th key={i} className="py-2 px-4 border-b bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {executionResult.rows.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          {row.map((cell: any, j: number) => (
                            <td key={j} className="py-2 px-4 border-b text-sm">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 