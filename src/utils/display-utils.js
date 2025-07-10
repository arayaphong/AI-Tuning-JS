/**
 * Display utilitie  console.log(chalk.white(`💬 Messages: ${info.messageCount}`));
  console.log(chalk.gray(`📅 Created: ${new Date(info.metadata.createdAt).toLocaleString()}`));
  console.log(chalk.gray(`🕒 Last Modified: ${new Date(info.metadata.lastModified).toLocaleString()}`));
  
  // Show autosave status
  console.log(chalk.gray(` Save on exit: ${info.autoSaveOnExit ? 'enabled' : 'disabled'}`));
  
  if (info.hasUnsavedChanges) {
    console.log(chalk.yellow('⚠️  Unsaved changes - use /save <n> to save'));
  }ession information, analytics, and conversation data
 * Handles the presentation of session-related information and statistics
 */

import chalk from 'chalk';

/**
 * Display current session information
 * @param {SessionManager} sessionManager - The session manager instance
 */
export async function displaySessionInfo(sessionManager) {
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
 * @param {SessionManager} sessionManager - The session manager instance
 */
export async function displayConversationHistory(sessionManager) {
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
 * @param {Array} results - Search results from session manager
 * @param {string} query - The search query
 */
export async function displaySearchResults(results, query) {
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
 * @param {SessionManager} sessionManager - The session manager instance
 */
export async function displayAnalytics(sessionManager) {
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
 * Show system info on startup
 */
export async function showSystemInfo() {
  const os = await import('os');
  console.log(chalk.gray(`System: ${os.type()} ${os.release()}`));
  console.log(chalk.gray(`Platform: ${os.platform()} ${os.arch()}`));
  console.log(chalk.gray(`Node.js: ${process.version}\n`));
}
