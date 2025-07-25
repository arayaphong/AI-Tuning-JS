import { GoogleAuth } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

class VertexAIEmbeddingREST {
    constructor(options = {}) {
        const {
            project = process.env.GOOGLE_CLOUD_PROJECT,
            location = process.env.GOOGLE_CLOUD_LOCATION,
            model = process.env.VERTEX_AI_MODEL,
            scopes = process.env.GOOGLE_AUTH_SCOPES?.split(',') || []
        } = options;

        if (!project) {
            throw new Error('Google Cloud Project ID is required. Set GOOGLE_CLOUD_PROJECT environment variable or pass project in options.');
        }
        if (!location) {
            throw new Error('Google Cloud Location is required. Set GOOGLE_CLOUD_LOCATION environment variable or pass location in options.');
        }
        if (!model) {
            throw new Error('Vertex AI Model is required. Set VERTEX_AI_MODEL environment variable or pass model in options.');
        }
        if (!scopes || scopes.length === 0) {
            throw new Error('Google Auth Scopes are required. Set GOOGLE_AUTH_SCOPES environment variable or pass scopes in options.');
        }

        this.project = project;
        this.location = location;
        this.model = model;
        this.auth = new GoogleAuth({
            scopes: scopes
        });
        
        console.log(`✅ Vertex AI REST Embedding Client Initialized: ${this.model} in ${this.location}`);
    }

    async getEmbedding(text, options = {}) {
        try {
            // Validate input
            if (!text || typeof text !== 'string' || text.trim().length === 0) {
                throw new Error('Text input is required and must be a non-empty string');
            }

            const {
                taskType = process.env.VERTEX_AI_TASK_TYPE,
                autoTruncate = process.env.VERTEX_AI_AUTO_TRUNCATE === 'true',
                outputDimensionality = process.env.VERTEX_AI_OUTPUT_DIMENSIONALITY ? parseInt(process.env.VERTEX_AI_OUTPUT_DIMENSIONALITY) : undefined
            } = options;

            if (!taskType) {
                throw new Error('Task type is required. Set VERTEX_AI_TASK_TYPE environment variable or pass taskType in options.');
            }

            // Get access token with proper method
            const authClient = await this.auth.getClient();
            const accessToken = await authClient.getAccessToken();
            
            if (!accessToken?.token) {
                throw new Error('Failed to get access token');
            }

            console.log(`🔍 Using model: ${this.model}`);
            
            const url = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.project}/locations/${this.location}/publishers/google/models/${this.model}:predict`;
            
            const requestBody = {
                instances: [
                    {
                        content: text.trim(),
                        task_type: taskType
                    }
                ],
                parameters: {}
            };

            // Only add parameters if they are defined
            if (autoTruncate !== undefined) {
                requestBody.parameters.autoTruncate = autoTruncate;
            }
            if (outputDimensionality !== undefined) {
                requestBody.parameters.outputDimensionality = outputDimensionality;
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const result = await response.json();
            
            if (result.predictions && result.predictions.length > 0) {
                const prediction = result.predictions[0];
                
                if (prediction.embeddings && prediction.embeddings.values) {
                    console.log(`✅ Embedding generated successfully using ${this.model} (${prediction.embeddings.values.length} dimensions)`);
                    return prediction.embeddings.values;
                }
            }
            
            throw new Error(`Unexpected response format: ${JSON.stringify(result, null, 2)}`);

        } catch (error) {
            console.error('🚨 Error generating Vertex AI embedding:', error.message);
            throw new Error(`Vertex AI embedding generation failed: ${error.message}`);
        }
    }
}

export default VertexAIEmbeddingREST;
