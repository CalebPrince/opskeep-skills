import { z } from "zod";
import { timeEntries, runningTimers, newId } from "../store.js";

function entriesFor(project) {
  if (!timeEntries.has(project)) timeEntries.set(project, []);
  return timeEntries.get(project);
}

function formatDuration(ms) {
  const minutes = Math.round(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return hours > 0 ? `${hours}h ${rem}m` : `${rem}m`;
}

export const startTimerTool = {
  name: "start_timer",
  config: {
    title: "Start a timer",
    description: "Start a running timer for a project. Fails if one is already running for that project.",
    inputSchema: {
      project: z.string().describe("Project or client name to attribute time to"),
      note: z.string().optional().describe("What this time block covers"),
    },
  },
  async handler({ project, note }) {
    if (runningTimers.has(project)) {
      return {
        isError: true,
        content: [{ type: "text", text: `A timer is already running for "${project}". Stop it first.` }],
      };
    }
    const id = newId("timer");
    runningTimers.set(project, { id, startedAt: new Date().toISOString(), note: note ?? null });
    return { content: [{ type: "text", text: `✓ Timer started for "${project}"${note ? `, ${note}` : ""}` }] };
  },
};

export const stopTimerTool = {
  name: "stop_timer",
  config: {
    title: "Stop a timer",
    description: "Stop the running timer for a project and log the completed entry.",
    inputSchema: {
      project: z.string().describe("Project or client name whose timer should stop"),
    },
  },
  async handler({ project }) {
    const running = runningTimers.get(project);
    if (!running) {
      return {
        isError: true,
        content: [{ type: "text", text: `No timer is running for "${project}".` }],
      };
    }
    const stoppedAt = new Date().toISOString();
    const durationMs = new Date(stoppedAt).getTime() - new Date(running.startedAt).getTime();
    entriesFor(project).push({ id: running.id, startedAt: running.startedAt, stoppedAt, note: running.note });
    runningTimers.delete(project);
    return {
      content: [
        { type: "text", text: `✓ Timer stopped for "${project}", logged ${formatDuration(durationMs)}` },
      ],
    };
  },
};

export const backfillTimeEntryTool = {
  name: "backfill_time_entry",
  config: {
    title: "Backfill a time entry",
    description: "Log a completed time block for a project without starting/stopping a live timer.",
    inputSchema: {
      project: z.string().describe("Project or client name to attribute time to"),
      startedAt: z.string().describe("ISO 8601 start time"),
      stoppedAt: z.string().describe("ISO 8601 end time"),
      note: z.string().optional().describe("What this time block covers"),
    },
  },
  async handler({ project, startedAt, stoppedAt, note }) {
    const start = new Date(startedAt);
    const stop = new Date(stoppedAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(stop.getTime()) || stop <= start) {
      return {
        isError: true,
        content: [{ type: "text", text: "startedAt and stoppedAt must be valid dates with stoppedAt after startedAt." }],
      };
    }
    const id = newId("timer");
    entriesFor(project).push({ id, startedAt, stoppedAt, note: note ?? null });
    return {
      content: [
        { type: "text", text: `✓ Backfilled ${formatDuration(stop - start)} for "${project}"` },
      ],
    };
  },
};

export const summarizeTimeTool = {
  name: "summarize_time",
  config: {
    title: "Summarize logged time",
    description: "Total up logged time for a project, optionally within a date range.",
    inputSchema: {
      project: z.string().describe("Project or client name to summarize"),
      since: z.string().optional().describe("ISO 8601 date-time lower bound (inclusive)"),
    },
  },
  async handler({ project, since }) {
    const cutoff = since ? new Date(since) : null;
    const entries = entriesFor(project).filter((e) => !cutoff || new Date(e.startedAt) >= cutoff);
    const totalMs = entries.reduce(
      (sum, e) => sum + (new Date(e.stoppedAt).getTime() - new Date(e.startedAt).getTime()),
      0
    );
    return {
      content: [
        {
          type: "text",
          text: `${project}: ${entries.length} entr${entries.length === 1 ? "y" : "ies"}, ${formatDuration(totalMs)} total${since ? ` since ${since}` : ""}`,
        },
      ],
    };
  },
};
