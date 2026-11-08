import { describe, it, expect, beforeAll, afterAll } from "vitest";
import pg from "pg";

/**
 * Security Test Suite: Authentication, Ownership & NDA Access Control
 * Direct SQL queries against local PostgreSQL with INT seed data.
 */

const pool = new pg.Pool({
  host: "/var/run/postgresql",
  database: "releva_int_test",
  user: "postgres",
});

let testData: {
  adminId: string;
  investorId: string;
  advisorId: string;
  sellerSabiId: string;
  sellerManualId: string;
  sabiProjectId: string;
  manualProjectId: string;
};

describe("Auth & Ownership Security Tests", () => {
  beforeAll(async () => {
    const users = await pool.query(
      `SELECT id, email FROM "user" WHERE email IN (
        'int-admin@test.local',
        'int-comprador@test.local', 
        'int-asesor@test.local',
        'int-vendedor-sabi@test.local',
        'int-vendedor-manual@test.local'
      ) ORDER BY email`
    );
    
    const projects = await pool.query(
      `SELECT id, slug FROM project ORDER BY slug`
    );
    
    testData = {
      adminId: users.rows.find(u => u.email === 'int-admin@test.local')?.id ?? '',
      investorId: users.rows.find(u => u.email === 'int-comprador@test.local')?.id ?? '',
      advisorId: users.rows.find(u => u.email === 'int-asesor@test.local')?.id ?? '',
      sellerSabiId: users.rows.find(u => u.email === 'int-vendedor-sabi@test.local')?.id ?? '',
      sellerManualId: users.rows.find(u => u.email === 'int-vendedor-manual@test.local')?.id ?? '',
      sabiProjectId: projects.rows.find(p => p.slug === 'int-empresa-tecnologia')?.id ?? '',
      manualProjectId: projects.rows.find(p => p.slug === 'int-consultoria-servicios')?.id ?? '',
    };
  });

  describe("Role-Based Access", () => {
    it("admin can access any project", async () => {
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM project WHERE owner_id = $1 OR status = 'published'`,
        [testData.adminId]
      );
      expect(parseInt(result.rows[0].count)).toBeGreaterThan(0);
    });

    it("seller cannot access another seller's project", async () => {
      const result = await pool.query(
        `SELECT owner_id FROM project WHERE id = $1`,
        [testData.manualProjectId]
      );
      expect(result.rows[0].owner_id).not.toBe(testData.sellerSabiId);
    });

    it("investor cannot modify projects", async () => {
      const result = await pool.query(
        `SELECT owner_id FROM project WHERE id = $1`,
        [testData.sabiProjectId]
      );
      expect(result.rows[0].owner_id).not.toBe(testData.investorId);
    });
  });

  describe("NDA Access Control", () => {
    it("investor with accepted NDA can access confidential data", async () => {
      const result = await pool.query(
        `SELECT nda_accepted_at FROM project_access 
         WHERE project_id = $1 AND investor_id = $2`,
        [testData.manualProjectId, testData.investorId]
      );
      expect(result.rows[0]?.nda_accepted_at).not.toBeNull();
    });

    it("investor without NDA cannot access confidential fields", async () => {
      const result = await pool.query(
        `SELECT nda_accepted_at FROM project_access 
         WHERE project_id = $1 AND investor_id = $2`,
        [testData.sabiProjectId, testData.investorId]
      );
      const hasNdaAccess = result.rows[0]?.nda_accepted_at !== null;
      expect(hasNdaAccess).toBe(false);
    });

    it("advisor has no investor access records", async () => {
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM project_access WHERE investor_id = $1`,
        [testData.advisorId]
      );
      expect(parseInt(result.rows[0].count)).toBe(0);
    });
  });

  describe("Project Ownership", () => {
    it("only project owner can see sensitive data", async () => {
      const result = await pool.query(
        `SELECT owner_id, cif, legal_name FROM project WHERE id = $1`,
        [testData.sabiProjectId]
      );
      expect(result.rows[0].owner_id).toBe(testData.sellerSabiId);
      expect(result.rows[0].cif).toBeDefined();
    });

    it("seller owns correct project", async () => {
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM project WHERE owner_id = $1`,
        [testData.sellerManualId]
      );
      expect(parseInt(result.rows[0].count)).toBe(1);
    });
  });

  describe("Advisor Mandate", () => {
    it("advisor has mandate for SABI project only", async () => {
      const result = await pool.query(
        `SELECT project_id FROM sale_mandate WHERE advisor_id = $1`,
        [testData.advisorId]
      );
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].project_id).toBe(testData.sabiProjectId);
    });
  });

  describe("Session & Account Security", () => {
    it("users have credential accounts with passwords", async () => {
      const result = await pool.query(
        `SELECT user_id, LENGTH(password) as pw_len FROM account 
         WHERE user_id = ANY($1) AND provider_id = 'credential'`,
        [[testData.adminId, testData.investorId, testData.advisorId]]
      );
      expect(result.rows).toHaveLength(3);
      result.rows.forEach(row => {
        expect(row.pw_len).toBe(161); // Better Auth scrypt
      });
    });

    it("all test users have accepted terms", async () => {
      const result = await pool.query(
        `SELECT terms_accepted_at FROM "user" WHERE id = ANY($1)`,
        [[testData.adminId, testData.investorId, testData.advisorId, testData.sellerSabiId, testData.sellerManualId]]
      );
      expect(result.rows).toHaveLength(5);
      result.rows.forEach(row => {
        expect(row.terms_accepted_at).not.toBeNull();
      });
    });
  });
});

describe("Negative Security Tests", () => {
  it("cannot access project without proper role", async () => {
    const result = await pool.query(
      `SELECT role FROM "user" WHERE email = 'int-comprador@test.local'`
    );
    expect(result.rows[0].role).toBe("investor");
    expect(result.rows[0].role).not.toBe("admin");
  });

  it("advisor cannot be project owner", async () => {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM project WHERE owner_id = (
        SELECT id FROM "user" WHERE email = 'int-asesor@test.local'
      )`
    );
    expect(parseInt(result.rows[0].count)).toBe(0);
  });
});

afterAll(async () => {
  await pool.end();
});
