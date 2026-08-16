export const applicationStatuses = ["Saved", "Applied", "Interview", "Offer", "Rejected", "Withdrawn"] as const;
export type ApplicationStatus = (typeof applicationStatuses)[number];

export type User = { id: string; name: string; email: string; createdAt: string };
export type Interview = {
  id: string;
  type: string;
  dateTime: string;
  interviewer?: string;
  meetingLink?: string;
  notes?: string;
  outcome?: string;
};
export type Application = {
  id: string;
  userId: string;
  company: string;
  role: string;
  location: string;
  status: ApplicationStatus;
  sourceUrl?: string;
  salaryMin?: number;
  salaryMax?: number;
  appliedDate?: string;
  nextActionDate?: string;
  notes?: string;
  interviews: Interview[];
  createdAt: string;
  updatedAt: string;
};
export type ApplicationInput = Pick<Application, "company" | "role" | "location" | "status" | "sourceUrl" | "salaryMin" | "salaryMax" | "appliedDate" | "nextActionDate" | "notes">;
export type DashboardStats = {
  total: number;
  active: number;
  interviews: number;
  offers: number;
  conversionRate: number;
  byStatus: Record<ApplicationStatus, number>;
  monthly: Array<{ label: string; count: number }>;
  upcoming: Application[];
  recent: Application[];
};
export type Pagination = { page: number; limit: number; total: number; pages: number };
