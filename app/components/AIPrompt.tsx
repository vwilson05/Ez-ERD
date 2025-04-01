'use client';

import { useState } from 'react';
import { NodeType, EdgeType, ERDNode } from '../utils/types';
import { useOpenAI } from '../utils/useOpenAI';
import AIResponseModal from './AIResponseModal';
import AIConversation from './AIConversation';

interface AIPromptProps {
  nodes: ERDNode[];
  setNodes: (nodes: ERDNode[]) => void;
  edges: EdgeType[];
  setEdges: (edges: EdgeType[]) => void;
  setDDL: (ddl: string) => void;
  setActiveTab?: (tab: 'erd' | 'ddl') => void;
}

export default function AIPrompt({ nodes, setNodes, edges, setEdges, setDDL, setActiveTab }: AIPromptProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [responseStatus, setResponseStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [rawResponse, setRawResponse] = useState('');
  const [activeSection, setActiveSection] = useState<'prompt' | 'conversation'>('prompt');
  
  const { 
    apiKey, 
    isApiKeyModalOpen, 
    tempApiKey, 
    setTempApiKey, 
    openApiKeyModal, 
    closeApiKeyModal, 
    saveApiKey, 
    generateERDFromPrompt,
    conversationHistory
  } = useOpenAI();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      return;
    }
    
    // If no API key, open the modal
    if (!apiKey) {
      openApiKeyModal();
      return;
    }
    
    await generateERDFromAPI(prompt, false);
  };
  
  const handleApiKeySave = () => {
    if (!tempApiKey.trim()) {
      return;
    }
    
    saveApiKey(tempApiKey);
    
    // After saving the API key, attempt to generate the ERD
    if (prompt.trim()) {
      generateERDFromAPI(prompt, false);
    }
  };
  
  const generateERDFromAPI = async (userPrompt: string, useHistory: boolean) => {
    setIsLoading(true);
    setError(null);
    setResponseStatus('loading');
    setIsResponseModalOpen(true);
    
    try {
      const result = await generateERDFromPrompt(userPrompt, useHistory);
      
      // Update the ERD and DDL
      setNodes(result.data.erd.nodes);
      setEdges(result.data.erd.edges);
      setDDL(result.data.ddl);
      
      // Save the raw response for display
      setRawResponse(result.rawResponse);
      
      // Set success status
      setResponseStatus('success');
      
      // Clear the prompt if this is a new prompt (not from conversation)
      if (!useHistory) {
        setPrompt('');
      }
      
      // Switch to conversation view if we're not already there
      if (activeSection === 'prompt' && conversationHistory.length > 1) {
        setActiveSection('conversation');
      }
    } catch (err: any) {
      if (err.message === 'API_KEY_REQUIRED') {
        setIsResponseModalOpen(false);
        openApiKeyModal();
      } else {
        console.error('Error generating ERD:', err);
        setErrorMessage(err.message || 'Failed to generate ERD. Please try again or adjust your prompt.');
        setRawResponse(err.toString());
        setResponseStatus('error');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleViewERD = () => {
    setIsResponseModalOpen(false);
    if (setActiveTab) {
      setActiveTab('erd');
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold dark:text-white">AI Assistant</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Describe your database requirements in plain English, and the AI will generate an ERD and Snowflake DDL for you.
      </p>
      
      {/* Tab selector */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          className={`px-4 py-2 text-sm border-b-2 ${
            activeSection === 'prompt' 
              ? 'border-primary-dark text-primary-dark dark:text-primary-light dark:border-primary-light' 
              : 'border-transparent text-gray-500 dark:text-gray-400'
          }`}
          onClick={() => setActiveSection('prompt')}
        >
          New Prompt
        </button>
        <button
          className={`px-4 py-2 text-sm border-b-2 ${
            activeSection === 'conversation' 
              ? 'border-primary-dark text-primary-dark dark:text-primary-light dark:border-primary-light' 
              : 'border-transparent text-gray-500 dark:text-gray-400'
          } ${conversationHistory.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => setActiveSection('conversation')}
          disabled={conversationHistory.length === 0}
        >
          Conversation
          {conversationHistory.filter(msg => msg.role !== 'system').length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 bg-primary-light text-white text-xs rounded-full">
              {conversationHistory.filter(msg => msg.role !== 'system').length}
            </span>
          )}
        </button>
      </div>
      
      {activeSection === 'prompt' ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Example: Create a customer order database with products, categories, and order details..."
            className="w-full h-40 p-2 border rounded dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
            disabled={isLoading}
          />
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <button
            type="submit"
            className="w-full bg-primary-light hover:bg-primary dark:bg-primary-dark hover:dark:bg-primary text-white px-3 py-2 rounded text-sm flex justify-center items-center"
            disabled={isLoading || !prompt.trim()}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              'Generate ERD and DDL'
            )}
          </button>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <h4 className="font-medium text-sm dark:text-white mb-2">Example Prompts:</h4>
            <div className="space-y-2">
              <div 
                className="p-2 border border-gray-300 dark:border-gray-600 rounded text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => setPrompt('Create a simple e-commerce database with customers, products, and orders.')}
              >
                Create a simple e-commerce database with customers, products, and orders.
              </div>
              <div 
                className="p-2 border border-gray-300 dark:border-gray-600 rounded text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => setPrompt('I need a database for a hospital with patients, doctors, appointments, and medical records.')}
              >
                I need a database for a hospital with patients, doctors, appointments, and medical records.
              </div>
              <div 
                className="p-2 border border-gray-300 dark:border-gray-600 rounded text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => setPrompt('Design a database for tracking inventory across multiple warehouses with products, suppliers, and stock levels.')}
              >
                Design a database for tracking inventory across multiple warehouses with products, suppliers, and stock levels.
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="h-[300px]">
          <AIConversation onNewGeneration={generateERDFromAPI} />
        </div>
      )}
      
      {/* OpenAI API Key Modal */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Enter OpenAI API Key</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              To use the AI assistant, you need to provide your OpenAI API key. 
              The key will be stored in your browser's local storage and not sent anywhere except to OpenAI's API.
            </p>
            
            <input
              type="password"
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full p-2 border rounded dark:border-gray-600 bg-white dark:bg-gray-900 text-sm mb-4"
            />
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={closeApiKeyModal}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded dark:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleApiKeySave}
                className="px-4 py-2 text-sm bg-primary-light hover:bg-primary dark:bg-primary-dark hover:dark:bg-primary text-white rounded"
                disabled={!tempApiKey.trim()}
              >
                Save API Key
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* AI Response Modal */}
      <AIResponseModal
        isOpen={isResponseModalOpen}
        onClose={() => setIsResponseModalOpen(false)}
        onViewERD={handleViewERD}
        status={responseStatus}
        errorMessage={errorMessage}
        rawResponse={rawResponse}
      />
    </div>
  );
} 