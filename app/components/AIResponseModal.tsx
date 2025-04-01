'use client';

import { useState, useEffect } from 'react';

interface AIResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewERD: () => void;
  status: 'loading' | 'success' | 'error';
  errorMessage?: string;
  rawResponse?: string;
}

export default function AIResponseModal({
  isOpen,
  onClose,
  onViewERD,
  status,
  errorMessage,
  rawResponse
}: AIResponseModalProps) {
  const [showFullResponse, setShowFullResponse] = useState(false);
  
  // Close modal when pressing Escape
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-3xl w-full max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold dark:text-white">
            {status === 'loading' ? 'Generating ERD and DDL...' : 
             status === 'success' ? 'Generation Complete' : 
             'Generation Failed'}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-auto">
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-16 h-16 border-4 border-primary-light border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 dark:text-gray-300 mt-4 text-center">
                The AI is generating your database schema...
                <br />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  This may take up to a minute
                </span>
              </p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="space-y-4">
              <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg">
                <p className="text-green-800 dark:text-green-200">
                  Successfully generated the ERD and DDL! You can now view your database schema.
                </p>
              </div>
              
              <div>
                <button
                  onClick={() => setShowFullResponse(!showFullResponse)}
                  className="text-sm text-primary-dark dark:text-primary-light flex items-center"
                >
                  <span className="mr-1">{showFullResponse ? 'Hide' : 'Show'} AI Response</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showFullResponse ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                  </svg>
                </button>
                
                {showFullResponse && rawResponse && (
                  <div className="mt-2 bg-gray-100 dark:bg-gray-900 p-3 rounded-lg max-h-[300px] overflow-auto">
                    <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                      {rawResponse}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-4">
              <div className="bg-red-100 dark:bg-red-900 p-4 rounded-lg">
                <p className="text-red-800 dark:text-red-200">
                  {errorMessage || 'An error occurred while generating the ERD and DDL.'}
                </p>
              </div>
              
              <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Troubleshooting tips:</h4>
                <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  <li>Check your OpenAI API key</li>
                  <li>Verify your account has access to GPT-4</li>
                  <li>Try simplifying your prompt</li>
                  <li>Check for any network issues</li>
                  <li>Try again in a few minutes</li>
                </ul>
              </div>
              
              {rawResponse && (
                <div>
                  <button
                    onClick={() => setShowFullResponse(!showFullResponse)}
                    className="text-sm text-primary-dark dark:text-primary-light flex items-center"
                  >
                    <span className="mr-1">{showFullResponse ? 'Hide' : 'Show'} Error Details</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showFullResponse ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                    </svg>
                  </button>
                  
                  {showFullResponse && (
                    <div className="mt-2 bg-gray-100 dark:bg-gray-900 p-3 rounded-lg max-h-[300px] overflow-auto">
                      <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                        {rawResponse}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          {status === 'loading' ? (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded dark:text-white"
            >
              Cancel
            </button>
          ) : status === 'success' ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded dark:text-white"
              >
                Close
              </button>
              <button
                onClick={onViewERD}
                className="px-4 py-2 text-sm bg-primary-light hover:bg-primary dark:bg-primary-dark hover:dark:bg-primary text-white rounded"
              >
                View ERD
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded dark:text-white"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 