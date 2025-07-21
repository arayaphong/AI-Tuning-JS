#!/usr/bin/env node

import readline from 'readline';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';
import Model from './src/utils/google-ai-model.js';

// Load environment variables
dotenv.config();

// Constants using uppercase naming convention
const SAVE_FILE = './save/last_session.json';
const SAVE_FOLDER = './save';
const MAX_HISTORY_DISPLAY = 10;

/**
 * Enhanced Session Manager class using ES6+ features
 */
class SessionManager {
  // Private fields
  #conversationHistory = [];
  
  constructor() {
    console.log('📝 Session manager initialized');
  }

  /**
   * Add a message to conversation history
   * @param {string} role - Message role (user/assistant)
   * @param {string} content - Message content
   */
  addMessage(role, content) {
    this.#conversationHistory.push({
      role,
      content,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get conversation history
   * @returns {Array} Conversation history array
   */
  getConversationHistory() {
    return [...this.#conversationHistory]; // Return a copy
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.#conversationHistory.length = 0;
    console.log(chalk.green('🧹 History cleared'));
  }

  /**
   * Auto-load previous session
   */
  async autoLoad() {
    try {
      const data = await fs.readFile(SAVE_FILE, 'utf8');
      const session = JSON.parse(data);
      this.#conversationHistory = session.conversationHistory ?? [];
      
      if (this.#conversationHistory.length > 0) {
        console.log(chalk.gray(`📚 Loaded ${this.#conversationHistory.length} previous messages`));
      }
    } catch (error) {
      // Silently fail if no previous session exists
      console.log(chalk.gray('📝 Starting fresh session'));
    }
  }

  /**
   * Auto-save current session
   */
  async autoSave() {
    try {
      await fs.mkdir(SAVE_FOLDER, { recursive: true });
      
      const session = {
        conversationHistory: this.#conversationHistory,
        savedAt: new Date().toISOString(),
        version: '1.0.0'
      };
      
      await fs.writeFile(SAVE_FILE, JSON.stringify(session, null, 2));
      console.log(chalk.green('💾 Session saved automatically'));
    } catch (error) {
      console.warn(chalk.yellow(`⚠️ Could not save session: ${error.message}`));
    }
  }

  /**
   * Get conversation statistics
   * @returns {Object} Statistics about the conversation
   */
  getStats() {
    const userMessages = this.#conversationHistory.filter(msg => msg.role === 'user').length;
    const assistantMessages = this.#conversationHistory.filter(msg => msg.role === 'assistant').length;
    
    return {
      total: this.#conversationHistory.length,
      userMessages,
      assistantMessages
    };
  }
}

/**
 * Enhanced markdown renderer with ES6+ features
 * @param {string} content - Markdown content to render
 */
const renderMarkdown = (content) => {
  const lines = content.split('\n');
  
  // Using for...of with modern syntax
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Using switch statement for better readability
    switch (true) {
      case trimmedLine.startsWith('# '):
        console.log(chalk.blue.bold(trimmedLine.substring(2)));
        break;
      case trimmedLine.startsWith('## '):
        console.log(chalk.cyan.bold(trimmedLine.substring(3)));
        break;
      case trimmedLine.startsWith('### '):
        console.log(chalk.green.bold(trimmedLine.substring(4)));
        break;
      case trimmedLine.startsWith('```'):
        console.log(chalk.gray(line));
        break;
      case trimmedLine.includes('**'):
        const boldText = line.replace(/\*\*(.*?)\*\*/g, chalk.bold('$1'));
        console.log(boldText);
        break;
      case trimmedLine.startsWith('- ') || trimmedLine.startsWith('* '):
        console.log(chalk.yellow('  •') + ' ' + trimmedLine.substring(2));
        break;
      default:
        console.log(line);
    }
  }
};

/**
 * Initialize AI model with error handling
 * @returns {Promise<Model>} Initialized AI model
 */
const initializeAI = async () => {
  try {
    const model = new Model();
    console.log(chalk.green('🤖 AI model initialized successfully'));
    return model;
  } catch (error) {
    console.error(chalk.red('❌ Failed to initialize AI:'), error.message);
    process.exit(1);
  }
};

/**
 * Generate AI response with conversation context
 * @param {Model} model - AI model instance
 * @param {string} input - User input
 * @param {Array} conversationHistory - Previous conversation
 * @returns {Promise<string>} AI response
 */
const generateResponse = async (model, input, conversationHistory) => {
  try {
    let contextPrompt = '';
    
    if (conversationHistory.length > 0) {
      contextPrompt = 'Previous conversation:\n';
      
      // Using array methods with destructuring
      conversationHistory
        .slice(-MAX_HISTORY_DISPLAY)
        .forEach(({ role, content }) => {
          contextPrompt += `${role}: ${content}\n`;
        });
      
      contextPrompt += '\nCurrent message:\n';
    }
    
    const fullPrompt = contextPrompt + input;
    return await model.generateContent(fullPrompt);
  } catch (error) {
    console.error(chalk.red('🚨 Error generating response:'), error.message);
    throw new Error(`Response generation failed: ${error.message}`);
  }
};

/**
 * Enhanced chatbot application with ES6+ features
 */
const startChatbot = async () => {
  console.log(chalk.blue.bold('\n🤖 AI Chatbot - Enhanced Edition'));
  console.log(chalk.gray('Commands: /exit (save & quit), /clear (clear screen & history), /stats (show statistics)\n'));

  const model = await initializeAI();
  const sessionManager = new SessionManager();
  
  await sessionManager.autoLoad();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.blue('💬 You: ')
  });

  rl.prompt();

  // Using arrow function for event handler
  rl.on('line', async (line) => {
    const input = line.trim();

    if (!input) {
      rl.prompt();
      return;
    }

    // Enhanced command handling with switch
    switch (input) {
      case '/exit':
        console.log(chalk.yellow('🔄 Saving session...'));
        await sessionManager.autoSave();
        console.log(chalk.green('👋 Goodbye!'));
        rl.close();
        return;

      case '/clear':
        console.clear();
        sessionManager.clearHistory();
        console.log(chalk.green('🧹 Screen and history cleared'));
        console.log(chalk.blue.bold('\n🤖 AI Chatbot - Enhanced Edition'));
        console.log(chalk.gray('Commands: /exit (save & quit), /clear (clear screen & history), /stats (show statistics)\n'));
        rl.prompt();
        return;

      case '/stats':
        const stats = sessionManager.getStats();
        console.log(chalk.cyan('📊 Session Statistics:'));
        console.log(chalk.gray(`  Total messages: ${stats.total}`));
        console.log(chalk.gray(`  User messages: ${stats.userMessages}`));
        console.log(chalk.gray(`  Assistant messages: ${stats.assistantMessages}\n`));
        rl.prompt();
        return;
    }

    sessionManager.addMessage('user', input);

    try {
      process.stdout.write(chalk.yellow('🤔 Processing...\r'));

      const response = await generateResponse(model, input, sessionManager.getConversationHistory());

      process.stdout.clearLine();
      process.stdout.cursorTo(0);

      sessionManager.addMessage('assistant', response);

      console.log(chalk.green.bold('🤖 AI:'));
      renderMarkdown(response);
      console.log();

    } catch (error) {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      console.error(chalk.red('❌ Error:'), error.message);
      console.log();
    }

    rl.prompt();
  });

  // Enhanced cleanup handlers using arrow functions
  rl.on('close', async () => {
    await sessionManager.autoSave();
    console.log(chalk.green('\n👋 Chat ended gracefully.'));
    process.exit(0);
  });

  // Graceful shutdown on interrupt
  process.on('SIGINT', async () => {
    console.log(chalk.yellow('\n🔄 Saving current session...'));
    await sessionManager.autoSave();
    console.log(chalk.green('👋 Goodbye!'));
    rl.close();
  });
};

// Application entry point with enhanced error handling
startChatbot().catch(error => {
  console.error(chalk.red('❌ Application error:'), error.message);
  console.error(chalk.gray('Stack trace:'), error.stack);
  process.exit(1);
});
