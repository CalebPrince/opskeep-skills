import { z } from "zod";
import { expenses, newId } from "../store.js";

// Job-tagged expense capture (materials, mileage, other costs). This tool
// never computes an amount from a mileage rate: the caller supplies the
// amount directly, since inventing a per-mile rate would be a fabricated
// number a real invoice or tax filing shouldn't rely on.
//
// Totals are always kept per currency. Adding amounts in different
// currencies would produce a meaningless number on an invoice.

const CATEGORIES = ["materials", "mileage", "travel", "fees", "software", "other"];
const DEFAULT_CURRENCY = (process.env.OPSKEEP_DEFAULT_CURRENCY || "USD").toUpperCase();

// Entries logged before billable/billed existed count as billable and unbilled.
function isBillable(e) {
  return e.billable !== false;
}
function isBilled(e) {
  return Boolean(e.invoiceRef);
}

const DAY_MS = 24 * 60 * 60 * 1000;

// A date-only upper bound ("2026-10-07") includes that whole day.
function inRange(e, fromDate, toDate) {
  const d = new Date(e.date).getTime();
  if (fromDate && d < new Date(fromDate).getTime()) return false;
  if (toDate) {
    const end = /^\d{4}-\d{2}-\d{2}$/.test(toDate) ? new Date(toDate).getTime() + DAY_MS - 1 : new Date(toDate).getTime();
    if (d > end) return false;
  }
  return true;
}

function totalsByCurrency(entries) {
  const totals = {};
  for (const e of entries) {
    totals[e.currency] = (totals[e.currency] ?? 0) + e.amount;
  }
  return totals;
}

function formatTotals(totals) {
  const parts = Object.entries(totals).map(([cur, amt]) => `${round2(amt)} ${cur}`);
  return parts.length ? parts.join(" + ") : "0";
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

export const logExpenseTool = {
  name: "log_expense",
  config: {
    title: "Log a job expense",
    description:
      "Log a cost and tag it to a job or client so it can be folded into that job's invoice " +
      "later. Amount must be supplied by the caller; this tool does not compute a total from " +
      "a mileage rate.",
    inputSchema: {
      jobLabel: z.string().describe("Job or client name this expense belongs to"),
      category: z.enum(CATEGORIES).describe("Type of expense"),
      amount: z.number().positive().describe("Amount in the given currency"),
      currency: z
        .string()
        .optional()
        .describe(`ISO currency code, e.g. GHS, USD. Defaults to ${DEFAULT_CURRENCY}`),
      billable: z
        .boolean()
        .default(true)
        .describe("Whether this cost is recharged to the client (false = absorbed by the business)"),
      reference: z.string().optional().describe("Receipt, supplier invoice or payment reference"),
      miles: z.number().positive().optional().describe("Distance driven, for category=mileage (informational only)"),
      description: z.string().optional().describe("What this expense was for"),
      date: z.string().optional().describe("ISO 8601 date, defaults to now"),
    },
  },
  async handler({ jobLabel, category, amount, currency, billable, reference, miles, description, date }) {
    const id = newId("exp");
    const cur = (currency || DEFAULT_CURRENCY).toUpperCase();
    expenses.set(id, {
      jobLabel,
      category,
      amount,
      currency: cur,
      billable,
      reference: reference ?? null,
      invoiceRef: null,
      miles: miles ?? null,
      description: description ?? null,
      date: date ?? new Date().toISOString(),
      status: "active",
    });
    return {
      content: [
        {
          type: "text",
          text: `✓ Expense ${id} logged for "${jobLabel}": ${amount} ${cur} (${category}, ${billable ? "billable" : "not billable"})${description ? ` - ${description}` : ""}`,
        },
      ],
    };
  },
};

export const listExpensesTool = {
  name: "list_expenses",
  config: {
    title: "List job expenses",
    description:
      "List logged expenses, optionally filtered by job, category, date range, billable and billed state.",
    inputSchema: {
      jobLabel: z.string().optional().describe("Filter to a single job/client"),
      category: z.enum(CATEGORIES).optional().describe("Filter by category"),
      status: z.enum(["active", "removed", "all"]).default("active").describe("Filter by status"),
      billing: z
        .enum(["all", "billable", "not_billable", "unbilled", "billed"])
        .default("all")
        .describe("unbilled = billable and not yet on an invoice"),
      fromDate: z.string().optional().describe("ISO 8601 lower bound (inclusive)"),
      toDate: z.string().optional().describe("ISO 8601 upper bound (inclusive)"),
    },
  },
  async handler({ jobLabel, category, status, billing, fromDate, toDate }) {
    const entries = [...expenses.entries()].filter(([, e]) => {
      if (jobLabel && e.jobLabel !== jobLabel) return false;
      if (category && e.category !== category) return false;
      if (status !== "all" && e.status !== status) return false;
      if (!matchesBilling(e, billing)) return false;
      return inRange(e, fromDate, toDate);
    });

    if (entries.length === 0) {
      return { content: [{ type: "text", text: "No matching expenses." }] };
    }

    const lines = entries.map(
      ([id, e]) =>
        `- ${id}: ${e.jobLabel} - ${e.amount} ${e.currency} (${e.category}${e.miles ? `, ${e.miles} mi` : ""}) on ${e.date}` +
        `${e.description ? ` - ${e.description}` : ""}${e.reference ? ` [ref ${e.reference}]` : ""}` +
        ` [${isBillable(e) ? (isBilled(e) ? `billed ${e.invoiceRef}` : "unbilled") : "not billable"}] [${e.status}]`
    );
    return { content: [{ type: "text", text: lines.join("\n") }] };
  },
};

function matchesBilling(e, billing) {
  switch (billing) {
    case "billable":
      return isBillable(e);
    case "not_billable":
      return !isBillable(e);
    case "unbilled":
      return isBillable(e) && !isBilled(e);
    case "billed":
      return isBilled(e);
    default:
      return true;
  }
}

export const summarizeExpensesTool = {
  name: "summarize_expenses",
  config: {
    title: "Summarize job expenses",
    description:
      "Total logged expenses for a job, per currency, split by category and into billable-unbilled, " +
      "billed and not-billable, ready to fold into that job's invoice.",
    inputSchema: {
      jobLabel: z.string().describe("Job or client name to summarize"),
      fromDate: z.string().optional().describe("ISO 8601 lower bound (inclusive)"),
      toDate: z.string().optional().describe("ISO 8601 upper bound (inclusive)"),
    },
  },
  async handler({ jobLabel, fromDate, toDate }) {
    const entries = [...expenses.values()].filter(
      (e) => e.jobLabel === jobLabel && e.status === "active" && inRange(e, fromDate, toDate)
    );
    if (entries.length === 0) {
      return { content: [{ type: "text", text: `No active expenses logged for "${jobLabel}".` }] };
    }

    const byCategory = {};
    for (const e of entries) {
      byCategory[e.category] ??= [];
      byCategory[e.category].push(e);
    }
    const categoryLines = Object.entries(byCategory).map(
      ([cat, list]) => `  ${cat}: ${formatTotals(totalsByCurrency(list))}`
    );

    const unbilled = entries.filter((e) => isBillable(e) && !isBilled(e));
    const billed = entries.filter(isBilled);
    const notBillable = entries.filter((e) => !isBillable(e));

    const text = [
      `${jobLabel}: ${entries.length} expense(s), ${formatTotals(totalsByCurrency(entries))} total` +
        `${fromDate || toDate ? ` (${fromDate ?? "start"} to ${toDate ?? "now"})` : ""}`,
      "By category:",
      ...categoryLines,
      `Billable, not yet invoiced: ${formatTotals(totalsByCurrency(unbilled))} (${unbilled.length})`,
      `Already invoiced: ${formatTotals(totalsByCurrency(billed))} (${billed.length})`,
      `Not billable: ${formatTotals(totalsByCurrency(notBillable))} (${notBillable.length})`,
    ].join("\n");

    return { content: [{ type: "text", text }] };
  },
};

export const markExpensesBilledTool = {
  name: "mark_expenses_billed",
  config: {
    title: "Mark expenses as invoiced",
    description:
      "Record that billable expenses were included on an invoice, so they no longer show as unbilled.",
    inputSchema: {
      expenseIds: z.array(z.string()).min(1).describe("IDs of the expenses that went on the invoice"),
      invoiceRef: z.string().describe("Invoice number or reference they were billed on"),
    },
  },
  async handler({ expenseIds, invoiceRef }) {
    const missing = expenseIds.filter((id) => !expenses.has(id));
    if (missing.length) {
      return {
        isError: true,
        content: [{ type: "text", text: `No expense found with ID ${missing.join(", ")}. Nothing was changed.` }],
      };
    }
    const notBillable = expenseIds.filter((id) => !isBillable(expenses.get(id)));
    if (notBillable.length) {
      return {
        isError: true,
        content: [
          { type: "text", text: `${notBillable.join(", ")} marked not billable. Nothing was changed.` },
        ],
      };
    }
    for (const id of expenseIds) {
      expenses.set(id, { ...expenses.get(id), invoiceRef });
    }
    return {
      content: [{ type: "text", text: `✓ ${expenseIds.length} expense(s) marked billed on ${invoiceRef}.` }],
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
    expenses.set(expenseId, { ...expense, status: "removed" });
    return { content: [{ type: "text", text: `✓ Expense ${expenseId} removed.` }] };
  },
};
