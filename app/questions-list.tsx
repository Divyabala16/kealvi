"use client";
import { useState, useEffect } from "react";
import { getVoterId } from "@/lib/voter";

type Question = {
  id: string;
  body: string;
  author: string | null;
  votes: number;
  image_url?: string | null;
};

export default function QuestionsList({
  initialQuestions,
  initialHasMore,
}: {
  initialQuestions: Question[];
  initialHasMore: boolean;
}) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [draft, setDraft] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  // Debounced search: wait 300ms after typing stops; each keystroke cancels
  // the previous timer, so "deploying" fires one request, not nine.
  useEffect(() => {
    const id = setTimeout(async () => {
      const url = query
        ? `/api/questions?q=${encodeURIComponent(query)}`
        : `/api/questions`;
      const res = await fetch(url);
      const data = await res.json();
      setQuestions(data.questions);
      setHasMore(data.hasMore);
    }, 300);

    return () => clearTimeout(id); // cancel the pending timer on each keystroke
  }, [query]);

  async function submit() 
  {
    if (!draft.trim()) return;

    let image_url = null;

    if (image) 
    {
      const formData = new FormData();
      formData.append("file", image);

      const uploadRes = await fetch("/api/upload", 
      {
        method: "POST",
        body: formData,
      }
    );

      const uploadData = await uploadRes.json();
      image_url = uploadData.image_url;
  }

    const res = await fetch("/api/questions", 
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify
        (
          {
            body: draft,
            image_url,
          }
        ),
      }
    );

    const created = await res.json();

    setQuestions((qs) => [{ ...created, votes: 0 }, ...qs]);

    setDraft("");
    setImage(null);
  }

  async function upvote(id: string) {
    // optimistic: assume success, update the UI now
    setQuestions((qs) =>
      qs.map((q) => (q.id === id ? { ...q, votes: q.votes + 1 } : q))
    );

    const res = await fetch(`/api/questions/${id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voterId: getVoterId() }),
    });

    // server said no (already voted) — roll back
    if (!res.ok) {
      setQuestions((qs) =>
        qs.map((q) => (q.id === id ? { ...q, votes: q.votes - 1 } : q))
      );
    }
  }

  async function loadMore() {
    setLoading(true);
    const res = await fetch(`/api/questions?offset=${questions.length}`);
    const data = await res.json();
    setQuestions((qs) => [...qs, ...data.questions]);
    setHasMore(data.hasMore);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        {hydrated ? "Interactive ✓" : "Loading interactivity…"}
      </p>

      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask a question…"
          className="flex-1 rounded-md border px-3 py-2"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] ?? null)}
          className="rounded-md border px-3 py-2"
        />
        <button onClick={submit} className="rounded-md border px-4 py-2">
          Ask
        </button>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search questions…"
        className="w-full rounded-md border px-3 py-2"
      />

      <ul className="space-y-3">
        {questions.map((q) => (
        <li
  key={q.id}
  className="rounded-lg border p-3"
>
  <div className="flex items-start gap-3">
    <button
      onClick={() => upvote(q.id)}
      className="rounded-md border px-3 py-1 font-mono"
    >
      ▲ {q.votes}
    </button>

    <div className="flex-1">
      <p>{q.body}</p>

      {q.image_url && (
        <img
          src={q.image_url}
          alt="Question image"
          className="mt-2 max-h-64 rounded-lg"
        />
      )}
    </div>
  </div>
</li>
        ))}
      </ul>

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="rounded-md border px-4 py-2 disabled:opacity-50"
        >
          {loading ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}
