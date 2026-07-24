import { z } from "zod";
import { escalations, newId } from "../store.js";

// Pause-and-notify escalation, not a live thread handoff. Whether a human can
// actually be inserted into an in-progress customer conversation (e.g. a
// WhatsApp thread) depends on that platform's own multi-agent/handoff
// features, which this scaffold does not control or assume exist. What this
// does: record the escalation and mark the transaction paused. Delivering an
// actual notification to the owner (SMS, WhatsApp DM, push, email) is a TODO
// for a real provider, same as send_client_update's delivery stub.

export const escalateToOwnerTool = {
  name: "escalate_to_owner",
  config: {
    title: "Escalate a transaction to the business owner",
    description:
      "Pause an in-progress autonomous transaction and record an escalation for the " +
      "business owner. Use only when the agent has been authorized to complete " +
      "transactions autonomously and hits something outside that authorization " +
      "(price deviation, ambiguous request, dispute, high value, or low confidence).",
    inputSchema: {
      summary: z.string().describe("What's happening and what decision the owner needs to make"),
      conversationRef: z.string().describe("Reference to the paused conversation, e.g. customer name/thread/order"),
      reason: z
        .enum(["pricing_deviation", "ambiguous_request", "dispute_or_complaint", "high_value", "other"])
        .describe("Why this needed a human"),
      ownerContact: z.string().describe("Where to notify the owner, e.g. their phone number or email"),
    },
  },
  async handler({ summary, conversationRef, reason, ownerContact }) {
    const id = newId("esc");
    escalations.set(id, {
      summary,
      conversationRef,
      reason,
      ownerContact,
      status: "pending",
      ownerResponse: null,
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    });

    // TODO: send a real notification to ownerContact (SMS/WhatsApp/push/email).
    // Nothing is actually delivered yet; this only records the escalation and
    // the caller must tell the customer-facing conversation to wait.

    return {
      content: [
        {
          type: "text",
          text:
            `✓ Escalation ${id} recorded for "${conversationRef}" (${reason}). ` +
            `Owner notification to ${ownerContact} is not yet wired to a real provider — ` +
            `treat this as paused, not delivered, until a human confirms they saw it.`,
        },
      ],
    };
  },
};

export const resolveEscalationTool = {
  name: "resolve_escalation",
  config: {
    title: "Resolve an escalation",
    description: "Record how an escalation was resolved so the paused transaction can proceed or be cancelled.",
    inputSchema: {
      escalationId: z.string().describe("The ID returned when the escalation was created"),
      resolution: z
        .enum(["owner_handled", "proceed_as_drafted", "cancelled"])
        .describe("owner_handled = owner took over directly; proceed_as_drafted = owner approved the agent's plan; cancelled = drop it"),
      ownerResponse: z.string().optional().describe("What the owner actually said/decided, if anything"),
    },
  },
  async handler({ escalationId, resolution, ownerResponse }) {
    const escalation = escalations.get(escalationId);
    if (!escalation) {
      return {
        isError: true,
        content: [{ type: "text", text: `No escalation found with ID ${escalationId}.` }],
      };
    }
    escalation.status = "resolved";
    escalation.resolution = resolution;
    escalation.ownerResponse = ownerResponse ?? null;
    escalation.resolvedAt = new Date().toISOString();
    return {
      content: [
        { type: "text", text: `✓ Escalation ${escalationId} resolved: ${resolution}${ownerResponse ? ` - "${ownerResponse}"` : ""}` },
      ],
    };
  },
};

export const listEscalationsTool = {
  name: "list_escalations",
  config: {
    title: "List escalations",
    description: "List escalations, optionally filtered by status.",
    inputSchema: {
      status: z.enum(["pending", "resolved", "all"]).default("pending").describe("Filter by escalation status"),
    },
  },
  async handler({ status }) {
    const entries = [...escalations.entries()].filter(([, e]) => status === "all" || e.status === status);
    if (entries.length === 0) {
      return { content: [{ type: "text", text: `No ${status === "all" ? "" : status + " "}escalations.` }] };
    }
    const lines = entries.map(
      ([id, e]) => `- ${id}: ${e.conversationRef} (${e.reason}) [${e.status}] - ${e.summary}`
    );
    return { content: [{ type: "text", text: lines.join("\n") }] };
  },
};
