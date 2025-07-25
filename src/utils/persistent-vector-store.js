import fs from 'fs/promises';
import path from 'path';

class PersistentVectorStore {
    constructor(options = {}) {
        this.storePath = options.storePath || './save/vector-store.json';
        this.memoryStore = new Map();
        this.metadata = new Map(); // Store additional metadata
        this.isLoaded = false;
        
        console.log("📚 Persistent Vector Store initialized");
    }

    // Load existing vectors from disk
    async load() {
        try {
            const data = await fs.readFile(this.storePath, 'utf8');
            const parsed = JSON.parse(data);
            
            // Restore vectors and metadata
            for (const [id, item] of Object.entries(parsed.vectors || {})) {
                this.memoryStore.set(id, item.embedding);
                if (parsed.metadata && parsed.metadata[id]) {
                    this.metadata.set(id, parsed.metadata[id]);
                }
            }
            
            console.log(`📖 Loaded ${this.memoryStore.size} vectors from persistent storage`);
            this.isLoaded = true;
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log("📝 No existing vector store found, starting fresh");
            } else {
                console.warn("⚠️  Error loading vector store:", error.message);
            }
            this.isLoaded = true;
        }
    }

    // Save vectors to disk
    async save() {
        try {
            // Ensure directory exists
            await fs.mkdir(path.dirname(this.storePath), { recursive: true });
            
            // Convert Map to plain object for JSON serialization
            const data = {
                vectors: {},
                metadata: {},
                lastSaved: new Date().toISOString(),
                count: this.memoryStore.size
            };
            
            for (const [id, embedding] of this.memoryStore.entries()) {
                data.vectors[id] = { embedding };
                if (this.metadata.has(id)) {
                    data.metadata[id] = this.metadata.get(id);
                }
            }
            
            await fs.writeFile(this.storePath, JSON.stringify(data, null, 2));
            console.log(`💾 Saved ${this.memoryStore.size} vectors to persistent storage`);
        } catch (error) {
            console.error("🚨 Error saving vector store:", error.message);
        }
    }

    // Simple cosine similarity calculation
    cosineSimilarity(vecA, vecB) {
        const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
        const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
        const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
        return dotProduct / (magnitudeA * magnitudeB);
    }

    async search(queryVector, numNeighbors = 5) {
        if (!this.isLoaded) {
            await this.load();
        }

        try {
            const similarities = [];
            
            for (const [id, storedVector] of this.memoryStore.entries()) {
                const similarity = this.cosineSimilarity(queryVector, storedVector);
                similarities.push({ id, similarity, metadata: this.metadata.get(id) });
            }

            // Sort by similarity (highest first) and return top numNeighbors
            similarities.sort((a, b) => b.similarity - a.similarity);
            const results = similarities.slice(0, numNeighbors);
            
            console.log(`🔍 Found ${results.length} similar memories from ${this.memoryStore.size} stored items`);
            return results.map(item => item.id);
        } catch (error) {
            console.error('🚨 Vector search error:', error.message);
            return [];
        }
    }

    async store(id, vector, metadata = {}) {
        if (!this.isLoaded) {
            await this.load();
        }

        try {
            this.memoryStore.set(id, vector);
            
            // Store metadata with timestamp
            this.metadata.set(id, {
                ...metadata,
                timestamp: Date.now(),
                dimensions: vector.length
            });
            
            console.log(`💾 Stored vector for "${id}" (${this.memoryStore.size} items total)`);
            
            // Auto-save periodically (every 10 items)
            if (this.memoryStore.size % 10 === 0) {
                await this.save();
            }
            
            return true;
        } catch (error) {
            console.error('🚨 Vector storage error:', error.message);
            return false;
        }
    }

    async getStats() {
        if (!this.isLoaded) {
            await this.load();
        }

        const stats = {
            totalVectors: this.memoryStore.size,
            dimensions: this.memoryStore.size > 0 ? Array.from(this.memoryStore.values())[0].length : 0,
            memoryUsageMB: (JSON.stringify([...this.memoryStore.entries()]).length / 1024 / 1024).toFixed(2)
        };

        return stats;
    }

    // Get vector by ID
    async get(id) {
        if (!this.isLoaded) {
            await this.load();
        }
        
        return {
            embedding: this.memoryStore.get(id),
            metadata: this.metadata.get(id)
        };
    }

    // Delete vector by ID
    async delete(id) {
        if (!this.isLoaded) {
            await this.load();
        }

        const deleted = this.memoryStore.delete(id) && this.metadata.delete(id);
        if (deleted) {
            console.log(`🗑️  Deleted vector for "${id}"`);
            await this.save();
        }
        return deleted;
    }

    // Clear all vectors
    async clear() {
        this.memoryStore.clear();
        this.metadata.clear();
        await this.save();
        console.log("🧹 Cleared all vectors");
    }
}

export default PersistentVectorStore;
