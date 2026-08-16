import { Router } from "express";
import { z } from "zod";
import type { DataStore } from "../data/store.js";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../middleware/errors.js";
import { applicationStatuses } from "../types/domain.js";

const optionalDate = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.string().datetime({ offset: true }).optional(),
);
const optionalUrl = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.string().url("Enter a valid URL").max(500).optional(),
);
const optionalNumber = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().min(0).optional(),
);

const applicationFields = z.object({
    company: z.string().trim().min(1, "Company is required").max(120),
    role: z.string().trim().min(1, "Role is required").max(160),
    location: z.string().trim().min(1, "Location is required").max(120),
    status: z.enum(applicationStatuses).default("Saved"),
    sourceUrl: optionalUrl,
    salaryMin: optionalNumber,
    salaryMax: optionalNumber,
    appliedDate: optionalDate,
    nextActionDate: optionalDate,
    notes: z.string().trim().max(5000).optional(),
  });

const validSalaryRange = (data: { salaryMin?: number; salaryMax?: number }) =>
  data.salaryMin === undefined ||
  data.salaryMax === undefined ||
  data.salaryMax >= data.salaryMin;

const applicationSchema = applicationFields.refine(
    validSalaryRange,
    { path: ["salaryMax"], message: "Maximum salary must be above minimum" },
  );

const updateApplicationSchema = applicationFields.partial().refine(
    (data) =>
      validSalaryRange(data),
    { path: ["salaryMax"], message: "Maximum salary must be above minimum" },
  );

const interviewSchema = z.object({
  type: z.string().trim().min(1, "Interview type is required").max(80),
  dateTime: z.string().datetime({ offset: true }),
  interviewer: z.string().trim().max(120).optional(),
  meetingLink: optionalUrl,
  notes: z.string().trim().max(3000).optional(),
  outcome: z.string().trim().max(120).optional(),
});

const querySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.enum(applicationStatuses).optional(),
  location: z.string().trim().max(120).optional(),
  sort: z.enum(["newest", "oldest", "company", "nextAction"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export function createApplicationsRouter(store: DataStore) {
  const router = Router();
  router.use(requireAuth);

  router.get("/", async (request, response) => {
    const filters = querySchema.parse(request.query);
    const result = await store.listApplications(request.userId!, filters);
    response.json({
      success: true,
      message: "Applications loaded",
      data: {
        applications: result.items,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: result.total,
          pages: Math.max(1, Math.ceil(result.total / filters.limit)),
        },
      },
    });
  });

  router.post("/", async (request, response) => {
    const input = applicationSchema.parse(request.body);
    const application = await store.createApplication(request.userId!, input);
    response.status(201).json({
      success: true,
      message: "Application added",
      data: application,
    });
  });

  router.get("/:id", async (request, response) => {
    const application = await store.getApplication(
      request.userId!,
      request.params.id,
    );
    if (!application) throw new AppError("Application was not found", 404);
    response.json({
      success: true,
      message: "Application loaded",
      data: application,
    });
  });

  router.put("/:id", async (request, response) => {
    const input = updateApplicationSchema.parse(request.body);
    const application = await store.updateApplication(
      request.userId!,
      request.params.id,
      input,
    );
    if (!application) throw new AppError("Application was not found", 404);
    response.json({
      success: true,
      message: "Application updated",
      data: application,
    });
  });

  router.delete("/:id", async (request, response) => {
    const deleted = await store.deleteApplication(
      request.userId!,
      request.params.id,
    );
    if (!deleted) throw new AppError("Application was not found", 404);
    response.json({ success: true, message: "Application deleted", data: null });
  });

  router.post("/:id/interviews", async (request, response) => {
    const input = interviewSchema.parse(request.body);
    const application = await store.addInterview(
      request.userId!,
      request.params.id,
      input,
    );
    if (!application) throw new AppError("Application was not found", 404);
    response.status(201).json({
      success: true,
      message: "Interview scheduled",
      data: application,
    });
  });

  return router;
}
