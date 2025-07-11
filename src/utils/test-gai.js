import { GoogleGenAI } from '@google/genai';

class Model {
    constructor(options = {}) {
        // Initialize Vertex with your Cloud project and location
        this.ai = new GoogleGenAI({
            vertexai: true,
            project: options.project || 'gen-lang-client-0312359180',
            location: options.location || 'global',
        });
        this.model = options.model || 'gemini-2.5-flash';

        // Set up generation config
        this.generationConfig = options.generationConfig || {
            maxOutputTokens: 65535,
            temperature: 1,
            topP: 1,
            seed: 0,
            safetySettings: [
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
            ],
        };
    }

    async generateContent(prompt) {
        const req = {
            model: this.model,
            contents: [prompt],
            config: this.generationConfig,
        };

        const streamingResp = await this.ai.models.generateContentStream(req);

        for await (const chunk of streamingResp) {
            if (chunk.text) {
                process.stdout.write(chunk.text);
            } else {
                process.stdout.write(JSON.stringify(chunk) + '\n');
            }
        }
    }
}

export default Model;

// Example usage:
// async function main() {
//     const model = new Model();
//     await model.generateContent('hello world');
// }
// main();