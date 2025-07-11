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

    // Collect detected actions
    const actions = [];

    // if (lowerPrompt.includes('memory') || lowerPrompt.includes('ram')) actions.push('memory');
    // if (lowerPrompt.includes('cpu') || lowerPrompt.includes('processor')) actions.push('cpu');
    // if (lowerPrompt.includes('system')) actions.push('system');
    // if (lowerPrompt.includes('os') || lowerPrompt.includes('operating system')) actions.push('os');
    // if (lowerPrompt.includes('time') || lowerPrompt.includes('date')) actions.push('time');
    // if (
    //     lowerPrompt.includes('list files') ||
    //     lowerPrompt.includes('show files') ||
    //     lowerPrompt.includes('directory') ||
    //     lowerPrompt.includes('folder')
    // )
    //     actions.push('files');

    // Fallback to direct execution
    if (actions.length === 0) actions.push('execute');

    // Execute detected actions
    for (const action of actions) {
        switch (action) {
            case 'memory': {
                console.log('🔧 Detected: memory request');
                const result = await shellCommands.getSystemInfo('memory');
                shellResults.push(`MEMORY INFO:\n${result}`);
                break;
            }
            case 'cpu': {
                console.log('🔧 Detected: CPU request');
                const result = await shellCommands.getSystemInfo('cpu');
                shellResults.push(`CPU INFO:\n${result}`);
                break;
            }
            case 'system': {
                console.log('🔧 Detected: system info request');
                const result = await shellCommands.getSystemInfo('all');
                shellResults.push(`SYSTEM INFO:\n${result}`);
                break;
            }
            case 'os': {
                console.log('🔧 Detected: OS info request');
                const result = await shellCommands.getSystemInfo('os');
                shellResults.push(`OS INFO:\n${result}`);
                break;
            }
            case 'time': {
                console.log('🔧 Detected: time/date request');
                const result = await shellCommands.executeCommand('date');
                shellResults.push(`TIME/DATE INFO:\n${result}`);
                break;
            }
            case 'files': {
                console.log('🔧 Detected: file listing request');
                const result = await shellCommands.listFiles();
                shellResults.push(`FILES:\n${result}`);
                break;
            }
            default: {
                const command = prompt.replace('#shell', '').trim();
                if (command.startsWith('bash') && !command.includes(' ')) {
                    command = command.replace('bash', '').trim();
                }
                console.log(`🔧 Detected: command execution "${command}"`);
                const result = await shellCommands.executeCommand(command);
                shellResults.push(`COMMAND:\n${result}`);
                break;
            }
        }
    }

    return shellResults;
}

/**
 * Get available shell command keywords for help display
 * @returns {Object} Object containing keyword categories and descriptions
 */
export function getShellCommandKeywords() {
    return {
        memory: ['memory', 'ram'],
        cpu: ['cpu', 'processor'],
        system: ['system info', 'system'],
        os: ['os', 'operating system'],
        time: ['time', 'date'],
        files: ['list files', 'show files', 'directory', 'folder'],
        execute: ['run <command>', 'execute <command>']
    };
}

/**
 * Check if a prompt contains any shell command keywords
 * @param {string} prompt - User input to check
 * @returns {boolean} True if shell keywords are detected
 */
export function hasShellKeywords(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    const keywords = getShellCommandKeywords();

    // Flatten all keywords into a single array
    const allKeywords = Object.values(keywords).flat();

    return allKeywords.some(keyword => {
        // Handle special cases for execute patterns
        if (keyword.includes('<command>')) {
            return /(?:run|execute|command)\s+/.test(lowerPrompt);
        }
        return lowerPrompt.includes(keyword);
    });
}
