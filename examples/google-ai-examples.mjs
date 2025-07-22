#!/usr/bin/env node

import Model from '../src/utils/google-ai-integration.js';
import chalk from 'chalk';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Example usage of Google AI Integration Utility
 * This demonstrates various ways to use the Google Generative AI model
 */

async function runGoogleAIExamples() {
  try {
    console.log(chalk.magenta('🚀 Starting Google AI Integration Examples\n'));

    // Example 1: Basic text generation with default settings
    console.log(chalk.cyan('📝 Example 1: Basic Text Generation'));
    const basicModel = new Model();
    console.log(`Using model: ${basicModel.model}`);
    
    const basicPrompt = "Explain the concept of machine learning in simple terms.";
    console.log(chalk.gray(`Prompt: ${basicPrompt}`));
    
    const basicResponse = await basicModel.generateContent(basicPrompt);
    console.log(chalk.green('Response:'));
    console.log(basicResponse);
    console.log('\n' + '='.repeat(80) + '\n');

    // Example 2: Creative writing with custom temperature
    console.log(chalk.cyan('🎨 Example 2: Creative Writing with High Temperature'));
    const creativeModel = new Model({
      generationConfig: {
        temperature: 1.8,
        maxOutputTokens: 500
      }
    });
    
    const creativePrompt = "Write a short story about a robot discovering emotions for the first time.";
    console.log(chalk.gray(`Prompt: ${creativePrompt}`));
    console.log(chalk.gray(`Temperature: 1.8 (more creative/random)`));
    
    const creativeResponse = await creativeModel.generateContent(creativePrompt);
    console.log(chalk.green('Response:'));
    console.log(creativeResponse);
    console.log('\n' + '='.repeat(80) + '\n');

    // Example 3: Technical explanation with low temperature
    console.log(chalk.cyan('🔬 Example 3: Technical Explanation with Low Temperature'));
    const technicalModel = new Model({
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 800
      }
    });
    
    const technicalPrompt = "Explain how JavaScript's event loop works, including the call stack, callback queue, and microtask queue.";
    console.log(chalk.gray(`Prompt: ${technicalPrompt}`));
    console.log(chalk.gray(`Temperature: 0.2 (more focused/deterministic)`));
    
    const technicalResponse = await technicalModel.generateContent(technicalPrompt);
    console.log(chalk.green('Response:'));
    console.log(technicalResponse);
    console.log('\n' + '='.repeat(80) + '\n');

    // Example 4: Code generation
    console.log(chalk.cyan('💻 Example 4: Code Generation'));
    const codeModel = new Model({
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1000
      }
    });
    
    const codePrompt = `Write a JavaScript function that:
1. Takes an array of numbers as input
2. Filters out negative numbers
3. Squares each remaining number
4. Returns the sum of all squared numbers
Include proper JSDoc comments and error handling.`;
    
    console.log(chalk.gray(`Prompt: ${codePrompt}`));
    
    const codeResponse = await codeModel.generateContent(codePrompt);
    console.log(chalk.green('Response:'));
    console.log(codeResponse);
    console.log('\n' + '='.repeat(80) + '\n');

    // Example 5: JSON data generation
    console.log(chalk.cyan('📊 Example 5: Structured Data Generation'));
    const dataModel = new Model({
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 600
      }
    });
    
    const dataPrompt = `Generate a JSON object representing a sample user profile for a social media app. Include:
- Personal information (name, age, email)
- Preferences (interests, privacy settings)
- Activity data (posts count, followers, following)
- Account metadata (created date, last login)
Make it realistic but fictional. Return only the JSON, no explanation.`;
    
    console.log(chalk.gray(`Prompt: ${dataPrompt}`));
    
    const dataResponse = await dataModel.generateContent(dataPrompt);
    console.log(chalk.green('Response:'));
    console.log(dataResponse);
    console.log('\n' + '='.repeat(80) + '\n');

    // Example 6: Multi-turn conversation simulation
    console.log(chalk.cyan('💬 Example 6: Multi-turn Conversation Simulation'));
    const conversationModel = new Model({
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 400
      }
    });
    
    // Simulate conversation context
    const conversationContext = `Previous conversation:
user: What's the difference between let and var in JavaScript?
assistant: The main differences are scope and hoisting. 'let' has block scope while 'var' has function scope. 'let' variables are not hoisted in the same way as 'var'.
user: Can you give me a practical example?`;
    
    console.log(chalk.gray('Conversation context provided'));
    console.log(chalk.gray('Current question: "Can you give me a practical example?"'));
    
    const conversationResponse = await conversationModel.generateContent(conversationContext);
    console.log(chalk.green('Response:'));
    console.log(conversationResponse);
    console.log('\n' + '='.repeat(80) + '\n');

    // Example 7: Different model comparison (if available)
    console.log(chalk.cyan('🔄 Example 7: Model Configuration Display'));
    const configModel = new Model({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.5,
        topP: 0.8,
        maxOutputTokens: 200
      }
    });
    
    console.log(chalk.green('Model Configuration:'));
    console.log(chalk.gray('Model:'), configModel.model);
    console.log(chalk.gray('Config:'), JSON.stringify(configModel.config, null, 2));
    console.log('\n' + '='.repeat(80) + '\n');

    // Example 8: Error handling demonstration
    console.log(chalk.cyan('⚠️ Example 8: Error Handling'));
    try {
      const errorModel = new Model({
        generationConfig: {
          maxOutputTokens: -1 // Invalid value to trigger error
        }
      });
      
      await errorModel.generateContent("This should fail");
    } catch (error) {
      console.log(chalk.red('Expected error caught:'), error.message);
    }

    console.log(chalk.green('\n✅ All Google AI examples completed successfully!'));
    
  } catch (error) {
    console.error(chalk.red('❌ Error in Google AI examples:'), error.message);
    console.error(chalk.gray('Stack trace:'), error.stack);
    process.exit(1);
  }
}

// Performance measurement wrapper
async function runWithTiming() {
  const startTime = Date.now();
  
  try {
    await runGoogleAIExamples();
  } finally {
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.log(chalk.blue(`\n⏱️ Total execution time: ${duration} seconds`));
  }
}

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(chalk.blue.bold('🤖 Google AI Integration Examples'));
  console.log(chalk.gray('Testing various Google Generative AI features\n'));
  
  runWithTiming().catch(error => {
    console.error(chalk.red('❌ Fatal error:'), error.message);
    process.exit(1);
  });
}

export { runGoogleAIExamples };
