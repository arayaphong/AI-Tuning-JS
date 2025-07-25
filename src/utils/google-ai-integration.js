import { GoogleGenAI } from '@google/genai';
import VertexAIEmbeddingREST from './vertex-ai-embedding-rest.js';
import GoogleAIEmbedding from './google-ai-embedding.js';
import SimpleEmbedding from './simple-embedding.js';

class Model {
    #ai;
    #model;
    #embeddingModel;
    #generationConfig;
    #embeddingClients;

    static DEFAULT_CONFIG = {
        project: process.env.GOOGLE_CLOUD_PROJECT,
        location: process.env.GOOGLE_CLOUD_LOCATION,
        model: process.env.GOOGLE_CLOUD_VERTEX_MODEL,
        embeddingModel: process.env.VERTEX_AI_MODEL,
        maxOutputTokens: process.env.MAX_OUTPUT_TOKENS ? parseInt(process.env.MAX_OUTPUT_TOKENS) : undefined,
        temperature: process.env.TEMPERATURE ? parseFloat(process.env.TEMPERATURE) : undefined,
        topP: process.env.TOP_P ? parseFloat(process.env.TOP_P) : undefined,
        seed: process.env.SEED ? parseInt(process.env.SEED) : undefined
    };

    static SAFETY_SETTINGS = [
        {
            category: process.env.HARM_CATEGORY_HATE_SPEECH,
            threshold: process.env.SAFETY_THRESHOLD,
        },
        {
            category: process.env.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: process.env.SAFETY_THRESHOLD,
        },
        {
            category: process.env.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: process.env.SAFETY_THRESHOLD,
        },
        {
            category: process.env.HARM_CATEGORY_HARASSMENT,
            threshold: process.env.SAFETY_THRESHOLD,
        },
    ];

    constructor(options = {}) {
        const {
            project = Model.DEFAULT_CONFIG.project,
            location = Model.DEFAULT_CONFIG.location,
            model = Model.DEFAULT_CONFIG.model,
            embeddingModel = Model.DEFAULT_CONFIG.embeddingModel,
            generationConfig = {}
        } = options;

        // Validate required parameters
        if (!project) {
            throw new Error('Google Cloud Project ID is required. Set GOOGLE_CLOUD_PROJECT environment variable or pass project in options.');
        }
        if (!location) {
            throw new Error('Google Cloud Location is required. Set GOOGLE_CLOUD_LOCATION environment variable or pass location in options.');
        }
        if (!model) {
            throw new Error('Google Cloud Vertex Model is required. Set GOOGLE_CLOUD_VERTEX_MODEL environment variable or pass model in options.');
        }
        if (!embeddingModel) {
            throw new Error('Vertex AI Model is required. Set VERTEX_AI_MODEL environment variable or pass embeddingModel in options.');
        }

        // Validate configuration parameters
        const requiredConfig = ['maxOutputTokens', 'temperature', 'topP', 'seed'];
        for (const param of requiredConfig) {
            if (Model.DEFAULT_CONFIG[param] === undefined) {
                throw new Error(`${param.toUpperCase()} is required. Set ${param.toUpperCase()} environment variable.`);
            }
        }

        // Validate safety settings
        const validSafetySettings = Model.SAFETY_SETTINGS.filter(setting => 
            setting.category && setting.threshold
        );
        if (validSafetySettings.length === 0) {
            throw new Error('Safety settings are required. Set HARM_CATEGORY_* and SAFETY_THRESHOLD environment variables.');
        }

        this.#ai = new GoogleGenAI({
            vertexai: true,
            project,
            location,
        });
        
        this.#model = model;
        this.#embeddingModel = embeddingModel;

        this.#generationConfig = {
            maxOutputTokens: Model.DEFAULT_CONFIG.maxOutputTokens,
            temperature: Model.DEFAULT_CONFIG.temperature,
            topP: Model.DEFAULT_CONFIG.topP,
            seed: Model.DEFAULT_CONFIG.seed,
            safetySettings: validSafetySettings,
            ...generationConfig
        };

        // Initialize embedding client with fallback options
        this.#embeddingClients = [];
        
        // Try Vertex AI first (using REST client)
        try {
            const vertexAI = new VertexAIEmbeddingREST({
                project,
                location,
                model: embeddingModel
            });
            this.#embeddingClients.push({ client: vertexAI, name: 'Vertex AI' });
        } catch (error) {
            console.warn('⚠️  Vertex AI embedding not available');
        }

        // Try Google AI as second option (uses API key)
        try {
            const googleAI = new GoogleAIEmbedding();
            this.#embeddingClients.push({ client: googleAI, name: 'Google AI' });
        } catch (error) {
            console.warn('⚠️  Google AI embedding not available');
        }

        // Always add Simple embedding as final fallback
        try {
            const simpleEmbedding = new SimpleEmbedding();
            this.#embeddingClients.push({ client: simpleEmbedding, name: 'Simple Hash' });
        } catch (error) {
            console.warn('⚠️  Simple embedding fallback failed');
        }

        console.log(`✅ Generative Model Initialized: ${this.#model}`);
        console.log(`✅ Embedding Model Initialized: ${this.#embeddingModel}`);
    }

    async generateContent(prompt) {
        try {
            const req = {
                model: this.#model,
                contents: [prompt],
                config: this.#generationConfig,
            };

            const streamingResp = await this.#ai.models.generateContentStream(req);
            
            const getStreamedContent = async (stream) => {
                let text = '';
                for await (const chunk of stream) {
                    text += chunk.text ?? JSON.stringify(chunk) + '\n';
                }
                return text;
            };
            
            return await getStreamedContent(streamingResp);
        } catch (error) {
            console.error('🚨 Error generating content:', error.message);
            throw new Error(`AI content generation failed: ${error.message}`);
        }
    }

    async getEmbedding(text) {
        // Try each embedding client in order until one succeeds
        for (const { client, name } of this.#embeddingClients) {
            try {
                console.log(`🔍 Attempting embedding with ${name}...`);
                const embedding = await client.getEmbedding(text);
                console.log(`✅ Embedding successful with ${name}`);
                return embedding;
            } catch (error) {
                console.warn(`⚠️  ${name} embedding failed: ${error.message}`);
                continue; // Try next client
            }
        }
        
        // If all clients fail, throw error
        throw new Error('All embedding clients failed');
    }

    get model() {
        return this.#model;
    }

    get config() {
        return { ...this.#generationConfig };
    }
}

export default Model;
