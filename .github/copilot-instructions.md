<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# AI-Tuning-JS Project Instructions

This is a Node.js project focused on AI model tuning and optimization. The project provides a framework for hyperparameter tuning, model optimization, and machine learning experimentation.

## Project Structure

- `src/ai-tuner.js` - Main AI tuner class with training and optimization capabilities
- `src/utils/data-utils.js` - Utility functions for data processing and manipulation
- `src/utils/google-ai-integration.js` - Google Generative AI integration for enhanced ML workflows
- `examples/` - Example scripts demonstrating usage
- `index.js` - Main entry point

## Code Style Guidelines

- Use ES6+ features and modern JavaScript with ES modules (import/export)
- Follow camelCase naming conventions
- Include comprehensive JSDoc comments for all public methods
- Use async/await for asynchronous operations
- Include proper error handling with try/catch blocks
- Add console logging with emojis for better user experience
- Focus on clean, readable, and maintainable code

## Key Dependencies

- `@google/generative-ai` - Google Generative AI SDK
- `dotenv` - Environment variable management
- `lodash` - Utility functions
- `mathjs` - Mathematical operations
- `chalk` - Console output formatting

## Development Practices

- Write modular, reusable code
- Include input validation for public methods
- Use meaningful variable and function names
- Add progress indicators for long-running operations
- Implement proper configuration management
- Include examples for all major features

## AI/ML Context

When working with AI/ML code:
- Focus on hyperparameter optimization algorithms
- Include statistical analysis and metrics
- Support different optimization methods (gradient descent, genetic algorithms, etc.)
- Provide data preprocessing utilities
- Include model evaluation and validation methods
- Support batch processing and streaming data
- Leverage Google Generative AI for intelligent suggestions and analysis
- Implement proper environment variable handling for API keys and configuration
- Use streaming responses for real-time AI feedback
- Provide fallback behavior when AI services are unavailable

## Google AI Integration Guidelines

- Always check for proper authentication before making AI calls
- Handle API errors gracefully with informative messages
- Use environment variables for sensitive configuration
- Implement proper JSON parsing for AI responses
- Provide meaningful prompts for better AI suggestions
- Cache AI responses when appropriate to reduce API calls
