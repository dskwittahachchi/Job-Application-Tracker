import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { ApplicationModel } from "../models/Application.js";
import { UserModel } from "../models/User.js";
import type {
  Application,
  ApplicationFilters,
  ApplicationInput,
  Interview,
  SafeUser,
  StoredUser,
} from "../types/domain.js";

export type InterviewInput = Omit<Interview, "id">;

export interface DataStore {
  findUserByEmail(email: string): Promise<StoredUser | null>;
  getUser(id: string): Promise<SafeUser | null>;
  createUser(input: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<SafeUser>;
  listApplications(
    userId: string,
    filters: ApplicationFilters,
  ): Promise<{ items: Application[]; total: number }>;
  getApplication(userId: string, id: string): Promise<Application | null>;
  createApplication(
    userId: string,
    input: ApplicationInput,
  ): Promise<Application>;
  updateApplication(
    userId: string,
    id: string,
    input: Partial<ApplicationInput>,
  ): Promise<Application | null>;
  deleteApplication(userId: string, id: string): Promise<boolean>;
  addInterview(
    userId: string,
    id: string,
    input: InterviewInput,
  ): Promise<Application | null>;
}

const isoDate = (value: unknown): string | undefined => {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

const mapUser = (doc: Record<string, unknown>): StoredUser => ({
  id: String(doc._id ?? doc.id),
  name: String(doc.name),
  email: String(doc.email),
  passwordHash: String(doc.passwordHash),
  createdAt: isoDate(doc.createdAt) ?? new Date().toISOString(),
});

const mapApplication = (doc: Record<string, unknown>): Application => {
  const interviews = Array.isArray(doc.interviews) ? doc.interviews : [];
  return {
    id: String(doc._id ?? doc.id),
    userId: String(doc.userId),
    company: String(doc.company),
    role: String(doc.role),
    location: String(doc.location),
    status: doc.status as Application["status"],
    sourceUrl: doc.sourceUrl ? String(doc.sourceUrl) : undefined,
    salaryMin:
      typeof doc.salaryMin === "number" ? doc.salaryMin : undefined,
    salaryMax:
      typeof doc.salaryMax === "number" ? doc.salaryMax : undefined,
    appliedDate: isoDate(doc.appliedDate),
    nextActionDate: isoDate(doc.nextActionDate),
    notes: doc.notes ? String(doc.notes) : undefined,
    interviews: interviews.map((item) => {
      const interview = item as Record<string, unknown>;
      return {
        id: String(interview._id ?? interview.id),
        type: String(interview.type),
        dateTime: isoDate(interview.dateTime) ?? new Date().toISOString(),
        interviewer: interview.interviewer
          ? String(interview.interviewer)
          : undefined,
        meetingLink: interview.meetingLink
          ? String(interview.meetingLink)
          : undefined,
        notes: interview.notes ? String(interview.notes) : undefined,
        outcome: interview.outcome ? String(interview.outcome) : undefined,
      };
    }),
    createdAt: isoDate(doc.createdAt) ?? new Date().toISOString(),
    updatedAt: isoDate(doc.updatedAt) ?? new Date().toISOString(),
  };
};

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export class MongoDataStore implements DataStore {
  async findUserByEmail(email: string) {
    const user = await UserModel.findOne({ email: email.toLowerCase() }).lean();
    return user ? mapUser(user as unknown as Record<string, unknown>) : null;
  }

  async getUser(id: string) {
    if (!mongoose.isValidObjectId(id)) return null;
    const user = await UserModel.findById(id).lean();
    if (!user) return null;
    const mapped = mapUser(user as unknown as Record<string, unknown>);
    const { passwordHash: _passwordHash, ...safeUser } = mapped;
    return safeUser;
  }

  async createUser(input: {
    name: string;
    email: string;
    passwordHash: string;
  }) {
    const user = await UserModel.create(input);
    const mapped = mapUser(user.toObject() as Record<string, unknown>);
    const { passwordHash: _passwordHash, ...safeUser } = mapped;
    return safeUser;
  }

  async listApplications(userId: string, filters: ApplicationFilters) {
    if (!mongoose.isValidObjectId(userId)) return { items: [], total: 0 };
    const query: Record<string, unknown> = { userId };
    if (filters.status) query.status = filters.status;
    if (filters.location) {
      query.location = new RegExp(escapeRegExp(filters.location), "i");
    }
    if (filters.search) {
      const search = new RegExp(escapeRegExp(filters.search), "i");
      query.$or = [{ company: search }, { role: search }];
    }
    const sortMap = {
      newest: { updatedAt: -1 },
      oldest: { updatedAt: 1 },
      company: { company: 1 },
      nextAction: { nextActionDate: 1 },
    } as const;
    const [documents, total] = await Promise.all([
      ApplicationModel.find(query)
        .sort(sortMap[filters.sort ?? "newest"])
        .skip((filters.page - 1) * filters.limit)
        .limit(filters.limit)
        .lean(),
      ApplicationModel.countDocuments(query),
    ]);
    return {
      items: documents.map((doc) =>
        mapApplication(doc as unknown as Record<string, unknown>),
      ),
      total,
    };
  }

  async getApplication(userId: string, id: string) {
    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(id)) {
      return null;
    }
    const document = await ApplicationModel.findOne({ _id: id, userId }).lean();
    return document
      ? mapApplication(document as unknown as Record<string, unknown>)
      : null;
  }

  async createApplication(userId: string, input: ApplicationInput) {
    const document = await ApplicationModel.create({ ...input, userId });
    return mapApplication(document.toObject() as Record<string, unknown>);
  }

  async updateApplication(
    userId: string,
    id: string,
    input: Partial<ApplicationInput>,
  ) {
    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(id)) {
      return null;
    }
    const document = await ApplicationModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: input },
      { new: true, runValidators: true },
    ).lean();
    return document
      ? mapApplication(document as unknown as Record<string, unknown>)
      : null;
  }

  async deleteApplication(userId: string, id: string) {
    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(id)) {
      return false;
    }
    const result = await ApplicationModel.deleteOne({ _id: id, userId });
    return result.deletedCount === 1;
  }

  async addInterview(
    userId: string,
    id: string,
    input: InterviewInput,
  ) {
    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(id)) {
      return null;
    }
    const document = await ApplicationModel.findOneAndUpdate(
      { _id: id, userId },
      { $push: { interviews: input }, $set: { status: "Interview" } },
      { new: true, runValidators: true },
    ).lean();
    return document
      ? mapApplication(document as unknown as Record<string, unknown>)
      : null;
  }
}

const createId = () => crypto.randomUUID();
const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

export class MemoryDataStore implements DataStore {
  private users: StoredUser[] = [];
  private applications: Application[] = [];

  static async create(options: { seed?: boolean } = {}) {
    const store = new MemoryDataStore();
    if (options.seed !== false) await store.seed();
    return store;
  }

  private async seed() {
    const userId = createId();
    const now = new Date().toISOString();
    this.users.push({
      id: userId,
      name: "Alex Morgan",
      email: "demo@trackly.dev",
      passwordHash: await bcrypt.hash("Demo123!", 10),
      createdAt: now,
    });
    const samples: Array<
      Pick<
        Application,
        "company" | "role" | "location" | "status" | "notes"
      > & { appliedOffset: number; nextOffset?: number; salary?: [number, number] }
    > = [
      {
        company: "Stripe",
        role: "Frontend Engineer",
        location: "Remote",
        status: "Interview",
        appliedOffset: -12,
        nextOffset: 2,
        salary: [130000, 160000],
        notes: "Prepare system design examples and product collaboration story.",
      },
      {
        company: "Linear",
        role: "Product Engineer",
        location: "San Francisco, CA",
        status: "Applied",
        appliedOffset: -6,
        nextOffset: 1,
        salary: [145000, 180000],
        notes: "Follow up with recruiting contact after one week.",
      },
      {
        company: "Notion",
        role: "Software Engineer, Growth",
        location: "New York, NY",
        status: "Offer",
        appliedOffset: -28,
        nextOffset: 4,
        salary: [155000, 190000],
        notes: "Review equity and remote-work terms.",
      },
      {
        company: "Vercel",
        role: "Design Engineer",
        location: "Remote",
        status: "Saved",
        appliedOffset: 0,
        salary: [125000, 170000],
        notes: "Tailor portfolio case study before applying.",
      },
      {
        company: "Figma",
        role: "Full Stack Engineer",
        location: "London, UK",
        status: "Rejected",
        appliedOffset: -45,
        notes: "Strong recruiter feedback; revisit future openings.",
      },
      {
        company: "GitLab",
        role: "Senior Frontend Engineer",
        location: "Remote",
        status: "Applied",
        appliedOffset: -3,
        nextOffset: 5,
        salary: [135000, 175000],
        notes: "Async culture aligns well with current experience.",
      },
    ];
    this.applications = samples.map((sample) => ({
      id: createId(),
      userId,
      company: sample.company,
      role: sample.role,
      location: sample.location,
      status: sample.status,
      salaryMin: sample.salary?.[0],
      salaryMax: sample.salary?.[1],
      appliedDate: addDays(sample.appliedOffset),
      nextActionDate:
        sample.nextOffset === undefined ? undefined : addDays(sample.nextOffset),
      notes: sample.notes,
      sourceUrl: "https://example.com/jobs",
      interviews:
        sample.status === "Interview"
          ? [
              {
                id: createId(),
                type: "Technical interview",
                dateTime: addDays(2),
                interviewer: "Engineering team",
                meetingLink: "https://meet.google.com/",
                notes: "60-minute product engineering exercise",
              },
            ]
          : [],
      createdAt: addDays(sample.appliedOffset),
      updatedAt: addDays(Math.min(sample.appliedOffset + 1, 0)),
    }));
  }

  async findUserByEmail(email: string) {
    return (
      this.users.find((user) => user.email === email.toLowerCase()) ?? null
    );
  }

  async getUser(id: string) {
    const user = this.users.find((item) => item.id === id);
    if (!user) return null;
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async createUser(input: {
    name: string;
    email: string;
    passwordHash: string;
  }) {
    const user: StoredUser = {
      id: createId(),
      ...input,
      email: input.email.toLowerCase(),
      createdAt: new Date().toISOString(),
    };
    this.users.push(user);
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async listApplications(userId: string, filters: ApplicationFilters) {
    const search = filters.search?.toLowerCase();
    let items = this.applications.filter(
      (application) =>
        application.userId === userId &&
        (!filters.status || application.status === filters.status) &&
        (!filters.location ||
          application.location
            .toLowerCase()
            .includes(filters.location.toLowerCase())) &&
        (!search ||
          application.company.toLowerCase().includes(search) ||
          application.role.toLowerCase().includes(search)),
    );
    const sort = filters.sort ?? "newest";
    items = [...items].sort((a, b) => {
      if (sort === "oldest") return a.updatedAt.localeCompare(b.updatedAt);
      if (sort === "company") return a.company.localeCompare(b.company);
      if (sort === "nextAction") {
        return (a.nextActionDate ?? "9999").localeCompare(
          b.nextActionDate ?? "9999",
        );
      }
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    const total = items.length;
    const start = (filters.page - 1) * filters.limit;
    return { items: items.slice(start, start + filters.limit), total };
  }

  async getApplication(userId: string, id: string) {
    return (
      this.applications.find(
        (application) => application.id === id && application.userId === userId,
      ) ?? null
    );
  }

  async createApplication(userId: string, input: ApplicationInput) {
    const now = new Date().toISOString();
    const application: Application = {
      id: createId(),
      userId,
      ...input,
      interviews: [],
      createdAt: now,
      updatedAt: now,
    };
    this.applications.unshift(application);
    return application;
  }

  async updateApplication(
    userId: string,
    id: string,
    input: Partial<ApplicationInput>,
  ) {
    const index = this.applications.findIndex(
      (application) => application.id === id && application.userId === userId,
    );
    if (index === -1) return null;
    const updated = {
      ...this.applications[index],
      ...input,
      updatedAt: new Date().toISOString(),
    } as Application;
    this.applications[index] = updated;
    return updated;
  }

  async deleteApplication(userId: string, id: string) {
    const index = this.applications.findIndex(
      (application) => application.id === id && application.userId === userId,
    );
    if (index === -1) return false;
    this.applications.splice(index, 1);
    return true;
  }

  async addInterview(
    userId: string,
    id: string,
    input: InterviewInput,
  ) {
    const application = await this.getApplication(userId, id);
    if (!application) return null;
    application.interviews.push({ id: createId(), ...input });
    application.status = "Interview";
    application.updatedAt = new Date().toISOString();
    return application;
  }
}
