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
        project: 'gen-lang-client-0312359180',
        location: 'us-central1',
        model: 'gemini-2.5-flash',
        embeddingModel: 'text-embedding-004',
        maxOutputTokens: 65535,
        temperature: 1,
        topP: 1,
        seed: 0
    };

    static SAFETY_SETTINGS = [
        {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'OFF',
        },
        {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'OFF',
        },
        {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'OFF',
        },
        {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'OFF',
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
            safetySettings: Model.SAFETY_SETTINGS,
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
