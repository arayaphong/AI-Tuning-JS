import { VertexAI } from '@google-cloud/vertexai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { processShellCommands } from './shell-processor.js';
import { listShellCommands } from './shell-commands.js';
import fs from 'fs';

/**
 * RELIABLE SHELL COMMAND SYSTEM - NO FUNCTION CALLING
 * This approach uses keyword detection and direct shell execution
 * Shell commands are now handled by separate modules for better organization
 */

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

const generateShellCommand = async (model, conversationContext, prompt) => {
  prompt = conversationContext + prompt;

  // Load bash prompt template from external file
  const bashPrompt = fs.readFileSync('prompts/bash-prompt.txt', 'utf8');
  const bashCommandPrompt = bashPrompt.replace('${prompt}', prompt);
  const response = await model.generateContent(bashCommandPrompt);

  // Convert the model response to plain text ✅
  const raw = response?.response ?? response; // Handle both SDK shapes
  let commandText = '';

  if (raw?.candidates?.[0]?.content?.parts?.[0]?.text) {
    // Vertex AI style
    commandText = raw.candidates[0].content.parts[0].text;
  } else if (raw?.text) {
    // google-generative-ai style
    commandText = typeof raw.text === 'function' ? await raw.text() : raw.text;
  }

  if (!commandText.includes('#shell')) return commandText;

  const m = commandText.match(/```bash\n(.*?)\n```/s);
  commandText = m ? m[1] : commandText;

  // Sanitize: remove zero-width and other non-printable characters, then trim
  const command = commandText
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
      googleAiResponses = commandOutput.includes('#shell')
        ? await processShellCommands(commandOutput)
        : [];
    } else {
      const commands = extractBashCommands(prompt);
      if (commands.length > 0) {
        commands = commands.map(cmd => `#shell ${cmd}`).join('\n');
      }
      commands.forEach(async cmd => {
        googleAiResponses.push(await processShellCommands(cmd));
      });
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
export { listShellCommands };

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
  // Regular expression to match bash code blocks
  const bashCodeBlockRegex = /```bash\n([\s\S]*?)\n```/g;
  const commands = [];
  let match;

  // Find all bash code blocks
  while ((match = bashCodeBlockRegex.exec(text)) !== null) {
    // Extract the command content (group 1)
    const commandContent = match[1].trim();

    // Split by newlines in case there are multiple commands in one block
    const commandLines = commandContent.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('#')); // Remove empty lines and comments

    commands.push(...commandLines);
  }

  // Return distinct/unique commands only
  return [...new Set(commands)];
}