"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title:'new',
    salary: 50000,
    equity: "0.2",
    company_handle: 'c1'
  };

  test("ok for users", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: newJob,
    });
  });

  test("not ok for unauthorized user", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u2Token}`);

    expect(resp.statusCode).toEqual(401)
  });
  

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "new",
          salary: 50000
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newJob,
          handle: "not-a-handle",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
          [
            {
              title:'j1',
              salary: 100000,
              equity: "0.7",
              company_handle: 'c1'
            },
            {
              title:'j2',
              salary: 90000,
              equity: "0.8",
              company_handle: 'c2'
            },
            {
              title:'j3',
              salary: 150000,
              equity: "0.9",
              company_handle: 'c3'
            },
          ],
    });
  });

  /// adding test for getting search results with filtered parameters
  test('ok for anon with filters', async function () {
    const resp = await request(app).get('/jobs?minSalary=100000')
    expect(resp.body).toEqual({
      jobs:
        [
          {
            title:'j1',
            salary: 100000,
            equity: "0.7",
            company_handle: 'c1'
          }
        ]
    })
  });

  /// test for invalid param
  test('fails because of invalid param', async function (){
    const resp = await request(app).get('/jobs?wrong=wrong')
    expect(resp.statusCode).toEqual(400)
  })

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:handle */

describe("GET /jobs/:job", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/j1`);
    expect(resp.body).toEqual({
      job: {
        title:'j1',
        salary: 100000,
        equity: "0.7",
        company_handle: 'c1'
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/nope`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:job */

describe("PATCH /jobs/:job", function () {
  test("works for users", async function () {
    const resp = await request(app)
        .patch(`/jobs/j1`)
        .send({
          title: "new-j1",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      job: {
        title:'new-j1',
        salary: 100000,
        equity: "0.7",
        company_handle: 'c1'
      },
    });
  });

  test("does not work for unauthorized user", async function () {
    const resp = await request(app)
        .patch(`/jobs/j1`)
        .send({
          title: "j1-new",
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401)
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/jobs/j1`)
        .send({
          title: "j1-new",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such company", async function () {
    const resp = await request(app)
        .patch(`/jobs/nope`)
        .send({
          title: "new-nope",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on handle change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/j1`)
        .send({
          title: "j1-new",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/jobs/j1`)
        .send({
          title: 47,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:handle */

describe("DELETE /jobs/:handle", function () {
  test("works for users", async function () {
    const resp = await request(app)
        .delete(`/jobs/j1`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: "j1" });
  });

  test("does not work for unauthorized user", async function () {
    const resp = await request(app)
        .delete(`/jobs/j1`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401)
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/jobs/j1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
        .delete(`/jobs/nope`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
