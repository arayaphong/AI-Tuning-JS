import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

class GoogleAIEmbedding {
    constructor(options = {}) {
        // For Google AI embeddings, we can use API key authentication
        this.apiKey = process.env.GOOGLE_API_KEY;
        this.model = options.model || process.env.GOOGLE_AI_EMBEDDING_MODEL;
        
        if (!this.apiKey) {
            console.warn('⚠️  GOOGLE_API_KEY not found, Google AI embeddings unavailable');
            throw new Error('Google API key required for Google AI embeddings');
        }

        if (!this.model) {
            throw new Error('Google AI embedding model is required. Set GOOGLE_AI_EMBEDDING_MODEL environment variable or pass model in options.');
        }

        this.client = new GoogleGenerativeAI(this.apiKey);
        console.log('✅ Google AI Embedding Client Initialized');
    }

    async getEmbedding(text) {
        try {
            // Validate input
            if (!text || typeof text !== 'string' || text.trim().length === 0) {
                throw new Error('Text input is required and must be a non-empty string');
            }

            console.log('🔍 Generating embedding using Google AI...');
            
            // Use the embedding model
            const model = this.client.getGenerativeModel({ model: this.model });
            const result = await model.embedContent(text.trim());
            
            if (result.embedding && result.embedding.values) {
                console.log('✅ Google AI embedding generated successfully');
                return result.embedding.values;
            } else {
                throw new Error('Unexpected response format from Google AI');
            }

        } catch (error) {
            console.error('🚨 Error generating Google AI embedding:', error.message);
            throw new Error(`Google AI embedding generation failed: ${error.message}`);
        }
    }
}

export default GoogleAIEmbedding;
