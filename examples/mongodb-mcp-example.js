#!/usr/bin/env node

/**
 * MongoDB MCP Integration Example
 * Demonstrates how to use MongoDB commands with the AI chatbot using TRUE MCP protocol
 * 
 * REQUIREMENTS:
 * - VS Code with MongoDB MCP extension installed, OR
 * - MCP server running with MongoDB MCP tools available
 * - Valid MongoDB connection string in .env file
 * 
 * This example uses ONLY the TRUE MCP protocol - no fallbacks or simulations.
 */

import { config } from 'dotenv';
import { initializeGoogleAI, generateContent, initializeMongoMCP, mongoCommands } from '../src/utils/google-ai-integration.js';
import chalk from 'chalk';

config();

async function testMongoMCPIntegration() {
  console.log(chalk.green.bold('🧪 MongoDB MCP Integration Test\n'));
  
  try {
    // Initialize AI
    console.log(chalk.blue('1. Initializing Google AI...'));
    const model = await initializeGoogleAI({
      project: process.env.GOOGLE_CLOUD_PROJECT,
      location: process.env.GOOGLE_CLOUD_LOCATION,
      apiKey: process.env.GOOGLE_AI_API_KEY
    });
    console.log(chalk.green('✅ AI initialized\n'));
    
    // Initialize MongoDB MCP
    console.log(chalk.blue('2. Initializing MongoDB MCP...'));
    const mongoClient = await initializeMongoMCP();
    if (mongoClient) {
      console.log(chalk.green('✅ MongoDB MCP initialized (TRUE MCP protocol)\n'));
    } else {
      console.log(chalk.red('❌ MongoDB MCP initialization failed - TRUE MCP environment required\n'));
      process.exit(1);
    }
    
    // Test MongoDB commands directly
    console.log(chalk.blue('3. Testing MongoDB Commands:'));
    console.log(chalk.gray('─'.repeat(40)));
    
    console.log(chalk.cyan('\n📊 Testing: List Databases'));
    const databases = await mongoCommands.listDatabases();
    console.log(databases);
    
    console.log(chalk.cyan('\n📁 Testing: List Collections'));
    const collections = await mongoCommands.listCollections('ai_tuning');
    console.log(collections);
    
    console.log(chalk.cyan('\n📋 Testing: Get Schema'));
    const schema = await mongoCommands.getCollectionSchema('training_data');
    console.log(schema);
    
    console.log(chalk.cyan('\n🔍 Testing: Find Documents'));
    const documents = await mongoCommands.findDocuments('training_data');
    console.log(documents);
    
    console.log(chalk.cyan('\n📊 Testing: Count Documents'));
    const count = await mongoCommands.countDocuments('training_data');
    console.log(count);
    
    // Test AI integration with MongoDB
    console.log(chalk.blue('\n4. Testing AI + MongoDB Integration:'));
    console.log(chalk.gray('─'.repeat(40)));
    
    const testPrompts = [
      "Show me all databases",
      "List collections in ai_tuning database", 
      "What's the schema for training_data?",
      "Find some training data documents",
      "Count documents in training_data"
    ];
    
    for (const prompt of testPrompts) {
      console.log(chalk.cyan(`\n💬 Testing: "${prompt}"`));
      try {
        const response = await generateContent(model, prompt);
        console.log(chalk.green('🤖 Response:'), response.substring(0, 200) + '...');
      } catch (error) {
        console.error(chalk.red('❌ Error:'), error.message);
      }
    }
    
    console.log(chalk.green.bold('\n🎉 MongoDB MCP Integration Test Complete!'));
    console.log(chalk.yellow('💡 Run "npm start" to start the interactive chatbot with MongoDB support'));
    
  } catch (error) {
    console.error(chalk.red('❌ Test failed:'), error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testMongoMCPIntegration().catch(error => {
  console.error(chalk.red('❌ Application error:'), error.message);
  process.exit(1);
});
