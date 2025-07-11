/**
 * Shell command detection and processing logic
 * Handles keyword detection and execution of shell commands based on user input
 */

import { shellCommands } from './shell-commands.js';

/**
 * Process user input and execute shell commands based on keywords
 * @param {string} prompt - User input prompt to analyze
 * @returns {Promise<Array<string>>} Array of shell command results
 */
export async function processShellCommands(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    let shellResults = [];

    if (!prompt.includes('#shell')) return shellResults; // Skip processing if #shell is not present
    if (lowerPrompt.startsWith('#shell #')) return shellResults; // Skip processing if starts with #shell #

    const command = prompt.replace('#shell', '').trim();
    if (command) {
        console.log(`🔧 Executing shell command: "${command}"`);
        const result = await shellCommands.executeCommand(command);
        shellResults.push(`COMMAND:\n${result}`);
    }

    return shellResults;
}
