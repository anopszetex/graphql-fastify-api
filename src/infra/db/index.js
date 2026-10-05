import knex from 'knex';

import { resolve } from 'node:path';

import { getDatabaseConfig } from './config.js';

import { __dirname } from './../../support/index.js';

function buildConnectionConfig() {
  const config = getDatabaseConfig();
  return {
    client: 'pg',
    pool: { min: 0, max: 5, idleTimeoutMillis: 60000 },
    connection: {
      host: config.DB_HOST,
      port: config.DB_PORT,
      user: config.DB_USER,
      password: config.DB_PASSWORD,
      database: config.DB_NAME,
    },
    migrations: {
      directory: resolve(__dirname(import.meta.url), './migrations'),
      extension: 'js',
      loadExtensions: ['.js'],
    },
    seeds: {
      directory: resolve(__dirname(import.meta.url), './seeds'),
      extension: 'js',
      loadExtensions: ['.js'],
    },
  };
}

function createConnection() {
  return knex(buildConnectionConfig());
}

export { createConnection, buildConnectionConfig };
