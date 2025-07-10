#!/usr/bin/env node

/**
 * AutoSave Feature Demo
 * Demonstrates the new autosave functionality for session management
 */

import { SessionManager } from '../src/utils/session-manager.js';
import chalk from 'chalk';

async function demoAutoSave() {
  console.log(chalk.cyan.bold('🎯 AutoSave Feature Demo\n'));

  console.log(chalk.yellow('This demo shows how the new /autosave feature works:'));
  console.log(chalk.yellow('1. Auto-saves sessions when you exit the chat'));
  console.log(chalk.yellow('2. Auto-loads your last session when starting a new chat'));
  console.log(chalk.yellow('3. Provides seamless conversation continuity\n'));

  const sessionManager = new SessionManager();
  await sessionManager.initialize();

  // Demonstrate enabling autosave
  console.log(chalk.blue('🔧 Enabling autosave feature...'));
  sessionManager.setAutoSave(true, true);
  console.log();

  // Simulate a conversation
  console.log(chalk.blue('💬 Simulating a conversation...'));
  sessionManager.addMessage('user', 'What is machine learning?');
  sessionManager.addMessage('assistant', 'Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed.');
  sessionManager.addMessage('user', 'Can you give me an example?');
  sessionManager.addMessage('assistant', 'Sure! A common example is email spam filtering. The system learns from examples of spam and legitimate emails to automatically classify new incoming emails.');
  
  console.log(chalk.gray('  Added 4 messages to conversation'));
  console.log();

  // Demonstrate save on exit
  console.log(chalk.blue('🚪 Simulating chat exit (auto-save on exit)...'));
  const saved = await sessionManager.saveOnExit();
  console.log(chalk.gray(`  Auto-save result: ${saved ? 'Success' : 'Failed'}`));
  console.log(chalk.gray(`  Session saved as: ${sessionManager.currentSessionName}`));
  console.log();

  // Demonstrate clearing session (like starting fresh)
  console.log(chalk.blue('🆕 Simulating new chat session (clearing current)...'));
  sessionManager.clearSession();
  console.log(chalk.gray('  Session cleared - no conversation history'));
  console.log();

  // Demonstrate auto-load last session
  console.log(chalk.blue('🔄 Simulating auto-load of last session...'));
  const loaded = await sessionManager.loadLastSession();
  const info = sessionManager.getSessionInfo();
  console.log(chalk.gray(`  Auto-load result: ${loaded ? 'Success' : 'Failed'}`));
  console.log(chalk.gray(`  Messages restored: ${info.messageCount}`));
  console.log(chalk.gray(`  Session name: ${info.currentSessionName}`));
  console.log();

  // Show session info
  console.log(chalk.blue('ℹ️  Current session status:'));
  console.log(chalk.gray(`  Auto-save enabled: ${info.autoSaveEnabled}`));
  console.log(chalk.gray(`  Save on exit enabled: ${info.autoSaveOnExit}`));
  console.log(chalk.gray(`  Has unsaved changes: ${info.hasUnsavedChanges}`));
  console.log();

  console.log(chalk.green.bold('✨ Demo completed successfully!'));
  console.log(chalk.yellow('\nTo use this feature in the actual chatbot:'));
  console.log(chalk.cyan('  1. Start the chatbot: npm start'));
  console.log(chalk.cyan('  2. Enable autosave: /autosave on'));
  console.log(chalk.cyan('  3. Have conversations normally'));
  console.log(chalk.cyan('  4. Exit with /exit or Ctrl+C'));
  console.log(chalk.cyan('  5. Start chatbot again - your conversation will be restored!'));
  console.log();
  console.log(chalk.gray('The feature is now active by default when you start the chatbot.'));
}

// Run the demo
demoAutoSave().catch(error => {
  console.error(chalk.red('❌ Demo failed:'), error.message);
  process.exit(1);
});
