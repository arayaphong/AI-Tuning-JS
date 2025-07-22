import { spawn } from 'child_process';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

/**
 * Parses MongoDB object strings to proper JSON format
 * Converts MongoDB-specific types and syntax to valid JSON
 * @param {string} str - MongoDB object string to parse
 * @returns {any} Parsed JSON object
 */
const parseMongoDBObject = (str) => {
  const converted = str
    .replace(/ObjectId\(['"](.+?)['"]\)/g, '"$1"')
    .replace(/ISODate\(['"](.+?)['"]\)/g, '"$1"')
    .replace(/([{,\s])(\w+):/g, '$1"$2":')
    .replace(/'([^']*?)'/g, '"$1"');

  return JSON.parse(converted);
};


/**
 * MongoDB Integration Utility
 * Provides a simplified interface for executing MongoDB shell scripts via mongosh
 */
class MongoDBIntegration {
  #connectionString = null;

  constructor() {
    this.#connectionString = process.env.MONGODB_URI;
    if (!this.#connectionString) {
      throw new Error('❌ MONGODB_URI not found in environment variables');
    }
  }

  /**
   * Executes MongoDB shell scripts and returns results
   * @param {string} script - MongoDB shell script to execute
   * @returns {Promise<any>} Script execution result
   * @example
   * // Get collection names from a database
   * const result = await mongo.mongoshEval("db.getSiblingDB('monitoring').getCollectionNames()");
   * // Result: ['memories', 'summary_vehicle_alert_data', 'vehicle_alert', 'history_near_by_location']
   */
  async mongoshEval(script) {
    try {
      // Execute the script via mongosh
      const mongoDBResult = await this.#evaluateScript(script);

      // Parse the JSON string to return a proper JSON object
      return parseMongoDBObject(mongoDBResult);
    } catch (error) {
      console.error(chalk.red('❌ Script execution failed:'), error.message);
      throw error;
    }
  }

  /**
   * Evaluates MongoDB shell script using mongosh child process
   * @private
   * @param {string} script - Script to evaluate
   * @returns {Promise<any>} Evaluation result
   */
  async #evaluateScript(script) {
    return new Promise((resolve, reject) => {
      try {
        // Prepare mongosh command with connection string
        const mongoshArgs = [
          this.#connectionString,
          '--eval',
          script,
          '--quiet'
        ];

        const mongoshProcess = spawn('mongosh', mongoshArgs, {
          stdio: ['pipe', 'pipe', 'pipe'],
          shell: false
        });

        let stdout = '';
        let stderr = '';

        // Collect stdout data
        mongoshProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        // Collect stderr data
        mongoshProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        // Handle process completion
        mongoshProcess.on('close', (code) => {
          if (code === 0) {
            try {
              // Clean up the output and parse if it's JSON
              const cleanOutput = stdout.trim();

              // Try to parse as JSON if it looks like JSON
              if (cleanOutput.startsWith('[') || cleanOutput.startsWith('{')) {
                try {
                  const parsed = JSON.parse(cleanOutput);
                  resolve(parsed);
                } catch (parseError) {
                  // If JSON parsing fails, return as string
                  resolve(cleanOutput);
                }
              } else {
                // Handle other output types
                if (cleanOutput.includes('\n')) {
                  // Multiple lines - split into array
                  resolve(cleanOutput.split('\n').filter(line => line.trim()));
                } else {
                  // Single line output
                  resolve(cleanOutput);
                }
              }
            } catch (error) {
              reject(new Error(`Failed to process mongosh output: ${error.message}`));
            }
          } else {
            reject(new Error(`mongosh process failed with code ${code}: ${stderr}`));
          }
        });

        // Handle process errors
        mongoshProcess.on('error', (error) => {
          if (error.code === 'ENOENT') {
            reject(new Error('mongosh command not found. Please ensure MongoDB Shell is installed and in PATH.'));
          } else {
            reject(new Error(`Failed to execute mongosh: ${error.message}`));
          }
        });

        // Set a timeout for the process
        const timeout = setTimeout(() => {
          mongoshProcess.kill('SIGTERM');
          reject(new Error('mongosh execution timed out after 30 seconds'));
        }, 30000);

        // Clear timeout on completion
        mongoshProcess.on('close', () => {
          clearTimeout(timeout);
        });

      } catch (error) {
        reject(new Error(`Script evaluation setup failed: ${error.message}`));
      }
    });
  }
}

export default MongoDBIntegration;