/**
 * Session Management Utility for AI-Tuning-JS
 * Handles saving and loading conversation sessions with enhanced features
 * @module session-manager
 */

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

const SAVE_FOLDER = 'save';
const BACKUP_FOLDER = path.join(SAVE_FOLDER, 'backups');

/**
 * Session Manager class for handling conversation persistence with enhanced features
 */
export class SessionManager {
  constructor() {
    this.conversationHistory = [];
    this.currentSessionName = null;
    this.sessionMetadata = {
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      messageCount: 0,
      sessionId: this.generateSessionId()
    };
    this.unsavedChanges = false;
    this.autoSaveOnExit = false; // Property for exit auto-save
    this.exitSaveInProgress = false; // Prevent duplicate exit saves
  }

  /**
   * Generate a unique session ID
   * @returns {string} Unique session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize the session manager and ensure save directory exists
   */
  async initialize() {
    try {
      await fs.mkdir(SAVE_FOLDER, { recursive: true });
      await fs.mkdir(BACKUP_FOLDER, { recursive: true });
      console.log(chalk.gray(`📁 Save directory ready: ./${SAVE_FOLDER}/`));
      console.log(chalk.gray(`📁 Backup directory ready: ./${BACKUP_FOLDER}/`));
    } catch (error) {
      console.warn(chalk.yellow(`⚠️ Could not create save directories: ${error.message}`));
    }
  }

  /**
   * Enable or disable auto-save functionality
   * @param {boolean} saveOnExit - Whether to auto-save when exiting chat
   */
  setAutoSave(saveOnExit = false) {
    this.autoSaveOnExit = saveOnExit;
    
    if (saveOnExit) {
      console.log(chalk.green('✅ Auto-save on exit enabled'));
    } else {
      console.log(chalk.yellow('🔄 Auto-save on exit disabled'));
    }
  }

  /**
   * Add a message to the conversation history
   * @param {string} role - 'user' or 'assistant'
   * @param {string} content - Message content
   * @param {Object} metadata - Additional metadata
   */
  addMessage(role, content, metadata = {}) {
    const message = {
      role,
      content,
      timestamp: new Date().toISOString(),
      messageId: this.generateMessageId(),
      ...metadata
    };

    this.conversationHistory.push(message);
    this.sessionMetadata.messageCount++;
    this.sessionMetadata.lastModified = new Date().toISOString();
    this.unsavedChanges = true;
  }

  /**
   * Generate a unique message ID
   * @returns {string} Unique message ID
   */
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Search through conversation history
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Array} Matching messages
   */
  searchHistory(query, options = {}) {
    const {
      role = null, // 'user' or 'assistant'
      caseSensitive = false,
      exactMatch = false,
      fromDate = null,
      toDate = null
    } = options;

    let results = this.conversationHistory;

    // Filter by role
    if (role) {
      results = results.filter(msg => msg.role === role);
    }

    // Filter by date range
    if (fromDate) {
      results = results.filter(msg => new Date(msg.timestamp) >= new Date(fromDate));
    }
    if (toDate) {
      results = results.filter(msg => new Date(msg.timestamp) <= new Date(toDate));
    }

    // Search content
    const searchQuery = caseSensitive ? query : query.toLowerCase();
    results = results.filter(msg => {
      const content = caseSensitive ? msg.content : msg.content.toLowerCase();
      return exactMatch ? content === searchQuery : content.includes(searchQuery);
    });

    return results;
  }

  /**
   * Get conversation analytics
   * @returns {Object} Analytics data
   */
  getAnalytics() {
    const totalMessages = this.conversationHistory.length;
    const userMessages = this.conversationHistory.filter(msg => msg.role === 'user').length;
    const assistantMessages = this.conversationHistory.filter(msg => msg.role === 'assistant').length;

    // Calculate conversation duration
    const firstMessage = this.conversationHistory[0];
    const lastMessage = this.conversationHistory[this.conversationHistory.length - 1];
    const duration = firstMessage && lastMessage ? 
      new Date(lastMessage.timestamp) - new Date(firstMessage.timestamp) : 0;

    // Average message length
    const totalLength = this.conversationHistory.reduce((sum, msg) => sum + msg.content.length, 0);
    const avgMessageLength = totalMessages > 0 ? Math.round(totalLength / totalMessages) : 0;

    // Most active hours
    const hourCounts = {};
    this.conversationHistory.forEach(msg => {
      const hour = new Date(msg.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const mostActiveHour = Object.keys(hourCounts).reduce((a, b) => 
      hourCounts[a] > hourCounts[b] ? a : b, '0');

    return {
      totalMessages,
      userMessages,
      assistantMessages,
      conversationDuration: duration,
      averageMessageLength: avgMessageLength,
      mostActiveHour: parseInt(mostActiveHour),
      createdAt: this.sessionMetadata.createdAt,
      lastModified: this.sessionMetadata.lastModified
    };
  }

  /**
   * Export conversation in different formats
   * @param {string} format - Export format ('json', 'markdown', 'txt', 'csv')
   * @param {string} fileName - Optional custom filename
   * @returns {Promise<string>} File path of exported conversation
   */
  async exportConversation(format = 'json', fileName = null) {
    if (!fileName) {
      const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp
      const sessionName = this.currentSessionName || 'unsaved_session';
      fileName = `${sessionName}_export_${timestamp}.${format}`;
    }

    const filePath = path.join(SAVE_FOLDER, fileName);
    let content = '';

    switch (format.toLowerCase()) {
      case 'markdown':
        content = this.exportToMarkdown();
        break;
      case 'txt':
        content = this.exportToText();
        break;
      case 'csv':
        content = this.exportToCSV();
        break;
      case 'json':
      default:
        content = JSON.stringify({
          metadata: this.sessionMetadata,
          conversationHistory: this.conversationHistory,
          analytics: this.getAnalytics(),
          exportedAt: new Date().toISOString()
        }, null, 2);
        break;
    }

    try {
      await fs.writeFile(filePath, content, 'utf8');
      console.log(chalk.green(`✅ Conversation exported successfully!`));
      console.log(chalk.gray(`   Format: ${format.toUpperCase()}`));
      console.log(chalk.gray(`   File: ${filePath}`));
      return filePath;
    } catch (error) {
      console.error(chalk.red(`❌ Failed to export conversation: ${error.message}`));
      throw error;
    }
  }

  /**
   * Export conversation to Markdown format
   * @returns {string} Markdown content
   */
  exportToMarkdown() {
    const analytics = this.getAnalytics();
    let content = `# Conversation Export\n\n`;
    
    content += `**Session:** ${this.currentSessionName || 'Unsaved Session'}\n`;
    content += `**Created:** ${new Date(this.sessionMetadata.createdAt).toLocaleString()}\n`;
    content += `**Messages:** ${analytics.totalMessages}\n`;
    content += `**Duration:** ${Math.round(analytics.conversationDuration / 60000)} minutes\n\n`;
    
    content += `---\n\n`;

    this.conversationHistory.forEach((message, index) => {
      const timestamp = new Date(message.timestamp).toLocaleTimeString();
      const role = message.role === 'user' ? '👤 User' : '🤖 Assistant';
      
      content += `## ${role} (${timestamp})\n\n`;
      content += `${message.content}\n\n`;
    });

    return content;
  }

  /**
   * Export conversation to plain text format
   * @returns {string} Text content
   */
  exportToText() {
    let content = `CONVERSATION EXPORT\n`;
    content += `==================\n\n`;
    content += `Session: ${this.currentSessionName || 'Unsaved Session'}\n`;
    content += `Created: ${new Date(this.sessionMetadata.createdAt).toLocaleString()}\n`;
    content += `Messages: ${this.conversationHistory.length}\n\n`;

    this.conversationHistory.forEach((message, index) => {
      const timestamp = new Date(message.timestamp).toLocaleString();
      const role = message.role.toUpperCase();
      
      content += `[${timestamp}] ${role}:\n`;
      content += `${message.content}\n\n`;
      content += `-`.repeat(50) + `\n\n`;
    });

    return content;
  }

  /**
   * Export conversation to CSV format
   * @returns {string} CSV content
   */
  exportToCSV() {
    let content = 'Timestamp,Role,Content,MessageID\n';
    
    this.conversationHistory.forEach(message => {
      const escapedContent = `"${message.content.replace(/"/g, '""')}"`;
      content += `${message.timestamp},${message.role},${escapedContent},${message.messageId}\n`;
    });

    return content;
  }

  /**
   * Create a backup of the current session
   * @returns {Promise<string>} Backup file path
   */
  async createBackup() {
    if (this.conversationHistory.length === 0) {
      console.log(chalk.yellow('⚠️ No conversation to backup'));
      return null;
    }

    const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp
    const sessionName = this.currentSessionName || 'unsaved_session';
    const backupFileName = `${sessionName}_backup_${timestamp}.json`;
    const backupPath = path.join(BACKUP_FOLDER, backupFileName);

    const backupData = {
      metadata: {
        ...this.sessionMetadata,
        backupCreatedAt: new Date().toISOString(),
        originalSessionName: this.currentSessionName
      },
      conversationHistory: this.conversationHistory
    };

    try {
      await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2), 'utf8');
      console.log(chalk.green(`✅ Backup created: ${backupFileName}`));
      return backupPath;
    } catch (error) {
      console.error(chalk.red(`❌ Failed to create backup: ${error.message}`));
      return null;
    }
  }

  /**
   * Initialize session from backup
   * @param {string} backupFileName - Backup file name (without extension)
   * @returns {Promise<boolean>} Success status
   */
  async initFromBackup(backupFileName) {
    if (!backupFileName || backupFileName.trim() === '') {
      throw new Error('Backup file name cannot be empty');
    }

    const backupFilePath = path.join(BACKUP_FOLDER, `${backupFileName}.json`);

    try {
      const fileContent = await fs.readFile(backupFilePath, 'utf8');
      const backupData = JSON.parse(fileContent);

      // Validate backup data structure
      if (!backupData.conversationHistory || !Array.isArray(backupData.conversationHistory)) {
        throw new Error('Invalid backup data format');
      }

      // Initialize the session
      this.conversationHistory = backupData.conversationHistory;
      this.sessionMetadata = backupData.metadata || this.sessionMetadata;
      this.currentSessionName = backupData.metadata?.sessionName || backupFileName;

      console.log(chalk.green(`✅ Session initialized from backup successfully!`));
      console.log(chalk.gray(`   File: ${backupFilePath}`));
      console.log(chalk.gray(`   Original name: ${backupData.metadata?.originalName || backupFileName}`));
      console.log(chalk.gray(`   Messages: ${this.conversationHistory.length}`));
      console.log(chalk.gray(`   Created: ${backupData.metadata?.createdAt || 'Unknown'}`));
      console.log(chalk.gray(`   Last modified: ${backupData.metadata?.lastModified || 'Unknown'}`));

      return true;
    } catch (error) {
      console.error(chalk.red(`❌ Failed to initialize session from backup: ${error.message}`));
      return false;
    }
  }

  /**
   * Save current session to file
   * @param {string} sessionName - Name of the session to save
   * @returns {Promise<boolean>} Success status
   */
  async saveSession(sessionName) {
    if (!sessionName || sessionName.trim() === '') {
      throw new Error('Session name cannot be empty');
    }

    // Sanitize session name for file system
    const sanitizedName = sessionName.replace(/[^a-zA-Z0-9\-_]/g, '_');
    const fileName = `${sanitizedName}.json`;
    const filePath = path.join(SAVE_FOLDER, fileName);

    const sessionData = {
      metadata: {
        ...this.sessionMetadata,
        sessionName: sanitizedName,
        originalName: sessionName,
        savedAt: new Date().toISOString()
      },
      conversationHistory: this.conversationHistory
    };

    try {
      await fs.writeFile(filePath, JSON.stringify(sessionData, null, 2), 'utf8');
      this.currentSessionName = sanitizedName;
      this.unsavedChanges = false; // Clear unsaved changes flag
      
      console.log(chalk.green(`✅ Session saved successfully!`));
      console.log(chalk.gray(`   File: ${filePath}`));
      console.log(chalk.gray(`   Messages: ${this.conversationHistory.length}`));
      console.log(chalk.gray(`   Size: ${JSON.stringify(sessionData).length} bytes`));
      
      return true;
    } catch (error) {
      console.error(chalk.red(`❌ Failed to save session: ${error.message}`));
      return false;
    }
  }

  /**
   * Load session from file
   * @param {string} sessionName - Name of the session to load
   * @returns {Promise<boolean>} Success status
   */
  async loadSession(sessionName) {
    if (!sessionName || sessionName.trim() === '') {
      throw new Error('Session name cannot be empty');
    }

    // Try both the sanitized name and original name
    const possibleNames = [
      sessionName,
      sessionName.replace(/[^a-zA-Z0-9\-_]/g, '_')
    ];

    let sessionData = null;
    let loadedFrom = null;

    for (const name of possibleNames) {
      const fileName = `${name}.json`;
      const filePath = path.join(SAVE_FOLDER, fileName);

      try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        sessionData = JSON.parse(fileContent);
        loadedFrom = filePath;
        break;
      } catch (error) {
        // Continue trying other names
        continue;
      }
    }

    if (!sessionData) {
      console.error(chalk.red(`❌ Session "${sessionName}" not found`));
      await this.listAvailableSessions();
      return false;
    }

    try {
      // Validate session data structure
      if (!sessionData.conversationHistory || !Array.isArray(sessionData.conversationHistory)) {
        throw new Error('Invalid session data format');
      }

      // Load the session
      this.conversationHistory = sessionData.conversationHistory;
      this.sessionMetadata = sessionData.metadata || this.sessionMetadata;
      this.currentSessionName = sessionData.metadata?.sessionName || sessionName;
      this.unsavedChanges = false; // Clear unsaved changes flag when loading

      console.log(chalk.green(`✅ Session loaded successfully!`));
      console.log(chalk.gray(`   File: ${loadedFrom}`));
      console.log(chalk.gray(`   Original name: ${sessionData.metadata?.originalName || sessionName}`));
      console.log(chalk.gray(`   Messages: ${this.conversationHistory.length}`));
      console.log(chalk.gray(`   Created: ${sessionData.metadata?.createdAt || 'Unknown'}`));
      console.log(chalk.gray(`   Last modified: ${sessionData.metadata?.lastModified || 'Unknown'}`));

      return true;
    } catch (error) {
      console.error(chalk.red(`❌ Failed to load session: ${error.message}`));
      return false;
    }
  }

  /**
   * List all available sessions
   */
  async listAvailableSessions() {
    try {
      const files = await fs.readdir(SAVE_FOLDER);
      const sessionFiles = files.filter(file => file.endsWith('.json'));

      if (sessionFiles.length === 0) {
        console.log(chalk.yellow('📝 No saved sessions found.'));
        return;
      }

      console.log(chalk.cyan.bold('\n📝 Available Sessions:'));
      console.log(chalk.gray('─'.repeat(50)));

      for (const file of sessionFiles) {
        const sessionName = path.basename(file, '.json');
        const filePath = path.join(SAVE_FOLDER, file);
        
        try {
          const stats = await fs.stat(filePath);
          const content = await fs.readFile(filePath, 'utf8');
          const sessionData = JSON.parse(content);
          
          const messageCount = sessionData.conversationHistory?.length || 0;
          const originalName = sessionData.metadata?.originalName || sessionName;
          const lastModified = new Date(stats.mtime).toLocaleString();
          
          console.log(chalk.white(`📄 ${originalName}`));
          console.log(chalk.gray(`   File: ${sessionName}.json`));
          console.log(chalk.gray(`   Messages: ${messageCount}`));
          console.log(chalk.gray(`   Modified: ${lastModified}`));
          console.log();
        } catch (error) {
          console.log(chalk.white(`📄 ${sessionName}`));
          console.log(chalk.red(`   Error reading file: ${error.message}`));
          console.log();
        }
      }
    } catch (error) {
      console.error(chalk.red(`❌ Error listing sessions: ${error.message}`));
    }
  }

  /**
   * Delete a session file
   * @param {string} sessionName - Name of the session to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteSession(sessionName) {
    if (!sessionName || sessionName.trim() === '') {
      throw new Error('Session name cannot be empty');
    }

    const sanitizedName = sessionName.replace(/[^a-zA-Z0-9\-_]/g, '_');
    const fileName = `${sanitizedName}.json`;
    const filePath = path.join(SAVE_FOLDER, fileName);

    try {
      await fs.unlink(filePath);
      console.log(chalk.green(`✅ Session "${sessionName}" deleted successfully!`));
      
      // Clear current session if it was the deleted one
      if (this.currentSessionName === sanitizedName) {
        this.clearSession();
      }
      
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.error(chalk.red(`❌ Session "${sessionName}" not found`));
      } else {
        console.error(chalk.red(`❌ Failed to delete session: ${error.message}`));
      }
      return false;
    }
  }

  /**
   * Clear current session without saving
   */
  clearSession() {
    this.conversationHistory = [];
    this.currentSessionName = null;
    this.sessionMetadata = {
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      messageCount: 0,
      sessionId: this.generateSessionId()
    };
    this.unsavedChanges = false;
    console.log(chalk.yellow('🧹 Current session cleared'));
  }

  /**
   * Get conversation history for context
   * @param {number} lastN - Number of recent messages to include (0 for all)
   * @returns {Array} Conversation history
   */
  getConversationHistory(lastN = 0) {
    if (lastN === 0) {
      return this.conversationHistory;
    }
    return this.conversationHistory.slice(-lastN);
  }

  /**
   * Get session info
   * @returns {Object} Session information
   */
  getSessionInfo() {
    return {
      currentSessionName: this.currentSessionName,
      messageCount: this.conversationHistory.length,
      metadata: this.sessionMetadata,
      hasUnsavedChanges: this.unsavedChanges,
      autoSaveOnExit: this.autoSaveOnExit
    };
  }

  /**
   * Get the most recently modified session file
   * @returns {Promise<string|null>} The name of the last session or null if none found
   */
  async getLastSession() {
    try {
      const files = await fs.readdir(SAVE_FOLDER);
      const sessionFiles = files.filter(file => file.endsWith('.json') && !file.includes('backup'));
      
      if (sessionFiles.length === 0) {
        return null;
      }

      let lastSession = null;
      let lastModified = 0;

      for (const file of sessionFiles) {
        const filePath = path.join(SAVE_FOLDER, file);
        try {
          const stats = await fs.stat(filePath);
          
          // Check if file is not empty and has valid content
          if (stats.size > 0) {
            const content = await fs.readFile(filePath, 'utf8');
            const sessionData = JSON.parse(content);
            
            // Validate that it has the expected structure
            if (sessionData.conversationHistory && Array.isArray(sessionData.conversationHistory)) {
              if (stats.mtime.getTime() > lastModified) {
                lastModified = stats.mtime.getTime();
                lastSession = path.basename(file, '.json');
              }
            }
          }
        } catch (error) {
          // Skip files that can't be read or parsed
          console.warn(chalk.yellow(`⚠️ Skipping invalid session file: ${file}`));
          continue;
        }
      }

      return lastSession;
    } catch (error) {
      console.warn(chalk.yellow(`⚠️ Could not find last session: ${error.message}`));
      return null;
    }
  }

  /**
   * Auto-save session on exit if enabled and has content
   * @returns {Promise<boolean>} Success status
   */
  async saveOnExit() {
    // Prevent duplicate saves during exit process
    if (this.exitSaveInProgress) {
      return false;
    }

    if (!this.autoSaveOnExit) {
      return false;
    }

    if (this.conversationHistory.length === 0) {
      console.log(chalk.gray('📝 No conversation to save on exit'));
      return false;
    }

    this.exitSaveInProgress = true;

    try {
      // If no current session name, create one with timestamp
      if (!this.currentSessionName) {
        const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp
        this.currentSessionName = `auto_save_${timestamp}`;
      }

      console.log(chalk.cyan('💾 Auto-saving session on exit...'));
      const saved = await this.saveSession(this.currentSessionName);
      
      if (saved) {
        console.log(chalk.green(`✅ Session auto-saved as: ${this.currentSessionName}`));
      }
      
      return saved;
    } catch (error) {
      console.error(chalk.red(`❌ Error saving on exit: ${error.message}`));
      return false;
    } finally {
      this.exitSaveInProgress = false;
    }
  }

  /**
   * Load the last session automatically on startup
   * @returns {Promise<boolean>} Success status
   */
  async loadLastSession() {
    const lastSessionName = await this.getLastSession();
    if (!lastSessionName) {
      console.log(chalk.gray('📝 No previous session found to auto-load'));
      return false;
    }

    console.log(chalk.cyan(`🔄 Auto-loading last session: ${lastSessionName}`));
    
    try {
      // Load session directly without calling listAvailableSessions on failure
      const fileName = `${lastSessionName}.json`;
      const filePath = path.join(SAVE_FOLDER, fileName);
      
      const fileContent = await fs.readFile(filePath, 'utf8');
      const sessionData = JSON.parse(fileContent);
      
      // Validate session data structure
      if (!sessionData.conversationHistory || !Array.isArray(sessionData.conversationHistory)) {
        throw new Error('Invalid session data format');
      }

      // Load the session
      this.conversationHistory = sessionData.conversationHistory;
      this.sessionMetadata = sessionData.metadata || this.sessionMetadata;
      this.currentSessionName = sessionData.metadata?.sessionName || lastSessionName;
      this.unsavedChanges = false;

      console.log(chalk.green('✅ Last session loaded automatically'));
      console.log(chalk.gray(`   Messages restored: ${this.conversationHistory.length}`));
      console.log(chalk.gray(`   Session: ${this.currentSessionName}`));
      
      return true;
    } catch (error) {
      console.warn(chalk.yellow(`⚠️ Error loading last session: ${error.message}`));
      console.log(chalk.gray('📝 Starting with a fresh session'));
      return false;
    }
  }

  /**
   * Load the last session automatically if autosave is enabled (for exit saving context)
   * @returns {Promise<boolean>} Success status
   */
  async loadLastSessionIfAutosaveEnabled() {
    if (!this.autoSaveOnExit) {
      return false;
    }
    return await this.loadLastSession();
  }
}