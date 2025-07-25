import { GoogleAuth } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

class VertexAIEmbeddingREST {
    constructor(options = {}) {
        const {
            project = process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0312359180',
            location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
            model = 'text-embedding-004'
        } = options;

        this.project = project;
        this.location = location;
        this.model = model;
        this.auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });
        
        console.log(`✅ Vertex AI REST Embedding Client Initialized: ${this.model} in ${this.location}`);
    }

    async getEmbedding(text) {
        try {
            // Validate input
            if (!text || typeof text !== 'string' || text.trim().length === 0) {
                throw new Error('Text input is required and must be a non-empty string');
            }

            // Get access token with proper method
            const authClient = await this.auth.getClient();
            const accessToken = await authClient.getAccessToken();
            
            if (!accessToken?.token) {
                throw new Error('Failed to get access token');
            }

            // Try multiple embedding models in order of preference
            const models = [
                'text-embedding-004',
                'textembedding-gecko@003',
                'textembedding-gecko@002',
                'textembedding-gecko@001'
            ];

            for (const model of models) {
                try {
                    console.log(`🔍 Trying: ${model}`);
                    
                    const url = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.project}/locations/${this.location}/publishers/google/models/${model}:predict`;
                    
                    const requestBody = {
                        instances: [
                            {
                                content: text.trim(),
                                task_type: "RETRIEVAL_DOCUMENT"
                            }
                        ],
                        parameters: {
                            autoTruncate: true,
                            outputDimensionality: 768
                        }
                    };

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
                        console.log(`❌ ${model} failed: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`);
                        continue;
                    }

                    const result = await response.json();
                    
                    if (result.predictions && result.predictions.length > 0) {
                        const prediction = result.predictions[0];
                        
                        if (prediction.embeddings && prediction.embeddings.values) {
                            console.log(`✅ Embedding generated successfully using ${model} (${prediction.embeddings.values.length} dimensions)`);
                            return prediction.embeddings.values;
                        }
                    }
                    
                    console.log(`📝 Unexpected response format from ${model}:`, JSON.stringify(result, null, 2));
                    
                } catch (modelError) {
                    console.log(`❌ ${model} error:`, modelError.message);
                    continue;
                }
            }

            throw new Error('All embedding models failed');

        } catch (error) {
            console.error('🚨 Error generating Vertex AI embedding:', error.message);
            throw new Error(`Vertex AI embedding generation failed: ${error.message}`);
        }
    }
}

export default VertexAIEmbeddingREST;
