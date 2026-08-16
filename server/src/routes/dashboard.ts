import { Router } from "express";
import type { DataStore } from "../data/store.js";
import { requireAuth } from "../middleware/auth.js";
import { applicationStatuses } from "../types/domain.js";

const monthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

export function createDashboardRouter(store: DataStore) {
  const router = Router();
  router.use(requireAuth);

  router.get("/stats", async (request, response) => {
    const { items: applications } = await store.listApplications(
      request.userId!,
      { page: 1, limit: 10_000, sort: "newest" },
    );
    const byStatus = Object.fromEntries(
      applicationStatuses.map((status) => [status, 0]),
    ) as Record<(typeof applicationStatuses)[number], number>;
    applications.forEach((application) => {
      byStatus[application.status] += 1;
    });

    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - (5 - index));
      return {
        key: monthKey(date),
        label: date.toLocaleDateString("en-US", { month: "short" }),
        count: 0,
      };
    });
    const monthLookup = new Map(months.map((month) => [month.key, month]));
    applications.forEach((application) => {
      const date = new Date(application.appliedDate ?? application.createdAt);
      const month = monthLookup.get(monthKey(date));
      if (month) month.count += 1;
    });

    const activeApplications = applications.filter(
      (application) => application.status !== "Saved",
    ).length;
    const progressed = byStatus.Interview + byStatus.Offer;
    const now = Date.now();
    const inTwoWeeks = now + 14 * 24 * 60 * 60 * 1000;
    const upcoming = applications
      .filter((application) => {
        if (!application.nextActionDate) return false;
        const time = new Date(application.nextActionDate).getTime();
        return time >= now && time <= inTwoWeeks;
      })
      .sort((a, b) =>
        (a.nextActionDate ?? "").localeCompare(b.nextActionDate ?? ""),
      )
      .slice(0, 5);

    response.json({
      success: true,
      message: "Dashboard statistics loaded",
      data: {
        total: applications.length,
        active: byStatus.Applied + byStatus.Interview,
        interviews: byStatus.Interview,
        offers: byStatus.Offer,
        conversionRate:
          activeApplications === 0
            ? 0
            : Math.round((progressed / activeApplications) * 100),
        byStatus,
        monthly: months.map(({ label, count }) => ({ label, count })),
        upcoming,
        recent: applications.slice(0, 5),
      },
    });
  });

  return router;
}
