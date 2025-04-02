import { v4 as uuidv4 } from 'uuid';
import { ERDNode, EdgeType, Column } from './types';

export default class DDLParser {
  private ddl: string;
  private nodes: ERDNode[] = [];
  private edges: EdgeType[] = [];
  private tableNames: Map<string, string> = new Map(); // Maps normalized table name to table ID

  constructor(ddl: string) {
    this.ddl = ddl;
  }

  /**
   * Main method to parse DDL and generate nodes and edges
   * @returns Object containing nodes and edges
   */
  public parse(): { nodes: ERDNode[], edges: EdgeType[] } {
    // Split the DDL into separate statements
    const statements = this.splitStatements(this.ddl);
    
    console.log(`Parsing ${statements.length} SQL statements`);
    
    // First pass: Create all table nodes
    for (const statement of statements) {
      if (this.isCreateTableStatement(statement)) {
        this.parseCreateTable(statement);
      }
    }
    
    // Second pass: Handle foreign key relationships
    for (const statement of statements) {
      if (this.isAlterTableAddForeignKey(statement)) {
        this.parseForeignKeyConstraint(statement);
      }
    }
    
    console.log(`Created ${this.nodes.length} tables and ${this.edges.length} relationships`);
    return { nodes: this.nodes, edges: this.edges };
  }

  /**
   * Split DDL into separate SQL statements
   * Handles multiple statements separated by semicolons, accounting for quoted text
   * and nested statements.
   */
  private splitStatements(ddl: string): string[] {
    // Split by semicolons, but ignore semicolons inside quotes
    const statements: string[] = [];
    let currentStatement = '';
    let inQuote = false;
    let quoteChar = '';
    let inComment = false;
    
    for (let i = 0; i < ddl.length; i++) {
      const char = ddl[i];
      const nextChar = i < ddl.length - 1 ? ddl[i + 1] : '';
      
      // Handle line comments
      if (!inQuote && char === '-' && nextChar === '-') {
        inComment = true;
      }
      
      // End of line terminates comments
      if (inComment && (char === '\n' || char === '\r')) {
        inComment = false;
      }
      
      // Skip comment content but keep adding to current statement
      if (inComment) {
        currentStatement += char;
        continue;
      }
      
      // Handle quotes
      if ((char === "'" || char === '"') && (i === 0 || ddl[i-1] !== '\\')) {
        if (!inQuote) {
          inQuote = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inQuote = false;
        }
      }
      
      // Handle semicolons
      if (char === ';' && !inQuote) {
        if (currentStatement.trim()) {
          statements.push(currentStatement.trim());
        }
        currentStatement = '';
      } else {
        currentStatement += char;
      }
    }
    
    // Add the last statement if there's no trailing semicolon
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }
    
    // Filter out any empty statements
    return statements.filter(stmt => stmt.trim().length > 0);
  }

  /**
   * Check if a statement is a CREATE TABLE statement
   */
  private isCreateTableStatement(statement: string): boolean {
    return /CREATE\s+(OR\s+REPLACE\s+)?(TABLE|VIEW|MATERIALIZED_VIEW|DYNAMIC_TABLE|ICEBERG_TABLE)\s+/i.test(statement);
  }

  /**
   * Check if a statement is an ALTER TABLE ADD FOREIGN KEY statement
   */
  private isAlterTableAddForeignKey(statement: string): boolean {
    return /ALTER\s+TABLE.*ADD\s+(CONSTRAINT\s+\w+\s+)?FOREIGN\s+KEY/i.test(statement);
  }

  /**
   * Parse a CREATE TABLE statement and add to nodes
   */
  private parseCreateTable(statement: string): void {
    // Extract table type (TABLE, VIEW, etc.)
    const typeMatch = statement.match(/CREATE\s+(OR\s+REPLACE\s+)?(TABLE|VIEW|MATERIALIZED_VIEW|DYNAMIC_TABLE|ICEBERG_TABLE)\s+/i);
    const tableType = typeMatch?.[2]?.toUpperCase() || 'TABLE';
    
    // Extract fully qualified table name - allow for quotes around each part or the whole name
    // Format can be: "DB"."SCHEMA"."TABLE" or DB.SCHEMA.TABLE or combinations
    const qualifiedNameRegex = /CREATE\s+(OR\s+REPLACE\s+)?(TABLE|VIEW|MATERIALIZED_VIEW|DYNAMIC_TABLE|ICEBERG_TABLE)\s+(?:(?:"([^"]+)"|([a-zA-Z0-9_]+))(?:\.(?:"([^"]+)"|([a-zA-Z0-9_]+)))?(?:\.(?:"([^"]+)"|([a-zA-Z0-9_]+)))?|"([^"]+\.[^"]+(?:\.[^"]+)?)"|([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)?))/i;
    
    const nameMatch = statement.match(qualifiedNameRegex);
    
    if (!nameMatch) return;
    
    // Extract the parts of the qualified name (database, schema, table)
    let fullTableName = '';
    let tableName = '';
    
    // Check if we matched a fully quoted name like "DB.SCHEMA.TABLE"
    if (nameMatch[9]) {
      fullTableName = nameMatch[9];
      const parts = fullTableName.split('.');
      tableName = parts[parts.length - 1];
    } 
    // Check if we matched an unquoted fully qualified name like DB.SCHEMA.TABLE
    else if (nameMatch[10]) {
      fullTableName = nameMatch[10];
      const parts = fullTableName.split('.');
      tableName = parts[parts.length - 1];
    }
    // Otherwise, build from the individual parts
    else {
      const dbPart = nameMatch[3] || nameMatch[4] || '';
      const schemaPart = nameMatch[5] || nameMatch[6] || '';
      const tableNamePart = nameMatch[7] || nameMatch[8] || '';
      
      if (tableNamePart) {
        // We have a three-part name: DB.SCHEMA.TABLE
        tableName = tableNamePart;
        fullTableName = `${dbPart}.${schemaPart}.${tableName}`;
      } else if (schemaPart) {
        // We have a two-part name: SCHEMA.TABLE
        tableName = schemaPart;
        fullTableName = `${dbPart}.${tableName}`;
      } else {
        // We have just a table name
        tableName = dbPart;
        fullTableName = tableName;
      }
    }
    
    if (!tableName) return;
    
    // Use the full name for display but keep the simple table name for internal reference
    const normalizedTableName = tableName.toUpperCase();
    
    // Extract columns from the statement
    const columnsSection = this.extractColumnDefinitions(statement);
    const columns = this.parseColumns(columnsSection, statement);
    
    // Extract table comment if present
    const commentMatch = statement.match(/COMMENT\s*=\s*'([^']*)'/i);
    const comment = commentMatch ? commentMatch[1].replace(/''/, "'") : '';
    
    // Extract tags if present
    const tagsMatch = statement.match(/WITH\s+TAG\s+\(([^)]*)\)/i);
    let tags: string[] = [];
    
    if (tagsMatch) {
      const tagsText = tagsMatch[1];
      // Extract tag names from tag expressions like 'tag1' = 'true'
      const tagRegex = /'([^']+)'\s*=\s*'true'/g;
      let tagMatch;
      while ((tagMatch = tagRegex.exec(tagsText)) !== null) {
        tags.push(tagMatch[1]);
      }
    }
    
    // Create the node
    const nodeId = `table-${uuidv4()}`;
    this.tableNames.set(normalizedTableName, nodeId);
    
    const node: ERDNode = {
      id: nodeId,
      type: 'table',
      position: {
        x: Math.floor(Math.random() * 500),
        y: Math.floor(Math.random() * 300),
      },
      data: {
        label: fullTableName,
        columns,
        tableType: tableType as any,
        comment,
        tags
      }
    };
    
    this.nodes.push(node);
  }

  /**
   * Extract column definitions section from CREATE TABLE statement
   */
  private extractColumnDefinitions(statement: string): string {
    // Get content between the first ( and the matching )
    const startIdx = statement.indexOf('(');
    if (startIdx === -1) return '';
    
    let depth = 1;
    let endIdx = startIdx + 1;
    
    for (let i = startIdx + 1; i < statement.length; i++) {
      if (statement[i] === '(') depth++;
      else if (statement[i] === ')') depth--;
      
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
    
    return statement.substring(startIdx + 1, endIdx).trim();
  }

  /**
   * Parse column definitions into Column objects
   */
  private parseColumns(columnsSection: string, fullStatement: string): Column[] {
    const columns: Column[] = [];
    const lines = columnsSection.split(',\n').map(line => line.trim());
    
    let primaryKeyColumns: string[] = [];
    
    // Extract primary key constraint if present
    const primaryKeyMatch = columnsSection.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
    if (primaryKeyMatch) {
      primaryKeyColumns = primaryKeyMatch[1]
        .split(',')
        .map(col => col.trim().replace(/"/g, '').toUpperCase());
    }
    
    // Process each column definition
    for (const line of lines) {
      // Skip if line is a constraint definition
      if (/^(PRIMARY|FOREIGN|UNIQUE)\s+KEY/i.test(line)) continue;
      
      // Extract column name
      const nameMatch = line.match(/^(?:"([^"]+)"|([a-zA-Z0-9_]+))\s+/);
      if (!nameMatch) continue;
      
      const name = nameMatch[1] || nameMatch[2];
      
      // Extract data type
      const typeMatch = line.match(/\s+([a-zA-Z0-9_]+(\([^)]+\))?)/);
      const dataType = typeMatch ? typeMatch[1] : 'VARCHAR';
      
      // Check if column is nullable
      const isNullable = !/NOT\s+NULL/i.test(line);
      
      // Check if column is a primary key
      const isPrimaryKey = primaryKeyColumns.includes(name.toUpperCase());
      
      // Extract comment if present
      const commentMatch = line.match(/COMMENT\s+'([^']*)'/i);
      const comment = commentMatch ? commentMatch[1].replace(/''/, "'") : '';
      
      // Parse column-level tags from full statement
      let tags: string[] = [];
      const tagRegex = new RegExp(`ALTER\\s+TABLE.*MODIFY\\s+COLUMN\\s+(?:"${name}"|${name})\\s+SET\\s+TAG\\s+([^;]+)`, 'i');
      const tagsMatch = fullStatement.match(tagRegex);
      
      if (tagsMatch) {
        const tagsText = tagsMatch[1];
        // Extract tag names from tag expressions
        const tagNameRegex = /'([^']+)'\s*=\s*'true'/g;
        let tagMatch;
        while ((tagMatch = tagNameRegex.exec(tagsText)) !== null) {
          tags.push(tagMatch[1]);
        }
      }
      
      columns.push({
        id: uuidv4(),
        name,
        dataType,
        isPrimaryKey,
        isForeignKey: false, // Will be set in second pass
        isNullable,
        comment,
        tags
      });
    }
    
    return columns;
  }

  /**
   * Parse a foreign key constraint and create relationships
   */
  private parseForeignKeyConstraint(statement: string): void {
    // Extract source table name (may be fully qualified)
    const tableMatch = statement.match(/ALTER\s+TABLE\s+(?:"([^"]+(?:\.[^"]+)*?)"|([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*))/i);
    if (!tableMatch) return;
    
    // Get the full name and extract just the table part for lookup
    const fullSourceName = (tableMatch[1] || tableMatch[2]);
    const sourceParts = fullSourceName.split('.');
    const tableName = sourceParts[sourceParts.length - 1].toUpperCase();
    
    // Extract source columns
    const sourceColsMatch = statement.match(/FOREIGN\s+KEY\s*\(([^)]+)\)/i);
    if (!sourceColsMatch) return;
    
    const sourceCols = sourceColsMatch[1]
      .split(',')
      .map(col => col.trim().replace(/"/g, '').toUpperCase());
    
    // Extract target table and columns
    const refsMatch = statement.match(/REFERENCES\s+(?:"([^"]+(?:\.[^"]+)*?)"|([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*))\s*\(([^)]+)\)/i);
    if (!refsMatch) return;
    
    // Get the full target name and extract just the table part for lookup
    const fullTargetName = (refsMatch[1] || refsMatch[2]);
    const targetParts = fullTargetName.split('.');
    const targetTable = targetParts[targetParts.length - 1].toUpperCase();
    
    const targetCols = refsMatch[3]
      .split(',')
      .map(col => col.trim().replace(/"/g, '').toUpperCase());
    
    // Find matching source and target nodes
    let sourceNode = null;
    let targetNode = null;
    let sourceId = '';
    let targetId = '';
    
    // First try exact match using the tableNames map
    if (this.tableNames.has(tableName) && this.tableNames.has(targetTable)) {
      sourceId = this.tableNames.get(tableName)!;
      targetId = this.tableNames.get(targetTable)!;
      sourceNode = this.nodes.find(node => node.id === sourceId);
      targetNode = this.nodes.find(node => node.id === targetId);
    }
    
    // If that fails, try matching by label (which may include full paths)
    if (!sourceNode || !targetNode) {
      for (const node of this.nodes) {
        if (node.type === 'table') {
          const nodeLabel = node.data.label.toUpperCase();
          
          // Check if node label matches full source name
          if (!sourceNode && (nodeLabel === fullSourceName.toUpperCase() || 
              nodeLabel.endsWith('.' + tableName))) {
            sourceNode = node;
            sourceId = node.id;
          }
          
          // Check if node label matches full target name
          if (!targetNode && (nodeLabel === fullTargetName.toUpperCase() || 
              nodeLabel.endsWith('.' + targetTable))) {
            targetNode = node;
            targetId = node.id;
          }
        }
      }
    }
    
    // If we have both source and target nodes
    if (sourceNode && targetNode && sourceNode.type === 'table' && targetNode.type === 'table') {
      // Update source columns to mark them as foreign keys
      for (let i = 0; i < sourceCols.length && i < targetCols.length; i++) {
        const columnName = sourceCols[i];
        const column = sourceNode.data.columns.find(
          (col: Column) => col.name.toUpperCase() === columnName
        );
        
        if (column) {
          column.isForeignKey = true;
          column.referencedTable = targetNode.data.label; // Use full label
          column.referencedColumn = targetCols[i];
        }
      }
      
      // Create an edge between the tables
      const edge: EdgeType = {
        id: `e${sourceId}-${targetId}-${uuidv4()}`,
        source: sourceId,
        target: targetId,
        sourceHandle: '',
        targetHandle: '',
        type: 'relationship',
        data: { relationshipType: 'one-to-many' }
      };
      
      this.edges.push(edge);
    } else {
      console.warn(`Could not create relationship between ${fullSourceName} and ${fullTargetName} - tables not found`);
    }
  }
} 