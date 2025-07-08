/**
 * Data utility functions for AI-Tuning-JS
 * @module data-utils
 */

/**
 * Validates and normalizes input data for ML workflows.
 * @param {Array|Object} data - Input data
 * @returns {Array} Normalized data array
 */
export function normalizeData(data) {
  if (!data) throw new Error('No data provided');
  if (Array.isArray(data)) return data;
  if (typeof data === 'object') return Object.values(data);
  throw new Error('Unsupported data type');
}

/**
 * Shuffles an array using Fisher-Yates algorithm.
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
export function shuffleArray(array) {
  if (!Array.isArray(array)) throw new Error('Input must be an array');
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
