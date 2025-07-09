/**
 * Enhanced Markdown Renderer with fallback support
 * Provides rich markdown rendering for chat output with proper formatting
 */

import chalk from 'chalk';

// Dynamic import for ink-markdown to handle ESM issues
let inkMarkdown = null;
let React = null;
let inkRender = null;

/**
 * Initialize ink-markdown components (lazy loading)
 */
async function initializeInkMarkdown() {
  if (inkMarkdown && React && inkRender) {
    return true;
  }
  
  try {
    // Dynamic imports to avoid ESM issues
    const reactModule = await import('react');
    const inkModule = await import('ink');
    const markdownModule = await import('ink-markdown');
    
    React = reactModule.default;
    inkRender = inkModule.render;
    inkMarkdown = markdownModule.default;
    
    return true;
  } catch (error) {
    console.warn(chalk.yellow('⚠️ ink-markdown not available, using fallback renderer'));
    return false;
  }
}

/**
 * Render markdown content using ink-markdown for rich formatting
 * @param {string} content - The markdown content to render
 * @param {Object} options - Rendering options
 * @returns {Promise<void>}
 */
export async function renderMarkdownContent(content, options = {}) {
  const { 
    showBorder = false, 
    theme = 'default',
    width = process.stdout.columns || 80
  } = options;

  // Try to use ink-markdown first
  const inkAvailable = await initializeInkMarkdown();
  
  if (inkAvailable) {
    try {
      // Create the Markdown component with content
      const MarkdownComponent = () => (
        React.createElement(inkMarkdown, {
          children: content,
        })
      );

      // Render using ink
      const { unmount } = inkRender(React.createElement(MarkdownComponent));
      
      // Allow some time for rendering to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Unmount to clean up
      unmount();
      
      return;
    } catch (error) {
      console.warn(chalk.yellow('⚠️ ink-markdown rendering failed, using fallback'));
    }
  }
  
  // Fallback to simple renderer
  renderMarkdownSimple(content);
}

/**
 * Enhanced markdown renderer with additional features
 * @param {string} content - The markdown content
 * @param {Object} options - Rendering options
 */
export async function renderChatMessage(content, options = {}) {
  const {
    prefix = '🤖 AI:',
    showTimestamp = false,
    addSpacing = true
  } = options;

  // Add timestamp if requested
  if (showTimestamp) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(chalk.gray(`[${timestamp}]`));
  }

  // Show prefix
  if (prefix) {
    console.log(chalk.green.bold(prefix));
  }

  // Render the markdown content
  await renderMarkdownContent(content, options);

  // Add spacing
  if (addSpacing) {
    console.log();
  }
}

/**
 * Render system information with markdown formatting
 * @param {string} title - Section title
 * @param {string} content - System info content
 */
export async function renderSystemInfo(title, content) {
  const markdownContent = `## ${title}\n\n${content}`;
  await renderMarkdownContent(markdownContent, { showBorder: true });
}

/**
 * Render code blocks with syntax highlighting
 * @param {string} code - Code content
 * @param {string} language - Programming language
 */
export async function renderCodeBlock(code, language = '') {
  const markdownContent = `\`\`\`${language}\n${code}\n\`\`\``;
  await renderMarkdownContent(markdownContent);
}

/**
 * Render help content with proper formatting
 * @param {Array} commands - Array of command objects
 */
export async function renderHelpContent(commands) {
  let helpContent = '# Available Commands\n\n';
  
  commands.forEach(cmd => {
    helpContent += `## ${cmd.name}\n`;
    helpContent += `${cmd.description}\n\n`;
    if (cmd.examples && cmd.examples.length > 0) {
      helpContent += '**Examples:**\n';
      cmd.examples.forEach(example => {
        helpContent += `- \`${example}\`\n`;
      });
      helpContent += '\n';
    }
  });

  await renderMarkdownContent(helpContent);
}

/**
 * Fallback simple markdown renderer (for compatibility)
 * @param {string} content - Markdown content
 */
export function renderMarkdownSimple(content) {
  if (!content) return;
  
  let output = content
    // Bold **text** or __text__
    .replace(/\*\*(.*?)\*\*/g, (_, m) => chalk.bold(m))
    .replace(/__(.*?)__/g, (_, m) => chalk.bold(m))
    // Italic *text* or _text_
    .replace(/\*(.*?)\*/g, (_, m) => chalk.italic(m))
    .replace(/_(.*?)_/g, (_, m) => chalk.italic(m))
    // Inline code `code`
    .replace(/`([^`]+)`/g, (_, m) => chalk.yellow.bgBlack(` ${m} `))
    // Headers
    .replace(/^## (.*$)/gim, (_, m) => chalk.cyan.bold(`\n${m}\n${'─'.repeat(m.length)}`))
    .replace(/^# (.*$)/gim, (_, m) => chalk.green.bold(`\n${m}\n${'═'.repeat(m.length)}`))
    // Links [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => 
      `${chalk.cyan.underline(text)} ${chalk.gray(`(${url})`)}`
    );
  
  console.log(output);
}

/**
 * Choose the best rendering method based on content complexity
 * @param {string} content - Markdown content
 * @param {Object} options - Rendering options
 */
export async function smartRender(content, options = {}) {
  const { forceSimple = false } = options;
  
  // Check if content has complex markdown that benefits from ink-markdown
  const hasComplexMarkdown = content.includes('```') || 
                            content.includes('|') || 
                            content.includes('- [ ]') ||
                            content.includes('- [x]') ||
                            (content.match(/^#{1,6}\s/gm) || []).length > 2;

  if (hasComplexMarkdown && !forceSimple) {
    try {
      await renderMarkdownContent(content, options);
    } catch (error) {
      console.warn(chalk.yellow('⚠️ Falling back to simple renderer'));
      renderMarkdownSimple(content);
    }
  } else {
    renderMarkdownSimple(content);
  }
}
