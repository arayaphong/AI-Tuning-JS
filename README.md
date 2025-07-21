# AI-Tuning-JS - Modern ES6+ Edition

A modern AI chatbot built with ES6+ JavaScript features and Google Generative AI integration.

## 🚀 ES6+ Features Used

- **Private Fields**: `#private` syntax for true encapsulation
- **Arrow Functions**: Concise function expressions
- **Destructuring**: Object and array destructuring with defaults
- **Template Literals**: Enhanced string formatting
- **Optional Chaining**: Safe property access with `?.`
- **Nullish Coalescing**: Using `??` for null/undefined checks
- **ES Modules**: Native import/export syntax
- **Enhanced Classes**: Static properties and modern class features
- **Async/Await**: Modern promise handling

## 📁 Project Structure

```
AI-Tuning-JS/
├── main.mjs                          # Enhanced chatbot with ES6+
├── src/utils/
│   ├── google-ai-integration.js      # AI integration with ES6+
│   └── google-ai-model.js            # AI model with private fields
├── save/                             # Auto-save functionality
└── package.json                      # Modern module configuration
```

## 🛠️ Installation

```bash
# Install dependencies (requires Node.js 16+)
npm install

# Set up environment variables
# Add your Google AI credentials to .env file
```

## 🎯 Quick Start

```bash
# Start the chatbot
npm start

# Development mode with auto-reload
npm run dev
```

## 📖 ES6+ Examples

### Private Fields & Modern Classes
```javascript
class Model {
  // Private fields using ES6+
  #ai;
  #model;
  #generationConfig;

  // Static constants
  static DEFAULT_CONFIG = {
    project: 'gen-lang-client-0312359180',
    location: 'global'
  };

  constructor(options = {}) {
    // Destructuring with defaults
    const {
      project = Model.DEFAULT_CONFIG.project,
      location = Model.DEFAULT_CONFIG.location
    } = options;

    this.#ai = new GoogleGenAI({ project, location });
  }
}
```

### Enhanced Error Handling & Async/Await
```javascript
export const generateContent = async (model, prompt, options = {}) => {
  // Input validation with early returns
  if (!model?.generateContent) {
    throw new Error('Valid model instance is required');
  }

  // Destructuring with defaults
  const { conversationHistory = [], maxHistoryLength = 10 } = options;

  try {
    // Optional chaining and nullish coalescing
    if (conversationHistory?.length > 0) {
      // Modern array methods with arrow functions
      conversationHistory
        .slice(-maxHistoryLength)
        .forEach(({ role, content }) => {
          // Template literals
          console.log(`${role}: ${content}`);
        });
    }

    return await model.generateContent(prompt);
  } catch (error) {
    // Enhanced error handling
    throw new Error(`Content generation failed: ${error.message}`);
  }
};
```

### Modern Event Handling
```javascript
class SessionManager {
  // Private field
  #conversationHistory = [];

  // Arrow function method
  addMessage = (role, content) => {
    this.#conversationHistory.push({
      role,
      content,
      timestamp: new Date().toISOString()
    });
  };

  // Getter with spread operator
  getConversationHistory() {
    return [...this.#conversationHistory];
  }
}
```

## 🎪 Features

- **Google AI Integration**: Modern ES6+ wrapper for Gemini API
- **Session Management**: Auto-save with private fields
- **Enhanced UI**: Colorized markdown rendering
- **Modern Syntax**: Comprehensive ES6+ feature usage
- **Error Handling**: Robust async/await patterns

## 🤝 Commands

- Type your messages to chat with AI
- `/exit` - Save session and quit
- `/clear` - Clear screen and history
- `/stats` - Show session statistics

## 📄 License

MIT License - Modern JavaScript ES6+ implementation

---

**Built with modern JavaScript ES6+ features** 🚀
