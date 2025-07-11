/**
 * Shell command implementations for system information and safe command execution
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Shell command implementations with safety controls
 */
export const shellCommands = {
  /**
   * Execute a safe shell command
   * @param {string} command - Command to execute
   * @returns {Promise<string>} Command output
   */
  async executeCommand(command) {    
    const commandParts = command.trim().split(' ');
    
    try {
      const { stdout, stderr } = await execAsync(command, { 
        timeout: 10000,
        maxBuffer: 1024 * 1024 
      });
      
      return `✅ Command: ${command}\n${stdout}${stderr ? `\nWarnings: ${stderr}` : ''}`;
    } catch (error) {
      return `❌ Command failed: ${error.message}`;
    }
  }
};

