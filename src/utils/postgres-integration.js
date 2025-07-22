import { Client } from 'pg';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

/**
 * PostgreSQL Integration Utility
 * Provides a simplified interface for executing SQL queries.
 */
class PostgresIntegration {
  #connectionString = null;
  #client = null;

  constructor() {
    this.#connectionString = process.env.POSTGRES_URI;
    if (!this.#connectionString) {
      throw new Error('❌ POSTGRES_URI not found in environment variables');
    }
    this.#client = new Client({
      connectionString: this.#connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }

  async #connect() {
    // The client instance has a _connected property.
    if (!this.#client._connected) {
      await this.#client.connect();
    }
  }

  async #disconnect() {
    if (this.#client._connected) {
      await this.#client.end();
    }
  }

  /**
   * Executes a SQL query and returns the results.
   * @param {string} sql - The SQL query to execute.
   * @returns {Promise<any>} The query result.
   * @example
   * const pg = new PostgresIntegration();
   * const result = await pg.executeQuery('SELECT * FROM users;');
   */
  async executeQuery(sql) {
    try {
      await this.#connect();
      const result = await this.#client.query(sql);
      return result.rows;
    } catch (error) {
      console.error(chalk.red('❌ Query execution failed:'), error.message);
      throw error;
    }
  }

  /**
   * Closes the database connection.
   */
  async close() {
    if (this.#client && this.#client._connected) {
      await this.#client.end();
    }
  }
}

export default PostgresIntegration;
