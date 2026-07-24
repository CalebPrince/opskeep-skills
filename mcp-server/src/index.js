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

const server = new McpServer({
  name: "opskeep-tools",
  version: "0.1.0",
});

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
  server.registerTool(tool.name, tool.config, tool.handler);
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`opskeep-tools MCP server running on stdio (${tools.length} tools registered)`);
}

main().catch((err) => {
  console.error("Fatal error starting opskeep-tools MCP server:", err);
  process.exit(1);
});
