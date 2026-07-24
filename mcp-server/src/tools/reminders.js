import { z } from "zod";
import { reminders, newId } from "../store.js";

// One-shot, deterministic reminders only. No recurrence here. A request for
// a recurring nudge belongs to the opskeep-manage automation flow instead
// (see recurringReminders.js and skills/opskeep-manage/references/recurring-reminders.md).

export const scheduleReminderTool = {
  name: "schedule_reminder",
  config: {
    title: "Schedule a one-time reminder",
    description:
      "Schedule a single future email reminder. Requires an explicit send time and " +
      "timezone; never infer a recurring schedule from this tool.",
    inputSchema: {
      message: z.string().describe("The reminder text to send"),
      sendAt: z.string().describe("ISO 8601 date-time the reminder should fire, e.g. 2026-08-01T09:00:00"),
      timezone: z.string().describe("IANA timezone, e.g. America/New_York"),
      recipientEmail: z.string().email().describe("Where to send the reminder"),
    },
  },
  async handler({ message, sendAt, timezone, recipientEmail }) {
    const parsed = new Date(sendAt);
    if (Number.isNaN(parsed.getTime())) {
      return {
        isError: true,
        content: [{ type: "text", text: `Could not parse sendAt "${sendAt}" as a date-time.` }],
      };
    }

    const id = newId("rem");
    reminders.set(id, { message, sendAt, timezone, recipientEmail, status: "scheduled" });

    // TODO: hand off to a real scheduler (cron table, queue, etc.) that fires
    // an email at sendAt in the given timezone.

    return {
      content: [
        {
          type: "text",
          text: `✓ Reminder ${id} scheduled for ${sendAt} (${timezone}) to ${recipientEmail}: "${message}"`,
        },
      ],
    };
  },
};

export const cancelReminderTool = {
  name: "cancel_reminder",
  config: {
    title: "Cancel a scheduled reminder",
    description: "Cancel a previously scheduled one-time reminder by its ID.",
    inputSchema: {
      reminderId: z.string().describe("The ID returned when the reminder was scheduled"),
    },
  },
  async handler({ reminderId }) {
    const reminder = reminders.get(reminderId);
    if (!reminder) {
      return {
        isError: true,
        content: [{ type: "text", text: `No reminder found with ID ${reminderId}.` }],
      };
    }
    reminder.status = "cancelled";
    return { content: [{ type: "text", text: `✓ Reminder ${reminderId} cancelled.` }] };
  },
};
