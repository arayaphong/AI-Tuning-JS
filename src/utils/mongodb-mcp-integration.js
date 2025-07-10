/**
 * MongoDB MCP Integration
 * Provides PURE MongoDB Model Context Protocol integration using ONLY the actual MCP tools
 * NO FALLBACK to direct MongoDB connections - TRUE MCP ONLY
 */

import chalk from 'chalk';
import { registerRealMCPTools, isRealDevMode } from './mongodb-mcp-real-dev.js';

/**
 * MongoDB MCP Client class
 * Uses ONLY the actual MCP tools available in the VS Code environment
 * Will fail if MCP tools are not available - no fallbacks
 */
export class MongoMCPClient {
  /**
   * Create a MongoDB MCP client
   * @param {Object} config - Configuration options
   * @param {string} config.connectionString - MongoDB connection string
   * @param {boolean} config.readOnly - Whether to operate in read-only mode
   * @param {boolean} config.indexCheck - Whether to check indexes before operations
   */
  constructor(config = {}) {
    this.config = {
      connectionString: config.connectionString || process.env.MDB_MCP_CONNECTION_STRING,
      readOnly: config.readOnly !== undefined ? config.readOnly : process.env.MDB_MCP_READ_ONLY === 'true',
      indexCheck: config.indexCheck !== undefined ? config.indexCheck : process.env.MDB_MCP_INDEX_CHECK === 'true',
      ...config
    };
    this.isConnected = false;
    this.mcpToolsAvailable = false;
  }

  /**
   * Initialize the MCP client using ONLY actual MCP tools
   * @returns {Promise<boolean>} Success indicator
   */
  async initialize() {
    if (!this.config.connectionString) {
      console.error(chalk.red('❌ MongoDB connection string required. Set MDB_MCP_CONNECTION_STRING environment variable.'));
      return false;
    }

    try {
      console.log(chalk.blue('🔄 Initializing PURE MongoDB MCP integration (TRUE MCP ONLY)...'));
      
      // Check MCP server process status
      await this.checkMCPServerStatus();
      
      // Check for real development mode (connects to actual MongoDB)
      if (isRealDevMode()) {
        console.log(chalk.blue('🔗 Real development mode detected - using actual MongoDB connection'));
        console.log(chalk.green('✅ This will connect to your real MongoDB database'));
        await registerRealMCPTools();
      }
      
      // Check for MCP tools availability
      this.checkMCPToolsAvailability();
      
      if (!this.mcpToolsAvailable) {
        console.error(chalk.red('❌ MCP tools not available. This integration requires TRUE MCP environment.'));
        console.error(chalk.red('   Please ensure you are running in VS Code with MongoDB MCP extension.'));
        console.log(chalk.yellow('💡 Development options:'));
        console.log(chalk.yellow('   - Real DB mode: npm run dev:real'));
        return false;
      }
      
      // Connect using ONLY MCP protocol
      await this.connectViaMCP();
      
      this.isConnected = true;
      console.log(chalk.green('✅ MongoDB MCP client connected using PURE MCP protocol'));
      console.log(chalk.green('🎯 MCP server process: ACTIVE and CONNECTED'));
      
      // Print detailed status report
      this.printMCPServerStatus();
      
      return true;
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to initialize TRUE MCP:'), error.message);
      console.error(chalk.red('   This integration requires actual MCP tools to be available.'));
      console.error(chalk.red('🔌 MCP server process: FAILED or DISCONNECTED'));
      return false;
    }
  }

  /**
   * Check if TRUE MCP tools are available
   */
  checkMCPToolsAvailability() {
    console.log(chalk.blue('🔍 Checking for TRUE MCP tools...'));
    
    // Check for VS Code environment
    if (typeof globalThis !== 'undefined' && globalThis.vscode) {
      console.log(chalk.green('✅ VS Code environment detected'));
    }
    
    // Check for actual MCP tools
    const requiredTools = [
      'mcp_mongo_connect',
      'mcp_mongo_list_databases', 
      'mcp_mongo_list_collections',
      'mcp_mongo_find',
      'mcp_mongo_count',
      'mcp_mongo_collection_schema'
    ];
    
    const availableTools = [];
    const missingTools = [];
    
    for (const tool of requiredTools) {
      if (typeof globalThis[tool] === 'function') {
        availableTools.push(tool);
      } else {
        missingTools.push(tool);
      }
    }
    
    if (availableTools.length > 0) {
      console.log(chalk.green(`✅ Found ${availableTools.length} MCP tools: ${availableTools.join(', ')}`));
    }
    
    if (missingTools.length > 0) {
      console.log(chalk.red(`❌ Missing ${missingTools.length} MCP tools: ${missingTools.join(', ')}`));
      console.log(chalk.yellow('💡 Install MongoDB MCP extension in VS Code or run with MCP server'));
    }
    
    this.mcpToolsAvailable = availableTools.length === requiredTools.length;
  }

  /**
   * Connect using PURE MCP protocol ONLY
   */
  async connectViaMCP() {
    console.log(chalk.blue('🔗 Connecting via PURE MCP protocol...'));
    
    if (typeof globalThis.mcp_mongo_connect !== 'function') {
      console.log(chalk.red('🔌 MCP server process: TOOLS NOT AVAILABLE'));
      throw new Error('mcp_mongo_connect tool not available. TRUE MCP environment required.');
    }
    
    try {
      console.log(chalk.blue('🔄 Attempting MCP connection to MongoDB...'));
      console.log(chalk.gray(`   Connection string: ${this.config.connectionString.replace(/\/\/.*@/, '//***:***@')}`));
      
      // Add timeout for MCP connection
      const connectionTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('MCP connection timeout after 30 seconds')), 30000)
      );
      
      const connectionPromise = globalThis.mcp_mongo_connect({
        connectionStringOrClusterName: this.config.connectionString
      });
      
      await Promise.race([connectionPromise, connectionTimeout]);
      
      console.log(chalk.green('🔗 Connected via TRUE MCP protocol'));
      console.log(chalk.green('🎯 MCP server process: ACTIVE and RESPONDING'));
      console.log(chalk.green('📡 MongoDB connection: ESTABLISHED via MCP'));
      
    } catch (error) {
      console.log(chalk.red('🔌 MCP server process: CONNECTION FAILED'));
      console.log(chalk.red('📡 MongoDB connection: FAILED via MCP'));
      console.error(chalk.red('Connection error details:'), error.message);
      throw new Error(`MCP connection failed: ${error.message}`);
    }
  }

  /**
   * Execute a MongoDB command using PURE MCP protocol ONLY
   * @param {string} operation - The operation name to execute
   * @param {Object} params - Operation parameters
   * @returns {Promise<Object>} Operation result
   */
  async executeMongoCommand(operation, params = {}) {
    if (!this.isConnected) {
      throw new Error('MCP client not connected. Call initialize() first.');
    }

    if (!this.mcpToolsAvailable) {
      throw new Error('MCP tools not available. This is a TRUE MCP-only implementation.');
    }

    console.log(chalk.green(`🔄 Executing PURE MCP operation: ${operation}`));
    console.log(chalk.blue('💬 CHAT -> MCP REQUEST:'));
    console.log(chalk.gray(`   Operation: ${operation}`));
    console.log(chalk.gray(`   Parameters: ${JSON.stringify(params, null, 2)}`));
    
    const result = await this.executePureMCPCommand(operation, params);
    
    console.log(chalk.green('💬 MCP -> CHAT RESPONSE:'));
    console.log(chalk.gray(`   Result keys: ${Object.keys(result).join(', ')}`));
    if (result.documents) {
      console.log(chalk.gray(`   Documents returned: ${result.documents.length}`));
    }
    if (result.databases) {
      console.log(chalk.gray(`   Databases returned: ${result.databases.length}`));
    }
    if (result.collections) {
      console.log(chalk.gray(`   Collections returned: ${result.collections.length}`));
    }
    if (result.count !== undefined) {
      console.log(chalk.gray(`   Document count: ${result.count}`));
    }
    
    return result;
  }

  /**
   * Execute command using PURE MCP tools ONLY
   * @param {string} operation - Operation name
   * @param {Object} params - Operation parameters
   * @returns {Promise<Object>} MCP result
   */
  async executePureMCPCommand(operation, params = {}) {
    console.log(chalk.cyan(`🔧 Using PURE MCP tool: ${operation}`));
    console.log(chalk.blue('🔄 MCP server communication: SENDING REQUEST'));

    try {
      let result;
      
      switch (operation) {
        case 'mcp_mongo_list-databases':
          if (typeof globalThis.mcp_mongo_list_databases !== 'function') {
            throw new Error('mcp_mongo_list_databases tool not available');
          }
          result = await globalThis.mcp_mongo_list_databases();
          break;
          
        case 'mcp_mongo_list-collections':
          if (typeof globalThis.mcp_mongo_list_collections !== 'function') {
            throw new Error('mcp_mongo_list_collections tool not available');
          }
          result = await globalThis.mcp_mongo_list_collections({
            database: params.database
          });
          break;
          
        case 'mcp_mongo_find':
          if (typeof globalThis.mcp_mongo_find !== 'function') {
            throw new Error('mcp_mongo_find tool not available');
          }
          result = await globalThis.mcp_mongo_find({
            database: params.database,
            collection: params.collection,
            filter: params.filter || {},
            limit: params.limit || 10
          });
          break;
          
        case 'mcp_mongo_count':
          if (typeof globalThis.mcp_mongo_count !== 'function') {
            throw new Error('mcp_mongo_count tool not available');
          }
          result = await globalThis.mcp_mongo_count({
            database: params.database,
            collection: params.collection,
            query: params.query || {}
          });
          break;
          
        case 'mcp_mongo_collection_schema':
          if (typeof globalThis.mcp_mongo_collection_schema !== 'function') {
            throw new Error('mcp_mongo_collection_schema tool not available');
          }
          result = await globalThis.mcp_mongo_collection_schema({
            database: params.database,
            collection: params.collection
          });
          break;
          
        case 'mcp_mongo_aggregate':
          if (typeof globalThis.mcp_mongo_aggregate !== 'function') {
            throw new Error('mcp_mongo_aggregate tool not available');
          }
          result = await globalThis.mcp_mongo_aggregate({
            database: params.database,
            collection: params.collection,
            pipeline: params.pipeline || []
          });
          break;
          
        default:
          throw new Error(`Unsupported MCP operation: ${operation}`);
      }
      
      console.log(chalk.green('✅ MCP server communication: RESPONSE RECEIVED'));
      console.log(chalk.green('🎯 MCP server process: ACTIVE and RESPONDING'));
      return result;
      
    } catch (error) {
      console.log(chalk.red('❌ MCP server communication: FAILED'));
      console.log(chalk.red('🔌 MCP server process: ERROR or DISCONNECTED'));
      throw error;
    }
  }

  /**
   * Infer schema from a sample document
   * @param {Object} document - Sample document
   * @returns {Object} Inferred schema
   */
  inferSchema(document) {
    const schema = {};
    for (const [key, value] of Object.entries(document)) {
      if (value === null) {
        schema[key] = { type: 'null' };
      } else if (Array.isArray(value)) {
        schema[key] = { type: 'Array' };
      } else if (typeof value === 'object') {
        schema[key] = { type: 'Object' };
      } else {
        schema[key] = { type: typeof value };
      }
    }
    return schema;
  }

  /**
   * Disconnect from the MCP server and clean up resources
   */
  async disconnect() {
    this.isConnected = false;
    console.log(chalk.yellow('📝 MongoDB MCP client disconnected'));
  }

  /**
   * Check if the client is connected
   * @returns {boolean} Connection status
   */
  get connected() {
    return this.isConnected;
  }

  /**
   * Check MCP server process status
   */
  async checkMCPServerStatus() {
    console.log(chalk.blue('🔍 Checking MCP server process status...'));
    
    try {
      // Check if we're in VS Code environment
      if (typeof globalThis !== 'undefined' && globalThis.vscode) {
        console.log(chalk.green('✅ VS Code MCP environment detected'));
        console.log(chalk.green('🔌 MCP server process: RUNNING (VS Code integrated)'));
        return true;
      }
      
      // Check if MCP SDK is available
      if (typeof globalThis !== 'undefined' && globalThis.mcpClient) {
        console.log(chalk.green('✅ MCP client detected in global scope'));
        console.log(chalk.green('🔌 MCP server process: RUNNING (standalone)'));
        return true;
      }
      
      // Check for any MCP-related environment variables
      const mcpEnvVars = Object.keys(process.env).filter(key => 
        key.toLowerCase().includes('mcp') || 
        key.toLowerCase().includes('model_context_protocol')
      );
      
      if (mcpEnvVars.length > 0) {
        console.log(chalk.yellow('⚠️ MCP environment variables found:'), mcpEnvVars.join(', '));
        console.log(chalk.yellow('🔌 MCP server process: ENVIRONMENT CONFIGURED'));
      } else {
        console.log(chalk.red('❌ No MCP environment detected'));
        console.log(chalk.red('🔌 MCP server process: NOT FOUND'));
      }
      
      return false;
      
    } catch (error) {
      console.error(chalk.red('❌ Error checking MCP server status:'), error.message);
      console.log(chalk.red('🔌 MCP server process: ERROR'));
      return false;
    }
  }

  /**
   * Get detailed MCP server status
   * @returns {Object} Status information
   */
  getMCPServerStatus() {
    const status = {
      isVSCode: typeof globalThis !== 'undefined' && globalThis.vscode,
      hasMCPClient: typeof globalThis !== 'undefined' && globalThis.mcpClient,
      availableTools: [],
      missingTools: [],
      connectionStatus: this.isConnected ? 'CONNECTED' : 'DISCONNECTED',
      serverProcess: 'UNKNOWN'
    };

    const requiredTools = [
      'mcp_mongo_connect',
      'mcp_mongo_list_databases', 
      'mcp_mongo_list_collections',
      'mcp_mongo_find',
      'mcp_mongo_count',
      'mcp_mongo_collection_schema',
      'mcp_mongo_aggregate'
    ];

    for (const tool of requiredTools) {
      if (typeof globalThis[tool] === 'function') {
        status.availableTools.push(tool);
      } else {
        status.missingTools.push(tool);
      }
    }

    // Determine server process status
    if (status.isVSCode) {
      status.serverProcess = 'VS_CODE_INTEGRATED';
    } else if (status.hasMCPClient) {
      status.serverProcess = 'STANDALONE_SERVER';
    } else if (status.availableTools.length > 0) {
      status.serverProcess = 'PARTIAL_TOOLS_AVAILABLE';
    } else {
      status.serverProcess = 'NOT_RUNNING';
    }

    return status;
  }

  /**
   * Print detailed MCP server status
   */
  printMCPServerStatus() {
    const status = this.getMCPServerStatus();
    
    console.log(chalk.blue.bold('\n📊 MCP Server Status Report'));
    console.log(chalk.blue('═'.repeat(40)));
    
    console.log(chalk.cyan('🔌 Server Process:'), this.getServerProcessStatusText(status.serverProcess));
    console.log(chalk.cyan('🔗 Connection:'), this.getConnectionStatusText(status.connectionStatus));
    console.log(chalk.cyan('🖥️  Environment:'), status.isVSCode ? chalk.green('VS Code') : chalk.yellow('Terminal'));
    
    if (status.availableTools.length > 0) {
      console.log(chalk.cyan('✅ Available Tools:'), chalk.green(`${status.availableTools.length}/7`));
      status.availableTools.forEach(tool => {
        console.log(chalk.green(`   ✓ ${tool}`));
      });
    }
    
    if (status.missingTools.length > 0) {
      console.log(chalk.cyan('❌ Missing Tools:'), chalk.red(`${status.missingTools.length}/7`));
      status.missingTools.forEach(tool => {
        console.log(chalk.red(`   ✗ ${tool}`));
      });
    }
    
    console.log(chalk.blue('═'.repeat(40)));
  }

  getServerProcessStatusText(status) {
    switch (status) {
      case 'VS_CODE_INTEGRATED': return chalk.green('VS Code Integrated');
      case 'STANDALONE_SERVER': return chalk.green('Standalone Server');
      case 'PARTIAL_TOOLS_AVAILABLE': return chalk.yellow('Partial Tools');
      case 'NOT_RUNNING': return chalk.red('Not Running');
      default: return chalk.gray('Unknown');
    }
  }

  getConnectionStatusText(status) {
    switch (status) {
      case 'CONNECTED': return chalk.green('Connected');
      case 'DISCONNECTED': return chalk.red('Disconnected');
      default: return chalk.gray('Unknown');
    }
  }
}

/**
 * Utility function to format bytes
 * @param {number} bytes - Bytes to format
 * @returns {string} Formatted string
 */
export function formatBytes(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}
