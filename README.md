# EzERD - Streamlined ERD to Snowflake DDL Tool

EzERD is a minimalist tool for creating Entity Relationship Diagrams (ERDs) and automatically generating corresponding Snowflake DDL. It features a clean, intuitive interface with AI assistance to accelerate database design.

## Features

- **Visual ERD Editor**: Drag-and-drop interface for creating tables and relationships
- **Snowflake DDL Generation**: Instantly convert your ERD to Snowflake-compatible DDL
- **AI Assistant**: Generate complete database schemas from plain English descriptions
- **Reverse Engineering**: Import Snowflake DDL and visualize the corresponding ERD
- **Dark Mode**: Easy on the eyes with a modern dark interface

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm (version 7 or higher)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/ezerd.git
   cd ezerd
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
2. Fill in the table name and define columns
3. Add relationships between tables by dragging from one column handle to another
4. Generate Snowflake DDL with one click

### Using AI Assistance

1. Click on the "AI Assist" tab
2. Describe your database requirements in plain English
3. The AI will generate both the ERD and the Snowflake DDL

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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 