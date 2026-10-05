function getDatabaseConfig() {
  return Object.freeze({
    DB_HOST: process.env.DB_HOST ?? 'localhost',
    DB_PORT: Number(process.env.DB_PORT ?? 5433),
    DB_USER: process.env.DB_USER ?? 'root1',
    DB_PASSWORD: process.env.DB_PASSWORD ?? 'root1',
    DB_NAME: process.env.DB_NAME ?? 'students-dev',
  });
}

export { getDatabaseConfig };
