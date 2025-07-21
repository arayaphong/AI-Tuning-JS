import Model from './google-ai-model.js';

export const initializeGoogleAI = async (config = {}) => {
  try {
    const model = new Model(config);
    console.log('🚀 Google AI model initialized successfully');
    return model;
  } catch (error) {
    console.error('❌ Failed to initialize Google AI:', error.message);
    throw new Error(`AI initialization failed: ${error.message}`);
  }
};

export const generateContent = async (model, prompt, options = {}) => {
  if (!model) {
    throw new Error('Model instance is required');
  }
  if (!prompt?.trim()) {
    throw new Error('Valid prompt is required');
  }

  const { 
    conversationHistory = [], 
    maxHistoryLength = 10 
  } = options;

  try {
    let enhancedPrompt = '';

    if (conversationHistory?.length > 0) {
      const recentHistory = conversationHistory.slice(-maxHistoryLength);
      
      enhancedPrompt += '--- CONVERSATION HISTORY ---\n';
      
      recentHistory.forEach(({ role, content }) => {
        const displayRole = role === 'user' ? 'User' : 'Assistant';
        enhancedPrompt += `${displayRole}: ${content}\n\n`;
      });
      
      enhancedPrompt += '--- END CONVERSATION HISTORY ---\n\n';
    }

    enhancedPrompt += `Current User Message: ${prompt}`;

    return await model.generateContent(enhancedPrompt);

  } catch (error) {
    console.error('🚨 Error in generateContent:', error.message);
    throw new Error(`Content generation failed: ${error.message}`);
  }
};