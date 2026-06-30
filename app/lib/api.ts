// Thin client for the FastAPI backend.
//
// The base URL is read from NEXT_PUBLIC_API_URL at build time. While the
// backend isn't ready yet, set it in a `.env.local` file, e.g.:
//   NEXT_PUBLIC_API_URL=http://localhost:8000
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type Todo = {
  id: number;
  title: string;
  completed: boolean;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  // 204 responses (e.g. DELETE) carry no body.
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

// Expected FastAPI routes — adjust to match the backend you provide later.
export const todoApi = {
  list: () => request<Todo[]>("/todos"),
  create: (title: string) =>
    request<Todo>("/todos", {
      method: "POST",
      body: JSON.stringify({ title }),
    }),
  toggle: (id: number, completed: boolean) =>
    request<Todo>(`/todos/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ completed }),
    }),
  remove: (id: number) =>
    request<void>(`/todos/${id}`, { method: "DELETE" }),
};
