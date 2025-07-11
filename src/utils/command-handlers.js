/**
 * Command handlers for CLI interface
 * Handles special commands like session management, help, and system commands
 */

import chalk from 'chalk';
import { renderSystemInfo, renderHelpContent, smartRender } from './ui-renderer.js';
import { 
  displaySessionInfo, 
  displayConversationHistory, 
  displaySearchResults, 
  displayAnalytics 
} from './display-utils.js';

/**
 * Handle special CLI commands including session management
 * @param {string} input - User input command
 * @param {readline.Interface} rl - Readline interface
 * @param {SessionManager} sessionManager - Session manager instance
 * @returns {boolean} - True if command was handled, false otherwise
 */
export async function handleSpecialCommands(input, rl, sessionManager) {
  const command = input.toLowerCase().trim();
  const parts = input.trim().split(' ');
  const baseCommand = parts[0].toLowerCase();
  
  switch (baseCommand) {
    case '/save':
      if (parts.length < 2) {
        console.log(chalk.red('❌ Usage: /save <session_name>'));
        console.log(chalk.gray('Example: /save my_conversation'));
        return true;
      }
      const saveSessionName = parts.slice(1).join(' ');
      await sessionManager.saveSession(saveSessionName);
      return true;

    case '/load':
      if (parts.length < 2) {
        console.log(chalk.red('❌ Usage: /load <session_name>'));
        console.log(chalk.gray('Example: /load my_conversation'));
        return true;
      }
      const loadSessionName = parts.slice(1).join(' ');
      const loaded = await sessionManager.loadSession(loadSessionName);
      if (loaded) {
        // Display conversation history
        await displayConversationHistory(sessionManager);
      }
      return true;

    case '/sessions':
    case '/list':
      await sessionManager.listAvailableSessions();
      return true;

    case '/delete':
      if (parts.length < 2) {
        console.log(chalk.red('❌ Usage: /delete <session_name>'));
        console.log(chalk.gray('Example: /delete my_conversation'));
        return true;
      }
      const deleteSessionName = parts.slice(1).join(' ');
      await sessionManager.deleteSession(deleteSessionName);
      return true;

    case '/new':
    case '/clear':
      if (command === '/clear') {
        console.clear();
        console.log(chalk.green('🤖 Gemini AI Chatbot with Shell Commands\n'));
      }
      sessionManager.clearSession();
      return true;

    case '/info':
    case '/status':
      await displaySessionInfo(sessionManager);
      return true;

    case '/history':
      await displayConversationHistory(sessionManager);
      return true;

    case '/search':
      if (parts.length < 2) {
        console.log(chalk.red('❌ Usage: /search <query> [options]'));
        console.log(chalk.gray('Example: /search "error message"'));
        console.log(chalk.gray('Options: --user, --assistant, --from=date, --to=date'));
        return true;
      }
      const searchQuery = parts.slice(1).join(' ').replace(/--\w+[=\w-]*/g, '').trim();
      const searchOptions = {};
      
      // Parse search options
      if (input.includes('--user')) searchOptions.role = 'user';
      if (input.includes('--assistant')) searchOptions.role = 'assistant';
      
      const results = sessionManager.searchHistory(searchQuery, searchOptions);
      await displaySearchResults(results, searchQuery);
      return true;

    case '/export':
      const format = parts[1] || 'json';
      const fileName = parts[2] || null;
      
      if (!['json', 'markdown', 'txt', 'csv'].includes(format.toLowerCase())) {
        console.log(chalk.red('❌ Invalid format. Supported: json, markdown, txt, csv'));
        return true;
      }
      
      try {
        await sessionManager.exportConversation(format, fileName);
      } catch (error) {
        console.log(chalk.red(`❌ Export failed: ${error.message}`));
      }
      return true;

    case '/analytics':
    case '/stats':
      await displayAnalytics(sessionManager);
      return true;

    case '/backup':
      await sessionManager.createBackup();
      return true;

    case '/autosave':
      const action = parts[1]?.toLowerCase();
      if (action === 'on' || action === 'enable') {
        sessionManager.setAutoSave(true); // Enable save-on-exit
      } else if (action === 'off' || action === 'disable') {
        sessionManager.setAutoSave(false);
      } else {
        console.log(chalk.yellow('💡 Usage: /autosave on|off'));
        console.log(chalk.gray('  on  - Enable auto-save on exit'));
        console.log(chalk.gray('  off - Disable auto-save on exit'));
        const sessionInfo = sessionManager.getSessionInfo();
        console.log(chalk.gray(`Auto-save on exit: ${sessionInfo.autoSaveOnExit ? 'enabled' : 'disabled'}`));
      }
      return true;

    case '/autoload':
      console.log(chalk.cyan('🔄 Manually loading last session...'));
      const autoLoaded = await sessionManager.loadLastSession();
      if (autoLoaded) {
        // Display conversation history
        await displayConversationHistory(sessionManager);
      }
      return true;

    case '/commands':
    case '/tools':
      await renderSystemInfo('Available Shell Commands', 'These keywords trigger shell commands when mentioned in your messages:');
      listShellCommands();
      return true;
      
    case '/help':
      await showHelpContent();
      return true;
      
    case '/examples':
      await showExampleContent();
      return true;
      
    case '/exit':
    case '/quit':
    case 'exit':
      // Auto-save current session if enabled
      await sessionManager.saveOnExit();
      console.log(chalk.green('👋 Goodbye!'));
      rl.close();
      process.exit(0);
      return true;
      
    default:
      return false;
  }
}

/**
 * Show help content with all available commands
 */
async function showHelpContent() {
  const helpCommands = [
    {
      name: '/save <name>',
      description: 'Save current conversation to a session file',
      examples: ['/save my_conversation', '/save project_chat']
    },
    {
      name: '/load <name>',
      description: 'Load a saved conversation session',
      examples: ['/load my_conversation', '/load project_chat']
    },
    {
      name: '/sessions',
      description: 'List all available saved sessions',
      examples: ['/sessions', '/list']
    },
    {
      name: '/delete <name>',
      description: 'Delete a saved session file',
      examples: ['/delete old_conversation']
    },
    {
      name: '/new',
      description: 'Start a new conversation (clear current session)',
      examples: ['/new', '/clear']
    },
    {
      name: '/info',
      description: 'Show current session information and status',
      examples: ['/info', '/status']
    },
    {
      name: '/search <q>',
      description: 'Search through conversation history',
      examples: ['/search "error message"', '/search api --user']
    },
    {
      name: '/export <format>',
      description: 'Export conversation (json, markdown, txt, csv)',
      examples: ['/export markdown', '/export json my_chat']
    },
    {
      name: '/analytics',
      description: 'Show conversation statistics and analytics',
      examples: ['/analytics', '/stats']
    },
    {
      name: '/backup',
      description: 'Create a backup of current conversation',
      examples: ['/backup']
    },
    {
      name: '/autosave <on|off>',
      description: 'Enable auto-save on exit to preserve sessions',
      examples: ['/autosave on', '/autosave off']
    },
    {
      name: '/autoload',
      description: 'Manually load the most recent session',
      examples: ['/autoload']
    },
    {
      name: '/commands',
      description: 'List all available shell command keywords',
      examples: ['/commands', '/tools']
    },
    {
      name: '/help',
      description: 'Show this help message with detailed command information',
      examples: ['/help']
    },
    {
      name: '/clear',
      description: 'Clear the terminal screen and start new session',
      examples: ['/clear']
    },
    {
      name: '/examples',
      description: 'Show example requests and usage patterns',
      examples: ['/examples']
    },
    {
      name: '/quit or /exit',
      description: 'Exit the chatbot application',
      examples: ['/quit', '/exit']
    }
  ];
  
  console.log(chalk.cyan.bold('🤖 Gemini AI Chatbot with Shell Commands & Sessions\n'));
  await renderHelpContent(helpCommands);
  
  console.log(chalk.yellow('💡 **Natural Language Usage:**'));
  console.log('Just type naturally! Keywords like "memory", "cpu", "files", "system" will automatically trigger shell commands.\n');
  console.log(chalk.yellow('💾 **Session Management:**'));
  console.log('Save conversations with /save, load them with /load, and manage with /sessions.\n');
}

/**
 * Show example usage content
 */
async function showExampleContent() {
  const exampleContent = `# Example Requests

## System Information
- "What's my system **memory** usage?"
- "Show me **CPU** information"
- "Give me **system info**"

## File Operations
- "List files in my current directory"
- "Show me the files in this folder"

## Command Execution
- "Run pwd"
- "Execute date"
- "Run ps aux"

## Session Management & History
- "/save important_meeting" - Save current conversation
- "/load important_meeting" - Load a saved conversation
- "/sessions" - List all saved sessions
- "/info" - Show current session status
- "/autosave on" - Enable auto-save on exit
- "/autoload" - Manually load the most recent session
- "/backup" - Create conversation backup

## Auto-Save Features
When \`/autosave on\` is enabled:
- Saves session when you exit the chat (/exit, Ctrl+C, or closing)
- Loads your last session when starting a new chat
- Perfect for resuming conversations seamlessly

## Search & Analysis
- "/search error" - Search conversation history
- "/search api --user" - Search only user messages
- "/analytics" - View conversation statistics
- "/export markdown" - Export to markdown file
- "/export json my_chat" - Export with custom name

## Combined Requests
- "Show my memory usage and list files"
- "What's my system info and memory usage?"

*Keywords are automatically detected and trigger shell commands!*
*Sessions are automatically tracked and can be saved/loaded anytime!*`;
  
  await smartRender(exampleContent);
}
