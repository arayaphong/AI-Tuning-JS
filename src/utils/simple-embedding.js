import crypto from 'crypto';

class SimpleEmbedding {
    constructor(options = {}) {
        this.dimensions = options.dimensions || (process.env.SIMPLE_EMBEDDING_DIMENSIONS ? parseInt(process.env.SIMPLE_EMBEDDING_DIMENSIONS) : undefined);
        
        if (!this.dimensions) {
            throw new Error('Embedding dimensions are required. Set SIMPLE_EMBEDDING_DIMENSIONS environment variable or pass dimensions in options.');
        }

        this.maxHashValue = options.maxHashValue || (process.env.SIMPLE_EMBEDDING_MAX_HASH_VALUE ? parseFloat(process.env.SIMPLE_EMBEDDING_MAX_HASH_VALUE) : undefined);
        
        if (!this.maxHashValue) {
            throw new Error('Max hash value for normalization is required. Set SIMPLE_EMBEDDING_MAX_HASH_VALUE environment variable or pass maxHashValue in options.');
        }

        console.log(`✅ Simple Local Embedding Client Initialized (Fallback) - ${this.dimensions} dimensions`);
    }

    async getEmbedding(text) {
        try {
            console.log('🔍 Generating simple hash-based embedding...');
            
            // Create a deterministic hash-based embedding
            const embedding = this.generateHashEmbedding(text, this.dimensions);
            
            console.log('✅ Simple embedding generated successfully');
            return embedding;
        } catch (error) {
            console.error('🚨 Error generating simple embedding:', error.message);
            throw error;
        }
    }

    generateHashEmbedding(text, dimensions) {
        // Create multiple hash seeds for better distribution
        const hashes = [];
        const seedCount = Math.ceil(dimensions / 16); // 16 values per hash
        
        for (let i = 0; i < seedCount; i++) {
            const hash = crypto.createHash('md5').update(text + i.toString()).digest('hex');
            hashes.push(hash);
        }
        
        // Convert hex to normalized float values
        const embedding = [];
        let hashIndex = 0;
        let charIndex = 0;
        
        for (let i = 0; i < dimensions; i++) {
            if (charIndex >= 32) { // MD5 hash has 32 hex chars
                hashIndex++;
                charIndex = 0;
            }
            
            if (hashIndex >= hashes.length) {
                hashIndex = 0;
                charIndex = 0;
            }
            
            // Take 4 hex chars and convert to float
            const hexChars = hashes[hashIndex].substr(charIndex, 4);
            const intValue = parseInt(hexChars, 16);
            const normalizedValue = (intValue / this.maxHashValue) - 0.5; // Normalize to [-0.5, 0.5]
            
            embedding.push(normalizedValue);
            charIndex += 4;
        }
        
        return embedding;
    }
}

export default SimpleEmbedding;
