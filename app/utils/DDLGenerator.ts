import { NodeType, EdgeType, Column, SnowflakeTable } from './types';

export default class DDLGenerator {
  private nodes: NodeType[];
  private edges: EdgeType[];
  private tables: SnowflakeTable[];

  constructor(nodes: NodeType[], edges: EdgeType[]) {
    this.nodes = nodes;
    this.edges = edges;
    this.tables = this.nodesToTables();
  }

  /**
   * Convert our ERD nodes to Snowflake table definitions
   */
  private nodesToTables(): SnowflakeTable[] {
    return this.nodes.map(node => {
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
        foreignKeys: foreignKeys.length > 0 ? foreignKeys : undefined
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
    let ddl = `CREATE OR REPLACE TABLE ${this.formatIdentifier(table.name)} (\n`;
    
    // Column definitions
    const columnDefinitions = table.columns.map(column => {
      let colDef = `  ${this.formatIdentifier(column.name)} ${column.dataType}`;
      
      // Add NOT NULL constraint if not nullable
      if (!column.isNullable) {
        colDef += ' NOT NULL';
      }
      
      return colDef;
    });
    
    ddl += columnDefinitions.join(',\n');
    
    // Add primary key constraint if exists
    if (table.primaryKey && table.primaryKey.length > 0) {
      const pkColumns = table.primaryKey.map(col => this.formatIdentifier(col)).join(', ');
      ddl += `,\n  PRIMARY KEY (${pkColumns})`;
    }
    
    ddl += '\n);';
    
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
      'function', 'procedure', 'pipe', 'stage', 'file', 'format', 'sequence'
    ];
    
    return reservedWords.includes(word.toLowerCase());
  }
}