/**
 * Rendering utilities for markdown-like content and chat messages
 * Provides functions for displaying formatted content in the terminal
 */

import chalk from 'chalk';

/**
 * Render a chat message with markdown support and formatting options
 * @param {string} content - The content to render
 * @param {Object} options - Rendering options
 * @param {string} options.prefix - Prefix to show before the message
 * @param {boolean} options.showTimestamp - Whether to show timestamp
 * @param {boolean} options.addSpacing - Whether to add spacing around the message
 */
export async function renderChatMessage(content, options = {}) {
  const {
    prefix = '🤖 AI:',
    showTimestamp = false,
    addSpacing = true
  } = options;

  if (addSpacing) console.log();

  // Show prefix with timestamp if requested
  if (showTimestamp) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(chalk.green.bold(`${prefix} [${timestamp}]`));
  } else {
    console.log(chalk.green.bold(prefix));
  }

  // Process markdown-like content for better display
  await smartRender(content);

  if (addSpacing) console.log();
}

/**
 * Smart render function that handles markdown-like content
 * @param {string} content - Content to render with basic markdown support
 */
export async function smartRender(content) {
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Handle headers
    if (trimmedLine.startsWith('# ')) {
      console.log(chalk.cyan.bold(trimmedLine.substring(2)));
    } else if (trimmedLine.startsWith('## ')) {
      console.log(chalk.blue.bold(trimmedLine.substring(3)));
    } else if (trimmedLine.startsWith('### ')) {
      console.log(chalk.magenta.bold(trimmedLine.substring(4)));
    }
    // Handle code blocks (basic support)
    else if (trimmedLine.startsWith('```')) {
      console.log(chalk.gray('─'.repeat(50)));
    }
    // Handle bold text **text**
    else if (trimmedLine.includes('**')) {
      const processed = trimmedLine.replace(/\*\*(.*?)\*\*/g, (match, text) => {
        return chalk.bold(text);
      });
      console.log(processed);
    }
    // Handle inline code `code`
    else if (trimmedLine.includes('`')) {
      const processed = trimmedLine.replace(/`(.*?)`/g, (match, code) => {
        return chalk.cyan.bg.gray(` ${code} `);
      });
      console.log(processed);
    }
    // Handle bullet points
    else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      console.log(chalk.yellow('  • ') + trimmedLine.substring(2));
    }
    // Handle numbered lists
    else if (/^\d+\.\s/.test(trimmedLine)) {
      const match = trimmedLine.match(/^(\d+)\.\s(.+)$/);
      if (match) {
        console.log(chalk.yellow(`  ${match[1]}. `) + match[2]);
      }
    }
    // Handle blockquotes
    else if (trimmedLine.startsWith('> ')) {
      console.log(chalk.gray('  │ ') + chalk.italic(trimmedLine.substring(2)));
    }
    // Handle horizontal rules
    else if (trimmedLine === '---' || trimmedLine === '***') {
      console.log(chalk.gray('─'.repeat(50)));
    }
    // Handle empty lines
    else if (trimmedLine === '') {
      console.log();
    }
    // Regular text
    else {
      console.log(line);
    }
  }
}

/**
 * Render system information with a title and description
 * @param {string} title - The title to display
 * @param {string} description - The description to display
 */
export async function renderSystemInfo(title, description) {
  console.log(chalk.cyan.bold(`\n${title}`));
  console.log(chalk.gray('─'.repeat(title.length)));
  if (description) {
    console.log(chalk.white(description));
  }
  console.log();
}

/**
 * Render help content with command information
 * @param {Array} commands - Array of command objects with name, description, and examples
 */
export async function renderHelpContent(commands) {
  for (const cmd of commands) {
    console.log(chalk.yellow.bold(`  ${cmd.name}`));
    console.log(chalk.white(`    ${cmd.description}`));
    
    if (cmd.examples && cmd.examples.length > 0) {
      console.log(chalk.gray('    Examples:'));
      for (const example of cmd.examples) {
        console.log(chalk.gray(`      ${example}`));
      }
    }
    console.log();
  }
}

/**
 * Display startup banner
 */
export function showBanner() {
  console.log(chalk.green.bold('🤖 Gemini AI Chatbot with Shell Commands & Sessions'));
  console.log(chalk.gray('═'.repeat(65)));
  console.log(chalk.yellow('💡 Use natural language - keywords trigger shell commands!'));
  console.log(chalk.yellow('💾 Save/load conversations with /save and /load commands!'));
  console.log(chalk.gray('Type /help for all commands or just start chatting!\n'));
}
