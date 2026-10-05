import { describe, beforeEach, afterEach, it } from 'node:test';

import { buildServer } from '../../src/server/index.js';
import { deepStrictEqual, strictEqual } from 'node:assert';

// eslint-disable-next-line n/no-unpublished-import
import { PostgreSqlContainer } from '@testcontainers/postgresql';

describe('API Workflow', () => {
  let container = null;
  let server = null;

  beforeEach(async () => {
    container = await new PostgreSqlContainer()
      .withDatabase('students-dev')
      .withExposedPorts(5432)
      .withUsername('root1')
      .withPassword('root1')
      .start();

    process.env.DB_PORT = String(container.getMappedPort(5432));
    server = await buildServer();
    await server.migrate();
    await server.seed();
  });

  afterEach(async () => {
    await server?.stop();
    await container?.stop();
    delete process.env.DB_PORT;
  });

  it('Should list the students', async () => {
    const query = `
        query Students {
           students {
            id
            name
            email
            ra
            cpf
          }
        }`;

    const request = await server.get().inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
      payload: JSON.stringify({ query }),
    });

    const response = request.json();
    strictEqual(request.statusCode, 200);
    strictEqual(response.data.students.length, 5);

    for (const student of response.data.students) {
      strictEqual(typeof student.id, 'string');
      strictEqual(typeof student.name, 'string');
      strictEqual(typeof student.email, 'string');
      strictEqual(typeof student.ra, 'string');
      strictEqual(typeof student.cpf, 'string');
      strictEqual(Object.prototype.hasOwnProperty.call(student, 'id'), true);
      strictEqual(Object.prototype.hasOwnProperty.call(student, 'name'), true);
      strictEqual(Object.prototype.hasOwnProperty.call(student, 'email'), true);
      strictEqual(Object.prototype.hasOwnProperty.call(student, 'ra'), true);
      strictEqual(Object.prototype.hasOwnProperty.call(student, 'cpf'), true);
    }
  });

  it('Create a student', async () => {
    const query = `
    mutation CreateStudent($input: StudentInput!){
           createStudent(input: $input) {
            id
            name
            email
            ra
            cpf
           }
    }`;

    const request = await server.get().inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
      payload: JSON.stringify({
        query,
        variables: {
          input: {
            name: 'John Doe',
            email: 'teste@teste.com',
            ra: '123456',
            cpf: '12345678901',
          },
        },
      }),
    });

    const response = request.json();

    strictEqual(request.statusCode, 200);

    deepStrictEqual(response.data.createStudent, {
      id: '51',
      name: 'John Doe',
      email: 'teste@teste.com',
      ra: '123456',
      cpf: '12345678901',
    });
  });

  it('It cannot be an invalid email', async () => {
    const query = `
    mutation CreateStudent($input: StudentInput!){
           createStudent(input: $input) {
            id
            name
            email
            ra
            cpf
           }
    }`;

    const request = await server.get().inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
      payload: JSON.stringify({
        query,
        variables: {
          input: {
            name: 'John Doe',
            email: 'invalidemail',
            ra: '123456',
            cpf: '12345678901',
          },
        },
      }),
    });

    const response = request.json();

    strictEqual(request.statusCode, 200);

    deepStrictEqual(response.errors[0].message, 'Invalid.email.format');
  });

  it('Deleting a student with successfull', async () => {
    const query = `
    mutation CreateStudent($input: StudentInput!){
           createStudent(input: $input) {
            id
            name
            email
            ra
            cpf
           }
    }`;

    const request = await server.get().inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
      payload: JSON.stringify({
        query,
        variables: {
          input: {
            name: 'John Doe',
            email: 'teste@teste.com',
            ra: '123456',
            cpf: '12345678901',
          },
        },
      }),
    });

    const response = request.json();

    strictEqual(request.statusCode, 200);

    const delStudent = `
    mutation DelStudent($id: ID!){
           delStudent(id: $id)
    }`;

    const requestdel = await server.get().inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
      payload: JSON.stringify({
        query: delStudent,
        variables: {
          id: response.data.createStudent.id,
        },
      }),
    });

    const responseDel = requestdel.json();
    strictEqual(requestdel.statusCode, 200);
    deepStrictEqual(responseDel.data.delStudent, true);
  });

  it('Should Try deleting a student but id is not valid', async () => {
    const delStudent = `
    mutation DelStudent($id: ID!){
           delStudent(id: $id)
    }`;

    const request = await server.get().inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
      payload: JSON.stringify({
        query: delStudent,
        variables: {
          id: 'ad99',
        },
      }),
    });

    const response = request.json();

    strictEqual(request.statusCode, 200);

    deepStrictEqual(response.errors[0].message, 'Invalid.id');

    deepStrictEqual(
      response.errors[0].extensions.code,
      'BUSINESS_VALIDATION_FAILED'
    );

    deepStrictEqual(response.errors[0].path[0], 'delStudent');
  });

  it('You must delete a student who does not exist.', async () => {
    const delStudent = `
    mutation DelStudent($id: ID!){
           delStudent(id: $id)
    }`;

    const request = await server.get().inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
      payload: JSON.stringify({
        query: delStudent,
        variables: {
          id: '999',
        },
      }),
    });

    const responseDel = request.json();
    strictEqual(request.statusCode, 200);
    deepStrictEqual(responseDel.data.delStudent, false);
  });

  it('RA must be unique', async (t) => {
    const query = `
    mutation CreateStudent($input: StudentInput!){
           createStudent(input: $input) {
            id
            name
            email
            ra
            cpf
           }
    }`;

    await server.get().inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
      payload: JSON.stringify({
        query,
        variables: {
          input: {
            name: 'John Doe',
            email: 'teste@teste.com',
            ra: '123456',
            cpf: '12345678901',
          },
        },
      }),
    });

    const request = await server.get().inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
      payload: JSON.stringify({
        query,
        variables: {
          input: {
            name: 'any_test',
            email: 'any_teste@teste.com',
            ra: '123456',
            cpf: '12345678901',
          },
        },
      }),
    });

    const response = request.json();

    const [error] = response.errors;
    strictEqual(error.message, 'errorSave');
    deepStrictEqual(error.extensions.code, 'INTERNAL_SERVER_ERROR');
    strictEqual(error.path[0], 'createStudent');
  });

  it('Update a student', async (t) => {
    const createGQL = `
    mutation CreateStudent($input: StudentInput!){
           createStudent(input: $input) {
            id
            name
            email
            ra
            cpf
           }
    }`;

    const request = await server.get().inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
      payload: JSON.stringify({
        query: createGQL,
        variables: {
          input: {
            name: 'John Doe',
            email: 'teste@teste.com',
            ra: '123456',
            cpf: '12345678901',
          },
        },
      }),
    });

    const response = request.json();

    const updateGQL = `
    mutation UpdateStudent($id: ID!, $input: StudentInput!){
           updateStudent(id: $id, input: $input) {
            id
            name
            email
            ra
            cpf
           }
    }`;

    const requestUpdate = await server.get().inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
      payload: JSON.stringify({
        query: updateGQL,
        variables: {
          id: response.data.createStudent.id,
          input: {
            name: 'Guest Doe',
            email: 'guest_any@hotmail.com',
            ra: '123456',
            cpf: '12345678901',
          },
        },
      }),
    });

    const updated = requestUpdate.json();

    strictEqual(requestUpdate.statusCode, 200);

    deepStrictEqual(updated.data.updateStudent, {
      id: '51',
      name: 'Guest Doe',
      email: 'guest_any@hotmail.com',
      ra: '123456',
      cpf: '12345678901',
    });
  });

  it('Update a student with an existing registration number (RA)', async () => {
    const createGQL = `
    mutation CreateStudent($input: StudentInput!){
           createStudent(input: $input) {
            id
            name
            email
            ra
            cpf
           }
    }`;

    await server.get().inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
      payload: JSON.stringify({
        query: createGQL,
        variables: {
          input: {
            name: 'John Doe',
            email: 'teste@teste.com',
            ra: '654321',
            cpf: '12345678901',
          },
        },
      }),
    });

    const request = await server.get().inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
      payload: JSON.stringify({
        query: createGQL,
        variables: {
          input: {
            name: 'John Doe',
            email: 'teste@teste.com',
            ra: '123456',
            cpf: '12345678901',
          },
        },
      }),
    });

    const response = request.json();

    const updateGQL = `
    mutation UpdateStudent($id: ID!, $input: StudentInput!){
           updateStudent(id: $id, input: $input) {
            id
            name
            email
            ra
            cpf
           }
    }`;

    const requestUpdate = await server.get().inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
      payload: JSON.stringify({
        query: updateGQL,
        variables: {
          id: response.data.createStudent.id,
          input: {
            name: 'Guest Doe',
            email: 'guest_any@hotmail.com',
            ra: '654321',
            cpf: '12345678901',
          },
        },
      }),
    });

    const updated = requestUpdate.json();

    strictEqual(requestUpdate.statusCode, 500);

    const [error] = updated.errors;
    strictEqual(error.message, 'errorUpdate');
    deepStrictEqual(error.extensions.code, 'INTERNAL_SERVER_ERROR');
    strictEqual(error.path[0], 'updateStudent');
  });

  it('Should update the student with invalid id', async () => {
    const createGQL = `
    mutation CreateStudent($input: StudentInput!){
           createStudent(input: $input) {
            id
            name
            email
            ra
            cpf
           }
    }`;

    await server.get().inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
      payload: JSON.stringify({
        query: createGQL,
        variables: {
          input: {
            name: 'John Doe',
            email: 'teste@teste.com',
            ra: '123456',
            cpf: '12345678901',
          },
        },
      }),
    });

    const updateGQL = `
    mutation UpdateStudent($id: ID!, $input: StudentInput!){
           updateStudent(id: $id, input: $input) {
            id
            name
            email
            ra
            cpf
           }
    }`;

    const requestUpdate = await server.get().inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
      payload: JSON.stringify({
        query: updateGQL,
        variables: {
          id: 'dsdsdsdsds',
          input: {
            name: 'Guest Doe',
            email: 'guest_any@hotmail.com',
            ra: '654321',
            cpf: '12345678901',
          },
        },
      }),
    });

    const updated = requestUpdate.json();

    strictEqual(requestUpdate.statusCode, 200);
    const [error] = updated.errors;
    strictEqual(error.message, 'Invalid.id');
  });

  it('Should return a invalid record', async () => {
    const createGQL = `
    mutation CreateStudent($input: StudentInput!){
           createStudent(input: $input) {
            id
            name
            email
            ra
            cpf
           }
    }`;

    await server.get().inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
      payload: JSON.stringify({
        query: createGQL,
        variables: {
          input: {
            name: 'John Doe',
            email: 'teste@teste.com',
            ra: '123456',
            cpf: '12345678901',
          },
        },
      }),
    });

    const updateGQL = `
    mutation UpdateStudent($id: ID!, $input: StudentInput!){
           updateStudent(id: $id, input: $input) {
            id
            name
            email
            ra
            cpf
           }
    }`;

    const requestUpdate = await server.get().inject({
      method: 'POST',
      url: '/graphql',
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
      payload: JSON.stringify({
        query: updateGQL,
        variables: {
          id: '999',
          input: {
            name: 'Guest Doe',
            email: 'guest_any@hotmail.com',
            ra: '654321',
            cpf: '12345678901',
          },
        },
      }),
    });

    const updated = requestUpdate.json();

    strictEqual(requestUpdate.statusCode, 200);

    const [error] = updated.errors;
    strictEqual(error.message, 'invalidRecord');
    deepStrictEqual(error.extensions.code, 'BUSINESS_VALIDATION_FAILED');
    strictEqual(error.path[0], 'updateStudent');
  });
});
