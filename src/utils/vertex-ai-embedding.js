import { PredictionServiceClient } from '@google-cloud/aiplatform';
import dotenv from 'dotenv';

dotenv.config();

class VertexAIEmbedding {
    constructor(options = {}) {
        const {
            project = process.env.GOOGLE_CLOUD_PROJECT,
            location = process.env.GOOGLE_CLOUD_LOCATION,
            model = process.env.VERTEX_AI_MODEL
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

        this.project = project;
        this.location = location;
        this.model = model;

        const clientOptions = {
            apiEndpoint: `${location}-aiplatform.googleapis.com`,
        };

        this.client = new PredictionServiceClient(clientOptions);
        console.log(`✅ Vertex AI Embedding Client Initialized: ${this.model} in ${this.location}`);
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

            // Correct request format for Vertex AI embedding API
            const instances = [
                {
                    content: text.trim(),
                    task_type: taskType
                }
            ];

            const parameters = {};
            if (autoTruncate !== undefined) {
                parameters.autoTruncate = autoTruncate;
            }
            if (outputDimensionality !== undefined) {
                parameters.outputDimensionality = outputDimensionality;
            }

            // Use the configured model directly instead of trying multiple models
            console.log(`🔍 Using model: ${this.model}`);
            
            const endpoint = `projects/${this.project}/locations/${this.location}/publishers/google/models/${this.model}`;
            
            const request = {
                endpoint,
                instances,
                parameters
            };

            const [response] = await this.client.predict(request);

            if (response.predictions && response.predictions.length > 0) {
                const prediction = response.predictions[0];
                
                // Handle different response formats
                if (prediction.embeddings && prediction.embeddings.values) {
                    console.log(`✅ Embedding generated successfully using ${this.model} (${prediction.embeddings.values.length} dimensions)`);
                    return prediction.embeddings.values;
                } else if (prediction.values) {
                    console.log(`✅ Embedding generated successfully using ${this.model} (${prediction.values.length} dimensions)`);
                    return prediction.values;
                } else if (Array.isArray(prediction.embeddings)) {
                    console.log(`✅ Embedding generated successfully using ${this.model} (${prediction.embeddings.length} dimensions)`);
                    return prediction.embeddings;
                }
            }
            
            throw new Error(`Unexpected response format: ${JSON.stringify(response, null, 2)}`);

        } catch (error) {
            console.error('🚨 Error generating Vertex AI embedding:', error.message);
            throw new Error(`Vertex AI embedding generation failed: ${error.message}`);
        }
    }
}

export default VertexAIEmbedding;
