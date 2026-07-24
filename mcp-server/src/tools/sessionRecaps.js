import { z } from "zod";
import { newId } from "../store.js";

export const createSessionRecapTool = {
  name: "create_session_recap",
  config: {
    title: "Create a session recap",
    description:
      "Turn source text (a session transcript, doc, PR description, or pasted markdown) " +
      "into a recap artifact with a shareable listening page.",
    inputSchema: {
      title: z.string().describe("Title for the recap"),
      sourceText: z.string().describe("The raw content to summarize into a recap"),
      format: z.enum(["audio", "text"]).default("audio").describe("Output format"),
    },
  },
  async handler({ title, sourceText, format }) {
    const id = newId("recap");
    const wordCount = sourceText.trim().split(/\s+/).filter(Boolean).length;

    // TODO: for format="audio", pipe a summarized script through a TTS provider
    // and upload the result; for format="text", just persist the summary.
    // This scaffold returns a placeholder link so the tool's contract is
    // exercisable end-to-end before that infrastructure exists.

    return {
      content: [
        {
          type: "text",
          text:
            `✓ Recap "${title}" created (${format}, ~${wordCount} source words). ` +
            `Listen at https://opskeep.example/recaps/${id}\n\n` +
            `(placeholder link: wire up real storage + TTS before shipping this tool)`,
        },
      ],
    };
  },
};
