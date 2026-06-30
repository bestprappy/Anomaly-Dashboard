export const API_BASE = "https://todo-api-obyu.onrender.com";

export type Todo = {
  id: number;
  title: string;
  description: string | null;
  done: boolean;
};

type CreateTodoInput = {
  title: string;
  description?: string;
  done?: boolean;
};

type UpdateTodoInput = {
  title: string;
  description?: string;
  done: boolean;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`.trim();

    try {
      const body: unknown = await res.json();
      if (
        body &&
        typeof body === "object" &&
        "detail" in body &&
        typeof body.detail === "string"
      ) {
        detail = body.detail;
      }
    } catch {
      // Keep the response status when the server does not send JSON.
    }

    throw new Error(`Request failed: ${detail}`);
  }

  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export const todoApi = {
  list: () => request<Todo[]>("/todos"),
  get: (id: number) => request<Todo>(`/todos/${id}`),
  create: (input: CreateTodoInput) =>
    request<Todo>("/todos", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: number, input: UpdateTodoInput) =>
    request<Todo>(`/todos/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  remove: (id: number) =>
    request<void>(`/todos/${id}`, { method: "DELETE" }),
};
