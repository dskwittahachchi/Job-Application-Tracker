import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { MemoryDataStore } from "../src/data/store.js";

let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  app = createApp(await MemoryDataStore.create({ seed: false }));
});

const register = async (name: string, email: string) => {
  const response = await request(app).post("/api/auth/register").send({
    name,
    email,
    password: "StrongPass1",
  });
  return response.body.data.token as string;
};

describe("Trackly API", () => {
  it("reports a healthy zero-config memory database", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body.data.database).toBe("memory");
  });

  it("registers, validates credentials, and protects private routes", async () => {
    const token = await register("Alex Tester", "alex@example.com");
    expect(token).toBeTypeOf("string");

    const failedLogin = await request(app).post("/api/auth/login").send({
      email: "alex@example.com",
      password: "WrongPass1",
    });
    expect(failedLogin.status).toBe(401);

    const unauthorized = await request(app).get("/api/applications");
    expect(unauthorized.status).toBe(401);
  });

  it("completes CRUD while enforcing ownership", async () => {
    const ownerToken = await register("Record Owner", "owner@example.com");
    const otherToken = await register("Other User", "other@example.com");
    const created = await request(app)
      .post("/api/applications")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        company: "Acme",
        role: "Product Engineer",
        location: "Remote",
        status: "Applied",
        salaryMin: 100000,
        salaryMax: 140000,
      });
    expect(created.status).toBe(201);
    const applicationId = created.body.data.id as string;

    const forbiddenRead = await request(app)
      .get(`/api/applications/${applicationId}`)
      .set("Authorization", `Bearer ${otherToken}`);
    expect(forbiddenRead.status).toBe(404);

    const updated = await request(app)
      .put(`/api/applications/${applicationId}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ status: "Interview" });
    expect(updated.body.data.status).toBe("Interview");

    const interview = await request(app)
      .post(`/api/applications/${applicationId}/interviews`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ type: "Technical interview", dateTime: new Date().toISOString() });
    expect(interview.status).toBe(201);
    expect(interview.body.data.interviews).toHaveLength(1);

    const deleted = await request(app)
      .delete(`/api/applications/${applicationId}`)
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(deleted.status).toBe(200);
  });

  it("rejects invalid salary ranges and returns dashboard data", async () => {
    const token = await register("Dashboard User", "dashboard@example.com");
    const invalid = await request(app)
      .post("/api/applications")
      .set("Authorization", `Bearer ${token}`)
      .send({
        company: "Acme",
        role: "Engineer",
        location: "Remote",
        salaryMin: 160000,
        salaryMax: 100000,
      });
    expect(invalid.status).toBe(400);

    const dashboard = await request(app)
      .get("/api/dashboard/stats")
      .set("Authorization", `Bearer ${token}`);
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.data.monthly).toHaveLength(6);
  });
});
