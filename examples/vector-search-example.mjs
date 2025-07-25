/**
 * Vector Search Example
 * 
 * This example demonstrates how to use the vector search functionality
 * with Vertex AI embeddings for long-term memory and semantic similarity.
 * 
 * Features demonstrated:
 * - High-quality Vertex AI embeddings (text-embedding-005)
 * - Persistent vector storage
 * - Semantic similarity search
 * - Real-world use cases
 */

import Model from '../src/utils/google-ai-integration.js';
import VectorSearch from '../src/utils/vector-search-integration-v2.js';
import chalk from 'chalk';

console.log(chalk.blue.bold('🔍 Vector Search Example'));
console.log(chalk.gray('================================================\n'));

// Sample documents for demonstration
const sampleDocuments = [
    {
        id: 'doc_javascript',
        content: 'JavaScript is a versatile programming language used for web development, both frontend and backend.',
        category: 'Programming'
    },
    {
        id: 'doc_python_ai',
        content: 'Python is excellent for artificial intelligence and machine learning projects with libraries like TensorFlow and PyTorch.',
        category: 'AI/ML'
    },
    {
        id: 'doc_react',
        content: 'React is a popular JavaScript library for building user interfaces and single-page applications.',
        category: 'Frontend'
    },
    {
        id: 'doc_nodejs',
        content: 'Node.js allows developers to run JavaScript on the server side, enabling full-stack JavaScript development.',
        category: 'Backend'
    },
    {
        id: 'doc_machine_learning',
        content: 'Machine learning algorithms can learn patterns from data and make predictions without explicit programming.',
        category: 'AI/ML'
    },
    {
        id: 'doc_databases',
        content: 'Databases store and organize data efficiently. Popular options include MongoDB, PostgreSQL, and MySQL.',
        category: 'Database'
    },
    {
        id: 'doc_api_design',
        content: 'RESTful APIs provide a standardized way for applications to communicate over HTTP with clear endpoints.',
        category: 'Backend'
    },
    {
        id: 'doc_css_styling',
        content: 'CSS is used for styling web pages, controlling layout, colors, fonts, and responsive design.',
        category: 'Frontend'
    },
    {
        id: 'doc_cloud_computing',
        content: 'Cloud computing provides on-demand access to computing resources like servers, storage, and databases.',
        category: 'Infrastructure'
    },
    {
        id: 'doc_data_science',
        content: 'Data science combines statistics, programming, and domain expertise to extract insights from data.',
        category: 'Data Science'
    }
];

// Sample queries to test
const sampleQueries = [
    {
        query: "How to build web applications?",
        expected: "Should find JavaScript, React, Node.js related documents"
    },
    {
        query: "What programming language for AI projects?",
        expected: "Should find Python and machine learning documents"
    },
    {
        query: "Frontend development technologies",
        expected: "Should find React, CSS, JavaScript documents"
    },
    {
        query: "Server-side programming",
        expected: "Should find Node.js, API, backend documents"
    },
    {
        query: "Data analysis and statistics",
        expected: "Should find data science and machine learning documents"
    }
];

async function demonstrateVectorSearch() {
    try {
        console.log(chalk.yellow('📦 Initializing components...'));
        
        // Initialize the AI model and vector search
        const model = new Model();
        const vectorSearch = new VectorSearch();
        
        console.log(chalk.green('✅ Components initialized successfully\n'));

        // Step 1: Store sample documents
        console.log(chalk.yellow('💾 Storing sample documents...'));
        
        for (const doc of sampleDocuments) {
            try {
                console.log(chalk.gray(`   Processing: ${doc.id}`));
                
                // Generate embedding for the document
                const embedding = await model.getEmbedding(doc.content);
                
                // Store in vector database
                await vectorSearch.save(doc.id, embedding);
                
                console.log(chalk.green(`   ✓ Stored: ${doc.category} - ${doc.content.substring(0, 50)}...`));
            } catch (error) {
                console.log(chalk.red(`   ✗ Failed to store ${doc.id}: ${error.message}`));
            }
        }
        
        console.log(chalk.green(`\n✅ Stored ${sampleDocuments.length} documents\n`));

        // Step 2: Get vector store statistics
        console.log(chalk.yellow('📊 Vector Store Statistics...'));
        const stats = await vectorSearch.getStats();
        console.log(chalk.cyan(`   • Total vectors: ${stats.totalVectors}`));
        console.log(chalk.cyan(`   • Dimensions: ${stats.dimensions}`));
        console.log(chalk.cyan(`   • Memory usage: ${stats.memoryUsageMB} MB\n`));

        // Step 3: Demonstrate semantic search
        console.log(chalk.yellow('🔍 Demonstrating semantic search...\n'));
        
        for (const testCase of sampleQueries) {
            console.log(chalk.blue(`Query: "${testCase.query}"`));
            console.log(chalk.gray(`Expected: ${testCase.expected}`));
            
            try {
                // Generate embedding for the query
                const queryEmbedding = await model.getEmbedding(testCase.query);
                
                // Search for similar documents
                const results = await vectorSearch.search(queryEmbedding, 3);
                
                console.log(chalk.green('📋 Results:'));
                for (let i = 0; i < results.length; i++) {
                    const docId = results[i];
                    const doc = sampleDocuments.find(d => d.id === docId);
                    if (doc) {
                        console.log(chalk.white(`   ${i + 1}. [${doc.category}] ${doc.content}`));
                    } else {
                        console.log(chalk.white(`   ${i + 1}. ${docId}`));
                    }
                }
                
            } catch (error) {
                console.log(chalk.red(`   ✗ Search failed: ${error.message}`));
            }
            
            console.log(); // Empty line for spacing
        }

        // Step 4: Demonstrate specific document retrieval
        console.log(chalk.yellow('🔎 Demonstrating document retrieval...'));
        
        const docToRetrieve = 'doc_python_ai';
        const retrievedDoc = await vectorSearch.get(docToRetrieve);
        
        if (retrievedDoc.embedding) {
            console.log(chalk.green(`✓ Retrieved document: ${docToRetrieve}`));
            console.log(chalk.cyan(`   • Embedding dimensions: ${retrievedDoc.embedding.length}`));
            console.log(chalk.cyan(`   • Metadata: ${JSON.stringify(retrievedDoc.metadata, null, 2)}`));
        } else {
            console.log(chalk.red(`✗ Document not found: ${docToRetrieve}`));
        }

        console.log();

        // Step 5: Performance demonstration
        console.log(chalk.yellow('⚡ Performance test...'));
        
        const perfQuery = "What is the best programming language for beginners?";
        const startTime = Date.now();
        
        const perfEmbedding = await model.getEmbedding(perfQuery);
        const embeddingTime = Date.now() - startTime;
        
        const searchStartTime = Date.now();
        const perfResults = await vectorSearch.search(perfEmbedding, 5);
        const searchTime = Date.now() - searchStartTime;
        const totalTime = Date.now() - startTime;
        
        console.log(chalk.cyan(`   • Embedding generation: ${embeddingTime}ms`));
        console.log(chalk.cyan(`   • Vector search: ${searchTime}ms`));
        console.log(chalk.cyan(`   • Total query time: ${totalTime}ms`));
        console.log(chalk.cyan(`   • Results found: ${perfResults.length}`));

        console.log();

        // Step 6: Real-world use case example
        console.log(chalk.yellow('💡 Real-world use case: Learning Assistant'));
        console.log(chalk.gray('Simulating a student asking for programming advice...\n'));
        
        const studentQueries = [
            "I'm new to programming, what should I learn first?",
            "How do I make my website look better?",
            "What's the difference between frontend and backend?",
            "I want to work with data, what tools should I use?"
        ];
        
        for (const studentQuery of studentQueries) {
            console.log(chalk.blue(`Student: "${studentQuery}"`));
            
            const studentEmbedding = await model.getEmbedding(studentQuery);
            const suggestions = await vectorSearch.search(studentEmbedding, 2);
            
            console.log(chalk.green('💡 AI Assistant suggests:'));
            for (let i = 0; i < suggestions.length; i++) {
                const doc = sampleDocuments.find(d => d.id === suggestions[i]);
                if (doc) {
                    console.log(chalk.white(`   ${i + 1}. ${doc.content}`));
                }
            }
            console.log();
        }

        console.log(chalk.green.bold('🎉 Vector Search Example Complete!\n'));
        
        console.log(chalk.blue('Key Benefits Demonstrated:'));
        console.log(chalk.white('• High-quality semantic search with Vertex AI embeddings'));
        console.log(chalk.white('• Fast in-memory vector search'));
        console.log(chalk.white('• Persistent storage across sessions'));
        console.log(chalk.white('• Production-ready error handling'));
        console.log(chalk.white('• Real-world applicability for AI assistants'));

    } catch (error) {
        console.error(chalk.red('🚨 Example failed:'), error.message);
        console.error(error.stack);
    }
}

// Additional utility functions for interactive exploration
export async function searchSimilar(query, topK = 5) {
    const model = new Model();
    const vectorSearch = new VectorSearch();
    
    const embedding = await model.getEmbedding(query);
    const results = await vectorSearch.search(embedding, topK);
    
    return results;
}

export async function addDocument(id, content, category = 'General') {
    const model = new Model();
    const vectorSearch = new VectorSearch();
    
    const embedding = await model.getEmbedding(content);
    await vectorSearch.save(id, embedding);
    
    console.log(chalk.green(`✓ Added document: ${id}`));
    return true;
}

export async function getVectorStats() {
    const vectorSearch = new VectorSearch();
    return await vectorSearch.getStats();
}

// Run the demonstration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    demonstrateVectorSearch().catch(console.error);
}

export default {
    demonstrateVectorSearch,
    searchSimilar,
    addDocument,
    getVectorStats,
    sampleDocuments,
    sampleQueries
};
