export const applicationStatuses = [
  "Saved",
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
  "Withdrawn",
] as const;

export type ApplicationStatus = (typeof applicationStatuses)[number];

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

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export type StoredUser = SafeUser & {
  passwordHash: string;
};

export type ApplicationInput = Omit<
  Application,
  "id" | "userId" | "interviews" | "createdAt" | "updatedAt"
>;

export type ApplicationFilters = {
  search?: string;
  status?: ApplicationStatus;
  location?: string;
  sort?: "newest" | "oldest" | "company" | "nextAction";
  page: number;
  limit: number;
};
