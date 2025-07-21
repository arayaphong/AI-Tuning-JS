import Model from './google-ai-model.js';

/**
 * Initialize Google AI model with configuration
 * @param {Object} config - Configuration options for the AI model
 * @returns {Promise<Model>} Initialized AI model instance
 */
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

/**
 * Generate content with conversation history support
 * @param {Model} model - The AI model instance
 * @param {string} prompt - The user prompt
 * @param {Object} options - Additional options
 * @param {Array} options.conversationHistory - Previous conversation messages
 * @param {number} options.maxHistoryLength - Maximum history length to include
 * @returns {Promise<string>} Generated response
 */
export const generateContent = async (model, prompt, options = {}) => {
  // Input validation with early returns
  if (!model) {
    throw new Error('Model instance is required');
  }
  if (!prompt?.trim()) {
    throw new Error('Valid prompt is required');
  }

  // Destructuring with defaults
  const { 
    conversationHistory = [], 
    maxHistoryLength = 10 
  } = options;

  try {
    let enhancedPrompt = '';

    // Use optional chaining and modern array methods
    if (conversationHistory?.length > 0) {
      const recentHistory = conversationHistory.slice(-maxHistoryLength);
      
      enhancedPrompt += '--- CONVERSATION HISTORY ---\n';
      
      // Using array methods with arrow functions
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