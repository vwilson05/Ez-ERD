# EzERD - Project Architecture Overview

## 🧱 Stack
- **Framework**: Next.js 14 with React 18 and TypeScript
- **UI/Styling**: TailwindCSS for responsive styling
- **State Management**: 
  - React Hooks (useState, useEffect) for local component state
  - React Context for theming and application-wide state
  - Zustand for more complex state management
- **Visualization**: ReactFlow for ERD diagram creation and manipulation
- **Code Editing**: Monaco Editor for DDL editing
- **AI Integration**: OpenAI API for AI assistance in schema generation
- **File Operations**: 
  - html-to-image for diagram exports
  - jsPDF for PDF generation
- **Parsing**: js-yaml for YAML parsing and generation

## 📦 Folder Structure
- **/app**: Main application folder (Next.js App Router)
  - **/components**: React components
  - **/context**: React Context providers
  - **/utils**: Utility functions, parsers, and type definitions
  - **/styles**: CSS styles
  - **/models**: Data models (currently empty)
  - **page.tsx**: Main application page
  - **layout.tsx**: Root layout component
  - **globals.css**: Global CSS styles
- **/public**: Static assets
- **/types**: TypeScript type definitions
- **next.config.js**: Next.js configuration
- **tailwind.config.js**: Tailwind CSS configuration

## 📚 Data Flow
- **ERD Creation**: 
  User Interaction → React Components → ReactFlow State → ERD Canvas → Zustand Store
- **DDL Generation**:
  ERD Diagram Data → DDL Generator → Editable DDL → Snowflake Execution (optional)
- **AI Assistance**:
  User Prompt → OpenAI API → Generated ERD/DDL → User Interface

## 🔄 State Management
- **Component State**: Local state using React hooks
- **Theme State**: Application-wide theme using React Context
- **ERD State**: Tables, relationships, and diagram layout using ReactFlow state
- **Persistence**: Local storage for saving user preferences

## 🚀 Key Features
- **ERD Designer**: Visual database schema design with drag-and-drop
- **DDL Generation**: Automatic Snowflake DDL generation from ERD
- **AI Assistant**: Generate database schemas from natural language
- **Snowflake Integration**: Direct execution of DDL in Snowflake
- **Export Options**: PNG, JPEG, and PDF export of diagrams
- **Theme Support**: Light and dark mode

## 🔧 Development Conventions
- **Components**: Use PascalCase for component names (e.g., TableNode, ERDCanvas)
- **Files**: TypeScript (.tsx/.ts) for all code files
- **Styling**: TailwindCSS classes for styling with dark mode support
- **TypeScript**: Strong typing with interfaces for props and data structures
- **State Updates**: Immutable state updates with spread operators