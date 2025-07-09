/**
 * MongoDB MCP Integration
 * Provides MongoDB Model Context Protocol integration for enhanced AI-powered database interactions
 */

import { spawn } from 'child_process';
import chalk from 'chalk';
import { promisify } from 'util';

/**
 * MongoDB MCP Client class
 * Manages connection and communication with the MongoDB MCP server
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
    this.mcpProcess = null;
    this.isConnected = false;
    this.requestId = 0;
    this.pendingRequests = new Map();
  }

  /**
   * Initialize the MCP server process
   * @returns {Promise<boolean>} Success indicator
   */
  async initialize() {
    if (!this.config.connectionString) {
      console.error(chalk.red('❌ MongoDB connection string required. Set MDB_MCP_CONNECTION_STRING environment variable.'));
      return false;
    }

    try {
      console.log(chalk.blue('🔄 Initializing MongoDB MCP client...'));
      
      // Test the connection first
      const { MongoClient } = await import('mongodb');
      const client = new MongoClient(this.config.connectionString);
      
      await client.connect();
      await client.close();
      
      this.isConnected = true;
      console.log(chalk.green('✅ MongoDB MCP client connected to Atlas'));
      return true;
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to connect to MongoDB:'), error.message);
      return false;
    }
  }

  /**
   * Execute a MongoDB command through the MCP server
   * @param {string} operation - The operation name to execute
   * @param {Object} params - Operation parameters
   * @returns {Promise<Object>} Operation result
   */
  async executeMongoCommand(operation, params = {}) {
    if (!this.isConnected) {
      throw new Error('MCP client not connected. Call initialize() first.');
    }

    if (!this.config.connectionString) {
      throw new Error('MongoDB connection string not configured. Set MDB_MCP_CONNECTION_STRING environment variable.');
    }

    // Execute real MongoDB operations directly
    console.log(chalk.green(`🔄 Executing MongoDB operation: ${operation}`));
    return await this.directMongoOperation(operation, params);
  }

  /**
   * Direct MongoDB operations using mongodb driver
   * @param {string} operation - Operation name
   * @param {Object} params - Operation parameters
   * @returns {Promise<Object>} MongoDB result
   */
  async directMongoOperation(operation, params = {}) {
    const { MongoClient } = await import('mongodb');
    
    const client = new MongoClient(this.config.connectionString);
    
    try {
      await client.connect();
      console.log(chalk.green('✅ Connected to MongoDB Atlas'));
      
      switch (operation) {
        case 'mcp_mongo_list-databases':
          const adminDb = client.db().admin();
          const databases = await adminDb.listDatabases();
          return { databases: databases.databases };
          
        case 'mcp_mongo_list-collections':
          const db = client.db(params.database || 'test');
          const collections = await db.listCollections().toArray();
          return { collections };
          
        case 'mcp_mongo_find':
          const findDb = client.db(params.database || 'test');
          const collection = findDb.collection(params.collection);
          const documents = await collection.find(params.filter || {})
            .limit(params.limit || 10)
            .toArray();
          return { documents };
          
        case 'mcp_mongo_count':
          const countDb = client.db(params.database || 'test');
          const countCollection = countDb.collection(params.collection);
          const count = await countCollection.countDocuments(params.query || {});
          return { count };
          
        case 'mcp_mongo_collection-schema':
          // For schema, we'll sample a few documents to infer structure
          const schemaDb = client.db(params.database || 'test');
          const schemaCollection = schemaDb.collection(params.collection);
          const sample = await schemaCollection.findOne();
          if (sample) {
            const schema = this.inferSchema(sample);
            return { schema };
          }
          return { schema: {} };
          
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }
      
    } finally {
      await client.close();
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
    if (this.mcpProcess) {
      this.mcpProcess.kill();
      this.mcpProcess = null;
    }
    this.isConnected = false;
    this.pendingRequests.clear();
    console.log(chalk.yellow('📝 MongoDB MCP client disconnected'));
  }

  /**
   * Check if the client is connected
   * @returns {boolean} Connection status
   */
  get connected() {
    return this.isConnected;
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
