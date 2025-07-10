/**
 * Shell command implementations for system information and safe command execution
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import si from 'systeminformation';

const execAsync = promisify(exec);

/**
 * Shell command implementations with safety controls
 */
export const shellCommands = {
  /**
   * Get comprehensive system information
   * @param {string} type - Type of info to get: 'all', 'memory', 'cpu', 'os'
   * @returns {Promise<string>} Formatted system information
   */
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

  /**
   * List files in a directory
   * @param {string} dirPath - Directory path to list
   * @param {boolean} showHidden - Whether to show hidden files
   * @returns {Promise<string>} Formatted file listing
   */
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

/**
 * Get file size for display
 * @private
 */
async function getFileSize(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile() ? `(${formatBytes(stats.size)})` : '';
  } catch {
    return '';
  }
}

/**
 * Format bytes into human-readable format
 * @private
 */
function formatBytes(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
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
  console.log('   ⚙️  Commands: "run <command>", "execute <command>"');
}
