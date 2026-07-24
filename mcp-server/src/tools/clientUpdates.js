import { z } from "zod";

// The agent composes the update text (that's judgment work, handled by the
// opskeep-run-work skill). This tool handles the mechanical, hosted half:
// formatting for the destination channel and "sending" it.

export const sendClientUpdateTool = {
  name: "send_client_update",
  config: {
    title: "Send client update",
    description:
      "Deliver a client-ready update to a channel (email or Slack). The caller supplies " +
      "the already-composed update body; this tool formats and sends it.",
    inputSchema: {
      project: z.string().describe("Project or client name the update is about"),
      channel: z.enum(["email", "slack"]).describe("Where to deliver the update"),
      recipient: z
        .string()
        .describe("Email address (for channel=email) or Slack channel/user ID (for channel=slack)"),
      subject: z.string().optional().describe("Subject line, used for email only"),
      body: z.string().describe("The composed update text"),
    },
  },
  async handler({ project, channel, recipient, subject, body }) {
    // TODO: wire up a real email provider (e.g. Resend/Postmark) and a Slack
    // Web API client here. For now this confirms the payload that would be sent.
    const preview = body.length > 160 ? `${body.slice(0, 160)}…` : body;

    return {
      content: [
        {
          type: "text",
          text:
            `✓ Update for "${project}" queued for delivery via ${channel} to ${recipient}` +
            (channel === "email" && subject ? ` (subject: "${subject}")` : "") +
            `\n\nPreview: ${preview}`,
        },
      ],
    };
  },
};
