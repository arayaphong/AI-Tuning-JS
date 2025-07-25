import { PredictionServiceClient } from '@google-cloud/aiplatform';
import dotenv from 'dotenv';

dotenv.config();

class VertexAIEmbedding {
    constructor(options = {}) {
        const {
            project = process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0312359180',
            location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
            model = 'text-embedding-004'
        } = options;

        this.project = project;
        this.location = location;
        this.model = model;

        const clientOptions = {
            apiEndpoint: `${location}-aiplatform.googleapis.com`,
        };

        this.client = new PredictionServiceClient(clientOptions);
        console.log(`✅ Vertex AI Embedding Client Initialized: ${this.model} in ${this.location}`);
    }

    async getEmbedding(text) {
        try {
            // Validate input
            if (!text || typeof text !== 'string' || text.trim().length === 0) {
                throw new Error('Text input is required and must be a non-empty string');
            }

            // Correct request format for Vertex AI embedding API
            const instances = [
                {
                    content: text.trim(),
                    task_type: "RETRIEVAL_DOCUMENT" // For document storage/indexing
                }
            ];

            const parameters = {
                autoTruncate: true,
                outputDimensionality: 768 // Use 768 dimensions for compatibility
            };

            // Try different models in priority order
            const modelCombinations = [
                // Current recommended models
                { endpoint: `projects/${this.project}/locations/${this.location}/publishers/google/models/text-embedding-005`, model: 'text-embedding-005' },
                { endpoint: `projects/${this.project}/locations/${this.location}/publishers/google/models/gemini-embedding-001`, model: 'gemini-embedding-001' },
                { endpoint: `projects/${this.project}/locations/${this.location}/publishers/google/models/text-multilingual-embedding-002`, model: 'text-multilingual-embedding-002' },
                
                // Legacy models for fallback
                { endpoint: `projects/${this.project}/locations/${this.location}/publishers/google/models/textembedding-gecko@003`, model: 'textembedding-gecko@003' },
                { endpoint: `projects/${this.project}/locations/${this.location}/publishers/google/models/textembedding-gecko@latest`, model: 'textembedding-gecko@latest' }
            ];

            for (const { endpoint, model } of modelCombinations) {
                try {
                    console.log(`🔍 Trying: ${model} at ${endpoint}`);
                    
                    // Adjust request for gemini-embedding-001 (single instance only)
                    const requestInstances = model === 'gemini-embedding-001' 
                        ? [{ content: text.trim() }] // Gemini embedding doesn't use task_type
                        : instances;
                    
                    const request = {
                        endpoint,
                        instances: requestInstances,
                        parameters
                    };

                    const [response] = await this.client.predict(request);

                    if (response.predictions && response.predictions.length > 0) {
                        const prediction = response.predictions[0];
                        
                        // Handle different response formats
                        if (prediction.embeddings && prediction.embeddings.values) {
                            console.log(`✅ Embedding generated successfully using ${model} (${prediction.embeddings.values.length} dimensions)`);
                            return prediction.embeddings.values;
                        } else if (prediction.values) {
                            console.log(`✅ Embedding generated successfully using ${model} (${prediction.values.length} dimensions)`);
                            return prediction.values;
                        } else if (Array.isArray(prediction.embeddings)) {
                            console.log(`✅ Embedding generated successfully using ${model} (${prediction.embeddings.length} dimensions)`);
                            return prediction.embeddings;
                        } else {
                            console.log(`📝 Response structure for ${model}:`, JSON.stringify(prediction, null, 2));
                        }
                    }
                } catch (endpointError) {
                    console.log(`❌ ${model} failed:`, endpointError.message.substring(0, 150));
                    continue; // Try next combination
                }
            }

            throw new Error('All embedding models and endpoints failed');

        } catch (error) {
            console.error('🚨 Error generating Vertex AI embedding:', error.message);
            console.error('Full error:', error);
            throw new Error(`Vertex AI embedding generation failed: ${error.message}`);
        }
    }
}

export default VertexAIEmbedding;
