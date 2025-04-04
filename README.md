# EzERD - Streamlined ERD to Snowflake DDL Tool

EzERD is a minimalist tool for creating Entity Relationship Diagrams (ERDs) and automatically generating corresponding Snowflake DDL. It features a clean, intuitive interface with AI assistance to accelerate database design.

## Features

- **Visual ERD Editor**: Drag-and-drop interface for creating tables and relationships
  - **In-line Editing**: Edit table fields directly on the ERD canvas
  - **Multi-point Connections**: Connect relationships from any side of table boxes
  - **Auto-sizing Tables**: Tables automatically expand to fit their content
  - **Column-to-Column Connections**: Create precise relationships between specific columns
  - **Clear Relationship Types**: Visually distinguish between one-to-one, one-to-many, and many-to-many relationships

- **Clean Exports**: Export your diagrams as PNG or PDF with professional quality
  - **Background Grid Preservation**: Maintain the dot grid pattern in exports
  - **UI Element Filtering**: Automatically hide UI controls in exports
  - **High Resolution Output**: Crisp, clear diagrams at 2.5x resolution

- **Snowflake DDL Generation**: Instantly convert your ERD to Snowflake-compatible DDL
  - **Edit & Execute**: Modify generated DDL with instant updates
  - **Snowflake Integration**: Connect to your Snowflake account and execute DDL directly

- **AI Assistant**: Generate complete database schemas from plain English descriptions
  - **Conversation History**: Maintain context across prompts for iterative design
  - **Intelligent Suggestions**: Get AI help refining your database model

- **Data Modeling Templates**: Quickly create tables using industry-standard patterns
  - **Kimball Dimensional Models**: Type 1 and Type 2 dimensions, fact tables
  - **Data Vault Models**: Hubs, Links, and Satellites for enterprise data warehousing

- **Reverse Engineering**: Import Snowflake DDL and visualize the corresponding ERD

- **Enhanced User Experience**:
  - **Dark & Light Modes**: Toggle between comfortable viewing options
  - **Responsive Design**: Works on various screen sizes
  - **Visual Feedback**: Clear indications of relationships and table structures
  - **Domain Grouping**: Organize related tables with color-coded domain boxes

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm (version 7 or higher)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/vwilson05/Ez-ERD.git
   cd Ez-ERD
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Start the development server
   ```
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Creating an ERD

1. Click "Add Table" in the sidebar
2. Create a custom table or use one of the pre-built templates (Kimball, Data Vault)
3. Add or edit columns directly on the ERD canvas by clicking on them
4. Create relationships by dragging from one table to another
5. Generate Snowflake DDL with one click

### Using AI Assistance

1. Click on the "AI Assistant" tab
2. Describe your database requirements in plain English
3. The AI will generate both the ERD and the Snowflake DDL
4. Continue the conversation to refine your design with follow-up questions

### Direct Snowflake Integration

1. Navigate to the "DDL & Execution" tab
2. Review and edit the generated DDL
3. Connect to your Snowflake account with the Snowflake tab
4. Execute the DDL directly in your Snowflake environment

### Importing Existing DDL

1. Click on the "Import" tab
2. Paste your existing Snowflake DDL
3. View and edit the generated ERD

## Technology Stack

- **Frontend**: React with TypeScript
- **UI**: TailwindCSS
- **ERD Visualization**: ReactFlow
- **State Management**: React Hooks and Context
- **AI Integration**: OpenAI API
- **Database Connectivity**: Snowflake JavaScript API (browser)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 