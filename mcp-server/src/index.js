#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { sendClientUpdateTool } from "./tools/clientUpdates.js";
import { scheduleReminderTool, cancelReminderTool } from "./tools/reminders.js";
import {
  scheduleRecurringReminderTool,
  cancelRecurringReminderTool,
  listRecurringRemindersTool,
} from "./tools/recurringReminders.js";
import { createSessionRecapTool } from "./tools/sessionRecaps.js";
import {
  startTimerTool,
  stopTimerTool,
  backfillTimeEntryTool,
  summarizeTimeTool,
} from "./tools/timeTracking.js";
import {
  logExpenseTool,
  listExpensesTool,
  summarizeExpensesTool,
  deleteExpenseTool,
} from "./tools/expenseTracking.js";
import {
  escalateToOwnerTool,
  resolveEscalationTool,
  listEscalationsTool,
} from "./tools/escalations.js";
import { meterTool, meteringEnabled } from "./metering.js";

const server = new McpServer({
  name: "opskeep-tools",
  version: "0.1.0",
});

// Tools that consume credits when metering is enabled, mapped to the billing
// action id sent to the admin server (per-action costs live there, in
// pricing.js). These are the outbound / generative actions; everything else
// (cancels, reads, local time/expense bookkeeping) runs free.
const BILLABLE_ACTIONS = {
  send_client_update: "opskeep.send_client_update",
  schedule_reminder: "opskeep.schedule_reminder",
  schedule_recurring_reminder: "opskeep.schedule_recurring_reminder",
  create_session_recap: "opskeep.create_session_recap",
  escalate_to_owner: "opskeep.escalate_to_owner",
};

const tools = [
  sendClientUpdateTool,
  scheduleReminderTool,
  cancelReminderTool,
  scheduleRecurringReminderTool,
  cancelRecurringReminderTool,
  listRecurringRemindersTool,
  createSessionRecapTool,
  startTimerTool,
  stopTimerTool,
  backfillTimeEntryTool,
  summarizeTimeTool,
  logExpenseTool,
  listExpensesTool,
  summarizeExpensesTool,
  deleteExpenseTool,
  escalateToOwnerTool,
  resolveEscalationTool,
  listEscalationsTool,
];

for (const tool of tools) {
  const action = BILLABLE_ACTIONS[tool.name];
  const registered = action ? meterTool(tool, action) : tool;
  server.registerTool(registered.name, registered.config, registered.handler);
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  const metering = meteringEnabled()
    ? `metering ON (${Object.keys(BILLABLE_ACTIONS).length} billable tools)`
    : "metering off";
  console.error(
    `opskeep-tools MCP server running on stdio (${tools.length} tools registered, ${metering})`
  );
}

main().catch((err) => {
  console.error("Fatal error starting opskeep-tools MCP server:", err);
  process.exit(1);
});
