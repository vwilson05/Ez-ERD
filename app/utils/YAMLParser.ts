import { v4 as uuidv4 } from 'uuid';
import yaml from 'js-yaml';
import { ERDNode, EdgeType, Column } from './types';

interface DBTColumn {
  name: string;
  description?: string;
  data_type?: string;
  tests?: string[] | { [key: string]: any }[];
  tags?: string[];
}

interface DBTModel {
  name: string;
  description?: string;
  columns?: DBTColumn[];
  meta?: { [key: string]: any };
  tags?: string[];
  tests?: any[];
  config?: {
    materialized?: string;
    [key: string]: any;
  };
  raw_sql?: string;
}

interface DBTSource {
  name: string;
  description?: string;
  database?: string;
  schema?: string;
  tables?: {
    name: string;
    description?: string;
    columns?: DBTColumn[];
    [key: string]: any;
  }[];
  [key: string]: any;
}

interface DBTRef {
  source: string;
  model: string;
  column: string;
}

interface DBTRefTest {
  name: string;
  ref: DBTRef[];
  [key: string]: any;
}

export default class YAMLParser {
  private yaml: string;
  private nodes: ERDNode[] = [];
  private edges: EdgeType[] = [];
  private modelMap: Map<string, string> = new Map(); // Maps model name to node ID
  private sourceMap: Map<string, Map<string, string>> = new Map(); // Maps source.table to node ID

  constructor(yaml: string) {
    this.yaml = yaml;
  }

  /**
   * Main method to parse YAML and generate nodes and edges
   * @returns Object containing nodes and edges
   */
  public parse(): { nodes: ERDNode[]; edges: EdgeType[] } {
    try {
      // Parse the YAML content
      const documents = this.splitYAMLDocuments(this.yaml);
      
      console.log(`Parsing ${documents.length} YAML documents`);
      
      // First pass: Create nodes for all models and sources
      for (const doc of documents) {
        // Handle model files
        if (doc.models) {
          for (const model of doc.models) {
            this.createModelNode(model);
          }
        }
        
        // Handle source files
        if (doc.sources) {
          for (const source of doc.sources) {
            this.createSourceNodes(source);
          }
        }
      }
      
      // Second pass: Create edges based on refs and relationships
      for (const doc of documents) {
        if (doc.models) {
          for (const model of doc.models) {
            this.processModelRelationships(model, doc);
          }
        }
        
        // Handle explicit relationship tests like relationships, foreign keys, etc.
        if (doc.models?.tests || doc.tests) {
          const tests = doc.models?.tests || doc.tests || [];
          this.processRelationshipTests(tests);
        }
      }
      
      console.log(`Created ${this.nodes.length} tables and ${this.edges.length} relationships`);
      return { nodes: this.nodes, edges: this.edges };
    } catch (error) {
      console.error('Error parsing YAML:', error);
      throw new Error('Failed to parse YAML content');
    }
  }

  /**
   * Split a YAML string into multiple documents
   */
  private splitYAMLDocuments(content: string): any[] {
    try {
      // Split the documents by document separator
      return yaml.loadAll(content);
    } catch (error) {
      console.error('Error splitting YAML documents:', error);
      // Try to load as a single document
      try {
        const doc = yaml.load(content);
        return doc ? [doc] : [];
      } catch (e) {
        console.error('Error loading YAML as single document:', e);
        return [];
      }
    }
  }

  /**
   * Create a node for a dbt model
   */
  private createModelNode(model: DBTModel): void {
    if (!model.name) return;
    
    const nodeId = `model-${uuidv4()}`;
    this.modelMap.set(model.name, nodeId);
    
    // Determine table type based on materialization
    let tableType = 'TABLE';
    if (model.config?.materialized) {
      const materialization = model.config.materialized.toUpperCase();
      if (materialization === 'VIEW') {
        tableType = 'VIEW';
      } else if (materialization === 'MATERIALIZED_VIEW') {
        tableType = 'MATERIALIZED_VIEW';
      } else if (materialization === 'INCREMENTAL') {
        tableType = 'TABLE'; // Most similar to a table
      }
    }
    
    // Convert dbt columns to our column format
    const columns: Column[] = [];
    if (model.columns) {
      for (const col of model.columns) {
        const isPrimaryKey = this.checkIsPrimaryKey(col);
        const isForeignKey = this.checkIsForeignKey(col);
        
        columns.push({
          id: uuidv4(),
          name: col.name,
          dataType: col.data_type || 'VARCHAR',
          isPrimaryKey,
          isForeignKey,
          isNullable: !this.checkIsNotNull(col),
          comment: col.description || '',
          tags: col.tags || []
        });
      }
    }
    
    // Create the node
    const node: ERDNode = {
      id: nodeId,
      type: 'table',
      position: {
        x: Math.floor(Math.random() * 500),
        y: Math.floor(Math.random() * 300),
      },
      data: {
        label: model.name,
        columns,
        tableType: tableType as any,
        comment: model.description || '',
        tags: model.tags || []
      }
    };
    
    this.nodes.push(node);
  }

  /**
   * Create nodes for tables in a dbt source
   */
  private createSourceNodes(source: DBTSource): void {
    if (!source.tables) return;
    
    // Create an entry for this source in the sourceMap
    const sourceTablesMap = new Map<string, string>();
    this.sourceMap.set(source.name, sourceTablesMap);
    
    for (const table of source.tables) {
      const nodeId = `source-${uuidv4()}`;
      sourceTablesMap.set(table.name, nodeId);
      
      // Determine full table name with source prefix
      const fullName = `${source.name}.${table.name}`;
      
      // Convert dbt columns to our column format
      const columns: Column[] = [];
      if (table.columns) {
        for (const col of table.columns) {
          const isPrimaryKey = this.checkIsPrimaryKey(col);
          
          columns.push({
            id: uuidv4(),
            name: col.name,
            dataType: col.data_type || 'VARCHAR',
            isPrimaryKey,
            isForeignKey: false, // Will be set later
            isNullable: !this.checkIsNotNull(col),
            comment: col.description || '',
            tags: col.tags || []
          });
        }
      }
      
      // Create the node
      const node: ERDNode = {
        id: nodeId,
        type: 'table',
        position: {
          x: Math.floor(Math.random() * 500),
          y: Math.floor(Math.random() * 300),
        },
        data: {
          label: fullName,
          columns,
          tableType: 'TABLE' as any, // Sources are always tables
          comment: table.description || source.description || '',
          tags: [...(source.tags || []), ...(table.tags || [])]
        }
      };
      
      this.nodes.push(node);
    }
  }

  /**
   * Process relationships from model references and tests
   */
  private processModelRelationships(model: DBTModel, doc: any): void {
    // Skip if no model name or not in map (should never happen)
    if (!model.name || !this.modelMap.has(model.name)) return;
    
    const sourceNodeId = this.modelMap.get(model.name)!;
    const sourceNode = this.nodes.find(node => node.id === sourceNodeId);
    if (!sourceNode || sourceNode.type !== 'table') return;
    
    // Parse SQL for refs if available to extract relationships
    if (doc.raw_sql || model.raw_sql) {
      const sql = doc.raw_sql || model.raw_sql;
      this.parseReferencesFromSQL(sql, sourceNodeId);
    }
    
    // Process column-level tests to identify relationships
    if (model.columns) {
      for (const column of model.columns) {
        if (!column.tests) continue;
        
        const tests = Array.isArray(column.tests) ? column.tests : [];
        for (const test of tests) {
          // Handle relationship test
          if (typeof test === 'object' && test.relationships) {
            const relInfo = test.relationships;
            if (relInfo.to && relInfo.field) {
              // Example: to: ref('customers'), field: 'id'
              const targetModel = this.extractRefFromString(relInfo.to);
              if (targetModel && this.modelMap.has(targetModel)) {
                const targetNodeId = this.modelMap.get(targetModel)!;
                
                // Create edge
                this.createRelationshipEdge(sourceNodeId, targetNodeId, column.name, relInfo.field);
                
                // Mark column as foreign key
                const sourceColumn = sourceNode.data.columns.find(col => col.name === column.name);
                if (sourceColumn) {
                  sourceColumn.isForeignKey = true;
                  sourceColumn.referencedTable = targetModel;
                  sourceColumn.referencedColumn = relInfo.field;
                }
              }
            }
          }
        }
      }
    }
  }

  /**
   * Process relationship tests from the schema file
   */
  private processRelationshipTests(tests: any[]): void {
    for (const test of tests) {
      if (typeof test !== 'object') continue;
      
      // Handle relationships test
      if (test.relationships) {
        const { name, relationships } = test;
        
        if (relationships && relationships.to && relationships.from) {
          const fromModel = this.extractRefFromString(relationships.from);
          const toModel = this.extractRefFromString(relationships.to);
          
          if (fromModel && toModel && 
              this.modelMap.has(fromModel) && this.modelMap.has(toModel)) {
            const sourceNodeId = this.modelMap.get(fromModel)!;
            const targetNodeId = this.modelMap.get(toModel)!;
            
            // Create edge
            this.createRelationshipEdge(
              sourceNodeId, 
              targetNodeId, 
              relationships.column_name || '', 
              relationships.field || ''
            );
          }
        }
      }
    }
  }

  /**
   * Create a relationship edge between two nodes
   */
  private createRelationshipEdge(
    sourceId: string, 
    targetId: string, 
    sourceColumn: string = '', 
    targetColumn: string = ''
  ): void {
    const edge: EdgeType = {
      id: `e${sourceId}-${targetId}-${uuidv4()}`,
      source: sourceId,
      target: targetId,
      sourceHandle: '',
      targetHandle: '',
      type: 'relationship',
      data: { 
        relationshipType: 'one-to-many'
        // We don't include sourceColumn and targetColumn as they're not part of the EdgeType data
      }
    };
    
    this.edges.push(edge);
  }

  /**
   * Check if a column is a primary key based on tests
   */
  private checkIsPrimaryKey(column: DBTColumn): boolean {
    if (!column.tests) return false;
    
    const tests = Array.isArray(column.tests) ? column.tests : [];
    for (const test of tests) {
      if (test === 'unique' || test === 'primary_key' || 
          (typeof test === 'object' && ('unique' in test || 'primary_key' in test))) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if a column is a foreign key based on tests
   */
  private checkIsForeignKey(column: DBTColumn): boolean {
    if (!column.tests) return false;
    
    const tests = Array.isArray(column.tests) ? column.tests : [];
    for (const test of tests) {
      if (typeof test === 'object' && 
          ('relationships' in test || 'foreign_key' in test)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if a column is not null based on tests
   */
  private checkIsNotNull(column: DBTColumn): boolean {
    if (!column.tests) return false;
    
    const tests = Array.isArray(column.tests) ? column.tests : [];
    for (const test of tests) {
      if (test === 'not_null' || 
          (typeof test === 'object' && 'not_null' in test)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Extract model name from a ref string like "ref('model_name')"
   */
  private extractRefFromString(refString: string): string | null {
    const refMatch = refString.match(/ref\s*\(\s*['"]([^'"]+)['"]\s*\)/);
    if (refMatch) {
      return refMatch[1];
    }
    
    const sourceMatch = refString.match(/source\s*\(\s*['"]([^'"]+)['"],\s*['"]([^'"]+)['"]\s*\)/);
    if (sourceMatch) {
      return `${sourceMatch[1]}.${sourceMatch[2]}`;
    }
    
    return null;
  }

  /**
   * Parse SQL for refs to extract relationships
   * This is a simple implementation - a real one would need a SQL parser
   */
  private parseReferencesFromSQL(sql: string, sourceNodeId: string): void {
    if (!sql) return;
    
    // Find all ref('model') patterns in the SQL
    const refRegex = /ref\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    let match;
    const referencedModels: string[] = [];
    
    while ((match = refRegex.exec(sql)) !== null) {
      const modelName = match[1];
      referencedModels.push(modelName);
    }
    
    // Find all source('source', 'table') patterns
    const sourceRegex = /source\s*\(\s*['"]([^'"]+)['"],\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = sourceRegex.exec(sql)) !== null) {
      const sourceName = match[1];
      const tableName = match[2];
      const sourceTables = this.sourceMap.get(sourceName);
      
      if (sourceTables && sourceTables.has(tableName)) {
        const targetNodeId = sourceTables.get(tableName)!;
        this.createRelationshipEdge(sourceNodeId, targetNodeId);
      }
    }
    
    // Create relationships for each referenced model
    for (const modelName of referencedModels) {
      if (this.modelMap.has(modelName)) {
        const targetNodeId = this.modelMap.get(modelName)!;
        this.createRelationshipEdge(sourceNodeId, targetNodeId);
      }
    }
  }
} 