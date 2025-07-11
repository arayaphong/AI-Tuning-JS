/**
 * CLI interface for the chatbot
 * Handles the main chatbot interaction loop and user interface
 */

import readline from 'readline';
import chalk from 'chalk';
import { initializeGoogleAI, generateContent } from './utils/google-ai-integration.js';
import { SessionManager } from './utils/session-manager.js';
import { handleSpecialCommands } from './utils/command-handlers.js';
import { renderChatMessage, showBanner } from './utils/ui-renderer.js';

/**
 * Starts the reliable chatbot with keyword-based shell commands and session management
 * @param {Object} config - Configuration options
 * @param {string} config.project - Google Cloud project ID
 * @param {string} config.location - Google Cloud location
 * @param {string} config.apiKey - Google AI API key
 */
export async function startChatbot(config = {}) {
  showBanner();

  // Initialize session manager
  const sessionManager = new SessionManager();
  await sessionManager.initialize();
  
  // Always try to load the last session on startup for continuity
  await sessionManager.loadLastSession();
  
  // Enable auto-save on exit for better user experience
  sessionManager.setAutoSave(true); // Enable save-on-exit

  const { project, location, apiKey } = config;

  let model;
  try {
    model = await initializeGoogleAI({
      project,
      location,
      apiKey
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
    if (await handleSpecialCommands(input, rl, sessionManager)) {
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

      // Display response using markdown rendering
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
        console.log(chalk.yellow('💡 Tip: Try using simpler language with keywords like "memory", "files", "cpu"'));
      }
    }

    console.log(); // Add spacing
    rl.prompt();
  });

  rl.on('close', async () => {
    console.log(chalk.green('\n👋 Chat ended.'));
    process.exit(0);
  });

  // Handle Ctrl+C gracefully
  process.on('SIGINT', async () => {
    console.log(chalk.yellow('\n🔄 Saving current session...'));
    await sessionManager.saveOnExit();
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

/**
 * Quick test function for verifying AI integration
 * @param {Object} config - Configuration options
 */
export async function quickTest(config = {}) {
  console.log(chalk.blue('🧪 Quick Test Mode\n'));
  
  try {
    const model = await initializeGoogleAI(config);
    
    console.log('✅ Model initialized successfully');
    
    const testPrompt = 'Show me my system memory usage';
    console.log(`\n🧪 Testing: "${testPrompt}"`);
    
    const response = await generateContent(model, testPrompt);
    
    // Test the markdown renderer
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
