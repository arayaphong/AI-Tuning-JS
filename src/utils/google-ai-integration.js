import { VertexAI } from '@google-cloud/vertexai';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Initializes a connection to Google's generative AI services.
 * @param {Object} config - Configuration options
 * @param {string} [config.project] - Google Cloud Project ID
 * @param {string} [config.location='us-central1'] - Google Cloud location
 * @param {string} [config.apiKey] - Google AI API key
 * @param {string} [config.vertexModel='gemini-2.5-flash'] - Model name for Vertex AI
 * @param {string} [config.apiKeyModel='gemini-pro'] - Model name for API key auth
 * @returns {Object} Initialized generative model
 * @throws {Error} If authentication fails
 */
export async function initializeGoogleAI(config = {}) {
  const {
    project,
    location = 'us-central1',
    apiKey,
    vertexModel = 'gemini-2.5-flash',
    apiKeyModel = 'gemini-pro'
  } = config;

  if (!project && !apiKey) {
    throw new Error('No authentication found. Set project or apiKey');
  }

  let model;

  // Try Vertex AI first, then API key
  if (project) {
    const vertexAI = new VertexAI({ project, location });
    model = vertexAI.getGenerativeModel({ model: vertexModel });
    console.log('✅ Using Vertex AI');
  } else if (apiKey) {
    const client = new GoogleGenerativeAI(apiKey);
    model = client.getGenerativeModel({ model: apiKeyModel });
    console.log('✅ Using API key');
  }

  return model;
}

/**
 * Generates content using Google's AI models.
 * @param {Object} model - Initialized Google AI model
 * @param {string} prompt - Text prompt to send to the model
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.stream=false] - Whether to stream the response
 * @returns {Promise<string>} Generated text
 */
export async function generateContent(model, prompt, options = {}) {
  const { stream = false } = options;

  if (!model) {
    throw new Error('Model not initialized');
  }

  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Valid prompt string is required');
  }

  if (stream) {
    // Implement streaming response handling (not implemented in this version)
    throw new Error('Streaming not implemented yet.');
  }

  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text ? response.text() : response.candidates?.[0]?.content?.parts?.[0]?.text;
}
