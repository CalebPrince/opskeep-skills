// In-memory storage for the scaffold. Swap for a real database before running
// this server for more than one session. Nothing here survives a restart.

export const reminders = new Map(); // id -> { message, sendAt, timezone, recipientEmail, status }
export const recurringReminders = new Map(); // id -> { message, recipientEmail, frequency, time, timezone, dayOfWeek, dayOfMonth, status }
export const timeEntries = new Map(); // project -> [{ id, startedAt, stoppedAt, note }]
export const runningTimers = new Map(); // project -> { id, startedAt, note }

let nextId = 1;
export function newId(prefix) {
  return `${prefix}_${nextId++}`;
}
