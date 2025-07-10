import { VertexAI } from '@google-cloud/vertexai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { processShellCommands } from './shell-processor.js';
import { listShellCommands } from './shell-commands.js';

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
export { listShellCommands };