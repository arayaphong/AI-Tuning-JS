import PersistentVectorStore from './persistent-vector-store.js';
import 'dotenv/config';

// These should be in your .env file
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT;
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const INDEX_ID = process.env.VERTEX_AI_INDEX_ID;
const INDEX_ENDPOINT_ID = process.env.VERTEX_AI_INDEX_ENDPOINT_ID;
const DEPLOYED_INDEX_ID = process.env.VERTEX_AI_DEPLOYED_INDEX_ID;

class VectorSearch {
    constructor() {
        // Initialize persistent vector store (always available)
        this.persistentStore = new PersistentVectorStore();
        
        // Disable Vertex AI vector storage for now (embeddings still work great!)
        this.useVertexAI = false;
        
        console.log("📝 Vector Search using persistent storage with Vertex AI embeddings. 🚀");
        console.log("💡 Vertex AI vector storage disabled - using efficient persistent storage instead");
        
        // Note: We still get high-quality Vertex AI embeddings, just store them locally
        // This gives us the best of both worlds: quality + reliability + speed
    }

    // Simple cosine similarity calculation
    cosineSimilarity(vecA, vecB) {
        const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
        const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
        const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
        return dotProduct / (magnitudeA * magnitudeB);
    }

    async search(vector, numNeighbors = 5) {
        // Always use persistent store for search (fast and reliable)
        return this.searchPersistent(vector, numNeighbors);
    }

    async searchPersistent(queryVector, numNeighbors = 5) {
        try {
            return await this.persistentStore.search(queryVector, numNeighbors);
        } catch (error) {
            console.error('🚨 Persistent search error:', error.message);
            return [];
        }
    }

    async searchVertexAI(vector, numNeighbors = 5) {
        try {
            const request = {
                indexEndpoint: this.indexEndpointClient.indexEndpointPath(PROJECT_ID, LOCATION, INDEX_ENDPOINT_ID),
                deployedIndexId: DEPLOYED_INDEX_ID,
                queries: [{
                    datapoint: {
                        datapointId: 'query',
                        featureVector: vector // Direct array, not wrapped in object
                    },
                    neighborCount: numNeighbors,
                }],
            };

            const [response] = await this.indexEndpointClient.findNeighbors(request);
            if (!response.nearestNeighbors || !response.nearestNeighbors[0].neighbors) {
                return [];
            }

            const neighbors = response.nearestNeighbors[0].neighbors;
            return neighbors.map(neighbor => neighbor.datapoint.datapointId);
        } catch (error) {
            console.error('🚨 Vertex AI search error:', error.message);
            console.log('⚠️  Falling back to memory search');
            this.useVertexAI = false; // Fallback to memory for future searches
            return this.searchMemory(vector, numNeighbors);
        }
    }

    async save(id, vector) {
        // Always save to persistent store (fast and reliable)
        return await this.savePersistent(id, vector);
        
        // Note: Vertex AI vector storage disabled to avoid errors
        // We still get excellent Vertex AI embeddings, just store them efficiently locally
    }

    async savePersistent(id, vector) {
        try {
            return await this.persistentStore.store(id, vector);
        } catch (error) {
            console.error('🚨 Persistent save error:', error.message);
            return false;
        }
    }

    async saveMemory(id, vector) {
        try {
            this.memoryStore.set(id, { embedding: vector, timestamp: Date.now() });
            console.log(`💾 Saved to memory store (${this.memoryStore.size} items total)`);
        } catch (error) {
            console.error('🚨 Memory save error:', error.message);
        }
    }

    async saveVertexAI(id, vector) {
        try {
            const request = {
                index: this.indexClient.indexPath(PROJECT_ID, LOCATION, INDEX_ID),
                datapoints: [{
                    datapointId: id,
                    featureVector: vector, // Direct array, not wrapped in object
                }],
            };

            await this.indexClient.upsertDatapoints(request);
            console.log(`✅ Saved turn to Vertex AI Vector DB.`);
        } catch (error) {
            console.error('🚨 Vertex AI save error:', error.message);
            console.log('⚠️  Falling back to persistent storage only');
            this.useVertexAI = false;
            throw error; // Re-throw so caller can handle
        }
    }

    // Utility methods
    async getStats() {
        return await this.persistentStore.getStats();
    }

    async get(id) {
        return await this.persistentStore.get(id);
    }

    async delete(id) {
        return await this.persistentStore.delete(id);
    }

    async clear() {
        return await this.persistentStore.clear();
    }

    // Legacy cosine similarity (now handled by persistent store)
    cosineSimilarity(vecA, vecB) {
        return this.persistentStore.cosineSimilarity(vecA, vecB);
    }
}

export default VectorSearch;
