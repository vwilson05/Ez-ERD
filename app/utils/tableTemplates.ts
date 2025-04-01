import { v4 as uuidv4 } from 'uuid';
import { Column } from './types';

export interface TableTemplate {
  name: string;
  description: string;
  category: 'Kimball' | 'Data Vault' | 'Other';
  getColumns: (tableName: string) => Column[];
}

// Helper function to create columns with unique IDs
const createColumn = (
  name: string,
  dataType: string,
  isPrimaryKey: boolean = false,
  isForeignKey: boolean = false,
  isNullable: boolean = true,
  referencedTable?: string,
  referencedColumn?: string
): Column => ({
  id: uuidv4(),
  name,
  dataType,
  isPrimaryKey,
  isForeignKey,
  isNullable,
  referencedTable,
  referencedColumn
});

// Kimball Templates
const kimballDimensionType1: TableTemplate = {
  name: 'Kimball Dimension (Type 1)',
  description: 'Standard dimension table with Type 1 SCD (no history)',
  category: 'Kimball',
  getColumns: (tableName: string) => [
    createColumn(`${tableName}_KEY`, 'INTEGER', true, false, false),
    createColumn('BUSINESS_KEY', 'VARCHAR', false, false, false),
    createColumn('DESCRIPTION', 'VARCHAR', false, false, true),
    createColumn('SOURCE_SYSTEM', 'VARCHAR', false, false, true),
    createColumn('CREATED_DATE', 'TIMESTAMP_NTZ', false, false, false),
    createColumn('UPDATED_DATE', 'TIMESTAMP_NTZ', false, false, true),
  ]
};

const kimballDimensionType2: TableTemplate = {
  name: 'Kimball Dimension (Type 2)',
  description: 'Dimension table with Type 2 SCD (historical tracking)',
  category: 'Kimball',
  getColumns: (tableName: string) => [
    createColumn(`${tableName}_KEY`, 'INTEGER', true, false, false),
    createColumn('BUSINESS_KEY', 'VARCHAR', false, false, false),
    createColumn('DESCRIPTION', 'VARCHAR', false, false, true),
    createColumn('SOURCE_SYSTEM', 'VARCHAR', false, false, true),
    createColumn('EFFECTIVE_FROM', 'TIMESTAMP_NTZ', false, false, false),
    createColumn('EFFECTIVE_TO', 'TIMESTAMP_NTZ', false, false, true),
    createColumn('IS_CURRENT', 'BOOLEAN', false, false, false),
    createColumn('CREATED_DATE', 'TIMESTAMP_NTZ', false, false, false),
    createColumn('UPDATED_DATE', 'TIMESTAMP_NTZ', false, false, true),
  ]
};

const kimballFactTable: TableTemplate = {
  name: 'Kimball Fact Table',
  description: 'Standard fact table with measures and dimension keys',
  category: 'Kimball',
  getColumns: (tableName: string) => [
    createColumn(`${tableName}_KEY`, 'INTEGER', true, false, false),
    createColumn('DATE_KEY', 'INTEGER', false, true, false, 'DATE_DIM', 'DATE_KEY'),
    createColumn('CUSTOMER_KEY', 'INTEGER', false, true, false, 'CUSTOMER_DIM', 'CUSTOMER_KEY'),
    createColumn('PRODUCT_KEY', 'INTEGER', false, true, false, 'PRODUCT_DIM', 'PRODUCT_KEY'),
    createColumn('TRANSACTION_DATE', 'TIMESTAMP_NTZ', false, false, false),
    createColumn('QUANTITY', 'INTEGER', false, false, false),
    createColumn('AMOUNT', 'DECIMAL', false, false, false),
    createColumn('COST', 'DECIMAL', false, false, true),
    createColumn('SOURCE_SYSTEM', 'VARCHAR', false, false, true),
    createColumn('CREATED_DATE', 'TIMESTAMP_NTZ', false, false, false),
  ]
};

// Data Vault Templates
const dataVaultHub: TableTemplate = {
  name: 'Data Vault Hub',
  description: 'Hub table containing business keys',
  category: 'Data Vault',
  getColumns: (tableName: string) => [
    createColumn('HUB_KEY', 'VARCHAR', true, false, false),
    createColumn('BUSINESS_KEY', 'VARCHAR', false, false, false),
    createColumn('RECORD_SOURCE', 'VARCHAR', false, false, false),
    createColumn('LOAD_DATE', 'TIMESTAMP_NTZ', false, false, false),
  ]
};

const dataVaultLink: TableTemplate = {
  name: 'Data Vault Link',
  description: 'Link table connecting business concepts',
  category: 'Data Vault',
  getColumns: (tableName: string) => [
    createColumn('LINK_KEY', 'VARCHAR', true, false, false),
    createColumn('HUB1_KEY', 'VARCHAR', false, true, false, 'HUB1', 'HUB_KEY'),
    createColumn('HUB2_KEY', 'VARCHAR', false, true, false, 'HUB2', 'HUB_KEY'),
    createColumn('RECORD_SOURCE', 'VARCHAR', false, false, false),
    createColumn('LOAD_DATE', 'TIMESTAMP_NTZ', false, false, false),
  ]
};

const dataVaultSatellite: TableTemplate = {
  name: 'Data Vault Satellite',
  description: 'Satellite table containing context and descriptive attributes',
  category: 'Data Vault',
  getColumns: (tableName: string) => [
    createColumn('SATELLITE_KEY', 'VARCHAR', true, false, false),
    createColumn('PARENT_KEY', 'VARCHAR', false, true, false, 'HUB/LINK', 'KEY'),
    createColumn('LOAD_DATE', 'TIMESTAMP_NTZ', false, false, false),
    createColumn('END_DATE', 'TIMESTAMP_NTZ', false, false, true),
    createColumn('RECORD_SOURCE', 'VARCHAR', false, false, false),
    createColumn('HASH_DIFF', 'VARCHAR', false, false, false),
    createColumn('IS_CURRENT', 'BOOLEAN', false, false, false),
    createColumn('ATTRIBUTE1', 'VARCHAR', false, false, true),
    createColumn('ATTRIBUTE2', 'VARCHAR', false, false, true),
  ]
};

// Export all templates
export const tableTemplates: TableTemplate[] = [
  kimballDimensionType1,
  kimballDimensionType2,
  kimballFactTable,
  dataVaultHub,
  dataVaultLink,
  dataVaultSatellite
]; 