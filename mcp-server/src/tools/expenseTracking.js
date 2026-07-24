import { z } from "zod";
import { expenses, newId } from "../store.js";

// Job-tagged expense capture (materials, mileage, other costs). This tool
// never computes an amount from a mileage rate: the caller supplies the
// dollar amount directly, since inventing a per-mile rate would be a
// fabricated number a real invoice or tax filing shouldn't rely on.

export const logExpenseTool = {
  name: "log_expense",
  config: {
    title: "Log a job expense",
    description:
      "Log a materials, mileage, or other cost and tag it to a job so it can be folded " +
      "into that job's invoice later. Amount must be supplied by the caller; this tool " +
      "does not compute a total from a mileage rate.",
    inputSchema: {
      jobLabel: z.string().describe("Job or client name this expense belongs to"),
      category: z.enum(["materials", "mileage", "other"]).describe("Type of expense"),
      amount: z.number().positive().describe("Dollar amount in the given currency"),
      currency: z.string().default("USD").describe("Currency code"),
      miles: z.number().positive().optional().describe("Miles driven, for category=mileage (informational only)"),
      description: z.string().optional().describe("What this expense was for"),
      date: z.string().optional().describe("ISO 8601 date, defaults to now"),
    },
  },
  async handler({ jobLabel, category, amount, currency, miles, description, date }) {
    const id = newId("exp");
    expenses.set(id, {
      jobLabel,
      category,
      amount,
      currency,
      miles: miles ?? null,
      description: description ?? null,
      date: date ?? new Date().toISOString(),
      status: "active",
    });
    return {
      content: [
        {
          type: "text",
          text: `✓ Expense ${id} logged for "${jobLabel}": ${amount} ${currency} (${category})${description ? ` - ${description}` : ""}`,
        },
      ],
    };
  },
};

export const listExpensesTool = {
  name: "list_expenses",
  config: {
    title: "List job expenses",
    description: "List logged expenses, optionally filtered by job and/or category.",
    inputSchema: {
      jobLabel: z.string().optional().describe("Filter to a single job/client"),
      category: z.enum(["materials", "mileage", "other"]).optional().describe("Filter by category"),
      status: z.enum(["active", "removed", "all"]).default("active").describe("Filter by status"),
    },
  },
  async handler({ jobLabel, category, status }) {
    const entries = [...expenses.entries()].filter(([, e]) => {
      if (jobLabel && e.jobLabel !== jobLabel) return false;
      if (category && e.category !== category) return false;
      if (status !== "all" && e.status !== status) return false;
      return true;
    });

    if (entries.length === 0) {
      return { content: [{ type: "text", text: "No matching expenses." }] };
    }

    const lines = entries.map(
      ([id, e]) =>
        `- ${id}: ${e.jobLabel} - ${e.amount} ${e.currency} (${e.category}${e.miles ? `, ${e.miles} mi` : ""}) on ${e.date}${e.description ? ` - ${e.description}` : ""} [${e.status}]`
    );
    return { content: [{ type: "text", text: lines.join("\n") }] };
  },
};

export const summarizeExpensesTool = {
  name: "summarize_expenses",
  config: {
    title: "Summarize job expenses",
    description: "Total logged expenses for a job, ready to fold into that job's invoice.",
    inputSchema: {
      jobLabel: z.string().describe("Job or client name to summarize"),
    },
  },
  async handler({ jobLabel }) {
    const entries = [...expenses.values()].filter((e) => e.jobLabel === jobLabel && e.status === "active");
    if (entries.length === 0) {
      return { content: [{ type: "text", text: `No active expenses logged for "${jobLabel}".` }] };
    }

    const byCategory = entries.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    }, {});
    const total = entries.reduce((sum, e) => sum + e.amount, 0);
    const currency = entries[0].currency;
    const breakdown = Object.entries(byCategory)
      .map(([cat, amt]) => `${cat}: ${amt} ${currency}`)
      .join(", ");

    return {
      content: [
        {
          type: "text",
          text: `${jobLabel}: ${entries.length} expense(s), ${total} ${currency} total (${breakdown})`,
        },
      ],
    };
  },
};

export const deleteExpenseTool = {
  name: "delete_expense",
  config: {
    title: "Remove a logged expense",
    description: "Remove a previously logged expense by its ID.",
    inputSchema: {
      expenseId: z.string().describe("The ID returned when the expense was logged"),
    },
  },
  async handler({ expenseId }) {
    const expense = expenses.get(expenseId);
    if (!expense) {
      return {
        isError: true,
        content: [{ type: "text", text: `No expense found with ID ${expenseId}.` }],
      };
    }
    expense.status = "removed";
    return { content: [{ type: "text", text: `✓ Expense ${expenseId} removed.` }] };
  },
};
