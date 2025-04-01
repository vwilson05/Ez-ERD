import { NodeType, EdgeType, Column, SnowflakeTable, ERDNode } from './types';

export default class DDLGenerator {
  private nodes: ERDNode[];
  private edges: EdgeType[];
  private tables: SnowflakeTable[];

  constructor(nodes: ERDNode[], edges: EdgeType[]) {
    this.nodes = nodes;
    this.edges = edges;
    this.tables = this.nodesToTables();
  }

  /**
   * Convert our ERD nodes to Snowflake table definitions
   */
  private nodesToTables(): SnowflakeTable[] {
    return this.nodes.filter(node => node.type === 'table').map(node => {
      const primaryKeys = node.data.columns
        .filter(col => col.isPrimaryKey)
        .map(col => col.name);

      const foreignKeys = node.data.columns
        .filter(col => col.isForeignKey && col.referencedTable && col.referencedColumn)
        .map(col => ({
          columns: [col.name],
          referencedTable: col.referencedTable as string,
          referencedColumns: [col.referencedColumn as string]
        }));

      return {
        name: node.data.label,
        columns: node.data.columns,
        primaryKey: primaryKeys.length > 0 ? primaryKeys : undefined,
        foreignKeys: foreignKeys.length > 0 ? foreignKeys : undefined,
        comment: node.data.comment,
        tags: node.data.tags,
        tableType: node.data.tableType || 'TABLE'
      };
    });
  }

  /**
   * Generate Snowflake DDL for the tables
   */
  public generateSnowflakeDDL(): string {
    let ddl = '';

    // First generate table creation statements
    for (const table of this.tables) {
      ddl += this.generateTableDDL(table);
      ddl += '\n\n';
    }

    // Then generate foreign key relationships
    for (const table of this.tables) {
      if (table.foreignKeys && table.foreignKeys.length > 0) {
        for (const fk of table.foreignKeys) {
          ddl += this.generateForeignKeyDDL(table.name, fk);
          ddl += '\n\n';
        }
      }
    }

    return ddl;
  }

  /**
   * Generate DDL for a single table
   */
  private generateTableDDL(table: SnowflakeTable): string {
    // Handle different table types
    const tableType = table.tableType || 'TABLE';
    let ddl = `CREATE OR REPLACE ${tableType} ${this.formatIdentifier(table.name)} (\n`;
    
    // Column definitions
    const columnDefinitions = table.columns.map(column => {
      let colDef = `  ${this.formatIdentifier(column.name)} ${column.dataType}`;
      
      // Add NOT NULL constraint if not nullable
      if (!column.isNullable) {
        colDef += ' NOT NULL';
      }
      
      // Add column comment if exists
      if (column.comment) {
        colDef += ` COMMENT '${this.escapeQuotes(column.comment)}'`;
      }
      
      return colDef;
    });
    
    ddl += columnDefinitions.join(',\n');
    
    // Add primary key constraint if exists
    if (table.primaryKey && table.primaryKey.length > 0) {
      const pkColumns = table.primaryKey.map(col => this.formatIdentifier(col)).join(', ');
      ddl += `,\n  PRIMARY KEY (${pkColumns})`;
    }
    
    ddl += '\n)';
    
    // Add table comment if exists
    if (table.comment) {
      ddl += `\nCOMMENT = '${this.escapeQuotes(table.comment)}'`;
    }
    
    // Special options for different table types
    if (tableType === 'DYNAMIC_TABLE') {
      ddl += `\nTARGET_LAG = '1 minute'`; // Default lag for dynamic tables
    } else if (tableType === 'ICEBERG_TABLE') {
      ddl += `\nWITH ICEBERG_CATALOG = 'SNOWFLAKE'`; // Default catalog for Iceberg tables
    }
    
    // Add table tags if they exist
    if (table.tags && table.tags.length > 0) {
      ddl += `\nWITH TAG (${table.tags.map((tag: string) => `'${this.escapeQuotes(tag)}' = 'true'`).join(', ')})`;
    }
    
    ddl += ';';
    
    // Generate column-level tags in separate statements
    for (const column of table.columns) {
      if (column.tags && column.tags.length > 0) {
        ddl += `\n\nALTER TABLE ${this.formatIdentifier(table.name)} MODIFY COLUMN ${this.formatIdentifier(column.name)} SET TAG`;
        column.tags.forEach((tag, index) => {
          ddl += ` '${this.escapeQuotes(tag)}' = 'true'${index < column.tags!.length - 1 ? ',' : ''}`;
        });
        ddl += ';';
      }
    }
    
    return ddl;
  }

  /**
   * Generate DDL for a foreign key constraint
   */
  private generateForeignKeyDDL(tableName: string, foreignKey: {
    columns: string[];
    referencedTable: string;
    referencedColumns: string[];
  }): string {
    const fkColumns = foreignKey.columns.map(col => this.formatIdentifier(col)).join(', ');
    const refColumns = foreignKey.referencedColumns.map(col => this.formatIdentifier(col)).join(', ');
    
    return `ALTER TABLE ${this.formatIdentifier(tableName)}\n` +
      `  ADD FOREIGN KEY (${fkColumns})\n` +
      `  REFERENCES ${this.formatIdentifier(foreignKey.referencedTable)} (${refColumns});`;
  }

  /**
   * Format identifier for Snowflake DDL (handles spaces, special chars, etc.)
   */
  private formatIdentifier(identifier: string): string {
    // If identifier has spaces, special chars, or is a reserved word, wrap in double quotes
    if (/[^a-zA-Z0-9_]/.test(identifier) || this.isReservedWord(identifier)) {
      return `"${identifier}"`;
    }
    return identifier.toUpperCase();
  }

  /**
   * Escape single quotes in string literals
   */
  private escapeQuotes(str: string): string {
    return str.replace(/'/g, "''");
  }

  /**
   * Check if a word is a Snowflake reserved word
   */
  private isReservedWord(word: string): boolean {
    // This is a simplified list of some common Snowflake reserved words
    const reservedWords = [
      'table', 'select', 'from', 'where', 'insert', 'update', 'delete',
      'create', 'alter', 'drop', 'grant', 'revoke', 'order', 'by', 'group',
      'having', 'join', 'left', 'right', 'outer', 'inner', 'full', 'on',
      'union', 'all', 'as', 'distinct', 'limit', 'offset', 'with', 'database',
      'schema', 'warehouse', 'role', 'user', 'password', 'account', 'view',
      'function', 'procedure', 'pipe', 'stage', 'file', 'format', 'sequence',
      'dynamic_table', 'iceberg_table'
    ];
    
    return reservedWords.includes(word.toLowerCase());
  }
}