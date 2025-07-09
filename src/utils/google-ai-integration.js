import { VertexAI } from '@google-cloud/vertexai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import si from 'systeminformation';
import chalk from 'chalk';
import { MongoMCPClient, formatBytes } from './mongodb-mcp-integration.js';

const execAsync = promisify(exec);

// MongoDB MCP client instance
let mongoMCP = null;

/**
 * RELIABLE SHELL COMMAND SYSTEM - NO FUNCTION CALLING
 * This approach uses keyword detection and direct shell execution
 */

// Shell command implementations
export const shellCommands = {
  async getSystemInfo(type = 'all') {
    let info = '';
    try {
      if (type === 'all' || type === 'memory') {
        const mem = await si.mem();
        const totalMem = mem.total;
        const freeMem = mem.available;
        const usedMem = mem.active;
        info += `💾 Memory Information:\n`;
        info += `   Total: ${formatBytes(totalMem)}\n`;
        info += `   Used: ${formatBytes(usedMem)}\n`;
        info += `   Free: ${formatBytes(freeMem)}\n`;
        info += `   Usage: ${((usedMem / totalMem) * 100).toFixed(1)}%\n\n`;
      }

      if (type === 'all' || type === 'cpu') {
        const cpu = await si.cpu();
        const cpuInfo = await si.currentLoad();
        info += `🖥️ CPU Information:\n`;
        info += `   Model: ${cpu.manufacturer} ${cpu.brand}\n`;
        info += `   Cores: ${cpu.cores}\n`;
        info += `   Speed: ${cpu.speed} GHz\n`;
        info += `   Load: ${cpuInfo.currentLoad.toFixed(1)}%\n\n`;
      }

      if (type === 'all' || type === 'os') {
        const osInfo = await si.osInfo();
        const uptime = await si.time();
        info += `🖥️ Operating System Information:\n`;
        info += `   OS: ${osInfo.distro} ${osInfo.release}\n`;
        info += `   Platform: ${osInfo.platform} ${osInfo.arch}\n`;
        info += `   Uptime: ${Math.floor(uptime.uptime / 60)} minutes\n\n`;
      }

      return info;
    } catch (error) {
      return `❌ Error getting system info: ${error.message}`;
    }
  },

  async listFiles(dirPath = '.', showHidden = false) {
    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      
      let result = `📁 Contents of ${path.resolve(dirPath)}:\n\n`;
      
      for (const file of files) {
        if (!showHidden && file.name.startsWith('.')) continue;
        
        const icon = file.isDirectory() ? '📁' : '📄';
        const size = file.isFile() ? await getFileSize(path.join(dirPath, file.name)) : '';
        result += `${icon} ${file.name} ${size}\n`;
      }
      
      return result;
    } catch (error) {
      return `❌ Error listing files: ${error.message}`;
    }
  },

  async executeCommand(command) {
    const safeCommands = [
      'ls', 'pwd', 'date', 'whoami', 'uname', 'df', 'du', 'ps',
      'git', 'npm', 'node', 'cat', 'head', 'tail', 'grep', 'find'
    ];
    
    const commandParts = command.trim().split(' ');
    const baseCommand = commandParts[0];
    
    if (!safeCommands.includes(baseCommand)) {
      return `❌ Command "${baseCommand}" not allowed. Safe commands: ${safeCommands.join(', ')}`;
    }
    
    try {
      const { stdout, stderr } = await execAsync(command, { 
        timeout: 10000,
        maxBuffer: 1024 * 1024 
      });
      
      return `✅ Command: ${command}\n${stdout}${stderr ? `\nWarnings: ${stderr}` : ''}`;
    } catch (error) {
      return `❌ Command failed: ${error.message}`;
    }
  },

  async getGitInfo(action = 'status') {
    try {
      let command;
      switch (action) {
        case 'status':
          command = 'git status --porcelain';
          break;
        case 'log':
          command = 'git log --oneline -5';
          break;
        case 'branch':
          command = 'git branch -a';
          break;
        default:
          return `❌ Unknown git action: ${action}`;
      }
      
      const { stdout, stderr } = await execAsync(command, { timeout: 10000 });
      
      return `🔄 Git ${action}:\n${stdout || 'No output'}`;
    } catch (error) {
      return `❌ Git command failed: ${error.message}`;
    }
  }
};

// Helper functions
async function getFileSize(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile() ? `(${formatBytes(stats.size)})` : '';
  } catch {
    return '';
  }
}

/**
 * Process user input and execute shell commands based on keywords
 * Enhanced with MongoDB command detection
 */
async function processShellCommands(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  let shellResults = [];
  
  // Memory information
  if (lowerPrompt.includes('memory') || lowerPrompt.includes('ram')) {
    console.log('🔧 Detected: memory request');
    const result = await shellCommands.getSystemInfo('memory');
    shellResults.push(`MEMORY INFO:\n${result}`);
  }

  // CPU information
  if (lowerPrompt.includes('cpu') || lowerPrompt.includes('processor')) {
    console.log('🔧 Detected: CPU request');
    const result = await shellCommands.getSystemInfo('cpu');
    shellResults.push(`CPU INFO:\n${result}`);
  }

  // System information
  if (lowerPrompt.includes('system')) {
    console.log('🔧 Detected: system info request');
    const result = await shellCommands.getSystemInfo('all');
    shellResults.push(`SYSTEM INFO:\n${result}`);
  }

  // Operating system information
  if (lowerPrompt.includes('os') || lowerPrompt.includes('operating system')) {
    console.log('🔧 Detected: OS info request');
    const result = await shellCommands.getSystemInfo('os');
    shellResults.push(`OS INFO:\n${result}`);
  }

  // Time/date information
  if (lowerPrompt.includes('time') || lowerPrompt.includes('date')) {
    console.log('🔧 Detected: time/date request');
    const result = await shellCommands.executeCommand('date');
    shellResults.push(`TIME/DATE INFO:\n${result}`);
  }

  // File listing
  if (lowerPrompt.includes('list files') || lowerPrompt.includes('show files') || 
      lowerPrompt.includes('directory') || lowerPrompt.includes('folder')) {
    console.log('🔧 Detected: file listing request');
    const result = await shellCommands.listFiles();
    shellResults.push(`FILES:\n${result}`);
  }

  // Git operations
  if (lowerPrompt.includes('git status')) {
    console.log('🔧 Detected: git status request');
    const result = await shellCommands.getGitInfo('status');
    shellResults.push(`GIT STATUS:\n${result}`);
  }

  if (lowerPrompt.includes('git log') || lowerPrompt.includes('git commits')) {
    console.log('🔧 Detected: git log request');
    const result = await shellCommands.getGitInfo('log');
    shellResults.push(`GIT LOG:\n${result}`);
  }

  // Command execution - look for patterns like "run pwd" or "execute date"
  const commandMatch = prompt.match(/(?:run|execute|command)\s+(.+)/i);
  if (commandMatch) {
    const command = commandMatch[1].trim();
    console.log(`🔧 Detected: command execution "${command}"`);
    const result = await shellCommands.executeCommand(command);
    shellResults.push(`COMMAND:\n${result}`);
  }

  // MongoDB-specific keyword detection
  if (lowerPrompt.includes('database') || lowerPrompt.includes('mongo') || lowerPrompt.includes('collection')) {
    console.log('🔧 Detected: MongoDB request');
    
    if (lowerPrompt.includes('list databases') || lowerPrompt.includes('show databases')) {
      const result = await mongoCommands.listDatabases();
      shellResults.push(`MONGO DATABASES:\n${result}`);
    }
    
    else if (lowerPrompt.includes('collections')) {
      const dbMatch = prompt.match(/(?:in|from)\s+database[s]?\s+(\w+)/i) || 
                     prompt.match(/database[s]?\s+(\w+)\s+collections/i) ||
                     prompt.match(/collections\s+(?:in|from)\s+(\w+)/i);
      const database = dbMatch ? dbMatch[1] : 'ai_tuning';
      const result = await mongoCommands.listCollections(database);
      shellResults.push(`MONGO COLLECTIONS:\n${result}`);
    }
    
    else if (lowerPrompt.includes('schema')) {
      const collectionMatch = prompt.match(/schema\s+(?:for\s+)?(\w+)/i) ||
                             prompt.match(/(\w+)\s+schema/i);
      const collection = collectionMatch ? collectionMatch[1] : 'training_data';
      const result = await mongoCommands.getCollectionSchema(collection);
      shellResults.push(`MONGO SCHEMA:\n${result}`);
    }
    
    else if (lowerPrompt.includes('find') || lowerPrompt.includes('search')) {
      const collectionMatch = prompt.match(/(?:in|from)\s+(\w+)/i) ||
                             prompt.match(/find\s+(\w+)/i) ||
                             prompt.match(/search\s+(\w+)/i);
      const collection = collectionMatch ? collectionMatch[1] : 'training_data';
      const result = await mongoCommands.findDocuments(collection);
      shellResults.push(`MONGO DOCUMENTS:\n${result}`);
    }
    
    else if (lowerPrompt.includes('count')) {
      const collectionMatch = prompt.match(/count\s+(?:documents\s+)?(?:in\s+)?(\w+)/i) ||
                             prompt.match(/(\w+)\s+count/i);
      const collection = collectionMatch ? collectionMatch[1] : 'training_data';
      const result = await mongoCommands.countDocuments(collection);
      shellResults.push(`MONGO COUNT:\n${result}`);
    }
    
    else if (lowerPrompt.includes('aggregate')) {
      const collectionMatch = prompt.match(/aggregate\s+(?:on\s+)?(\w+)/i) ||
                             prompt.match(/(\w+)\s+aggregate/i);
      const collection = collectionMatch ? collectionMatch[1] : 'training_data';
      const result = await mongoCommands.runAggregation(collection);
      shellResults.push(`MONGO AGGREGATION:\n${result}`);
    }
  }

  return shellResults;
}

/**
 * Initialize Google AI - SIMPLE VERSION (NO TOOLS)
 */
export async function initializeGoogleAI(config = {}) {
  const {
    project,
    location = 'us-central1',
    apiKey,
    vertexModel = 'gemini-2.0-flash-exp',
    apiKeyModel = 'gemini-pro'
  } = config;

  if (!project && !apiKey) {
    throw new Error('No authentication found. Set project or apiKey');
  }

  let model;
  if (project) {
    const vertexAI = new VertexAI({ project, location });
    // SIMPLE MODEL - NO TOOLS
    model = vertexAI.getGenerativeModel({ model: vertexModel });
    console.log('✅ Using Vertex AI with reliable shell commands');
  } else if (apiKey) {
    const client = new GoogleGenerativeAI(apiKey);
    // SIMPLE MODEL - NO TOOLS  
    model = client.getGenerativeModel({ model: apiKeyModel });
    console.log('✅ Using API key with reliable shell commands');
  }

  return model;
}

/**
 * Generate content with shell command detection - RELIABLE VERSION
 */
export async function generateContent(model, prompt, options = {}) {
  if (!model || !prompt) {
    throw new Error('Model and prompt are required');
  }

  try {
    // Execute shell commands first
    const shellResults = await processShellCommands(prompt);
    
    // Build enhanced prompt
    let enhancedPrompt = prompt;
    if (shellResults.length > 0) {
      enhancedPrompt += '\n\n--- SYSTEM DATA ---\n' + shellResults.join('\n\n') + 
                       '\n--- END SYSTEM DATA ---\n\n' +
                       'Please provide a helpful response about the user question using the system data above.';
    }
    
    // Simple generate content call - NO FUNCTION CALLING
    const result = await model.generateContent(enhancedPrompt);
    const response = result.response;
    
    // Handle response safely
    if (response.text && typeof response.text === 'function') {
      return response.text();
    } else if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
      return response.candidates[0].content.parts[0].text;
    } else {
      return 'Response generated but could not extract text';
    }
    
  } catch (error) {
    console.error('Error in generateContent:', error.message);
    throw error;
  }
}

/**
 * List available shell command keywords
 */
export function listShellCommands() {
  console.log('🛠️ Shell Command Keywords:');
  console.log('   💾 Memory: "memory", "ram"');
  console.log('   🖥️  CPU: "cpu", "processor"');
  console.log('   📊 System: "system info"');
  console.log('   📁 Files: "list files", "directory"');
  console.log('   🔄 Git: "git status", "git log"');
  console.log('   ⚙️  Commands: "run <command>", "execute <command>"');
  console.log();
  listMongoCommands();
}

/**
 * Initialize MongoDB MCP client
 * @returns {Promise<MongoMCPClient|null>} The MongoDB MCP client or null if initialization failed
 */
export async function initializeMongoMCP() {
  try {
    mongoMCP = new MongoMCPClient({
      readOnly: process.env.MDB_MCP_READ_ONLY === 'true',
      indexCheck: process.env.MDB_MCP_INDEX_CHECK === 'true'
    });
    
    const success = await mongoMCP.initialize();
    if (!success) {
      console.warn(chalk.yellow('⚠️ MongoDB MCP initialization failed'));
      mongoMCP = null;
    }
    return mongoMCP;
  } catch (error) {
    console.warn(chalk.yellow('⚠️ MongoDB MCP not available:'), error.message);
    return null;
  }
}

/**
 * MongoDB commands implementation
 */
export const mongoCommands = {
  /**
   * List available databases
   * @returns {Promise<string>} Formatted result
   */
  async listDatabases() {
    if (!mongoMCP || !mongoMCP.connected) return '❌ MongoDB MCP not connected';
    
    try {
      const result = await mongoMCP.executeMongoCommand('mcp_mongo_list-databases');
      
      let output = '📊 Available Databases:\n';
      if (result && result.databases && Array.isArray(result.databases)) {
        result.databases.forEach(db => {
          output += `   - ${db.name} (${formatBytes(db.sizeOnDisk || 0)})\n`;
        });
      } else {
        output += '   No databases found\n';
      }
      return output;
    } catch (error) {
      return `❌ Error listing databases: ${error.message}`;
    }
  },

  /**
   * List collections in a database
   * @param {string} database - Database name
   * @returns {Promise<string>} Formatted result
   */
  async listCollections(database = '') {
    if (!mongoMCP || !mongoMCP.connected) return '❌ MongoDB MCP not connected';
    
    try {
      const result = await mongoMCP.executeMongoCommand('mcp_mongo_list-collections', { database });
      
      let output = `📁 Collections in "${database || 'default'}":\n`;
      if (result && result.collections && Array.isArray(result.collections)) {
        result.collections.forEach(collection => {
          output += `   - ${collection.name} (${collection.type || 'collection'})\n`;
        });
      } else {
        output += '   No collections found\n';
      }
      return output;
    } catch (error) {
      return `❌ Error listing collections: ${error.message}`;
    }
  },

  /**
   * Find documents in a collection
   * @param {string} collection - Collection name
   * @param {string} database - Database name
   * @param {Object} query - Query filter
   * @param {number} limit - Maximum documents to return
   * @returns {Promise<string>} Formatted result
   */
  async findDocuments(collection = 'training_data', database = '', query = {}, limit = 10) {
    if (!mongoMCP || !mongoMCP.connected) return '❌ MongoDB MCP not connected';
    
    try {
      const result = await mongoMCP.executeMongoCommand('mcp_mongo_find', {
        collection,
        database,
        filter: query,
        limit
      });
      
      let output = `🔍 Documents in "${collection}":\n`;
      if (result && result.documents && Array.isArray(result.documents)) {
        if (result.documents.length === 0) {
          output += '   No documents found matching the query\n';
        } else {
          result.documents.forEach((doc, index) => {
            output += `\n   Document ${index + 1}:\n`;
            output += `   ${JSON.stringify(doc, null, 2).replace(/\n/g, '\n   ')}\n`;
          });
          output += `\n   Total: ${result.documents.length} document(s) (limit: ${limit})\n`;
        }
      } else {
        output += '   No documents found\n';
      }
      return output;
    } catch (error) {
      return `❌ Error finding documents: ${error.message}`;
    }
  },

  /**
   * Get schema information for a collection
   * @param {string} collection - Collection name
   * @param {string} database - Database name
   * @returns {Promise<string>} Formatted result
   */
  async getCollectionSchema(collection = 'training_data', database = '') {
    if (!mongoMCP || !mongoMCP.connected) return '❌ MongoDB MCP not connected';
    
    try {
      const result = await mongoMCP.executeMongoCommand('mcp_mongo_collection-schema', { 
        collection,
        database 
      });
      
      let output = `📋 Schema for "${collection}":\n`;
      if (result && result.schema) {
        Object.entries(result.schema).forEach(([field, info]) => {
          const type = typeof info === 'object' ? info.type : info;
          const required = info.required ? ' (required)' : '';
          output += `   - ${field}: ${type}${required}\n`;
        });
      } else {
        output += '   Schema information not available\n';
      }
      return output;
    } catch (error) {
      return `❌ Error getting schema: ${error.message}`;
    }
  },

  /**
   * Count documents in a collection
   * @param {string} collection - Collection name
   * @param {string} database - Database name
   * @param {Object} query - Query filter
   * @returns {Promise<string>} Formatted result
   */
  async countDocuments(collection = 'training_data', database = '', query = {}) {
    if (!mongoMCP || !mongoMCP.connected) return '❌ MongoDB MCP not connected';
    
    try {
      const result = await mongoMCP.executeMongoCommand('mcp_mongo_count', {
        collection,
        database,
        query
      });
      
      return `📊 Document count in "${collection}": ${result.count || 0}`;
    } catch (error) {
      return `❌ Error counting documents: ${error.message}`;
    }
  },

  /**
   * Run aggregation pipeline on a collection
   * @param {string} collection - Collection name
   * @param {Array} pipeline - Aggregation pipeline
   * @returns {Promise<string>} Formatted result
   */
  async runAggregation(collection = 'training_data', pipeline = []) {
    if (!mongoMCP || !mongoMCP.connected) return '❌ MongoDB MCP not connected';
    
    try {
      // Default pipeline to group by metadata type
      if (pipeline.length === 0) {
        pipeline = [
          { $group: { _id: '$metadata.type', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ];
      }

      const result = await mongoMCP.executeMongoCommand('mcp_mongo_aggregate', {
        collection,
        pipeline
      });
      
      let output = `🔄 Aggregation results for "${collection}":\n`;
      if (result && result.results && Array.isArray(result.results)) {
        if (result.results.length === 0) {
          output += '   No results from aggregation\n';
        } else {
          result.results.forEach((doc, index) => {
            output += `\n   Result ${index + 1}:\n`;
            output += `   ${JSON.stringify(doc, null, 2).replace(/\n/g, '\n   ')}\n`;
          });
          output += `\n   Total: ${result.results.length} result(s)\n`;
        }
      } else {
        output += '   No aggregation results\n';
      }
      return output;
    } catch (error) {
      return `❌ Error running aggregation: ${error.message}`;
    }
  }
};

/**
 * List available MongoDB command keywords
 */
export function listMongoCommands() {
  console.log('🗄️ MongoDB Command Keywords:');
  console.log('   📊 Databases: "list databases", "show databases"');
  console.log('   📁 Collections: "collections in database_name"');
  console.log('   📋 Schema: "schema for collection_name"');
  console.log('   🔍 Find: "find in collection_name", "search in collection_name"');
  console.log('   📊 Count: "count documents in collection_name"');
  console.log('   🔄 Aggregate: "aggregate collection_name"');
}