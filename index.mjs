#!/usr/bin/env node

import { initializeGoogleAI, generateContent, listShellCommands } from './src/utils/google-ai-integration.js';
import { 
  renderChatMessage, 
  renderHelpContent, 
  renderSystemInfo,
  smartRender 
} from './src/utils/markdown-renderer.js';

import dotenv from 'dotenv';
import readline from 'readline';
import chalk from 'chalk';

dotenv.config();

/**
 * Handle special CLI commands
 */
async function handleSpecialCommands(input, rl) {
  const command = input.toLowerCase().trim();
  
  switch (command) {
    case '/commands':
    case '/tools':
      await renderSystemInfo('Available Shell Commands', 'These keywords trigger shell commands when mentioned in your messages:');
      listShellCommands();
      return true;
      
    case '/help':
      const helpCommands = [
        {
          name: '/commands',
          description: 'List all available shell command keywords',
          examples: ['/commands', '/tools']
        },
        {
          name: '/help',
          description: 'Show this help message with detailed command information',
          examples: ['/help']
        },
        {
          name: '/clear',
          description: 'Clear the terminal screen',
          examples: ['/clear']
        },
        {
          name: '/examples',
          description: 'Show example requests and usage patterns',
          examples: ['/examples']
        },
        {
          name: '/quit or /exit',
          description: 'Exit the chatbot application',
          examples: ['/quit', '/exit']
        }
      ];
      
      console.log(chalk.cyan.bold('🤖 Gemini AI Chatbot with Shell Commands\n'));
      await renderHelpContent(helpCommands);
      
      console.log(chalk.yellow('💡 **Natural Language Usage:**'));
      console.log('Just type naturally! Keywords like "memory", "cpu", "files", "git status" will automatically trigger shell commands.\n');
      return true;
      
    case '/examples':
      const exampleContent = `# Example Requests

## System Information
- "What's my system **memory** usage?"
- "Show me **CPU** information"
- "Give me **system info**"

## File Operations
- "List files in my current directory"
- "Show me the files in this folder"

## Git Operations
- "What's my git status?"
- "Show me recent git commits"
- "What git branch am I on?"

## Command Execution
- "Run pwd"
- "Execute date"
- "Run ps aux"

## Combined Requests
- "Show my memory usage and list files"
- "What's my git status and system info?"

*Keywords are automatically detected and trigger shell commands!*`;
      
      await smartRender(exampleContent);
      return true;
      
    case '/clear':
      console.clear();
      console.log(chalk.green('🤖 Gemini AI Chatbot with Shell Commands\n'));
      return true;
      
    case '/exit':
    case 'exit':
      console.log(chalk.green('👋 Goodbye!'));
      rl.close();
      process.exit(0);
      return true;
      
    default:
      return false;
  }
}

/**
 * Display startup banner
 */
function showBanner() {
  console.log(chalk.green.bold('🤖 Gemini AI Chatbot with Shell Commands'));
  console.log(chalk.gray('═'.repeat(55)));
  console.log(chalk.yellow('💡 Use natural language - keywords trigger shell commands!'));
  console.log(chalk.gray('Type /help for commands or just start chatting!\n'));
}

/**
 * Starts the reliable chatbot with keyword-based shell commands
 */
async function startChatbot() {
    showBanner();

    const { GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_LOCATION, GOOGLE_AI_API_KEY } = process.env;

    let model;
    try {
        model = await initializeGoogleAI({
            project: GOOGLE_CLOUD_PROJECT,
            location: GOOGLE_CLOUD_LOCATION,
            apiKey: GOOGLE_AI_API_KEY
        });
    } catch (error) {
        console.error(chalk.red('❌ Failed to initialize AI:'), error.message);
        process.exit(1);
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: chalk.blue('💬 You: ')
    });

    // Show available shell command keywords on startup
    console.log(chalk.cyan('Available shell command keywords:'));
    listShellCommands();
    console.log(chalk.gray('\nJust ask naturally - keywords will trigger shell commands!\n'));
    rl.prompt();

    rl.on('line', async (line) => {
        const input = line.trim();

        if (!input) {
            rl.prompt();
            return;
        }

        // Handle special commands
        if (await handleSpecialCommands(input, rl)) {
            rl.prompt();
            return;
        }

        try {
            // Show processing indicator
            const processingText = chalk.yellow('🤔 Processing...');
            process.stdout.write(processingText + '\r');

            const response = await generateContent(model, input);

            // Clear processing indicator
            process.stdout.clearLine();
            process.stdout.cursorTo(0);

            // Display response using ink-markdown for rich markdown rendering
            await renderChatMessage(response, {
              prefix: '🤖 Gemini:',
              showTimestamp: false,
              addSpacing: true
            });

        } catch (err) {
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            console.error(chalk.red('❌ Error:'), err.message);

            // Provide helpful hints for common errors
            if (err.message.includes('permission')) {
                console.log(chalk.yellow('💡 Tip: Some commands might need different permissions'));
            } else if (err.message.includes('not found')) {
                console.log(chalk.yellow('💡 Tip: Command might not be available on your system'));
            } else if (err.message.includes('function')) {
                console.log(chalk.yellow('💡 Tip: Try using simpler language with keywords like "memory", "files", "git status"'));
            }
        }

        console.log(); // Add spacing
        rl.prompt();
    });

    rl.on('close', () => {
        console.log(chalk.green('\n👋 Chat ended.'));
        process.exit(0);
    });

    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
        console.log(chalk.green('\n👋 Goodbye!'));
        rl.close();
    });

    // Handle uncaught errors
    process.on('unhandledRejection', (error) => {
        console.error(chalk.red('\n❌ Unexpected error:'), error.message);
        console.log(chalk.yellow('💡 Try restarting the chatbot or using simpler commands'));
        rl.prompt();
    });
}

// Show system info on startup (optional)
async function showSystemInfo() {
    const os = await import('os');
    console.log(chalk.gray(`System: ${os.type()} ${os.release()}`));
    console.log(chalk.gray(`Platform: ${os.platform()} ${os.arch()}`));
    console.log(chalk.gray(`Node.js: ${process.version}\n`));
}

// Quick test function
async function quickTest() {
    console.log(chalk.blue('🧪 Quick Test Mode\n'));
    
    try {
        const model = await initializeGoogleAI({
            project: process.env.GOOGLE_CLOUD_PROJECT,
            location: process.env.GOOGLE_CLOUD_LOCATION,
            apiKey: process.env.GOOGLE_AI_API_KEY
        });
        
        console.log('✅ Model initialized successfully');
        
        const testPrompt = 'Show me my system memory usage';
        console.log(`\n🧪 Testing: "${testPrompt}"`);
        
        const response = await generateContent(model, testPrompt);
        
        // Test the new markdown renderer
        await renderChatMessage(response, {
          prefix: '📝 Test Response:',
          showTimestamp: true
        });
        
        console.log('\n🎉 Quick test completed successfully!');
        console.log('💡 Run "npm start" to start the interactive chatbot\n');
        
    } catch (error) {
        console.error(chalk.red('❌ Test failed:'), error.message);
        process.exit(1);
    }
}

// Command line argument handling
async function main() {
  if (process.argv.includes('--test')) {
    await quickTest();
  } else if (process.argv.includes('--system-info')) {
    await showSystemInfo();
    await startChatbot();
  } else {
    await startChatbot();
  }
}

// Start the application
main().catch(error => {
  console.error(chalk.red('❌ Application error:'), error.message);
  process.exit(1);
});