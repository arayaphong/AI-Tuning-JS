#!/usr/bin/env node

/**
 * Main entry point for the AI Tuning JS Chatbot
 * Handles command line arguments and initializes the appropriate mode
 */

import dotenv from 'dotenv';
import { startChatbot, quickTest } from './src/cli-interface.js';
import { showSystemInfo } from './src/utils/display-utils.js';

// Load environment variables
dotenv.config();

/**
 * Main application entry point
 */
async function main() {
  // Extract configuration from environment variables
  const config = {
    project: process.env.GOOGLE_CLOUD_PROJECT,
    location: process.env.GOOGLE_CLOUD_LOCATION,
    apiKey: process.env.GOOGLE_AI_API_KEY
  };

  // Handle command line arguments
  if (process.argv.includes('--test')) {
    await quickTest(config);
  } else if (process.argv.includes('--system-info')) {
    await showSystemInfo();
    await startChatbot(config);
  } else {
    await startChatbot(config);
  }
}

// Start the application with error handling
main().catch(error => {
  console.error('❌ Application error:', error.message);
  process.exit(1);
});
