import { VertexAI } from '@google-cloud/vertexai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import si from 'systeminformation';

const execAsync = promisify(exec);

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

function formatBytes(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Process user input and execute shell commands based on keywords
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
 * Generate content with shell command detection and conversation context - RELIABLE VERSION
 */
export async function generateContent(model, prompt, options = {}) {
  if (!model || !prompt) {
    throw new Error('Model and prompt are required');
  }

  const { conversationHistory = [] } = options;

  try {
    // Execute shell commands first
    const shellResults = await processShellCommands(prompt);
    
    // Build conversation context
    let contextPrompt = '';
    
    // Add conversation history for context (last 10 messages to avoid token limits)
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-10);
      contextPrompt += '\n--- CONVERSATION HISTORY ---\n';
      recentHistory.forEach((message, index) => {
        const role = message.role === 'user' ? 'User' : 'Assistant';
        contextPrompt += `${role}: ${message.content}\n\n`;
      });
      contextPrompt += '--- END CONVERSATION HISTORY ---\n\n';
    }
    
    // Build enhanced prompt with context and current message
    let enhancedPrompt = '';
    
    // Add conversation context if available
    if (contextPrompt) {
      enhancedPrompt += contextPrompt;
    }
    
    // Add current user message
    enhancedPrompt += `Current User Message: ${prompt}\n\n`;
    
    // Add shell command results if any
    if (shellResults.length > 0) {
      enhancedPrompt += '--- SYSTEM DATA ---\n' + shellResults.join('\n\n') + 
                       '\n--- END SYSTEM DATA ---\n\n';
    }
    
    // Add instructions for the AI
    enhancedPrompt += `Please respond to the current user message. Use the conversation history to remember previous information about the user (name, location, preferences, etc.). If system data is provided, incorporate it naturally into your response.

Important: 
- Remember information from previous messages in the conversation
- If the user asks about something mentioned earlier (like their name or location), refer back to that information
- Be conversational and natural
- Use the system data to answer technical questions when relevant`;
    
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
}