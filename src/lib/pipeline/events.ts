/** Shared between server and client: real pipeline stages, streamed as NDJSON. */
export const STAGES = [
  { id: "validate", label: "Validating content" },
  { id: "render", label: "Rendering slides" },
  { id: "check", label: "Checking layout" },
  { id: "export", label: "Preparing exports" },
] as const;

export type StageId = (typeof STAGES)[number]["id"];

export type PipelineEvent =
  | { type: "stage"; stage: StageId }
  | { type: "done"; projectId: string }
  | { type: "error"; stage: StageId | null; message: string };

/** Read an NDJSON pipeline response, calling `onEvent` for each event. */
export async function readPipeline(
  response: Response,
  onEvent: (event: PipelineEvent) => void,
): Promise<void> {
  if (!response.body) throw new Error("Empty response");
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (value) buffer += value;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) if (line.trim()) onEvent(JSON.parse(line) as PipelineEvent);
    if (done) break;
  }
  if (buffer.trim()) onEvent(JSON.parse(buffer) as PipelineEvent);
}
