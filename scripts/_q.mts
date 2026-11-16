import pg from "pg";
const c = new pg.Client({ connectionString: process.env.DATABASE_URL }); await c.connect();
const sql = process.argv[2];
console.log((await c.query(sql)).rows); await c.end();
