import { IndexEndpointServiceClient, IndexServiceClient } from '@google-cloud/aiplatform';
import 'dotenv/config';

// These should be in your .env file
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT;
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const INDEX_ID = process.env.VERTEX_AI_INDEX_ID;
const INDEX_ENDPOINT_ID = process.env.VERTEX_AI_INDEX_ENDPOINT_ID;
const DEPLOYED_INDEX_ID = process.env.VERTEX_AI_DEPLOYED_INDEX_ID;

class VectorSearch {
    constructor() {
        if (!PROJECT_ID || !LOCATION || !INDEX_ID || !INDEX_ENDPOINT_ID || !DEPLOYED_INDEX_ID) {
            console.error("🔴 Missing required Vertex AI environment variables.");
            process.exit(1);
        }

        const clientOptions = {
            apiEndpoint: `${LOCATION}-aiplatform.googleapis.com`,
        };

        this.indexEndpointClient = new IndexEndpointServiceClient(clientOptions);
        this.indexClient = new IndexServiceClient(clientOptions);
        console.log("Vector Search client initialized. 🚀");
    }

    async search(vector, numNeighbors = 5) {
        try {
            const request = {
                indexEndpoint: this.indexEndpointClient.indexEndpointPath(PROJECT_ID, LOCATION, INDEX_ENDPOINT_ID),
                deployedIndexId: DEPLOYED_INDEX_ID,
                queries: [{
                    datapoint: {
                        datapointId: 'query',
                        featureVector: { value: vector }
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
            console.error('🚨 Vector search error:', error.message);
            console.log('⚠️  Returning empty results due to vector search error');
            return []; // Return empty array instead of crashing
        }
    }

    async save(id, vector) {
        const request = {
            index: this.indexClient.indexPath(PROJECT_ID, LOCATION, INDEX_ID),
            datapoints: [{
                datapointId: id, // We use the text as the ID for simplicity
                featureVector: { value: vector },
            }],
        };

        await this.indexClient.upsertDatapoints(request);
        console.log(`✅ Saved turn to Vector DB.`);
    }
}

export default VectorSearch;