// Node Types
export interface Column {
  id: string;
  name: string;
  dataType: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isNullable: boolean;
  referencedTable?: string;
  referencedColumn?: string;
}

export interface NodeType {
  id: string;
  type: 'table';
  position: { x: number; y: number };
  data: {
    label: string;
    columns: Column[];
  };
}

// Edge Types
export interface EdgeType {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
  type: 'relationship';
  data: {
    relationshipType: 'one-to-one' | 'one-to-many' | 'many-to-many';
  };
}

// Snowflake DDL Types
export interface SnowflakeTable {
  name: string;
  columns: Column[];
  primaryKey?: string[];
  foreignKeys?: {
    columns: string[];
    referencedTable: string;
    referencedColumns: string[];
  }[];
}

// OpenAI API Types
export interface AIPromptRequest {
  prompt: string;
}

export interface AIPromptResponse {
  erd: {
    nodes: NodeType[];
    edges: EdgeType[];
  };
  ddl: string;
}

// Snowflake credentials
export interface SnowflakeCredentials {
  accountIdentifier: string;
  username: string;
  password?: string;
  role: string;
  warehouse: string;
  database: string;
  schema: string;
  authType: 'password' | 'keypair'; 
  privateKey?: string;
  privateKeyPass?: string;
}

export interface SnowflakeExecutionResult {
  status: 'success' | 'error';
  message: string;
  rows?: any[];
  columns?: string[];
  error?: string;
} 