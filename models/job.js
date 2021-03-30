"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { title, salary, equity, company_handle }
   *
   * Throws BadRequestError if job already in database.
   * */

  static async create({ title, salary, equity, company_handle}) {
    const duplicateCheck = await db.query(
          `SELECT title, company_handle
           FROM jobs
           WHERE title = $1 AND company_handle = $2`,
        [title, company_handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate job: ${title}, ${company_handle}`);

    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING title, salary, equity, company_handle`,
        [
            title, 
            salary, 
            equity,
            company_handle
        ]
    );
    const job = result.rows[0];

     return job;
  }

  /// function to create 'WHERE' search param in findAll() if necessary
  static searchFilter(params){
    let searchList = []
    if ('title' in params){
      searchList.push(`lower(title) LIKE '%${params['title'].toLowerCase()}%'`)
    }
    if('minSalary' in params){
      searchList.push(`salary >= ${params['minSalary']}`)
    }
    if('hasEquity' in params && params['hasEquity'] == 'true'){
      searchList.push(`equity IS NOT NULL`)
    }

    /// creating string to be entered into sql query if necessary
    if (searchList.length == 3){
      return `WHERE ` + `${searchList[0]} AND ` + `${searchList[1]} AND ` + `${searchList[2]}`
    }else if(searchList.length == 2){
      return `WHERE ` + `${searchList[0]} AND ` + `${searchList[1]}`
    }else if(searchList.length ==1){
      return `WHERE ` + `${searchList[0]}`
    }else{
      return ''
    }
  }

  /** Find all jobs.
   *
   * Returns [{ title, salary, equity, company_handle }, ...]
   * */

  static async findAll(params) {
    const jobsRes = await db.query(
          `SELECT id,
                  title, 
                  salary, 
                  equity, 
                  company_handle
           FROM jobs
           ${this.searchFilter(params)}
           ORDER BY id`);
    return jobsRes.rows;
  }

  /** Given a id return data about job.
   *
   * Returns { title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
          `SELECT title, 
                  salary, 
                  equity, 
                  company_handle
           FROM jobs
           WHERE id = $1`,
        [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No company: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {title, salary, equity}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          companyHandle: "company_handle"
        });
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING title, 
                                salary, 
                                equity`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No company: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}


module.exports = Job;
