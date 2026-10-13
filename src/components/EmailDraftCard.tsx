'use client';

import { useState } from 'react';
import type { EmailDraft } from '@/types/chat';

type EmailDraftCardProps = {
  draft: EmailDraft;
  onDismiss: () => void;
};


export function EmailDraftCard({ draft, onDismiss }: EmailDraftCardProps) {
  const [to, setTo] = useState(draft.to);
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);

  const handleSend = () => {
    const mailtoUrl =
      `mailto:${encodeURIComponent(to)}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    window.location.href = mailtoUrl;
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-500 space-y-3 max-w-lg ">
      <p className="text-sm font-medium text-white">Email draft</p>

      <div className="space-y-2">
        <input
          type="email"
          placeholder="Recipient email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm text-white border-black"
        />
        <input
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm text-white border-black"
        />
        <textarea
          placeholder="Body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          className="w-full border rounded px-3 py-2 text-sm text-white border-black resize-y"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSend}
          disabled={!to}
          className="bg-blue-400 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
        >
          Open in Email App
        </button>
        <button
          onClick={onDismiss}
          className="border px-4 py-2 rounded text-sm border-blue"
        >
          Discard
        </button>
      </div>
    </div>
  );
}