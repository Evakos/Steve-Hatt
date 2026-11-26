import { getContactMessages, markContactRead, deleteContactMessage } from "@/lib/contact-store";
import { Trash2, Mail, MailCheck, AlertCircle } from "lucide-react";
import { NextResponse } from "next/server";

async function getMessages() {
  try {
    return await getContactMessages();
  } catch (error) {
    console.error("Failed to fetch contact messages:", error);
    throw error;
  }
}

export default async function ContactMessagesPage() {
  let messages: Awaited<ReturnType<typeof getMessages>> = [];
  let error: Error | null = null;
  
  try {
    messages = await getMessages();
  } catch (e) {
    error = e instanceof Error ? e : new Error(String(e));
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-navy">Contact Messages</h1>
      <p className="mt-1 text-sm text-text-light">
        Messages submitted via the contact form. They are also emailed to the notification addresses.
      </p>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3" style={{ borderRadius: "8px" }}>
          <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Failed to load messages</p>
            <p className="mt-1 font-mono text-xs">{error.message}</p>
          </div>
        </div>
      )}

      {messages.length === 0 && !error ? (
        <p className="mt-4 text-sm text-text-light">No contact messages yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`border border-border bg-white p-4 shadow-sm transition-colors ${msg.read ? "opacity-70" : "border-lobster"}`}
              style={{ borderRadius: "12px" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-navy">{msg.name}</p>
                    <span className="text-xs text-text-light">{msg.email}</span>
                    {!msg.read && <span className="bg-lobster text-white text-xs px-1.5 py-0.5" style={{ borderRadius: "999px" }}>Unread</span>}
                  </div>
                  <p className="mt-2 text-sm text-text-light whitespace-pre-wrap">{msg.message}</p>
                  <p className="mt-2 text-xs text-text-light">
                    {new Date(msg.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!msg.read && (
                    <form action="/admin/contact-messages/read" method="POST">
                      <input type="hidden" name="id" value={msg.id} />
                      <button type="submit" className="p-2 text-teal hover:bg-teal/10 transition-colors" style={{ borderRadius: "6px" }} title="Mark read">
                        <MailCheck className="h-5 w-5" />
                      </button>
                    </form>
                  )}
                  <form action="/admin/contact-messages/delete" method="POST">
                    <input type="hidden" name="id" value={msg.id} />
                    <button type="submit" className="p-2 text-red-600 hover:bg-red-600/10 transition-colors" style={{ borderRadius: "6px" }} title="Delete">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}