# AI-Tuning-JS with Enhanced Markdown Rendering

A Node.js AI chatbot with beautiful built-in markdown rendering for exceptional chat output.

## Features

### 🧠 Conversation Memory
- **Remembers information** from previous messages in the conversation
- **Personal details recall** (name, location, preferences)
- **Context-aware responses** based on conversation history
- **Cross-session continuity** with save/load functionality

### 💾 Advanced Session Management
- **Save/load conversations** with meaningful names
- **Search through history** with powerful filters
- **Export conversations** in multiple formats (JSON, Markdown, CSV, TXT)
- **Automatic backups** and data protection
- **Analytics and insights** about conversation patterns

### 🎨 Enhanced Built-in Markdown Rendering
- **Rich text formatting** with bold, italic, and inline code
- **Syntax-highlighted code blocks** with language indicators
- **Beautiful table rendering** with borders and proper alignment
- **Task lists** with checkboxes (✅ completed, ☐ pending)
- **Structured headers** and numbered/bulleted lists
- **Reliable cross-platform rendering** without external dependencies
- **Beautiful terminal output** with proper spacing and colors

### 🤖 AI-Powered Chat
- Google Generative AI integration
- Keyword-based shell command execution
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
npm test                 # Basic AI functionality test
npm run memory-test      # Test conversation memory
npm run history-demo     # Demo session management features
```

### Test Conversation Memory
Try this scenario to see memory in action:
```bash
npm start

# In the chat:
You: My name is Arme from Bangkok, Thailand.
AI: Hello Arme! Nice to meet you...

You: What is my name?
AI: Your name is Arme.

You: Where am I from?  
AI: You're from Bangkok, Thailand.
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
- **Commands**: `run <command>`, `execute <command>` → Execute safe commands

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

The system uses a powerful built-in renderer:

1. **Primary**: Enhanced chalk-based renderer with full markdown support
2. **Reliable**: No external dependencies or compatibility issues
3. **Feature-rich**: Tables, checkboxes, code blocks, and beautiful formatting

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
│   ├── ui-renderer.js          # Enhanced UI rendering and markdown
│   ├── google-ai-integration.js # AI integration
│   ├── shell-commands.js       # Shell command implementations
│   ├── shell-processor.js      # Shell command detection and processing
│   ├── command-handlers.js     # CLI command handlers
│   ├── session-manager.js      # Session management
│   └── display-utils.js        # Display utilities
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
- `chalk` - Terminal string styling for beautiful output
- `@google/generative-ai` - Google AI SDK
- `systeminformation` - System data collection

## Troubleshooting

### Performance
- Rendering is optimized for real-time chat
- Built-in renderer ensures consistent cross-platform experience
- Smart detection avoids unnecessary processing
- No external dependencies means faster startup and fewer compatibility issues

## Examples

See `examples/basic-google-ai.js` for AI integration patterns.

## License

ISC
