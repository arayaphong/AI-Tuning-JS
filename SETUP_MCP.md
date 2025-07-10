# MongoDB MCP Setup Guide

## Method 1: VS Code with MongoDB MCP Extension (Recommended)

### Step 1: Install VS Code Extensions
```bash
# Install MongoDB for VS Code extension
code --install-extension mongodb.mongodb-vscode

# Install Model Context Protocol extension (if available)
code --install-extension microsoft.vscode-mcp
```

### Step 2: Configure VS Code Settings
Create `.vscode/settings.json`:
```json
{
  "mongodb.connectionString": "your-connection-string-here",
  "mcp.enabled": true,
  "mcp.mongodb.enabled": true
}
```

### Step 3: Open Project in VS Code
```bash
# Open the project in VS Code
code /home/arme/Works/AI-Tuning-JS

# Run the application from VS Code terminal
npm start
```

## Method 2: Standalone MCP Server

### Step 1: Install MCP Server Dependencies
```bash
npm install @modelcontextprotocol/server-mongodb
npm install @modelcontextprotocol/sdk
```

### Step 2: Create MCP Server Configuration
Create `mcp-server.json`:
```json
{
  "name": "mongodb-mcp-server",
  "version": "1.0.0",
  "servers": {
    "mongodb": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-mongodb"],
      "env": {
        "MONGODB_URI": "your-connection-string-here"
      }
    }
  }
}
```

### Step 3: Start MCP Server
```bash
# Start the MCP server
npx @modelcontextprotocol/sdk run-server mcp-server.json
```

## Method 3: Manual Tool Registration (Development/Testing)

If you want to test without full MCP setup, you can manually register the tools for development.
