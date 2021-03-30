"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "j-new",
    salary: 150000,
    equity: true,
    company_handle: 'c1'
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual(newJob);

    const result = await db.query(
          `SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'j-new'`);
    expect(result.rows).toEqual([
      {
        title: "j-new",
        salary: 150000,
        equity: true,
        company_handle: 'c1'
      },
    ]);
  });

  test("bad request with dupe", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(companies).toEqual([
      {
        title: 'j1',
        salary: 100000,
        equity: true,
        company_handle: 'c1'
      },
      {
        title: 'j2',
        salary: 90000,
        equity: true,
        company_handle: 'c2'
      },
      {
        title: 'j3',
        salary: 80000,
        equity: true,
        company_handle: 'c3'
      },
    ]);
  });
  test("works: filter", async function (){
    let jobs = await Job.findAll({title:'j2',minSalary:90000,hasEquity:true})
    expect(jobs).toEqual([
      {
        title: 'j2',
        salary: 90000,
        equity: true,
        company_handle: 'c2'
      }
    ])
  })
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get("j1");
    expect(job).toEqual({
        title: 'j1',
        salary: 100000,
        equity: true,
        company_handle: 'c1'
    });
  });

  test("not found if no such company", async function () {
    try {
      await Job.get("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: 'new',
    salary: 125000,
    equity: true,
    company_handle: 'c1'
  };

  test("works", async function () {
    let job = await Job.update("j1", updateData);
    expect(job).toEqual({
      title: 'new',
      ...updateData,
    });

    const result = await db.query(
          `SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'new'`);
    expect(result.rows).toEqual([{
        title: 'new',
        salary: 125000,
        equity: true,
        company_handle: 'c1'
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "new",
      salary: null,
      equity: null,
      company_handle: 'c1'
    };

    let job = await Job.update("c1", updateDataSetNulls);
    expect(job).toEqual({
      title: "j1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
        `SELECT title, salary, equity, company_handle
        FROM jobs
        WHERE title = 'new'`);
    expect(result.rows).toEqual([{
        title: "new",
        salary: null,
        equity: null,
        company_handle: 'c1'
    }]);
  });

  test("not found if no such company", async function () {
    try {
      await Job.update("nope", updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update("j1", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove("j1");
    const res = await db.query(
        "SELECT title FROM companies WHERE title='j1'");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Job.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
