import fs from 'fs';
import Model from './google-ai-model.js';
import { processShellCommands } from './shell-processor.js';

/**
 * RELIABLE SHELL COMMAND SYSTEM - NO FUNCTION CALLING
 * This approach uses keyword detection and direct shell execution
 * Shell commands are now handled by separate modules for better organization
 */

/**
 * Initialize Google AI - SIMPLE VERSION (NO TOOLS)
 */
export async function initializeGoogleAI(config = {}) {
  // Import the Model class from @google/generative-ai
  return new Model();
}

const generateShellCommand = async (model, conversationContext, prompt) => {
  prompt = conversationContext + prompt;

  // Load bash prompt template from external file
  const bashPrompt = fs.readFileSync('prompts/bash-prompt.txt', 'utf8');
  const bashCommandPrompt = bashPrompt.replace('${prompt}', prompt);
  const responseText = await model.generateContent(bashCommandPrompt);

  if (!responseText.includes('#shell')) return responseText;

  const bashCommandMatch = responseText.match(/```bash\n(.*?)\n```/s);
  responseText = bashCommandMatch ? bashCommandMatch[1] : responseText;

  // Sanitize: remove zero-width and other non-printable characters, then trim
  const command = responseText
    .replace(/[\x00-\x1F\x7F\u200B-\u200D\u2060\uFEFF]/g, '')
    .trim();

  // If the command starts with "bash" (e.g., "bash# ..."), extract only the comment part
  let finalCommand = command;
  const bashContent = command.match(/```bash\n(.*?)\n```/s);
  if (bashContent) {
    const comment = bashContent[1].match(/#.*$/m);
    finalCommand = comment ? comment[0] : null;
  }

  // Extract the comment part if it exists
  const match = finalCommand.match(/#.*$/);
  finalCommand = match ? match[0] : finalCommand;

  // Unwrap any kind of quote
  finalCommand = finalCommand.replace(/['"`]/g, '').trim();

  return finalCommand;
};
/**
 * Generate content with shell command detection and conversation context - RELIABLE VERSION
 */
export async function generateContent(model, prompt, options = {}) {
  if (!model || !prompt) {
    throw new Error('Model and prompt are required');
  }

  const { conversationHistory = [] } = options;

  try {
    // Build conversation context
    let conversationContext = retrieveRecentMessages(conversationHistory);

    let googleAiResponses = [];
    if (!prompt.startsWith('#shell')) {
      const commandOutput = await generateShellCommand(model, conversationContext, prompt);
      let commands = extractBashCommands(commandOutput);
      if (commands.length > 0) {
        commands = commands.map(cmd => `#shell ${cmd}`);
      } else {
        commands = [];
      }
      for (const cmd of commands) {
        googleAiResponses.push(await processShellCommands(cmd));
      }
    } else {
      googleAiResponses.push(await processShellCommands(prompt));
    }

    // Build enhanced prompt with context and current message
    let enhancedPrompt = '';

    // Add conversation context if available
    if (conversationContext) {
      enhancedPrompt += conversationContext;
    }

    // Add current user message
    enhancedPrompt += `Current User Message: ${prompt}\n\n`;

    // Add shell command results if any
    if (googleAiResponses.length > 0) {
      enhancedPrompt += '--- SYSTEM DATA ---\n' + googleAiResponses.join('\n\n') +
        '\n--- END SYSTEM DATA ---\n\n';
    }

    // Simple generate content call - NO FUNCTION CALLING
    return await model.generateContent(enhancedPrompt);

  } catch (error) {
    console.error('Error in generateContent:', error.message);
    throw error;
  }
}

function retrieveRecentMessages(conversationHistory) {
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
  return contextPrompt;
}

function extractBashCommands(text) {
  const commands = [];

  // Try both patterns: escaped backticks and regular backticks
  const patterns = [
    // Pattern 1: Regular backticks (```bash ... ```)
    /```bash\n([\s\S]*?)\n```/g,
    // Pattern 2: Escaped backticks (\`\`\`bash ... \`\`\`)
    /\\`\\`\\`bash\n([\s\S]*?)\n\\`\\`\\`/g
  ];

  patterns.forEach(regex => {
    let match;
    while ((match = regex.exec(text)) !== null) {
      const commandContent = match[1].trim();

      // Split by newlines in case there are multiple commands in one block
      const commandLines = commandContent.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('#'));

      commands.push(...commandLines);
    }
  });

  // Return distinct/unique commands only
  return [...new Set(commands)];
}