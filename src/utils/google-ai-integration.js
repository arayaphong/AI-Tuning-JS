/**
 * Lean Google AI Integration - Simple content generation without shell commands
 */

import Model from './google-ai-model.js';

/**
 * Initialize Google AI - Simple version
 */
export async function initializeGoogleAI(config = {}) {
  return new Model();
}

/**
 * Generate content with conversation context - Simple version
 */
export async function generateContent(model, prompt, options = {}) {
  if (!model || !prompt) {
    throw new Error('Model and prompt are required');
  }

  const { conversationHistory = [] } = options;

  try {
    // Build conversation context from history
    let enhancedPrompt = '';

    // Add conversation context if available (last 10 messages to avoid token limits)
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-10);
      enhancedPrompt += '--- CONVERSATION HISTORY ---\n';
      recentHistory.forEach((message) => {
        const role = message.role === 'user' ? 'User' : 'Assistant';
        enhancedPrompt += `${role}: ${message.content}\n\n`;
      });
      enhancedPrompt += '--- END CONVERSATION HISTORY ---\n\n';
    }

    // Add current user message
    enhancedPrompt += `Current User Message: ${prompt}`;

    // Generate content
    return await model.generateContent(enhancedPrompt);

  } catch (error) {
    console.error('Error in generateContent:', error.message);
    throw error;
  }
}