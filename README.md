<details>
<summary><strong>🇧🇷 Ver documentação em Português (Brasil)</strong></summary>

# graphql-fastify-api

API GraphQL para gerenciamento de estudantes, construída com **Fastify**, **Mercurius**, **GraphQL** e **PostgreSQL**.

O projeto demonstra como montar uma API moderna em Node.js com testes de integração usando **testcontainers**, separação de responsabilidades e shutdown gracioso.

## Tecnologias

- [Node.js](https://nodejs.org/) 20+
- [Fastify](https://www.fastify.io/) — framework web rápido e leve
- [Mercurius](https://mercurius.dev/) — integração GraphQL para Fastify
- [GraphQL](https://graphql.org/)
- [Knex.js](https://knexjs.org/) — query builder SQL
- [PostgreSQL](https://www.postgresql.org/)
- [testcontainers](https://testcontainers.com/) — banco de testes real em containers
- [node --test](https://nodejs.org/api/test.html) — runner de testes nativo

## Arquitetura

```text
src/
├── server/          # bootstrap do Fastify, schema GraphQL e lifecycle
├── graphql/         # type definitions e resolvers
├── infra/db/        # conexão, migrations e seeds do Knex
└── support/         # utilitários
```

- O schema GraphQL é montado a partir de arquivos `.graphql` e resolvers organizados por domínio.
- O contexto da requisição injeta a conexão com o banco, mantendo os resolvers testáveis.
- O shutdown gracioso (`close-with-grace`) garante que conexões e o servidor sejam fechados corretamente.

## Como rodar

### Pré-requisitos

- Node.js 20+
- Docker e Docker Compose

### Subir o banco de dados

```sh
docker-compose up -d
```

### Instalar dependências

```sh
npm ci
```

### Rodar migrations e seeds

```sh
npm run knex:migrate
npm run knex:seed
```

### Iniciar o servidor

```sh
npm run dev
```

A API estará disponível em `http://0.0.0.0:4000`.

### Health check

```sh
curl http://0.0.0.0:4000/.well-known/health
```

## Testes

Os testes usam **testcontainers** para subir um PostgreSQL real durante a execução, garantindo que o comportamento reflete o ambiente de produção.

```sh
# todos os testes
npm test

# com variáveis de ambiente
npm run test:env

# modo watch
npm run test:watch

# arquivo específico
npm test tests/students.test.js
```

## Lint e formatação

```sh
# verificar
npm run lint:ci
npm run format:check

# corrigir
npm run lint
npm run format
```

## Exemplos de operações GraphQL

### Criar estudante

```graphql
mutation CreateStudent($input: StudentInput!) {
  createStudent(input: $input) {
    id
    name
    email
    ra
    cpf
  }
}
```

```json
{
  "input": {
    "name": "John Doe",
    "email": "john@example.com",
    "ra": "123456",
    "cpf": "12345678901"
  }
}
```

### Listar estudantes

```graphql
query Students {
  students {
    id
    name
    email
    ra
    cpf
  }
}
```

## Licença

[MIT](LICENSE)

</details>

# graphql-fastify-api

---

A GraphQL student-management API built with **Fastify**, **Mercurius**, **PostgreSQL**, and **Knex**. It demonstrates schema and resolver organization, dependency injection through the GraphQL context, graceful shutdown, and integration tests against a real PostgreSQL container.

## Requirements

- Node.js 20+
- Docker and Docker Compose

```sh
docker-compose up -d
npm ci
npm run knex:migrate
npm run knex:seed
npm run dev
```

The API is available at `http://0.0.0.0:4000`; its health endpoint is `/.well-known/health`.

## Architecture

```text
src/
├── server/       # Fastify bootstrap, GraphQL schema, and lifecycle
├── resolvers/    # queries and mutations
├── schemas/      # GraphQL definitions
├── infra/db/     # Knex connection, migrations, and seeds
└── support/      # validation and shared errors
```

## Tests and quality

```sh
npm test
npm run lint:ci
npm run format:check
```

The end-to-end suite uses Testcontainers, so Docker must be running.

## License

[MIT](LICENSE)
