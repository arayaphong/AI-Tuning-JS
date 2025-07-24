#!/usr/bin/env node

import readline from 'readline';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { promises as fs } from 'fs';
import Model from './src/utils/google-ai-integration.js';
import MongoDBIntegration from './src/utils/mongodb-integration.js';
import PostgresIntegration from './src/utils/postgres-integration.js';

dotenv.config();

const SAVE_FILE = './save/last_session.json';
const SAVE_FOLDER = './save';
const MAX_HISTORY_DISPLAY = 10;

class SessionManager {
  #conversationHistory = [];

  constructor() {
    console.log('📝 Session manager initialized');
  }

  addMessage(role, content) {
    this.#conversationHistory.push({
      role,
      content,
      timestamp: new Date().toISOString()
    });
  }

  getConversationHistory() {
    return [...this.#conversationHistory];
  }

  clearHistory() {
    this.#conversationHistory.length = 0;
    console.log(chalk.green('🧹 History cleared'));
  }

  async autoLoad() {
    try {
      const data = await fs.readFile(SAVE_FILE, 'utf8');
      const session = JSON.parse(data);
      this.#conversationHistory = session.conversationHistory ?? [];

      if (this.#conversationHistory.length > 0) {
        console.log(chalk.gray(`📚 Loaded ${this.#conversationHistory.length} previous messages`));
      }
    } catch (error) {
      console.log(chalk.gray('📝 Starting fresh session'));
    }
  }

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

const renderMarkdown = (content) => {
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();

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
      case trimmedLine.startsWith('* '):
        const boldText1 = line.replace(/\*(.*?)\*/g, chalk.bold('$1'));
        console.log(boldText1);
        break;
      case trimmedLine.includes('**'):
        const boldText2 = line.replace(/\*\*(.*?)\*\*/g, chalk.bold('$1'));
        console.log(boldText2);
        break;
      case trimmedLine.startsWith('- ') || trimmedLine.startsWith('* '):
        console.log(chalk.yellow('  •') + ' ' + trimmedLine.substring(2));
        break;
      default:
        console.log(line);
    }
  }
};

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

const generateResponse = async (model, role, input, sessionManager) => {
  try {
    const conversationHistory = sessionManager.getConversationHistory();
    let contextPrompt = await fs.readFile('prompts/main-prompt.txt', 'utf8');

    if (conversationHistory.length > 0) {
      contextPrompt += 'Previous conversation:\n';

      conversationHistory
        .slice(-MAX_HISTORY_DISPLAY)
        .forEach(({ role, content }) => {
          if (role === 'execution') {
            contextPrompt += `${role}: ${JSON.stringify(content)}\n`;
          } else {
            contextPrompt += `${role}: ${content}\n`;
          }
        });

      contextPrompt += `\nCurrent message (${role}) :\n`;
    }

    // Add the latest message to the conversation history
    input = role === 'agent' ? await fs.readFile('prompts/agent-prompt.txt', 'utf8') : input;
    sessionManager.addMessage(role, input);
    return await model.generateContent(contextPrompt + input);
  } catch (error) {
    console.error(chalk.red('🚨 Error generating response:'), error.message);
    throw new Error(`Response generation failed: ${error.message}`);
  }
};

const handleResponseExecution = async (response, sessionManager) => {
  const extractedScript = () => {
    const regex = /```(?:javascript|mongodb)\s*([\s\S]*?)\s*```/;
    const match = response.match(regex);
    return (match && match[1]) ? match[1].trim() : null; // No script found
  };

  const extractedSQL = () => {
    const regex = /```sql\s*([\s\S]*?)\s*```/;
    const match = response.match(regex);
    return (match && match[1]) ? match[1].trim() : null;
  };

  const mongoshEval = extractedScript();
  const sqlQuery = extractedSQL();
  if (!mongoshEval && !sqlQuery) return null; // No execution commands found

  let mongoJson;
  if (mongoshEval) {
    console.log(chalk.yellow('🚀 Executing MongoDB script:', mongoshEval));
    const mongodb = new MongoDBIntegration();
    mongoJson = {
      query: mongoshEval,
      result: await mongodb.mongoshEval(mongoshEval)
    };
    mongodb.close();
  }

  let sqlJson;
  if (sqlQuery) {
    console.log(chalk.yellow('🚀 Executing SQL query:', sqlQuery));
    const postgres = new PostgresIntegration();
    sqlJson = {
      query: sqlQuery,
      result: await postgres.executeQuery(sqlQuery)
    };
  }

  let resultJson = {};
  if (mongoJson) {
    resultJson.mongodb = mongoJson;
  }
  if (sqlJson) {
    resultJson.postgres = sqlJson;
  }

  // Log the execution interaction
  sessionManager.addMessage('execution', resultJson);

  console.log(chalk.gray(JSON.stringify(resultJson, null, 2)));
  console.log(chalk.green('✅ Database query execution successfully'));
  console.log();

  return resultJson;
};

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

  rl.on('line', async (line) => {
    const input = line.trim();

    if (!input) {
      rl.prompt();
      return;
    }

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

    try {
      process.stdout.write(chalk.yellow('🤔 Processing...\r'));

      let response = await generateResponse(model, 'user', input, sessionManager);
      while (await handleResponseExecution(response, sessionManager)) {
        response = await generateResponse(model, 'agent', null, sessionManager); // Agent asks follow-up
      }

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
    console.log(chalk.green('\n👋 Chat ended gracefully.'));
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log(chalk.yellow('\n🔄 Saving current session...'));
    await sessionManager.autoSave();
    console.log(chalk.green('👋 Goodbye!'));
    rl.close();
  });
};

startChatbot().catch(error => {
  console.error(chalk.red('❌ Application error:'), error.message);
  console.error(chalk.gray('Stack trace:'), error.stack);
  process.exit(1);
});
