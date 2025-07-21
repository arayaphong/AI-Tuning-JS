import Model from './google-ai-model.js';

export async function initializeGoogleAI(config = {}) {
  return new Model();
}

export async function generateContent(model, prompt, options = {}) {
  if (!model || !prompt) {
    throw new Error('Model and prompt are required');
  }

  const { conversationHistory = [] } = options;

  try {
    let enhancedPrompt = '';

    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-10);
      enhancedPrompt += '--- CONVERSATION HISTORY ---\n';
      recentHistory.forEach((message) => {
        const role = message.role === 'user' ? 'User' : 'Assistant';
        enhancedPrompt += `${role}: ${message.content}\n\n`;
      });
      enhancedPrompt += '--- END CONVERSATION HISTORY ---\n\n';
    }

    enhancedPrompt += `Current User Message: ${prompt}`;

    return await model.generateContent(enhancedPrompt);

  } catch (error) {
    console.error('Error in generateContent:', error.message);
    throw error;
  }
}