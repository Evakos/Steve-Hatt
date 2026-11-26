import { kv } from "@vercel/kv";

const KEY = "contact:messages";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export async function saveContactMessage(message: Omit<ContactMessage, "id" | "createdAt" | "read">): Promise<ContactMessage> {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const fullMessage: ContactMessage = { ...message, id, createdAt, read: false };

  const existing = (await kv.get<ContactMessage[]>(KEY)) ?? [];
  existing.unshift(fullMessage);
  await kv.set(KEY, existing.slice(0, 500));
  return fullMessage;
}

export async function getContactMessages(): Promise<ContactMessage[]> {
  return (await kv.get<ContactMessage[]>(KEY)) ?? [];
}

export async function markContactRead(id: string): Promise<void> {
  const messages = await getContactMessages();
  const updated = messages.map((m) => (m.id === id ? { ...m, read: true } : m));
  await kv.set(KEY, updated);
}

export async function deleteContactMessage(id: string): Promise<void> {
  const messages = await getContactMessages();
  const updated = messages.filter((m) => m.id !== id);
  await kv.set(KEY, updated);
}