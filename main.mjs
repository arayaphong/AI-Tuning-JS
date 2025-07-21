#!/usr/bin/env node

import readline from 'readline';
import chalk from 'chalk';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import Model from './src/utils/google-ai-model.js';

dotenv.config();

const SAVE_FILE = './save/last_session.json';
const SAVE_FOLDER = './save';

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

function renderMarkdown(content) {
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('# ')) {
      console.log(chalk.blue.bold(trimmedLine.substring(2)));
    } else if (trimmedLine.startsWith('## ')) {
      console.log(chalk.cyan.bold(trimmedLine.substring(3)));
    } else if (trimmedLine.startsWith('### ')) {
      console.log(chalk.green.bold(trimmedLine.substring(4)));
    }
    else if (trimmedLine.startsWith('```')) {
      console.log(chalk.gray(line));
    }
    else if (trimmedLine.includes('**')) {
      const boldText = line.replace(/\*\*(.*?)\*\*/g, chalk.bold('$1'));
      console.log(boldText);
    }
    else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      console.log(chalk.yellow('  •') + ' ' + trimmedLine.substring(2));
    }
    else {
      console.log(line);
    }
  }
}

async function initializeAI() {
  try {
    return new Model();
  } catch (error) {
    console.error(chalk.red('❌ Failed to initialize AI:'), error.message);
    process.exit(1);
  }
}

async function generateResponse(model, input, conversationHistory) {
  let contextPrompt = '';
  if (conversationHistory.length > 0) {
    contextPrompt = 'Previous conversation:\n';
    conversationHistory.slice(-10).forEach(msg => {
      contextPrompt += `${msg.role}: ${msg.content}\n`;
    });
    contextPrompt += '\nCurrent message:\n';
  }
  
  const fullPrompt = contextPrompt + input;
  return await model.generateContent(fullPrompt);
}

async function startLeanChatbot() {
  console.log(chalk.blue.bold('\n🤖 Lean AI Chatbot'));
  console.log(chalk.gray('Commands: /exit (save & quit), /clear (clear screen & history)\n'));

  const model = await initializeAI();
  const sessionManager = new LeanSessionManager();
  
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

    if (input === '/exit') {
      console.log(chalk.yellow('🔄 Saving session...'));
      await sessionManager.autoSave();
      console.log(chalk.green('👋 Goodbye!'));
      rl.close();
      return;
    }

    if (input === '/clear') {
      console.clear();
      sessionManager.clearHistory();
      console.log(chalk.green('🧹 Screen and history cleared'));
      console.log(chalk.blue.bold('\n🤖 Lean AI Chatbot'));
      console.log(chalk.gray('Commands: /exit (save & quit), /clear (clear screen & history)\n'));
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

  rl.on('close', async () => {
    await sessionManager.autoSave();
    console.log(chalk.green('\n👋 Chat ended.'));
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log(chalk.yellow('\n🔄 Saving current session...'));
    await sessionManager.autoSave();
    console.log(chalk.green('👋 Goodbye!'));
    rl.close();
  });
}

startLeanChatbot().catch(error => {
  console.error('❌ Application error:', error.message);
  process.exit(1);
});
