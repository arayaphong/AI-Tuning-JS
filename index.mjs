#!/usr/bin/env node

import { initializeGoogleAI, generateContent } from './src/utils/google-ai-integration.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Demonstrates Google AI integration capabilities
 * @returns {Promise<void>}
 */
async function generate() {
    console.log('🚀 Testing Gemini AI...');

    const { GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_LOCATION, GOOGLE_AI_API_KEY } = process.env;

    try {
        // Initialize the AI model
        const model = await initializeGoogleAI({
            project: GOOGLE_CLOUD_PROJECT,
            location: GOOGLE_CLOUD_LOCATION,
            apiKey: GOOGLE_AI_API_KEY
        });

        // Generate content with a simple prompt
        const text = await generateContent(model, "Hello! Please respond with a friendly greeting.");

        console.log('\n📥 Response:');
        console.log(text);
        console.log('\n✅ Success! 🎉');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

generate();
