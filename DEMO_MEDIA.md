# Demo media and browser proof

## Public demo

The completed Capability Navigator demo video is published on the public Devpost portfolio page:

https://devpost.com/software/capability-navigator-give-browser-agents-tools-not-pixels

The current public demo cut is:

`Capability-Navigator-WebMCP-Demo-SUBMIT-FINAL.mp4`

- Runtime: **76.93 seconds**
- Resolution: **1920×1080**
- Video: H.264
- Audio: AAC, Sparkles / ElevenLabs narration
- SHA-256: `bf2eb6b593e9fc7994862dde61aff5e22392a3038215802b8eb516f77325bb0d`

The cut begins immediately on the real production app, keeps the native WebMCP browser run as its backbone, and uses short moving proof close-ups for Agent Trace, the `AGENT-STAGED` packet, the human-edited `HUMAN-BUILT` packet, and the six-tool / zero-external-action boundary.

## Native WebMCP browser proof

The production app was recorded in headed Google Chrome with native WebMCP enabled and the official WebMCP testing extension loaded.

Verified GitHub Actions run: `33807187076`  
Head SHA: `4cf4f5fa34e2572602413ac121bbf8aaa0e3039f`  
Browser recording artifact: `webmcp-live-browser-demo` / artifact ID `9913424366`  
Artifact ZIP SHA-256: `7be0d3804cb12d0b48f8fc9dfb4eaacb78fce6de410017442f54fa36181f9fa6`

The run log proves:

- `WEBMCP_STATUS=WebMCP ready`
- `MODEL_CONTEXT_PRESENT=true`
- exactly six registered tools:
  - `list_capabilities`
  - `get_capability`
  - `find_examples`
  - `draft_scope`
  - `prepare_decision_packet`
  - `stage_human_review`
- every one of those six tools completed successfully through native `document.modelContext.executeTool(...)`.
- the browser recording shows the visible Agent Trace, an `AGENT-STAGED` Human Review packet, the human adding `Low-bandwidth field use`, and the packet becoming `HUMAN-BUILT`.

The raw native browser recording is 37.08 seconds at 1600×900.

## Verification scope

The verified claim is native WebMCP behavior in the Chrome acceptance run above. This document does not claim independent acceptance in every browser or agent client.

## Historical challenge note

This media package was originally prepared for the 2026 WebMCP Challenge. The final competition submission was not completed before the deadline, so the project was not included in judging. The Devpost page and media are retained as public portfolio artifacts, and the challenge-era evidence remains in the repository for provenance.
