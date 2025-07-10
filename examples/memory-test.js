#!/usr/bin/env node

/**
 * Test conversation memory functionality
 * Tests if the AI can remember information from previous messages
 */

import { initializeGoogleAI, generateContent } from '../src/utils/google-ai-integration.js';
import { SessionManager } from '../src/utils/session-manager.js';
import chalk from 'chalk';
import dotenv from 'dotenv';

dotenv.config();

async function testConversationMemory() {
  console.log(chalk.cyan.bold('🧠 Testing Conversation Memory\n'));

  try {
    // Initialize session manager and AI
    const sessionManager = new SessionManager();
    await sessionManager.initialize();

    const model = await initializeGoogleAI({
      project: process.env.GOOGLE_CLOUD_PROJECT,
      location: process.env.GOOGLE_CLOUD_LOCATION,
      apiKey: process.env.GOOGLE_AI_API_KEY
    });

    console.log(chalk.green('✅ AI and session manager initialized\n'));

    // Test scenario 1: User introduces themselves
    console.log(chalk.blue('👤 Test User: My name is Arme from Bangkok, Thailand.'));
    sessionManager.addMessage('user', 'My name is Arme from Bangkok, Thailand.');

    let response = await generateContent(model, 'My name is Arme from Bangkok, Thailand.', {
      conversationHistory: sessionManager.getConversationHistory()
    });

    sessionManager.addMessage('assistant', response);
    console.log(chalk.green('🤖 AI Response:'), response.substring(0, 200) + '...\n');

    // Test scenario 2: Ask for name
    console.log(chalk.blue('👤 Test User: Tell me what is my name?'));
    sessionManager.addMessage('user', 'Tell me what is my name?');

    response = await generateContent(model, 'Tell me what is my name?', {
      conversationHistory: sessionManager.getConversationHistory()
    });

    sessionManager.addMessage('assistant', response);
    console.log(chalk.green('🤖 AI Response:'), response);

    // Check if AI remembered the name
    const rememberedName = response.toLowerCase().includes('arme');
    console.log(rememberedName ? 
      chalk.green('✅ AI remembered the name correctly!') : 
      chalk.red('❌ AI failed to remember the name'));

    // Test scenario 3: Ask for location
    console.log(chalk.blue('\n👤 Test User: Where am I from?'));
    sessionManager.addMessage('user', 'Where am I from?');

    response = await generateContent(model, 'Where am I from?', {
      conversationHistory: sessionManager.getConversationHistory()
    });

    sessionManager.addMessage('assistant', response);
    console.log(chalk.green('🤖 AI Response:'), response);

    // Check if AI remembered the location
    const rememberedLocation = response.toLowerCase().includes('bangkok') || 
                              response.toLowerCase().includes('thailand');
    console.log(rememberedLocation ? 
      chalk.green('✅ AI remembered the location correctly!') : 
      chalk.red('❌ AI failed to remember the location'));

    // Save the test session
    console.log(chalk.yellow('\n💾 Saving test conversation...'));
    await sessionManager.saveSession('memory_test_conversation');

    // Summary
    console.log(chalk.cyan.bold('\n📊 Test Summary:'));
    console.log(`  Name memory: ${rememberedName ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Location memory: ${rememberedLocation ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Total messages: ${sessionManager.getConversationHistory().length}`);

    if (rememberedName && rememberedLocation) {
      console.log(chalk.green.bold('\n🎉 Conversation memory test PASSED!'));
    } else {
      console.log(chalk.red.bold('\n❌ Conversation memory test FAILED!'));
    }

  } catch (error) {
    console.error(chalk.red('❌ Test failed:'), error.message);
  }
}

// Run the test
testConversationMemory();
