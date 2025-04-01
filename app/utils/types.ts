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
  comment?: string;
  tags?: string[];
}

// TableNode Type
export interface NodeType {
  id: string;
  type: 'table';
  position: { x: number; y: number };
  data: {
    label: string;
    columns: Column[];
    comment?: string;
    tags?: string[];
    tableType?: 'TABLE' | 'VIEW' | 'MATERIALIZED_VIEW' | 'DYNAMIC_TABLE' | 'ICEBERG_TABLE';
  };
}

// DomainNode Type
export interface DomainNodeType {
  id: string;
  type: 'domain';
  position: { x: number; y: number };
  style?: { width?: number; height?: number };
  data: {
    label: string;
    color: string;
    opacity: number;
    onDelete?: (nodeId: string) => void;
  };
}

// Combined node type
export type ERDNode = NodeType | DomainNodeType;

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
  comment?: string;
  tags?: string[];
  tableType?: 'TABLE' | 'VIEW' | 'MATERIALIZED_VIEW' | 'DYNAMIC_TABLE' | 'ICEBERG_TABLE';
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