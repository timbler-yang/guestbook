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
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [nickname, setNickname] = useState("");
  const [editingNickname, setEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState("");
  const [nicknameLoading, setNicknameLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        setNickname(data.user.user_metadata?.nickname || "");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setNickname(session.user.user_metadata?.nickname || "");
      }
    });

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
    setNickname("");
  }

  async function handleSetNickname(e: React.FormEvent) {
    e.preventDefault();
    if (!newNickname.trim()) return;

    setNicknameLoading(true);
    const trimmed = newNickname.trim();

    const { error } = await supabase.auth.updateUser({
      data: { nickname: trimmed },
    });

    if (!error) {
      // Update all existing guestbook entries with new nickname
      if (user) {
        await supabase
          .from("guestbook")
          .update({ nickname: trimmed })
          .eq("author_id", user.id);
      }

      setNickname(trimmed);
      setEditingNickname(false);
      setNewNickname("");
      await fetchEntries();
    }
    setNicknameLoading(false);
  }

  async function handleInitialNickname(e: React.FormEvent) {
    e.preventDefault();
    if (!newNickname.trim()) return;

    setNicknameLoading(true);
    const trimmed = newNickname.trim();

    const { error } = await supabase.auth.updateUser({
      data: { nickname: trimmed },
    });

    if (!error) {
      // Update all existing guestbook entries with new nickname
      if (user) {
        await supabase
          .from("guestbook")
          .update({ nickname: trimmed })
          .eq("author_id", user.id);
      }

      setNickname(trimmed);
      setNewNickname("");
      await fetchEntries();
    }
    setNicknameLoading(false);
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
            방명록
          </h1>
          {user ? (
            <div className="flex items-center gap-3">
              {nickname && !editingNickname && (
                <button
                  onClick={() => {
                    setNewNickname(nickname);
                    setEditingNickname(true);
                  }}
                  className="text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
                  title="닉네임 변경"
                >
                  {nickname} ✎
                </button>
              )}
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              로그인
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-10">
        {/* Nickname Edit Modal */}
        {editingNickname && (
          <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              닉네임 변경
            </p>
            <form onSubmit={handleSetNickname} className="flex gap-2">
              <input
                type="text"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                maxLength={50}
                required
                className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-600"
                placeholder="새 닉네임"
              />
              <button
                type="submit"
                disabled={nicknameLoading}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                {nicknameLoading ? "변경 중..." : "변경"}
              </button>
              <button
                type="button"
                onClick={() => setEditingNickname(false)}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                취소
              </button>
            </form>
            <p className="mt-2 text-xs text-zinc-400">
              변경하면 이전에 작성한 글의 닉네임도 함께 변경됩니다.
            </p>
          </div>
        )}

        {/* Nickname Setup (first time) */}
        {user && !nickname && (
          <div className="mb-10 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="mb-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              닉네임을 설정해주세요
            </p>
            <p className="mb-4 text-xs text-zinc-400">
              방명록에 표시될 이름입니다.
            </p>
            <form onSubmit={handleInitialNickname} className="flex gap-2">
              <input
                type="text"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                maxLength={50}
                required
                placeholder="닉네임 입력"
                className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-600"
              />
              <button
                type="submit"
                disabled={nicknameLoading}
                className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                {nicknameLoading ? "설정 중..." : "설정"}
              </button>
            </form>
          </div>
        )}

        {/* Form */}
        {user && nickname ? (
          <form onSubmit={handleSubmit} className="mb-10 space-y-3">
            <textarea
              placeholder="메시지를 남겨주세요"
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
              {loading ? "작성 중..." : "작성"}
            </button>
          </form>
        ) : !user ? (
          <div className="mb-10 rounded-lg border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              로그인하고 메시지를 남겨보세요.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="mt-3 rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              로그인
            </button>
          </div>
        ) : null}

        {/* Entries */}
        <div className="space-y-4">
          {entries.length === 0 && (
            <p className="text-sm text-zinc-400">
              아직 글이 없습니다. 첫 번째로 작성해보세요!
            </p>
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
                    삭제
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
