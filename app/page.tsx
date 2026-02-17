"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface GuestbookEntry {
  id: number;
  author_id: string;
  nickname: string;
  message: string;
  created_at: string;
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );

    fetchEntries();

    return () => subscription.unsubscribe();
  }, []);

  async function fetchEntries() {
    const { data } = await supabase
      .from("guestbook")
      .select("id, author_id, nickname, message, created_at")
      .order("created_at", { ascending: false });

    if (data) setEntries(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !nickname.trim() || !message.trim()) return;

    setLoading(true);
    const { error } = await supabase.from("guestbook").insert({
      author_id: user.id,
      nickname: nickname.trim(),
      message: message.trim(),
    });

    if (!error) {
      setNickname("");
      setMessage("");
      await fetchEntries();
    }
    setLoading(false);
  }

  async function handleDelete(id: number) {
    const { error } = await supabase.from("guestbook").delete().eq("id", id);
    if (!error) await fetchEntries();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Guestbook
          </h1>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Login
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-10">
        {/* Form */}
        {user ? (
          <form onSubmit={handleSubmit} className="mb-10 space-y-3">
            <input
              type="text"
              placeholder="Nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={50}
              required
              className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-600"
            />
            <textarea
              placeholder="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              required
              rows={3}
              className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-600"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {loading ? "Posting..." : "Post"}
            </button>
          </form>
        ) : (
          <div className="mb-10 rounded-lg border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Sign in to leave a message.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="mt-3 rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Login
            </button>
          </div>
        )}

        {/* Entries */}
        <div className="space-y-4">
          {entries.length === 0 && (
            <p className="text-sm text-zinc-400">No entries yet. Be the first!</p>
          )}
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {entry.nickname}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {formatDate(entry.created_at)}
                  </span>
                </div>
                {user && user.id === entry.author_id && (
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-xs text-red-400 transition-colors hover:text-red-600"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                {entry.message}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
