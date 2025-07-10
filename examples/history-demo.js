#!/usr/bin/env node

/**
 * Example demonstrating chat history saving and management features
 * 
 * This example shows how to:
 * - Save conversations with meaningful names
 * - Load previous conversations
 * - Search through chat history
 * - Export conversations in different formats
 * - Use analytics to understand conversation patterns
 */

import { SessionManager } from '../src/utils/session-manager.js';
import chalk from 'chalk';

async function demonstrateHistoryFeatures() {
  console.log(chalk.cyan.bold('🚀 Chat History Features Demo\n'));

  // Initialize session manager
  const sessionManager = new SessionManager();
  await sessionManager.initialize();

  // Simulate a conversation
  console.log(chalk.yellow('📝 Simulating a conversation...'));
  
  sessionManager.addMessage('user', 'Hello! Can you help me with JavaScript promises?');
  sessionManager.addMessage('assistant', 'Of course! JavaScript promises are a way to handle asynchronous operations. They represent a value that may be available now, in the future, or never.');
  
  sessionManager.addMessage('user', 'Can you show me an example?');
  sessionManager.addMessage('assistant', 'Here\'s a simple example:\n\n```javascript\nconst promise = new Promise((resolve, reject) => {\n  setTimeout(() => {\n    resolve("Hello World!");\n  }, 1000);\n});\n\npromise.then(result => {\n  console.log(result); // "Hello World!"\n});\n```');
  
  sessionManager.addMessage('user', 'What about error handling?');
  sessionManager.addMessage('assistant', 'Great question! You can handle errors using .catch() or try/catch with async/await:\n\n```javascript\npromise\n  .then(result => console.log(result))\n  .catch(error => console.error("Error:", error));\n```');

  // Save the conversation
  console.log(chalk.green('\n💾 Saving conversation...'));
  await sessionManager.saveSession('javascript_promises_tutorial');

  // Show session info
  console.log(chalk.blue('\n📊 Session Information:'));
  const info = sessionManager.getSessionInfo();
  console.log(`  Messages: ${info.messageCount}`);
  console.log(`  Session: ${info.currentSessionName}`);

  // Demonstrate search
  console.log(chalk.magenta('\n🔍 Searching for "error"...'));
  const searchResults = sessionManager.searchHistory('error');
  console.log(`Found ${searchResults.length} matching messages:`);
  searchResults.forEach((msg, i) => {
    console.log(`  ${i + 1}. [${msg.role}] ${msg.content.substring(0, 50)}...`);
  });

  // Show analytics
  console.log(chalk.cyan('\n📈 Conversation Analytics:'));
  const analytics = sessionManager.getAnalytics();
  console.log(`  Total messages: ${analytics.totalMessages}`);
  console.log(`  User messages: ${analytics.userMessages}`);
  console.log(`  AI messages: ${analytics.assistantMessages}`);
  console.log(`  Average message length: ${analytics.averageMessageLength} characters`);
  console.log(`  Conversation duration: ${Math.round(analytics.conversationDuration / 1000)} seconds`);

  // Export in different formats
  console.log(chalk.yellow('\n📤 Exporting conversation...'));
  
  try {
    await sessionManager.exportConversation('markdown', 'promises_tutorial.md');
    await sessionManager.exportConversation('json', 'promises_tutorial.json');
    console.log(chalk.green('✅ Exported to markdown and JSON formats'));
  } catch (error) {
    console.error(chalk.red('❌ Export failed:'), error.message);
  }

  // Create backup
  console.log(chalk.hex('#FFA500')('\n🛡️ Creating backup...'));
  await sessionManager.createBackup();

  // List available sessions
  console.log(chalk.hex('#800080')('\n📝 Available sessions:'));
  await sessionManager.listAvailableSessions();

  console.log(chalk.green.bold('\n🎉 Demo completed! Check the save/ folder for exported files.'));
  console.log(chalk.gray('💡 Run "npm start" to try the interactive chatbot with these features.'));
}

// Run the demo
demonstrateHistoryFeatures().catch(error => {
  console.error(chalk.red('❌ Demo failed:'), error.message);
  process.exit(1);
});
