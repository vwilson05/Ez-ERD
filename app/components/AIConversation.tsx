'use client';

import { useState } from 'react';
import { useOpenAI } from '../utils/useOpenAI';

interface AIConversationProps {
  onNewGeneration: (prompt: string, useHistory: boolean) => Promise<void>;
}

export default function AIConversation({ onNewGeneration }: AIConversationProps) {
  const [newPrompt, setNewPrompt] = useState('');
  const { conversationHistory, clearConversation } = useOpenAI();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrompt.trim()) return;
    
    setIsLoading(true);
    try {
      await onNewGeneration(newPrompt, true);
      setNewPrompt('');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Only show messages from user and assistant (skip system message)
  const visibleMessages = conversationHistory.filter(msg => msg.role !== 'system');
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between mb-2">
        <h4 className="font-medium text-sm dark:text-white">Conversation History</h4>
        {visibleMessages.length > 0 && (
          <button
            onClick={clearConversation}
            className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400"
          >
            Clear History
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-auto mb-4 border rounded dark:border-gray-700">
        {visibleMessages.length === 0 ? (
          <div className="p-4 text-gray-500 dark:text-gray-400 text-sm italic text-center">
            No conversation history yet. Start by generating an ERD.
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {visibleMessages.map((message, index) => (
              <div key={index} className={`p-3 ${message.role === 'user' ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'}`}>
                <div className="font-medium text-xs text-gray-700 dark:text-gray-300 mb-1">
                  {message.role === 'user' ? 'You' : 'AI Assistant'}:
                </div>
                <div className="text-sm whitespace-pre-wrap">
                  {message.role === 'assistant' ? (
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {message.content.length > 300 
                        ? message.content.substring(0, 300) + '...' 
                        : message.content}
                    </div>
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="mt-auto">
        <div className="flex items-center space-x-2">
          <textarea
            value={newPrompt}
            onChange={(e) => setNewPrompt(e.target.value)}
            placeholder="Add a follow-up instruction..."
            className="flex-1 p-2 border rounded dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
            rows={3}
            disabled={isLoading || visibleMessages.length === 0}
          />
          <button
            type="submit"
            className="h-full px-4 py-2 bg-primary-light hover:bg-primary dark:bg-primary-dark hover:dark:bg-primary text-white rounded text-sm flex items-center justify-center"
            disabled={isLoading || !newPrompt.trim() || visibleMessages.length === 0}
          >
            {isLoading ? (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Send'
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 