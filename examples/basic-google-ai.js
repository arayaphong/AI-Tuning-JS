import { config } from 'dotenv';
import { initializeGoogleAI, generateContent } from '../src/utils/google-ai-integration.js';

config();

(async () => {
  try {
    const { GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_LOCATION, GOOGLE_AI_API_KEY } = process.env;
    const model = await initializeGoogleAI({
      project: GOOGLE_CLOUD_PROJECT,
      location: GOOGLE_CLOUD_LOCATION,
      apiKey: GOOGLE_AI_API_KEY
    });
    const text = await generateContent(model, 'Say hello from the example script!');
    console.log('📥 Example Response:', text);
  } catch (err) {
    console.error('❌ Example Error:', err.message);
  }
})();
