#!/bin/bash

# MongoDB MCP Setup Script
# This script helps set up MongoDB MCP integration

echo "🔧 MongoDB MCP Setup Script"
echo "════════════════════════════"

# Check if we're in VS Code
if [ -n "$VSCODE_PID" ] || [ -n "$TERM_PROGRAM" ] && [ "$TERM_PROGRAM" = "vscode" ]; then
    echo "✅ VS Code environment detected"
    echo "💡 Install MongoDB MCP extension:"
    echo "   1. Open Command Palette (Ctrl+Shift+P)"
    echo "   2. Type: Extensions: Install Extensions"
    echo "   3. Search for: MongoDB for VS Code"
    echo "   4. Install the extension"
    echo ""
    echo "🔄 After installation, restart VS Code and run:"
    echo "   npm start"
else
    echo "⚠️ Not running in VS Code"
    echo ""
    echo "Choose your setup option:"
    echo "1. Development mode with mock tools (for testing)"
    echo "2. Install VS Code and MongoDB extension (recommended)"
    echo "3. Set up standalone MCP server (advanced)"
    echo ""
    
    read -p "Enter your choice (1-3): " choice
    
    case $choice in
        1)
            echo "🔧 Setting up development mode..."
            echo "Run: npm run dev:mcp"
            ;;
        2)
            echo "📥 VS Code setup instructions:"
            echo "1. Install VS Code: https://code.visualstudio.com/"
            echo "2. Install MongoDB extension:"
            echo "   code --install-extension mongodb.mongodb-vscode"
            echo "3. Open project in VS Code:"
            echo "   code ."
            echo "4. Run from VS Code terminal:"
            echo "   npm start"
            ;;
        3)
            echo "🔧 Standalone MCP Server setup:"
            echo "1. Install MCP server dependencies:"
            echo "   npm install @modelcontextprotocol/server-mongodb"
            echo "2. Configure MCP server (see SETUP_MCP.md)"
            echo "3. Start MCP server before running the app"
            ;;
        *)
            echo "❌ Invalid choice"
            exit 1
            ;;
    esac
fi

echo ""
echo "📚 For detailed instructions, see: SETUP_MCP.md"
echo "🎯 Current MongoDB connection string: $MDB_MCP_CONNECTION_STRING"

if [ -z "$MDB_MCP_CONNECTION_STRING" ]; then
    echo "⚠️ MongoDB connection string not set!"
    echo "   Add to .env file: MDB_MCP_CONNECTION_STRING=your-connection-string"
fi
