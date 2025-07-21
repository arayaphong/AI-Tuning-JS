import { GoogleGenAI } from '@google/genai';

class Model {
    #ai;
    #model;
    #generationConfig;

    static DEFAULT_CONFIG = {
        project: 'gen-lang-client-0312359180',
        location: 'global',
        model: 'gemini-2.5-flash',
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
            generationConfig = {}
        } = options;

        this.#ai = new GoogleGenAI({
            vertexai: true,
            project,
            location,
        });
        
        this.#model = model;

        this.#generationConfig = {
            maxOutputTokens: Model.DEFAULT_CONFIG.maxOutputTokens,
            temperature: Model.DEFAULT_CONFIG.temperature,
            topP: Model.DEFAULT_CONFIG.topP,
            seed: Model.DEFAULT_CONFIG.seed,
            safetySettings: Model.SAFETY_SETTINGS,
            ...generationConfig
        };
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

    get model() {
        return this.#model;
    }

    get config() {
        return { ...this.#generationConfig };
    }
}

export default Model;
