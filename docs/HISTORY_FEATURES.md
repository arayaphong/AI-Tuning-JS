# Chat History Management Features

The AI-Tuning-JS chatbot now includes comprehensive chat history saving and management capabilities. Here's everything you need to know about managing your conversation```

### File Naming
- Session files: `<n>.json`
- Backups: `<n>_backup_<unix_timestamp>.json`
- Exports: `<n>_export_<unix_timestamp>.<format>`
- Auto-saves: `auto_save_<unix_timestamp>.json`

### Auto-Save Behavior Quick Start

1. Start the chatbot: `npm start`
2. Have a conversation with the AI
3. Save your conversation: `/save my_conversation`
4. Load it later: `/load my_conversation`

## 📁 File Structure

```
AI-Tuning-JS/
├── save/                    # Main save directory
│   ├── *.json              # Saved conversation sessions
│   └── backups/            # Automatic backups
└── examples/
    └── history-demo.js     # Demo of history features
```

## 💬 Chat Commands

### Session Management
- `/save <name>` - Save current conversation with a name
- `/load <name>` - Load a previously saved conversation
- `/sessions` or `/list` - List all available saved sessions
- `/delete <name>` - Delete a saved session
- `/new` or `/clear` - Start a new conversation

### History Features
- `/history` - Display current conversation history
- `/search <query>` - Search through conversation history
- `/analytics` - Show conversation statistics and insights
- `/export <format>` - Export conversation (json, markdown, txt, csv)
- `/backup` - Create a backup of current conversation
- `/autosave on/off` - Enable/disable automatic saving

### Search Options
- `/search "error message"` - Basic text search
- `/search api --user` - Search only user messages
- `/search help --assistant` - Search only AI responses

## 🔧 Auto-Save Feature

Auto-save is enabled by default and automatically saves your conversation when you exit the CLI and loads the latest session when you start up.

```bash
# Enable auto-save
/autosave on

# Disable auto-save
/autosave off

# Check status
/autosave
```

## 📊 Analytics & Insights

Get detailed analytics about your conversations:

- Total message count
- User vs AI message distribution
- Average message length
- Conversation duration
- Most active hours
- Session creation and modification dates

## 📤 Export Formats

Export your conversations in multiple formats:

### JSON Export
```bash
/export json
/export json my_conversation
```
Contains full conversation data, metadata, and analytics.

### Markdown Export
```bash
/export markdown
/export markdown my_conversation.md
```
Creates a readable markdown file with timestamps and role indicators.

### Text Export
```bash
/export txt
```
Simple plain text format for easy reading.

### CSV Export
```bash
/export csv
```
Spreadsheet-compatible format for data analysis.

## 🔍 Advanced Search

Search through your conversation history with powerful options:

```bash
# Basic search
/search "javascript promises"

# Search user messages only
/search "help" --user

# Search AI responses only
/search "example" --assistant

# Case-sensitive search
/search "API" --case-sensitive

# Exact match
/search "Hello World" --exact
```

## 🛡️ Backup System

Automatic backups are created in the `save/backups/` directory:

- Manual backup: `/backup`
- Automatic backups when auto-save is enabled
- Timestamped backup files
- Full session data preservation

## 💡 Usage Examples

### Save Important Conversations
```bash
You: Can you help me debug this React component?
AI: Of course! I'd be happy to help...

# Save this conversation for later reference
/save react_debugging_session
```

### Load Previous Work
```bash
# Continue where you left off
/load react_debugging_session

# View the conversation history
/history
```

### Find Specific Information
```bash
# Find all mentions of "useState"
/search useState

# Find your questions about hooks
/search "hook" --user
```

### Export for Documentation
```bash
# Create a markdown file for documentation
/export markdown react_tutorial.md

# Export data for analysis
/export csv conversation_data.csv
```

## 🎯 Demo & Testing

Run the interactive demo to see all features in action:

```bash
npm run history-demo
```

This will demonstrate:
- Session creation and management
- Search functionality
- Analytics generation
- Export capabilities
- Backup creation

## 🔧 Technical Details

### Session Data Structure
```json
{
  "metadata": {
    "createdAt": "2025-07-10T...",
    "lastModified": "2025-07-10T...",
    "sessionName": "my_conversation",
    "sessionId": "session_1720...",
    "messageCount": 10
  },
  "conversationHistory": [
    {
      "role": "user",
      "content": "Hello!",
      "timestamp": "2025-07-10T...",
      "messageId": "msg_1720..."
    }
  ]
}
```

### File Naming
- Session files: `<name>.json`
- Backups: `<name>_backup_<timestamp>.json`
- Exports: `<name>_export_<timestamp>.<format>`

### Auto-Save Behavior
- Saves automatically on CLI exit
- Loads latest session on startup
- Only saves if a session name is set

## 🚨 Error Handling

The system gracefully handles:
- Invalid session names (automatic sanitization)
- Missing files (helpful error messages)
- Corrupted data (validation and recovery)
- Permission issues (clear error reporting)

## 🎨 Customization

You can customize the history system by modifying:
- `AUTO_SAVE_INTERVAL` in `session-manager.js`
- Save directory location (`SAVE_FOLDER`)
- Export formats and templates
- Search options and filters

## 📝 Best Practices

1. **Use descriptive names**: `debugging_react_hooks` instead of `session1`
2. **Regular backups**: Use `/backup` before important conversations
3. **Export important conversations**: Save key discussions as markdown
4. **Use search effectively**: Combine keywords with filters for better results
5. **Enable auto-save**: Let the system handle saving automatically

---

🎉 **Ready to get started?** Run `npm start` and begin chatting with full history support!
