import { useState, useEffect } from 'react';
import { AIPromptResponse } from './types';
import { v4 as uuidv4 } from 'uuid';

interface GenerateERDResult {
  data: AIPromptResponse;
  rawResponse: string;
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function useOpenAI() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  
  useEffect(() => {
    // Try to load API key from localStorage if available
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
    
    // Try to load conversation history from localStorage
    const savedHistory = localStorage.getItem('conversation_history');
    if (savedHistory) {
      try {
        setConversationHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse saved conversation history:', e);
      }
    }
  }, []);
  
  // Save conversation history to localStorage whenever it changes
  useEffect(() => {
    if (conversationHistory.length > 0) {
      localStorage.setItem('conversation_history', JSON.stringify(conversationHistory));
    }
  }, [conversationHistory]);
  
  const saveApiKey = (key: string) => {
    localStorage.setItem('openai_api_key', key);
    setApiKey(key);
    setIsApiKeyModalOpen(false);
  };
  
  const openApiKeyModal = () => {
    setTempApiKey('');
    setIsApiKeyModalOpen(true);
  };
  
  const closeApiKeyModal = () => {
    setIsApiKeyModalOpen(false);
  };
  
  const clearConversation = () => {
    setConversationHistory([]);
    localStorage.removeItem('conversation_history');
  };
  
  const generateERDFromPrompt = async (prompt: string, useHistory: boolean = false): Promise<GenerateERDResult> => {
    if (!apiKey) {
      // Instead of using window.prompt, return a flag indicating the API key is needed
      // The component can then show a proper modal
      throw new Error('API_KEY_REQUIRED');
    }
    
    try {
      // Add system message if this is the first message or not using history
      let messages: Message[] = [];
      
      if (!useHistory || conversationHistory.length === 0) {
        // Starting a new conversation
        const systemMessage: Message = {
          role: 'system',
          content: `You are a database expert specialized in designing Entity Relationship Diagrams (ERDs) and generating Snowflake SQL DDL.
            
When given requirements, you'll respond with:
1. A JSON representation of the ERD with tables (nodes) and relationships (edges)
2. The Snowflake SQL DDL code to create the database

Follow these guidelines:
- Create clear and normalized table designs 
- Use appropriate Snowflake data types
- Include primary and foreign keys
- Add appropriate indexes and constraints
- For each table, include relevant columns based on the context
- Enforce referential integrity with foreign key relationships

The response must be valid JSON in this exact format:
{
  "erd": {
    "nodes": [
      {
        "id": "string",
        "type": "table",
        "position": { "x": number, "y": number },
        "data": {
          "label": "string",
          "columns": [
            {
              "id": "string",
              "name": "string",
              "dataType": "string",
              "isPrimaryKey": boolean,
              "isForeignKey": boolean,
              "isNullable": boolean,
              "referencedTable": "string" (optional),
              "referencedColumn": "string" (optional)
            }
          ]
        }
      }
    ],
    "edges": [
      {
        "id": "string",
        "source": "string",
        "target": "string",
        "sourceHandle": "string",
        "targetHandle": "string",
        "type": "relationship",
        "data": {
          "relationshipType": "one-to-one | one-to-many | many-to-many"
        }
      }
    ]
  },
  "ddl": "string (full Snowflake DDL SQL code)"
}`
        };
        
        messages = [systemMessage];
      } else if (useHistory) {
        // Use existing conversation history
        messages = [...conversationHistory];
      }
      
      // Add the new user message
      const userMessage: Message = {
        role: 'user',
        content: prompt
      };
      messages.push(userMessage);
      
      // Build the API request payload
      const requestPayload = {
        model: 'gpt-4',
        messages: messages,
        temperature: 0.2
      };
      
      // Call the OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestPayload)
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorData}`);
      }
      
      const data = await response.json();
      
      // Parse the JSON response from the message content
      const content = data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in the API response');
      }
      
      console.log('Raw OpenAI response:', content);
      
      // Add the assistant's response to the conversation history
      const assistantMessage: Message = {
        role: 'assistant',
        content: content
      };
      
      // Update conversation history
      const updatedHistory = [...messages, assistantMessage];
      setConversationHistory(updatedHistory);
      
      // Extract the JSON part of the response
      let jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse JSON from the API response: ' + content);
      }
      
      try {
        const parsedResponse = JSON.parse(jsonMatch[0]) as AIPromptResponse;
        
        // Process the nodes and edges to ensure they have valid IDs and references
        parsedResponse.erd.nodes = parsedResponse.erd.nodes.map(node => ({
          ...node,
          id: node.id || uuidv4(),
          position: node.position || { x: Math.random() * 500, y: Math.random() * 300 },
          data: {
            ...node.data,
            columns: node.data.columns.map(col => ({
              ...col,
              id: col.id || uuidv4()
            }))
          }
        }));
        
        parsedResponse.erd.edges = parsedResponse.erd.edges.map(edge => ({
          ...edge,
          id: edge.id || `e${edge.source}-${edge.target}`,
          sourceHandle: edge.sourceHandle || `${edge.source}-source`,
          targetHandle: edge.targetHandle || `${edge.target}-target`
        }));
        
        return {
          data: parsedResponse,
          rawResponse: content
        };
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError);
        throw new Error('Failed to parse JSON response: ' + (jsonError as Error).message + '\n\nRaw content: ' + content);
      }
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  };
  
  // Return the functions and state needed by components
  return {
    apiKey,
    saveApiKey,
    isApiKeyModalOpen,
    tempApiKey,
    setTempApiKey,
    openApiKeyModal,
    closeApiKeyModal,
    generateERDFromPrompt,
    conversationHistory,
    clearConversation
  };
} 