# AI-Tuning-JS with MongoDB MCP Integration

A Node.js AI chatbot with enhanced markdown rendering and MongoDB Model Context Protocol (MCP) integration for beautiful chat output and database interactions.

## Features

### 🎨 Enhanced Markdown Rendering
- **Rich text formatting** with bold, italic, and inline code
- **Syntax-highlighted code blocks** 
- **Structured headers** and lists
- **Smart fallback rendering** when ink-markdown is unavailable
- **Beautiful terminal output** with proper spacing and colors

### 🤖 AI-Powered Chat
- Google Generative AI integration
- Keyword-based shell command execution
- **MongoDB MCP integration** for database interactions
- System information retrieval
- Interactive command-line interface

## Installation

```bash
npm install
```

## Usage

### Start the Interactive Chatbot
```bash
npm start
# or
node index.mjs
```

### Test the System
```bash
npm test
# or
node index.mjs --test
```

## Markdown Rendering Examples

### Basic Chat Messages
The system automatically renders AI responses with rich markdown:

```javascript
await renderChatMessage('Hello! This is **bold** and *italic* text with `code`.', {
  prefix: '🤖 AI:',
  showTimestamp: true
});
```

### Rich Content
Complex markdown with headers, lists, and code blocks:

```markdown
# System Report
## Memory Usage
- **Total**: 30.01 GB
- **Used**: 9.05 GB (30.2%)

### Command
\`\`\`bash
free -h
\`\`\`
```

### Help Content
Structured help with examples:

```javascript
const helpCommands = [
  {
    name: '/memory',
    description: 'Display memory information',
    examples: ['/memory', 'show RAM usage']
  }
];
await renderHelpContent(helpCommands);
```

## Available Chat Commands

| Command | Description | Examples |
|---------|-------------|----------|
| `/help` | Show help with markdown formatting | `/help` |
| `/examples` | Display usage examples | `/examples` |
| `/commands` | List shell command keywords | `/commands` |
| `/clear` | Clear the screen | `/clear` |
| `/exit` | Exit the chatbot | `/exit`, `/quit` |

## Shell Command Keywords

The AI automatically detects these keywords and executes system commands:

- **Memory**: `memory`, `ram` → Shows memory usage
- **CPU**: `cpu`, `processor` → Shows CPU information  
- **System**: `system` → Shows system information
- **Files**: `list files`, `directory` → Lists files
- **Git**: `git status`, `git log` → Git operations

## MongoDB Command Keywords

The AI automatically detects these keywords and executes MongoDB operations:

- **Databases**: `databases`, `list databases` → Shows available databases
- **Collections**: `collections in database_name` → Lists collections in a database
- **Schema**: `schema for collection_name` → Shows collection schema
- **Find**: `find in collection_name` → Finds documents in a collection
- **Count**: `count documents in collection_name` → Counts documents
- **Aggregate**: `aggregate collection_name` → Runs aggregation pipeline

### MongoDB Setup

1. **Local MongoDB**: Install MongoDB locally and ensure it's running
2. **MongoDB Atlas**: Use a cloud MongoDB instance
3. **Environment Variables**: Configure in `.env` file:

```bash
# Local MongoDB
MDB_MCP_CONNECTION_STRING=mongodb://localhost:27017/ai_tuning

# Or Atlas
MDB_MCP_CONNECTION_STRING=mongodb+srv://username:password@cluster.mongodb.net/ai_tuning

# Optional settings
MDB_MCP_READ_ONLY=false
MDB_MCP_INDEX_CHECK=true
```

## Markdown Renderer API

### Core Functions

#### `renderChatMessage(content, options)`
Renders a chat message with markdown formatting.

```javascript
await renderChatMessage(response, {
  prefix: '🤖 AI:',
  showTimestamp: false,
  addSpacing: true
});
```

#### `smartRender(content, options)`
Automatically chooses the best rendering method based on content complexity.

```javascript
await smartRender(markdownContent, {
  forceSimple: false
});
```

#### `renderSystemInfo(title, content)`
Renders system information with proper formatting.

```javascript
await renderSystemInfo('Memory Usage', memoryData);
```

#### `renderCodeBlock(code, language)`
Renders code with syntax highlighting.

```javascript
await renderCodeBlock(jsCode, 'javascript');
```

#### `renderHelpContent(commands)`
Renders structured help content.

```javascript
await renderHelpContent(commandArray);
```

### Fallback Behavior

The system includes intelligent fallback:

1. **Primary**: Attempts to use `ink-markdown` for rich rendering
2. **Fallback**: Uses enhanced chalk-based renderer
3. **Safety**: Falls back to plain text if needed

### Configuration

The renderer supports various options:

```javascript
const options = {
  showBorder: false,
  theme: 'default', 
  width: process.stdout.columns || 80,
  forceSimple: false,
  showTimestamp: true,
  addSpacing: true
};
```

## Environment Setup

1. Copy `.env.example` to `.env`
2. Add your Google AI API key:
   ```
   GOOGLE_AI_API_KEY=your_api_key_here
   GOOGLE_CLOUD_PROJECT=your_project_id
   GOOGLE_CLOUD_LOCATION=us-central1
   ```

## Architecture

```
src/
├── utils/
│   ├── markdown-renderer.js    # Enhanced markdown rendering
│   ├── google-ai-integration.js # AI and shell commands
│   └── data-utils.js           # Data processing utilities
examples/
└── basic-google-ai.js          # Basic AI examples
```

## Development

### Code Style
- ES6+ modules with async/await
- Comprehensive JSDoc comments
- Error handling with fallbacks
- Console logging with emojis for UX

### Key Dependencies
- `ink-markdown` - Rich terminal markdown rendering
- `ink` - React-based terminal UI components  
- `chalk` - Terminal string styling
- `@google/generative-ai` - Google AI SDK
- `systeminformation` - System data collection

## Troubleshooting

### ink-markdown Not Working
If you see "⚠️ ink-markdown not available", the system automatically falls back to the enhanced chalk renderer. This can happen due to:
- ESM compatibility issues
- Missing dependencies
- Terminal compatibility

The fallback renderer still provides excellent formatting with:
- **Bold** and *italic* text
- `Highlighted code`
- Structured headers
- Proper spacing and colors

### Performance
- Rendering is optimized for real-time chat
- Automatic cleanup prevents memory leaks
- Smart detection avoids unnecessary processing

## Examples

See `examples/basic-google-ai.js` for AI integration patterns and `examples/mongodb-mcp-example.js` for MongoDB MCP integration examples.

### Natural Language MongoDB Queries

```
💬 You: "Show me all databases"
🤖 AI: I found 4 databases: admin, config, local, and ai_tuning...

💬 You: "List collections in ai_tuning database"  
🤖 AI: The ai_tuning database contains: training_data, models, experiments...

💬 You: "What's the schema for training_data?"
🤖 AI: The training_data collection has fields: _id (ObjectId), name (String)...

💬 You: "Find some documents in training_data"
🤖 AI: I found 2 documents in training_data collection...

💬 You: "Show my memory usage and list databases"
🤖 AI: [Shows both system memory info AND MongoDB databases]
```

## License

ISC
