# AutoSave Feature Documentation

## Overview

The `/autosave` feature provides seamless session management by automatically saving your conversations when you exit the chat and loading your last session when you start a new chat session.

## How to Use

### Enable AutoSave
```
/autosave on
```
This command enables:
- **Save on Exit**: Automatically saves your session when you exit the chat (/exit, /quit, Ctrl+C, or closing the terminal)
- **Load Last Session**: Automatically loads your most recent session when starting a new chat

### Disable AutoSave
```
/autosave off
```
This command disables all auto-save functionality.

### Check AutoSave Status
```
/autosave
```
Shows current auto-save settings and status.

## Features

### 1. Automatic Session Saving on Exit
When `/autosave on` is enabled and you exit the chat:
- If you have an existing session name, it saves to that session
- If you don't have a session name, it creates a new auto-save session with Unix timestamp (e.g., `auto_save_1752135014`)
- Works with all exit methods: `/exit`, `/quit`, `Ctrl+C`, or closing the terminal

### 2. Automatic Last Session Loading
When starting the chatbot:
- **Always** automatically finds and loads your most recently modified session file
- Works independently of autosave settings - loads the latest session even if autosave is disabled
- Loads the conversation history seamlessly
- Shows confirmation message with session details
- Falls back gracefully to a fresh session if no valid sessions are found

### 3. Periodic Auto-Save
- Saves your session automatically when you exit the CLI
- Only saves if you have an active session name
- Runs in the background without interrupting your conversation

## Examples

### Typical Workflow

1. **Start Chat and Enable AutoSave**
   ```
   /autosave on
   ```

2. **Have Conversations**
   Your messages are automatically tracked and saved periodically.

3. **Exit Chat**
   ```
   /exit
   ```
   Session is automatically saved.

4. **Start New Chat Session**
   Your last conversation is automatically loaded, and you can continue where you left off. This happens regardless of autosave settings.

### Manual Session Management
You can still use manual session commands alongside autosave:
```
/save my_important_chat    # Save with specific name
/load my_important_chat    # Load specific session
/autoload                  # Manually load most recent session
/sessions                  # List all sessions
```

## Session Information
Use `/info` to see detailed session information including:
- Current session name
- Message count
- Auto-save status
- Save on exit status
- Unsaved changes indicator

## Benefits

- **Seamless Experience**: Never lose your conversations
- **Automatic Resume**: Continue exactly where you left off
- **Background Operation**: Auto-save works silently in the background
- **Multiple Exit Methods**: Works with all ways of exiting the chat
- **Smart Naming**: Auto-generates meaningful session names when needed

## Technical Details

- Auto-save sessions are stored in the `save/` directory
- Auto-generated session names use format: `auto_save_YYYY-MM-DDTHH-MM-SS`
- The system finds the most recently modified session file for auto-loading
- Backup files are ignored when finding the last session
- All session data includes metadata like creation time, message count, etc.
- Invalid or empty session files are automatically skipped during loading
- The system gracefully handles corrupted session files and continues with a fresh session

## Compatibility

The autosave feature is fully compatible with:
- Manual session saving and loading
- Session export functionality
- Session search and analytics
- Backup creation
- All existing session management features
