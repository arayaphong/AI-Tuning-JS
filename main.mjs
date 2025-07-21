#!/usr/bin/env node

/**
 * Lean AI Chatbot - Minimal version with essential features only
 * Features: Google AI chat, auto-save/load, markdown rendering, /exit and /clear commands
 */

import readline from 'readline';
import chalk from 'chalk';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import Model from './src/utils/google-ai-model.js';

// Load environment variables
dotenv.config();

const SAVE_FILE = './save/last_session.json';
const SAVE_FOLDER = './save';

/**
 * Simple session manager for auto-save/load functionality
 */
class LeanSessionManager {
  constructor() {
    this.conversationHistory = [];
  }

  addMessage(role, content) {
    this.conversationHistory.push({
      role,
      content,
      timestamp: new Date().toISOString()
    });
  }

  getConversationHistory() {
    return this.conversationHistory;
  }

  clearHistory() {
    this.conversationHistory = [];
  }

  async autoLoad() {
    try {
      const data = await fs.readFile(SAVE_FILE, 'utf8');
      const session = JSON.parse(data);
      this.conversationHistory = session.conversationHistory || [];
      if (this.conversationHistory.length > 0) {
        console.log(chalk.gray(`📚 Loaded ${this.conversationHistory.length} previous messages`));
      }
    } catch (error) {
      // No previous session found, start fresh
    }
  }

  async autoSave() {
    try {
      await fs.mkdir(SAVE_FOLDER, { recursive: true });
      const session = {
        conversationHistory: this.conversationHistory,
        savedAt: new Date().toISOString()
      };
      await fs.writeFile(SAVE_FILE, JSON.stringify(session, null, 2));
      console.log(chalk.green('💾 Session saved automatically'));
    } catch (error) {
      console.warn(chalk.yellow(`⚠️ Could not save session: ${error.message}`));
    }
  }
}

/**
 * Simple markdown renderer for terminal output
 */
function renderMarkdown(content) {
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Handle headers
    if (trimmedLine.startsWith('# ')) {
      console.log(chalk.blue.bold(trimmedLine.substring(2)));
    } else if (trimmedLine.startsWith('## ')) {
      console.log(chalk.cyan.bold(trimmedLine.substring(3)));
    } else if (trimmedLine.startsWith('### ')) {
      console.log(chalk.green.bold(trimmedLine.substring(4)));
    }
    // Handle code blocks
    else if (trimmedLine.startsWith('```')) {
      console.log(chalk.gray(line));
    }
    // Handle bold text
    else if (trimmedLine.includes('**')) {
      const boldText = line.replace(/\*\*(.*?)\*\*/g, chalk.bold('$1'));
      console.log(boldText);
    }
    // Handle bullet points
    else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      console.log(chalk.yellow('  •') + ' ' + trimmedLine.substring(2));
    }
    // Regular text
    else {
      console.log(line);
    }
  }
}

/**
 * Initialize Google AI model
 */
async function initializeAI() {
  try {
    return new Model();
  } catch (error) {
    console.error(chalk.red('❌ Failed to initialize AI:'), error.message);
    process.exit(1);
  }
}

/**
 * Generate AI response with conversation context
 */
async function generateResponse(model, input, conversationHistory) {
  // Build context from conversation history
  let contextPrompt = '';
  if (conversationHistory.length > 0) {
    contextPrompt = 'Previous conversation:\n';
    conversationHistory.slice(-10).forEach(msg => { // Keep last 10 messages for context
      contextPrompt += `${msg.role}: ${msg.content}\n`;
    });
    contextPrompt += '\nCurrent message:\n';
  }
  
  const fullPrompt = contextPrompt + input;
  return await model.generateContent(fullPrompt);
}

/**
 * Main chatbot function
 */
async function startLeanChatbot() {
  // Show banner
  console.log(chalk.blue.bold('\n🤖 Lean AI Chatbot'));
  console.log(chalk.gray('Commands: /exit (save & quit), /clear (clear screen & history)\n'));

  // Initialize components
  const model = await initializeAI();
  const sessionManager = new LeanSessionManager();
  
  // Auto-load previous session
  await sessionManager.autoLoad();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.blue('💬 You: ')
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();

    if (!input) {
      rl.prompt();
      return;
    }

    // Handle /exit command
    if (input === '/exit') {
      console.log(chalk.yellow('🔄 Saving session...'));
      await sessionManager.autoSave();
      console.log(chalk.green('👋 Goodbye!'));
      rl.close();
      return;
    }

    // Handle /clear command
    if (input === '/clear') {
      console.clear();
      sessionManager.clearHistory();
      console.log(chalk.green('🧹 Screen and history cleared'));
      console.log(chalk.blue.bold('\n🤖 Lean AI Chatbot'));
      console.log(chalk.gray('Commands: /exit (save & quit), /clear (clear screen & history)\n'));
      rl.prompt();
      return;
    }

    // Add user message to session
    sessionManager.addMessage('user', input);

    try {
      // Show processing indicator
      process.stdout.write(chalk.yellow('🤔 Processing...\r'));

      // Generate AI response
      const response = await generateResponse(model, input, sessionManager.getConversationHistory());

      // Clear processing indicator
      process.stdout.clearLine();
      process.stdout.cursorTo(0);

      // Add AI response to session
      sessionManager.addMessage('assistant', response);

      // Display response with markdown rendering
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

  rl.on('close', async () => {
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
}

// Start the lean chatbot
startLeanChatbot().catch(error => {
  console.error('❌ Application error:', error.message);
  process.exit(1);
});
