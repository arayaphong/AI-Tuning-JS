import MongoDBIntegration from '../src/utils/mongodb-integration.js';
import chalk from 'chalk';

/**
 * Example usage of MongoDB Integration Utility
 * This demonstrates the mongoshEval function for executing MongoDB shell scripts via mongosh
 */

async function runMongoDBExamples() {
  const mongodb = new MongoDBIntegration();
  
  try {
    console.log(chalk.magenta('🚀 Starting MongoDB mongoshEval Examples (using mongosh child process)\n'));
    
    // Example 1: Get collection names from monitoring database
    console.log(chalk.cyan('\n📋 Example 1: Get collection names from monitoring database'));
    try {
      const monitoringCollections = await mongodb.mongoshEval("db.getSiblingDB('monitoring').getCollectionNames()");
      console.log('Collections in monitoring database:', monitoringCollections);
    } catch (error) {
      console.log(chalk.yellow('⚠️ Could not access monitoring database (may not exist)'));
    }

    // Example 2: Get items from history_near_by_location collection
    console.log(chalk.cyan('\n📋 Example 2: Get items from history_near_by_location collection'));
    try {
      const nearbyVehicleHistory = await mongodb.mongoshEval("db.getSiblingDB('monitoring').history_near_by_location.find({}).limit(10)");
      console.log('Recent history_near_by_location entries:', nearbyVehicleHistory);
    } catch (error) {
      console.log(chalk.yellow('⚠️ Could not access history_near_by_location collection (may not exist)'));
    }

    // Example 3: List all databases
    console.log(chalk.cyan('\n📋 Example 3: List all databases'));
    try {
      const allDatabases = await mongodb.mongoshEval("show dbs");
      console.log('All databases:', allDatabases);
    } catch (error) {
      console.log(chalk.yellow('⚠️ Could not list databases'));
    }

    mongodb.close();

    console.log(chalk.green('\n✅ All mongoshEval examples completed successfully!'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Error in examples:'), error.message);
  } finally {
    // No need to disconnect - mongosh handles this automatically
    console.log(chalk.blue('\n👋 Examples finished'));
  }
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMongoDBExamples().catch(console.error);
}

export { runMongoDBExamples };
