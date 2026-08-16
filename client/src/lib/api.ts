import type { Application, ApplicationInput, DashboardStats, Interview, Pagination, User } from "../types";

type FieldError = { field?: string; message: string };
type ApiEnvelope<T> = { success: boolean; message: string; data: T; errors?: FieldError[] };

export class ApiError extends Error {
  constructor(message: string, public status: number, public errors: FieldError[] = []) {
    super(message);
  }
}

const request = async <T>(path: string, options: RequestInit = {}): Promise<ApiEnvelope<T>> => {
  const token = localStorage.getItem("trackly_token");
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const payload = (await response.json().catch(() => ({ success: false, message: "The server returned an unreadable response", errors: [] }))) as ApiEnvelope<T>;
  if (!response.ok) throw new ApiError(payload.message, response.status, payload.errors ?? []);
  return payload;
};

export const api = {
  login: (input: { email: string; password: string }) => request<{ user: User; token: string }>("/auth/login", { method: "POST", body: JSON.stringify(input) }),
  register: (input: { name: string; email: string; password: string }) => request<{ user: User; token: string }>("/auth/register", { method: "POST", body: JSON.stringify(input) }),
  me: () => request<User>("/auth/me"),
  dashboard: () => request<DashboardStats>("/dashboard/stats"),
  applications: (params: URLSearchParams) => request<{ applications: Application[]; pagination: Pagination }>(`/applications?${params}`),
  application: (id: string) => request<Application>(`/applications/${id}`),
  createApplication: (input: ApplicationInput) => request<Application>("/applications", { method: "POST", body: JSON.stringify(input) }),
  updateApplication: (id: string, input: Partial<ApplicationInput>) => request<Application>(`/applications/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  deleteApplication: (id: string) => request<null>(`/applications/${id}`, { method: "DELETE" }),
  addInterview: (id: string, input: Omit<Interview, "id">) => request<Application>(`/applications/${id}/interviews`, { method: "POST", body: JSON.stringify(input) }),
};
