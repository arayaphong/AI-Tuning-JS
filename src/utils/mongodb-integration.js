import { spawn } from 'child_process';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

/**
 * Parses MongoDB extended JSON strings to standard JSON objects
 * Converts MongoDB-specific types and syntax to valid JSON
 * @param {string} str - MongoDB object string to parse
 * @returns {any} Parsed JSON object or the original string if parsing fails
 */
const parseMongoDBObject = (str) => {
  try {
    let converted = str
      // Handle Long
      .replace(/Long\(['"](\d+)['"]\)/g, '$1')
      // Handle Timestamp
      .replace(/Timestamp\({ t: (\d+), i: (\d+) }\)/g, '{"$timestamp":{"t":$1,"i":$2}}')
      // Handle Binary
      .replace(/Binary.createFromBase64\(['"]([^'"]+)['"], (\d+)\)/g, '{"$binary":{"base64":"$1","subType":"$2"}}')
      // Handle ObjectId
      .replace(/ObjectId\(['"](.+?)['"]\)/g, '"$1"')
      // Handle ISODate
      .replace(/ISODate\(['"](.+?)['"]\)/g, '"$1"')
      // Quote unquoted keys
      .replace(/([{,\s])(\w+):/g, '$1"$2":')
      // Replace single quotes with double quotes for strings
      .replace(/'([^']*?)'/g, '"$1"');

    return JSON.parse(converted);
  } catch (error) {
    // If parsing fails, return the original string
    return str;
  }
};

/**
 * MongoDB Integration Utility
 * Provides an interactive interface for executing MongoDB shell commands via mongosh
 */
class MongoDBIntegration {
  #connectionString = null;
  #mongoshProcess = null;
  #commandQueue = [];
  #currentResolve = null;
  #currentReject = null;
  #outputBuffer = '';
  #ready = false;

  constructor() {
    this.#connectionString = process.env.MONGODB_URI;
    if (!this.#connectionString) {
      throw new Error('❌ MONGODB_URI not found in environment variables');
    }
    this.#startMongosh();
  }

  /**
   * Starts a persistent mongosh process
   * @private
   */
  #startMongosh() {
    this.#mongoshProcess = spawn('mongosh', [this.#connectionString, '--quiet'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false,
    });

    // Handle stdout (responses from mongosh)
    this.#mongoshProcess.stdout.on('data', (data) => {
      const output = data.toString();
      this.#outputBuffer += output;
      this.#processOutput();
    });

    // Handle stderr (errors from mongosh)
    this.#mongoshProcess.stderr.on('data', (data) => {
      const error = data.toString();
      if (this.#currentReject) {
        this.#currentReject(new Error(`mongosh error: ${error}`));
        this.#clearCurrentCommand();
      }
    });

    // Handle process errors
    this.#mongoshProcess.on('error', (error) => {
      if (error.code === 'ENOENT') {
        throw new Error('mongosh command not found. Please ensure MongoDB Shell is installed and in PATH.');
      }
      if (this.#currentReject) {
        this.#currentReject(new Error(`Failed to execute mongosh: ${error.message}`));
        this.#clearCurrentCommand();
      }
    });

    // Handle process exit
    this.#mongoshProcess.on('close', (code) => {
      const error = new Error(`mongosh process exited with code ${code}`);
      if (this.#currentReject) {
        this.#currentReject(error);
        this.#clearCurrentCommand();
      }
      this.#mongoshProcess = null;
    });
  }

  /**
   * Processes stdout to detect prompts and extract command output
   * @private
   */
  #processOutput() {
    // Split the buffer into lines
    const lines = this.#outputBuffer.split(/\r?\n/);
    const lastLine = lines[lines.length - 1]?.trim() || '';

    // Check if the last line is a prompt (ends with '>')
    if (lastLine.endsWith('>')) {
      // Extract the output before the prompt line
      const commandOutput = lines.slice(0, -1).join('\n').trim();

      // Clear the buffer
      this.#outputBuffer = '';

      if (!this.#ready) {
        // Initial prompt detected, set ready and process next command
        this.#ready = true;
      } else if (this.#currentResolve) {
        // Handle 'show dbs' specifically to return raw string
        if (this.#commandQueue[0]?.script === 'show dbs') {
          this.#currentResolve(commandOutput);
        } else {
          // Try to parse JSON-like output
          let result = commandOutput;
          if (commandOutput.startsWith('{') || commandOutput.startsWith('[')) {
            result = parseMongoDBObject(commandOutput);
          }
          this.#currentResolve(result);
        }
        this.#clearCurrentCommand();
      }

      // Process the next command in the queue
      this.#processNextCommand();
    }
  }

  /**
   * Clears the current command's resolve/reject
   * @private
   */
  #clearCurrentCommand() {
    this.#currentResolve = null;
    this.#currentReject = null;
  }

  /**
   * Processes the next command in the queue if ready
   * @private
   */
  #processNextCommand() {
    if (this.#ready && this.#commandQueue.length > 0 && !this.#currentResolve) {
      const { script, resolve, reject } = this.#commandQueue.shift();
      this.#currentResolve = resolve;
      this.#currentReject = reject;

      // Send the command to mongosh
      this.#mongoshProcess.stdin.write(`${script}\n`);
    }
  }

  /**
   * Executes a MongoDB shell script interactively
   * @param {string} script - MongoDB shell script to execute
   * @returns {Promise<any>} Script execution result (string for 'show dbs', parsed object for JSON-like output)
   */
  async mongoshEval(script) {
    if (!this.#mongoshProcess || this.#mongoshProcess.killed) {
      throw new Error('mongosh process is not running');
    }

    return new Promise((resolve, reject) => {
      this.#commandQueue.push({ script, resolve, reject });
      this.#processNextCommand();
    });
  }

  /**
   * Closes the mongosh process
   */
  close() {
    if (this.#mongoshProcess && !this.#mongoshProcess.killed) {
      this.#mongoshProcess.stdin.write('exit\n');
      this.#mongoshProcess = null;
    }
  }
}

export default MongoDBIntegration;