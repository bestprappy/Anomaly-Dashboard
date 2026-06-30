"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { todoApi, type Todo } from "./lib/api";

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyIds, setBusyIds] = useState<Set<number>>(() => new Set());
  const [error, setError] = useState<string | null>(null);

  const doneCount = useMemo(
    () => todos.filter((todo) => todo.done).length,
    [todos],
  );

  useEffect(() => {
    let active = true;

    async function loadTodos() {
      try {
        const loadedTodos = await todoApi.list();
        if (active) {
          setTodos(loadedTodos);
        }
      } catch (err) {
        if (active) {
          setError(messageFromError(err, "Could not load todos."));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadTodos();

    return () => {
      active = false;
    };
  }, []);

  async function addTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();

    if (!cleanTitle) {
      return;
    }

    setSubmitting(true);

    try {
      const created = await todoApi.create({
        title: cleanTitle,
        ...(cleanDescription ? { description: cleanDescription } : {}),
      });

      setTodos((prev) => [created, ...prev]);
      setTitle("");
      setDescription("");
    } catch (err) {
      setError(messageFromError(err, "Failed to add todo."));
    } finally {
      setSubmitting(false);
    }
  }

  async function toggle(todo: Todo) {
    setError(null);
    setBusy(todo.id, true);

    try {
      const updated = await todoApi.update(todo.id, {
        title: todo.title,
        ...(todo.description ? { description: todo.description } : {}),
        done: !todo.done,
      });

      setTodos((prev) => prev.map((t) => (t.id === todo.id ? updated : t)));
    } catch (err) {
      setError(messageFromError(err, "Failed to update todo."));
    } finally {
      setBusy(todo.id, false);
    }
  }

  async function remove(todo: Todo) {
    setError(null);
    setBusy(todo.id, true);

    try {
      await todoApi.remove(todo.id);
      setTodos((prev) => prev.filter((t) => t.id !== todo.id));
    } catch (err) {
      setError(messageFromError(err, "Failed to delete todo."));
      setBusy(todo.id, false);
    }
  }

  function setBusy(id: number, busy: boolean) {
    setBusyIds((current) => {
      const next = new Set(current);

      if (busy) {
        next.add(id);
      } else {
        next.delete(id);
      }

      return next;
    });
  }

  return (
    <main className="app-shell">
      <section className="todo-card" aria-labelledby="todo-title">
        <header className="todo-header">
          <div>
            <p className="eyebrow">Task Board</p>
            <h1 id="todo-title">Todos</h1>
          </div>
          <div
            className="todo-count"
            aria-label={`${doneCount} of ${todos.length} todos done`}
          >
            {doneCount}/{todos.length} done
          </div>
        </header>

        <div className="todo-content">
          <form className="todo-form" onSubmit={addTodo}>
            <div className="form-fields">
              <label className="sr-only" htmlFor="title">
                Title
              </label>
              <input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Title"
                required
              />

              <label className="sr-only" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Description"
                rows={3}
              />
            </div>

            <button
              className="primary-button"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Adding..." : "Add Todo"}
            </button>
          </form>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          {loading ? (
            <p className="status-message">Loading todos...</p>
          ) : todos.length === 0 ? (
            <p className="empty-state">No todos yet.</p>
          ) : (
            <ul className="todo-list">
              {todos.map((todo) => {
                const isBusy = busyIds.has(todo.id);

                return (
                  <li
                    key={todo.id}
                    className={`todo-item${todo.done ? " is-done" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={todo.done}
                      onChange={() => toggle(todo)}
                      disabled={isBusy}
                      aria-label={`Mark ${todo.title} as ${
                        todo.done ? "not done" : "done"
                      }`}
                    />

                    <div className="todo-text">
                      <span className="todo-item-title">{todo.title}</span>
                      {todo.description && (
                        <span className="todo-item-description">
                          {todo.description}
                        </span>
                      )}
                    </div>

                    <button
                      className="delete-button"
                      type="button"
                      onClick={() => remove(todo)}
                      disabled={isBusy}
                    >
                      Delete
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}

function messageFromError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
