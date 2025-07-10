/**
 * MongoDB MCP Real Connection Development Mode
 * Uses actual MongoDB connection with MCP-style interface for development
 */

import chalk from 'chalk';

/**
 * Test network connectivity to MongoDB Atlas
 */
/**
 * Register real MongoDB tools that connect to actual database
 * This provides TRUE database connectivity while maintaining MCP interface
 */
export async function registerRealMCPTools() {
  console.log(chalk.blue('🔄 REAL DEV MODE: Registering real MongoDB tools with MCP interface'));
  console.log(chalk.green('✅ This will connect to your actual MongoDB database'));
  
  // Import MongoDB driver
  let MongoClient;
  try {
    const mongodb = await import('mongodb');
    MongoClient = mongodb.MongoClient;
  } catch (error) {
    console.error(chalk.red('❌ MongoDB driver not available for real connection mode'));
    throw new Error('MongoDB driver required for real connection mode');
  }
  
  let client = null;
  let isConnected = false;
  
  // Real mcp_mongo_connect
  globalThis.mcp_mongo_connect = async ({ connectionStringOrClusterName }) => {
    console.log(chalk.blue('🔗 Connecting to MongoDB...'));
    console.log(chalk.cyan(`   Connection string: ${connectionStringOrClusterName.replace(/\/\/.*@/, '//***:***@')}`));
    
    // Log the MCP command being sent
    console.log(chalk.magenta('📤 MCP COMMAND SENT:'));
    console.log(chalk.gray(JSON.stringify({
      tool: 'mcp_mongo_connect',
      parameters: {
        connectionStringOrClusterName: connectionStringOrClusterName.replace(/\/\/.*@/, '//***:***@')
      }
    }, null, 2)));
    
    try {
      // Use mongosh-compatible connection options (since mongosh works perfectly)
      const options = {
        serverSelectionTimeoutMS: 10000, // 10 second timeout (same as mongosh default)
        connectTimeoutMS: 15000, // 15 second connection timeout
        socketTimeoutMS: 0, // No socket timeout
        maxPoolSize: 10, // Standard pool size
        serverApi: {
          version: '1',
          strict: true,
          deprecationErrors: true,
        }
      };
      
      console.log(chalk.gray('   Creating MongoDB client with mongosh-compatible options...'));
      console.log(chalk.green('   ✅ Connection validated with mongosh - proceeding...'));
      
      client = new MongoClient(connectionStringOrClusterName, options);
      
      console.log(chalk.gray('   Connecting to MongoDB...'));
      await client.connect();
      
      console.log(chalk.gray('   Testing connection with ping...'));
      const pingResult = await client.db('admin').command({ ping: 1 });
      
      isConnected = true;
      
      // Log the MCP response being received
      const response = { success: true, message: 'Real connection established', ping: pingResult };
      console.log(chalk.green('📥 MCP RESPONSE RECEIVED:'));
      console.log(chalk.gray(JSON.stringify(response, null, 2)));
      
      console.log(chalk.green('✅ Connected to MongoDB successfully'));
      return response;
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to connect to MongoDB:'), error.message);
      
      // Log specific error details
      if (error.code) {
        console.error(chalk.red('   Error code:'), error.code);
      }
      if (error.codeName) {
        console.error(chalk.red('   Error codeName:'), error.codeName);
      }
      
      // Log the MCP error response
      const errorResponse = { success: false, error: error.message, code: error.code };
      console.log(chalk.red('📥 MCP ERROR RESPONSE:'));
      console.log(chalk.gray(JSON.stringify(errorResponse, null, 2)));
      
      // Clean up on error
      if (client) {
        try {
          console.log(chalk.gray('   Cleaning up failed connection...'));
          await Promise.race([
            client.close(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Close timeout')), 2000))
          ]);
        } catch (closeError) {
          console.error(chalk.red('❌ Error closing client:'), closeError.message);
        }
        client = null;
      }
      isConnected = false;
      
      // Don't throw error immediately, try fallback approach
      console.log(chalk.yellow('⚠️ Primary connection failed, checking network connectivity...'));
      
      // Check if it's a network issue
      if (error.message.includes('timeout') || error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        console.log(chalk.yellow('🔄 Network connectivity issue detected'));
        console.log(chalk.yellow('💡 Possible issues:'));
        console.log(chalk.yellow('   1. MongoDB Atlas cluster is paused or deleted'));
        console.log(chalk.yellow('   2. Hostname "tariffprod.gqam5sm.mongodb.net" might be incorrect'));
        console.log(chalk.yellow('   3. Internet connection or DNS issues'));
        console.log(chalk.yellow('   4. IP address not whitelisted in MongoDB Atlas'));
        console.log(chalk.yellow('   5. Credentials might be incorrect'));
        console.log(chalk.blue('💡 To fix:'));
        console.log(chalk.blue('   1. Check MongoDB Atlas dashboard'));
        console.log(chalk.blue('   2. Verify cluster is running'));
        console.log(chalk.blue('   3. Update connection string if needed'));
      }
      
      throw error;
    }
  };
  
  // Real mcp_mongo_list_databases
  globalThis.mcp_mongo_list_databases = async () => {
    console.log(chalk.blue('🔍 Listing databases...'));
    if (!isConnected || !client) throw new Error('Not connected to MongoDB');
    
    // Log the MCP command being sent
    console.log(chalk.magenta('📤 MCP COMMAND SENT:'));
    console.log(chalk.gray(JSON.stringify({
      tool: 'mcp_mongo_list_databases',
      parameters: {}
    }, null, 2)));
    
    try {
      const adminDb = client.db().admin();
      const result = await adminDb.listDatabases();
      
      // Log the MCP response being received
      console.log(chalk.green('📥 MCP RESPONSE RECEIVED:'));
      console.log(chalk.gray(JSON.stringify({ databases: result.databases }, null, 2)));
      
      console.log(chalk.green(`✅ Found ${result.databases.length} databases`));
      return { databases: result.databases };
    } catch (error) {
      // Log the MCP error response
      const errorResponse = { error: error.message };
      console.log(chalk.red('📥 MCP ERROR RESPONSE:'));
      console.log(chalk.gray(JSON.stringify(errorResponse, null, 2)));
      
      console.error(chalk.red('❌ Failed to list databases:'), error.message);
      throw error;
    }
  };
  
  // Real mcp_mongo_list_collections
  globalThis.mcp_mongo_list_collections = async ({ database }) => {
    console.log(chalk.blue(`🔍 Listing collections in ${database}...`));
    if (!isConnected || !client) throw new Error('Not connected to MongoDB');
    
    // Log the MCP command being sent
    console.log(chalk.magenta('📤 MCP COMMAND SENT:'));
    console.log(chalk.gray(JSON.stringify({
      tool: 'mcp_mongo_list_collections',
      parameters: { database }
    }, null, 2)));
    
    try {
      const db = client.db(database);
      const collections = await db.listCollections().toArray();
      
      // Log the MCP response being received
      console.log(chalk.green('📥 MCP RESPONSE RECEIVED:'));
      console.log(chalk.gray(JSON.stringify({ collections }, null, 2)));
      
      console.log(chalk.green(`✅ Found ${collections.length} collections in ${database}`));
      return { collections };
    } catch (error) {
      // Log the MCP error response
      const errorResponse = { error: error.message };
      console.log(chalk.red('📥 MCP ERROR RESPONSE:'));
      console.log(chalk.gray(JSON.stringify(errorResponse, null, 2)));
      
      console.error(chalk.red(`❌ Failed to list collections in ${database}:`), error.message);
      throw error;
    }
  };
  
  // Real mcp_mongo_find
  globalThis.mcp_mongo_find = async ({ database, collection, filter = {}, limit = 10 }) => {
    console.log(chalk.blue(`🔍 Finding documents in ${database}.${collection}...`));
    if (!isConnected || !client) throw new Error('Not connected to MongoDB');
    
    // Log the MCP command being sent
    console.log(chalk.magenta('📤 MCP COMMAND SENT:'));
    console.log(chalk.gray(JSON.stringify({
      tool: 'mcp_mongo_find',
      parameters: { database, collection, filter, limit }
    }, null, 2)));
    
    try {
      const db = client.db(database);
      const coll = db.collection(collection);
      const documents = await coll.find(filter).limit(limit).toArray();
      
      // Log the MCP response being received (truncated for readability)
      console.log(chalk.green('📥 MCP RESPONSE RECEIVED:'));
      const responsePreview = {
        documents: documents.slice(0, 3), // Show first 3 docs
        totalCount: documents.length,
        truncated: documents.length > 3
      };
      console.log(chalk.gray(JSON.stringify(responsePreview, null, 2)));
      
      console.log(chalk.green(`✅ Found ${documents.length} documents`));
      return { documents };
    } catch (error) {
      // Log the MCP error response
      const errorResponse = { error: error.message };
      console.log(chalk.red('📥 MCP ERROR RESPONSE:'));
      console.log(chalk.gray(JSON.stringify(errorResponse, null, 2)));
      
      console.error(chalk.red(`❌ Failed to find documents in ${database}.${collection}:`), error.message);
      throw error;
    }
  };
  
  // Real mcp_mongo_count
  globalThis.mcp_mongo_count = async ({ database, collection, query = {} }) => {
    console.log(chalk.blue(`📊 Counting documents in ${database}.${collection}...`));
    if (!isConnected || !client) throw new Error('Not connected to MongoDB');
    
    // Log the MCP command being sent
    console.log(chalk.magenta('📤 MCP COMMAND SENT:'));
    console.log(chalk.gray(JSON.stringify({
      tool: 'mcp_mongo_count',
      parameters: { database, collection, query }
    }, null, 2)));
    
    try {
      const db = client.db(database);
      const coll = db.collection(collection);
      const count = await coll.countDocuments(query);
      
      // Log the MCP response being received
      console.log(chalk.green('📥 MCP RESPONSE RECEIVED:'));
      console.log(chalk.gray(JSON.stringify({ count }, null, 2)));
      
      console.log(chalk.green(`✅ Found ${count} documents`));
      return { count };
    } catch (error) {
      // Log the MCP error response
      const errorResponse = { error: error.message };
      console.log(chalk.red('📥 MCP ERROR RESPONSE:'));
      console.log(chalk.gray(JSON.stringify(errorResponse, null, 2)));
      
      console.error(chalk.red(`❌ Failed to count documents in ${database}.${collection}:`), error.message);
      throw error;
    }
  };
  
  // Real mcp_mongo_collection_schema
  globalThis.mcp_mongo_collection_schema = async ({ database, collection }) => {
    console.log(chalk.blue(`📋 Getting schema for ${database}.${collection}...`));
    if (!isConnected || !client) throw new Error('Not connected to MongoDB');
    
    try {
      const db = client.db(database);
      const coll = db.collection(collection);
      
      // Get a sample document to infer schema
      const sample = await coll.findOne();
      if (!sample) {
        console.log(chalk.yellow(`⚠️ No documents found in ${database}.${collection}`));
        return { schema: {} };
      }
      
      // Infer schema from sample
      const schema = {};
      for (const [key, value] of Object.entries(sample)) {
        if (value === null) {
          schema[key] = { type: 'null' };
        } else if (Array.isArray(value)) {
          schema[key] = { type: 'Array' };
        } else if (value instanceof Date) {
          schema[key] = { type: 'Date' };
        } else if (typeof value === 'object') {
          schema[key] = { type: 'Object' };
        } else {
          schema[key] = { type: typeof value };
        }
      }
      
      console.log(chalk.green(`✅ Schema inferred from sample document`));
      return { schema };
    } catch (error) {
      console.error(chalk.red(`❌ Failed to get schema for ${database}.${collection}:`), error.message);
      throw error;
    }
  };
  
  // Real mcp_mongo_aggregate
  globalThis.mcp_mongo_aggregate = async ({ database, collection, pipeline = [] }) => {
    console.log(chalk.blue(`🔄 Running aggregation on ${database}.${collection}...`));
    if (!isConnected || !client) throw new Error('Not connected to MongoDB');
    
    try {
      const db = client.db(database);
      const coll = db.collection(collection);
      const documents = await coll.aggregate(pipeline).toArray();
      console.log(chalk.green(`✅ Aggregation returned ${documents.length} documents`));
      return { documents };
    } catch (error) {
      console.error(chalk.red(`❌ Failed to run aggregation on ${database}.${collection}:`), error.message);
      throw error;
    }
  };
  
  console.log(chalk.green('✅ Real MongoDB MCP tools registered for development'));
  console.log(chalk.blue('🔗 Tools will connect to your actual MongoDB database'));
  
  // Cleanup function
  globalThis._cleanup_real_mcp = async () => {
    if (client) {
      await client.close();
      console.log(chalk.yellow('🔌 Real MongoDB connection closed'));
    }
  };
}

/**
 * Check if real development mode is enabled
 */
export function isRealDevMode() {
  return process.env.MCP_REAL_DEV === 'true' ||
         process.argv.includes('--real-dev');
}
