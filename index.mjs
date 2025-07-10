#!/usr/bin/env node

import { initializeGoogleAI, generateContent, listShellCommands } from './src/utils/google-ai-integration.js';
import { 
  renderChatMessage, 
  renderHelpContent, 
  renderSystemInfo,
  smartRender 
} from './src/utils/markdown-renderer.js';
import { SessionManager } from './src/utils/session-manager.js';

import dotenv from 'dotenv';
import readline from 'readline';
import chalk from 'chalk';

dotenv.config();

// Global session manager instance
let sessionManager;

/**
 * Handle special CLI commands including session management
 */
async function handleSpecialCommands(input, rl) {
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
        await displayConversationHistory();
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
      await displaySessionInfo();
      return true;

    case '/history':
      await displayConversationHistory();
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
      await displayAnalytics();
      return true;

    case '/backup':
      await sessionManager.createBackup();
      return true;

    case '/autosave':
      const action = parts[1]?.toLowerCase();
      if (action === 'on' || action === 'enable') {
        sessionManager.setAutoSave(true);
      } else if (action === 'off' || action === 'disable') {
        sessionManager.setAutoSave(false);
      } else {
        console.log(chalk.yellow('💡 Usage: /autosave on|off'));
        console.log(chalk.gray('Current status: ' + (sessionManager.autoSaveEnabled ? 'enabled' : 'disabled')));
      }
      return true;

    case '/commands':
    case '/tools':
      await renderSystemInfo('Available Shell Commands', 'These keywords trigger shell commands when mentioned in your messages:');
      listShellCommands();
      return true;
      
    case '/help':
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
          description: 'Enable or disable automatic saving',
          examples: ['/autosave on', '/autosave off']
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
      console.log('Just type naturally! Keywords like "memory", "cpu", "files", "git status" will automatically trigger shell commands.\n');
      console.log(chalk.yellow('💾 **Session Management:**'));
      console.log('Save conversations with /save, load them with /load, and manage with /sessions.\n');
      return true;
      
    case '/examples':
      const exampleContent = `# Example Requests

## System Information
- "What's my system **memory** usage?"
- "Show me **CPU** information"
- "Give me **system info**"

## File Operations
- "List files in my current directory"
- "Show me the files in this folder"

## Git Operations
- "What's my git status?"
- "Show me recent git commits"
- "What git branch am I on?"

## Command Execution
- "Run pwd"
- "Execute date"
- "Run ps aux"

## Session Management & History
- "/save important_meeting" - Save current conversation
- "/load important_meeting" - Load a saved conversation
- "/sessions" - List all saved sessions
- "/info" - Show current session status
- "/autosave on" - Enable automatic saving
- "/backup" - Create conversation backup

## Search & Analysis
- "/search error" - Search conversation history
- "/search api --user" - Search only user messages
- "/analytics" - View conversation statistics
- "/export markdown" - Export to markdown file
- "/export json my_chat" - Export with custom name

## Combined Requests
- "Show my memory usage and list files"
- "What's my git status and system info?"

*Keywords are automatically detected and trigger shell commands!*
*Sessions are automatically tracked and can be saved/loaded anytime!*`;
      
      await smartRender(exampleContent);
      return true;
      
    case '/exit':
    case '/quit':
    case 'exit':
      // Auto-save current session if active
      await sessionManager.autoSave();
      console.log(chalk.green('👋 Goodbye!'));
      rl.close();
      process.exit(0);
      return true;
      
    default:
      return false;
  }
}

/**
 * Display current session information
 */
async function displaySessionInfo() {
  const info = sessionManager.getSessionInfo();
  
  console.log(chalk.cyan.bold('\n📊 Session Information'));
  console.log(chalk.gray('─'.repeat(30)));
  
  if (info.currentSessionName) {
    console.log(chalk.white(`💾 Current Session: ${info.currentSessionName}`));
  } else {
    console.log(chalk.yellow('💾 Current Session: Unsaved'));
  }
  
  console.log(chalk.white(`💬 Messages: ${info.messageCount}`));
  console.log(chalk.gray(`📅 Created: ${new Date(info.metadata.createdAt).toLocaleString()}`));
  console.log(chalk.gray(`🕒 Last Modified: ${new Date(info.metadata.lastModified).toLocaleString()}`));
  
  if (info.hasUnsavedChanges) {
    console.log(chalk.yellow('⚠️  Unsaved changes - use /save <name> to save'));
  }
  
  console.log();
}

/**
 * Display conversation history
 */
async function displayConversationHistory() {
  const history = sessionManager.getConversationHistory();
  
  if (history.length === 0) {
    console.log(chalk.yellow('📝 No conversation history in current session.'));
    return;
  }
  
  console.log(chalk.cyan.bold('\n📜 Conversation History'));
  console.log(chalk.gray('═'.repeat(50)));
  
  for (let i = 0; i < history.length; i++) {
    const message = history[i];
    const timestamp = new Date(message.timestamp).toLocaleTimeString();
    
    if (message.role === 'user') {
      console.log(chalk.blue.bold(`\n[${timestamp}] 💬 You:`));
      console.log(chalk.white(message.content));
    } else {
      console.log(chalk.green.bold(`\n[${timestamp}] 🤖 AI:`));
      // Use simple rendering for history to avoid formatting issues
      console.log(chalk.white(message.content.substring(0, 200) + (message.content.length > 200 ? '...' : '')));
    }
  }
  
  console.log(chalk.gray('\n' + '═'.repeat(50)));
  console.log(chalk.gray(`Total messages: ${history.length}`));
  console.log();
}

/**
 * Display search results
 */
async function displaySearchResults(results, query) {
  if (results.length === 0) {
    console.log(chalk.yellow(`🔍 No results found for "${query}"`));
    return;
  }

  console.log(chalk.cyan.bold(`\n🔍 Search Results for "${query}"`));
  console.log(chalk.gray('═'.repeat(50)));
  console.log(chalk.gray(`Found ${results.length} matching message(s)\n`));

  for (let i = 0; i < results.length; i++) {
    const message = results[i];
    const timestamp = new Date(message.timestamp).toLocaleString();
    const roleIcon = message.role === 'user' ? '💬' : '🤖';
    const roleColor = message.role === 'user' ? chalk.blue : chalk.green;
    
    console.log(roleColor.bold(`${roleIcon} ${message.role.toUpperCase()} [${timestamp}]:`));
    
    // Highlight search term in context
    const content = message.content.length > 200 ? 
      message.content.substring(0, 200) + '...' : message.content;
    
    console.log(chalk.white(content));
    console.log(chalk.gray('─'.repeat(30)));
  }
  console.log();
}

/**
 * Display conversation analytics
 */
async function displayAnalytics() {
  const analytics = sessionManager.getAnalytics();
  
  console.log(chalk.cyan.bold('\n📊 Conversation Analytics'));
  console.log(chalk.gray('═'.repeat(40)));
  
  console.log(chalk.white(`💬 Total Messages: ${analytics.totalMessages}`));
  console.log(chalk.blue(`👤 User Messages: ${analytics.userMessages}`));
  console.log(chalk.green(`🤖 AI Messages: ${analytics.assistantMessages}`));
  
  if (analytics.conversationDuration > 0) {
    const duration = Math.round(analytics.conversationDuration / 60000);
    console.log(chalk.yellow(`⏱️  Duration: ${duration} minutes`));
  }
  
  console.log(chalk.magenta(`📏 Avg Message Length: ${analytics.averageMessageLength} chars`));
  console.log(chalk.cyan(`🕐 Most Active Hour: ${analytics.mostActiveHour}:00`));
  
  console.log(chalk.gray(`📅 Created: ${new Date(analytics.createdAt).toLocaleString()}`));
  console.log(chalk.gray(`🕒 Last Modified: ${new Date(analytics.lastModified).toLocaleString()}`));
  
  // Message distribution
  if (analytics.totalMessages > 0) {
    const userRatio = Math.round((analytics.userMessages / analytics.totalMessages) * 100);
    const aiRatio = 100 - userRatio;
    console.log(chalk.gray(`📊 Distribution: ${userRatio}% User, ${aiRatio}% AI`));
  }
  
  console.log();
}

/**
 * Display startup banner
 */
function showBanner() {
  console.log(chalk.green.bold('🤖 Gemini AI Chatbot with Shell Commands & Sessions'));
  console.log(chalk.gray('═'.repeat(65)));
  console.log(chalk.yellow('💡 Use natural language - keywords trigger shell commands!'));
  console.log(chalk.yellow('💾 Save/load conversations with /save and /load commands!'));
  console.log(chalk.gray('Type /help for all commands or just start chatting!\n'));
}

/**
 * Starts the reliable chatbot with keyword-based shell commands and session management
 */
async function startChatbot() {
    showBanner();

    // Initialize session manager
    sessionManager = new SessionManager();
    await sessionManager.initialize();
    
    // Enable auto-save by default for better user experience
    sessionManager.setAutoSave(true);

    const { GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_LOCATION, GOOGLE_AI_API_KEY } = process.env;

    let model;
    try {
        model = await initializeGoogleAI({
            project: GOOGLE_CLOUD_PROJECT,
            location: GOOGLE_CLOUD_LOCATION,
            apiKey: GOOGLE_AI_API_KEY
        });
    } catch (error) {
        console.error(chalk.red('❌ Failed to initialize AI:'), error.message);
        process.exit(1);
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: chalk.blue('💬 You: ')
    });

    // Show available shell command keywords on startup
    console.log(chalk.cyan('Available shell command keywords:'));
    listShellCommands();
    console.log(chalk.cyan('\nSession commands: /save, /load, /search, /export, /analytics'));
    console.log(chalk.cyan('History features: Auto-save, backup, search, export to multiple formats'));
    console.log(chalk.gray('\nJust ask naturally - keywords will trigger shell commands!\n'));
    rl.prompt();

    rl.on('line', async (line) => {
        const input = line.trim();

        if (!input) {
            rl.prompt();
            return;
        }

        // Handle special commands
        if (await handleSpecialCommands(input, rl)) {
            rl.prompt();
            return;
        }

        // Add user message to session
        sessionManager.addMessage('user', input);

        try {
            // Show processing indicator
            const processingText = chalk.yellow('🤔 Processing...');
            process.stdout.write(processingText + '\r');

            // Get conversation history for context
            const conversationHistory = sessionManager.getConversationHistory();

            const response = await generateContent(model, input, {
                conversationHistory: conversationHistory
            });

            // Clear processing indicator
            process.stdout.clearLine();
            process.stdout.cursorTo(0);

            // Add AI response to session
            sessionManager.addMessage('assistant', response);

            // Display response using ink-markdown for rich markdown rendering
            await renderChatMessage(response, {
              prefix: '🤖 Gemini:',
              showTimestamp: false,
              addSpacing: true
            });

        } catch (err) {
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            console.error(chalk.red('❌ Error:'), err.message);

            // Provide helpful hints for common errors
            if (err.message.includes('permission')) {
                console.log(chalk.yellow('💡 Tip: Some commands might need different permissions'));
            } else if (err.message.includes('not found')) {
                console.log(chalk.yellow('💡 Tip: Command might not be available on your system'));
            } else if (err.message.includes('function')) {
                console.log(chalk.yellow('💡 Tip: Try using simpler language with keywords like "memory", "files", "git status"'));
            }
        }

        console.log(); // Add spacing
        rl.prompt();
    });

    rl.on('close', async () => {
        // Auto-save current session if active
        await sessionManager.autoSave();
        console.log(chalk.green('\n👋 Chat ended.'));
        process.exit(0);
    });

    // Handle Ctrl+C gracefully
    process.on('SIGINT', async () => {
        console.log(chalk.yellow('\n🔄 Saving current session...'));
        await sessionManager.autoSave();
        console.log(chalk.green('👋 Goodbye!'));
        rl.close();
    });

    // Handle uncaught errors
    process.on('unhandledRejection', (error) => {
        console.error(chalk.red('\n❌ Unexpected error:'), error.message);
        console.log(chalk.yellow('💡 Try restarting the chatbot or using simpler commands'));
        rl.prompt();
    });
}

// Show system info on startup (optional)
async function showSystemInfo() {
    const os = await import('os');
    console.log(chalk.gray(`System: ${os.type()} ${os.release()}`));
    console.log(chalk.gray(`Platform: ${os.platform()} ${os.arch()}`));
    console.log(chalk.gray(`Node.js: ${process.version}\n`));
}

// Quick test function
async function quickTest() {
    console.log(chalk.blue('🧪 Quick Test Mode\n'));
    
    try {
        const model = await initializeGoogleAI({
            project: process.env.GOOGLE_CLOUD_PROJECT,
            location: process.env.GOOGLE_CLOUD_LOCATION,
            apiKey: process.env.GOOGLE_AI_API_KEY
        });
        
        console.log('✅ Model initialized successfully');
        
        const testPrompt = 'Show me my system memory usage';
        console.log(`\n🧪 Testing: "${testPrompt}"`);
        
        const response = await generateContent(model, testPrompt);
        
        // Test the new markdown renderer
        await renderChatMessage(response, {
          prefix: '📝 Test Response:',
          showTimestamp: true
        });
        
        console.log('\n🎉 Quick test completed successfully!');
        console.log('💡 Run "npm start" to start the interactive chatbot\n');
        
    } catch (error) {
        console.error(chalk.red('❌ Test failed:'), error.message);
        process.exit(1);
    }
}

// Command line argument handling
async function main() {
  if (process.argv.includes('--test')) {
    await quickTest();
  } else if (process.argv.includes('--system-info')) {
    await showSystemInfo();
    await startChatbot();
  } else {
    await startChatbot();
  }
}

// Start the application
main().catch(error => {
  console.error(chalk.red('❌ Application error:'), error.message);
  process.exit(1);
});