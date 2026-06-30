"use client";

import { useEffect, useState } from "react";
import { todoApi, type Todo } from "./lib/api";

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setTodos(await todoApi.list());
    } catch {
      setError(
        "Could not reach the backend. Start the FastAPI server and set NEXT_PUBLIC_API_URL.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    const value = title.trim();
    if (!value) return;
    try {
      const created = await todoApi.create(value);
      setTodos((prev) => [...prev, created]);
      setTitle("");
    } catch {
      setError("Failed to add todo.");
    }
  }

  async function toggle(todo: Todo) {
    try {
      const updated = await todoApi.toggle(todo.id, !todo.completed);
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? updated : t)));
    } catch {
      setError("Failed to update todo.");
    }
  }

  async function remove(todo: Todo) {
    try {
      await todoApi.remove(todo.id);
      setTodos((prev) => prev.filter((t) => t.id !== todo.id));
    } catch {
      setError("Failed to delete todo.");
    }
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Todo List</h1>

      <form onSubmit={addTodo} className="mb-6 flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task…"
          className="flex-1 rounded-md border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50"
        />
        <button
          type="submit"
          className="rounded-md bg-foreground px-4 py-2 font-medium text-background transition-opacity hover:opacity-90"
        >
          Add
        </button>
      </form>

      {error && (
        <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm opacity-60">Loading…</p>
      ) : todos.length === 0 ? (
        <p className="text-sm opacity-60">No todos yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center gap-3 rounded-md border border-black/10 px-3 py-2 dark:border-white/10"
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggle(todo)}
                className="size-4"
              />
              <span
                className={`flex-1 ${todo.completed ? "line-through opacity-50" : ""}`}
              >
                {todo.title}
              </span>
              <button
                onClick={() => remove(todo)}
                className="text-sm opacity-50 transition-opacity hover:opacity-100"
                aria-label="Delete"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
