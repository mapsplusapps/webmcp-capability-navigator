# Demo media — submission lock

The previously published 2:05.7 MP4 is **REJECTED and must not be used for judging**. Its visuals remain on the title treatment for nearly the entire narration and do not clearly demonstrate the application functioning.

Rejected asset SHA-256: `0b7c84574e1100116b04b0933261cf83e3f59b7cfaa0aa1e478f6452a6002e4c`

## Required replacement

The final Devpost video must be a public YouTube video under 3 minutes that visibly shows the live production app changing state while the audio explains the WebMCP implementation. At minimum the capture must show:

1. `https://webmcp-capability-navigator.vercel.app` loading in a WebMCP-capable browser and reporting **WebMCP ready · 6 tools**.
2. The live handoff workspace before agent action.
3. Registered tool calls appearing in the visible **Agent trace**.
4. `stage_human_review` updating the visible **Human-review packet**.
5. A human editing a constraint and rebuilding the same shared workspace.
6. The six-tool manifest / zero-external-action boundary.

A manual-only recording workflow is committed at `.github/workflows/record-webmcp-demo.yml`; it uses `scripts/record-live-demo.mjs` to capture the real production URL with the WebMCP testing extension. It intentionally does not auto-run.

Do not mark the Devpost entry submitted until the replacement YouTube URL is present and the final video has been watched end-to-end.
