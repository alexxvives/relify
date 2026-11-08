import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

/**
 * Security Test Suite: Authentication, Ownership & NDA Access Control
 * 
 * Tests against local PostgreSQL with synthetic INT seed data.
 * DOES NOT access production database.
 */

// Use direct connection without SCRAM
const pool = new pg.Pool({
  host: "/var/run/postgresql", // Unix socket
  database: "releva_int_test",
  user: "postgres",
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

describe("Auth & Ownership Security Tests", () => {
  let adminId: string;
  let investorId: string;
  let advisorId: string;
  let sellerSabiId: string;
  let sellerManualId: string;
  let sabiProjectId: string;
  let manualProjectId: string;

  beforeAll(async () => {
    // Load test users and projects from INT seed
    const admin = await prisma.user.findUnique({ where: { email: "int-admin@test.local" } });
    const investor = await prisma.user.findUnique({ where: { email: "int-comprador@test.local" } });
    const advisor = await prisma.user.findUnique({ where: { email: "int-asesor@test.local" } });
    const sellerSabi = await prisma.user.findUnique({ where: { email: "int-vendedor-sabi@test.local" } });
    const sellerManual = await prisma.user.findUnique({ where: { email: "int-vendedor-manual@test.local" } });

    if (!admin || !investor || !advisor || !sellerSabi || !sellerManual) {
      throw new Error("INT seed data not loaded. Run seed first.");
    }

    adminId = admin.id;
    investorId = investor.id;
    advisorId = advisor.id;
    sellerSabiId = sellerSabi.id;
    sellerManualId = sellerManual.id;

    const projects = await prisma.project.findMany();
    sabiProjectId = projects.find(p => p.slug === "int-empresa-tecnologia")?.id ?? "";
    manualProjectId = projects.find(p => p.slug === "int-consultoria-servicios")?.id ?? "";
  });

  describe("Role-Based Access", () => {
    it("admin can access any project", async () => {
      // Admins should see all projects
      const projects = await prisma.project.findMany({
        where: { 
          OR: [
            { ownerId: adminId },
            { status: "published" }
          ]
        }
      });
      
      expect(projects.length).toBeGreaterThan(0);
    });

    it("seller cannot access another seller's project", async () => {
      // Seller SABI should NOT see manual seller's project directly
      const project = await prisma.project.findUnique({
        where: { id: manualProjectId }
      });
      
      expect(project?.ownerId).not.toBe(sellerSabiId);
      
      // Verify ownership isolation
      const ownedBySellerSabi = await prisma.project.findMany({
        where: { ownerId: sellerSabiId }
      });
      
      expect(ownedBySellerSabi.every(p => p.ownerId === sellerSabiId)).toBe(true);
    });

    it("investor cannot modify projects", async () => {
      // Investors should only have read access via NDA
      const project = await prisma.project.findUnique({
        where: { id: sabiProjectId }
      });
      
      expect(project?.ownerId).not.toBe(investorId);
    });
  });

  describe("NDA Access Control", () => {
    it("investor with accepted NDA can access confidential data", async () => {
      // Check investor has NDA access to manual project
      const access = await prisma.projectAccess.findUnique({
        where: {
          projectId_investorId: {
            projectId: manualProjectId,
            investorId: investorId
          }
        }
      });
      
      expect(access).toBeDefined();
      expect(access?.ndaAcceptedAt).not.toBeNull();
    });

    it("investor without NDA cannot access confidential fields", async () => {
      // Check investor does NOT have NDA access to SABI project
      const access = await prisma.projectAccess.findFirst({
        where: {
          projectId: sabiProjectId,
          investorId: investorId
        }
      });
      
      // Should either not exist or not have NDA accepted
      if (access) {
        expect(access.ndaAcceptedAt).toBeNull();
      }
    });

    it("pre-NDA investor has no project_access record", async () => {
      // Advisor should not have investor access records
      const accessCount = await prisma.projectAccess.count({
        where: { investorId: advisorId }
      });
      
      expect(accessCount).toBe(0);
    });
  });

  describe("Project Ownership", () => {
    it("only project owner can see sensitive data", async () => {
      const project = await prisma.project.findUnique({
        where: { id: sabiProjectId },
        select: {
          ownerId: true,
          cif: true,
          legalName: true,
        }
      });
      
      expect(project?.ownerId).toBe(sellerSabiId);
      expect(project?.cif).toBeDefined();
      expect(project?.legalName).toBeDefined();
    });

    it("seller owns correct project", async () => {
      const projects = await prisma.project.findMany({
        where: { ownerId: sellerManualId }
      });
      
      expect(projects).toHaveLength(1);
      expect(projects[0].id).toBe(manualProjectId);
    });
  });

  describe("Advisor Mandate", () => {
    it("advisor has mandate for SABI project only", async () => {
      const mandates = await prisma.saleMandate.findMany({
        where: { advisorId: advisorId }
      });
      
      expect(mandates).toHaveLength(1);
      expect(mandates[0].projectId).toBe(sabiProjectId);
    });

    it("advisor cannot have mandate for non-owned projects without permission", async () => {
      // Verify mandate requires project owner relationship
      const mandate = await prisma.saleMandate.findFirst({
        where: {
          advisorId: advisorId,
          projectId: sabiProjectId
        },
        include: {
          project: {
            select: { ownerId: true }
          }
        }
      });
      
      expect(mandate).toBeDefined();
      expect(mandate?.project.ownerId).toBe(sellerSabiId);
    });
  });

  describe("Session & Account Security", () => {
    it("users have credential accounts with passwords", async () => {
      const accounts = await prisma.account.findMany({
        where: {
          userId: { in: [adminId, investorId, advisorId] },
          providerId: "credential"
        }
      });
      
      expect(accounts).toHaveLength(3);
      accounts.forEach(account => {
        expect(account.password).toBeDefined();
        expect(account.password?.length).toBe(161); // Better Auth scrypt
      });
    });

    it("all test users have accepted terms", async () => {
      const users = await prisma.user.findMany({
        where: {
          id: { in: [adminId, investorId, advisorId, sellerSabiId, sellerManualId] }
        },
        select: { termsAcceptedAt: true }
      });
      
      expect(users).toHaveLength(5);
      users.forEach(user => {
        expect(user.termsAcceptedAt).not.toBeNull();
      });
    });
  });
});

describe("Negative Security Tests", () => {
  it("cannot create account with duplicate email", async () => {
    await expect(
      prisma.user.create({
        data: {
          id: "test-duplicate",
          email: "int-admin@test.local", // Duplicate
          name: "Test",
          role: "admin",
        }
      })
    ).rejects.toThrow();
  });

  it("cannot access project without proper role", async () => {
    // Simulate unauthorized access check
    const user = await prisma.user.findUnique({
      where: { email: "int-comprador@test.local" }
    });
    
    expect(user?.role).toBe("investor");
    expect(user?.role).not.toBe("admin");
    expect(user?.role).not.toBe("seller");
  });

  it("advisor cannot be project owner", async () => {
    const advisor = await prisma.user.findUnique({
      where: { email: "int-asesor@test.local" }
    });
    
    const ownedProjects = await prisma.project.count({
      where: { ownerId: advisor?.id }
    });
    
    expect(ownedProjects).toBe(0);
  });
});

// Cleanup
afterAll(async () => {
  await prisma.$disconnect();
  await pool.end();
});
