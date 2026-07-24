// In-memory storage for the scaffold. Swap for a real database before running
// this server for more than one session. Nothing here survives a restart.

export const reminders = new Map(); // id -> { message, sendAt, timezone, recipientEmail, status }
export const recurringReminders = new Map(); // id -> { message, recipientEmail, frequency, time, timezone, dayOfWeek, dayOfMonth, status }
export const timeEntries = new Map(); // project -> [{ id, startedAt, stoppedAt, note }]
export const runningTimers = new Map(); // project -> { id, startedAt, note }
export const expenses = new Map(); // id -> { jobLabel, category, amount, currency, miles, description, date, status }
export const escalations = new Map(); // id -> { summary, conversationRef, reason, ownerContact, status, ownerResponse, createdAt, resolvedAt }

let nextId = 1;
export function newId(prefix) {
  return `${prefix}_${nextId++}`;
}
