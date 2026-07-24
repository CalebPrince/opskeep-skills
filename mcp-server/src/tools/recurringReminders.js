import { z } from "zod";
import { recurringReminders, newId } from "../store.js";

// Recurring email nudges, owned by the opskeep-manage automation flow (not
// opskeep-follow-up-reminders, which is one-shot only). Cadence is stored as
// a rule, not a materialized list of future sends.

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function describeCadence({ frequency, time, timezone, dayOfWeek, dayOfMonth }) {
  if (frequency === "daily") return `daily at ${time} (${timezone})`;
  if (frequency === "weekly") return `every ${WEEKDAYS[dayOfWeek]} at ${time} (${timezone})`;
  return `monthly on day ${dayOfMonth} at ${time} (${timezone})`;
}

export const scheduleRecurringReminderTool = {
  name: "schedule_recurring_reminder",
  config: {
    title: "Schedule a recurring reminder",
    description:
      "Create a recurring email reminder rule (daily, weekly, or monthly). Stores the " +
      "cadence; does not itself fire emails on a schedule.",
    inputSchema: {
      message: z.string().describe("The reminder text to send on each occurrence"),
      recipientEmail: z.string().email().describe("Where to send the reminder"),
      frequency: z.enum(["daily", "weekly", "monthly"]).describe("How often the reminder repeats"),
      time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).describe("24-hour local time, e.g. 09:00"),
      timezone: z.string().describe("IANA timezone, e.g. America/New_York"),
      dayOfWeek: z
        .number()
        .int()
        .min(0)
        .max(6)
        .optional()
        .describe("Required when frequency=weekly. 0=Sunday..6=Saturday"),
      dayOfMonth: z
        .number()
        .int()
        .min(1)
        .max(31)
        .optional()
        .describe("Required when frequency=monthly"),
    },
  },
  async handler({ message, recipientEmail, frequency, time, timezone, dayOfWeek, dayOfMonth }) {
    if (frequency === "weekly" && dayOfWeek === undefined) {
      return {
        isError: true,
        content: [{ type: "text", text: "frequency=weekly requires dayOfWeek (0=Sunday..6=Saturday)." }],
      };
    }
    if (frequency === "monthly" && dayOfMonth === undefined) {
      return {
        isError: true,
        content: [{ type: "text", text: "frequency=monthly requires dayOfMonth (1-31)." }],
      };
    }

    const id = newId("rrem");
    const rule = { message, recipientEmail, frequency, time, timezone, dayOfWeek, dayOfMonth, status: "active" };
    recurringReminders.set(id, rule);

    // TODO: hand off to a real cron/queue scheduler that materializes and
    // fires an email for each occurrence at (time, timezone) on the given
    // cadence. Nothing here actually sends anything yet.

    return {
      content: [
        {
          type: "text",
          text: `✓ Recurring reminder ${id} created: ${describeCadence(rule)} to ${recipientEmail}: "${message}"`,
        },
      ],
    };
  },
};

export const cancelRecurringReminderTool = {
  name: "cancel_recurring_reminder",
  config: {
    title: "Cancel a recurring reminder",
    description: "Cancel a previously scheduled recurring reminder rule by its ID.",
    inputSchema: {
      recurringReminderId: z.string().describe("The ID returned when the recurring reminder was created"),
    },
  },
  async handler({ recurringReminderId }) {
    const rule = recurringReminders.get(recurringReminderId);
    if (!rule) {
      return {
        isError: true,
        content: [{ type: "text", text: `No recurring reminder found with ID ${recurringReminderId}.` }],
      };
    }
    rule.status = "cancelled";
    return { content: [{ type: "text", text: `✓ Recurring reminder ${recurringReminderId} cancelled.` }] };
  },
};

export const listRecurringRemindersTool = {
  name: "list_recurring_reminders",
  config: {
    title: "List recurring reminders",
    description: "List recurring reminder rules, optionally filtered by status.",
    inputSchema: {
      status: z.enum(["active", "cancelled", "all"]).default("active").describe("Filter by rule status"),
    },
  },
  async handler({ status }) {
    const entries = [...recurringReminders.entries()].filter(
      ([, rule]) => status === "all" || rule.status === status
    );

    if (entries.length === 0) {
      return { content: [{ type: "text", text: `No ${status === "all" ? "" : status + " "}recurring reminders.` }] };
    }

    const lines = entries.map(
      ([id, rule]) => `- ${id}: ${describeCadence(rule)} to ${rule.recipientEmail} (${rule.status}) - "${rule.message}"`
    );
    return { content: [{ type: "text", text: lines.join("\n") }] };
  },
};
