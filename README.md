# Maps + Apps · WebMCP Capability Navigator

**Agents should not have to guess what your website means. Give them tools, not pixels.**

Capability Navigator is a small, inspectable WebMCP reference implementation that turns a fuzzy software need into an evidence-backed, nonbinding decision packet. A human and a browser agent operate over the same public capability records and the same visible workspace.

## See it working

- **Live app:** https://webmcp-capability-navigator.vercel.app
- **Demo video + project page:** https://devpost.com/software/capability-navigator-give-browser-agents-tools-not-pixels
- **Native browser proof:** [`DEMO_MEDIA.md`](./DEMO_MEDIA.md)
- **License:** [`LICENSE`](./LICENSE) — MIT

## Try it in about 60 seconds

1. Open the hosted release in Chrome with WebMCP enabled. The page should report **WebMCP ready · 6 tools**.
2. Use the natural-language demo prompt printed above the handoff workflow. The same prompt is preserved in [`JUDGE_PROMPT.md`](./JUDGE_PROMPT.md); the historical filename is retained for provenance.
3. Watch typed tool calls appear in the on-page **Agent trace**, then watch `stage_human_review` place an evidence-backed packet into the same visible **Human-review packet** a person can edit.
4. Change one constraint manually and rebuild. Human and agent now act on one deterministic evidence model instead of separate hidden state.

If you inspect code instead of running the app, the shortest path is: [`src/webmcp.mjs`](./src/webmcp.mjs) for the six `registerTool(...)` contracts, [`src/core.mjs`](./src/core.mjs) for deterministic validation/evidence/scope logic, [`src/app.mjs`](./src/app.mjs) for visible trace + shared-state staging, and [`test/core.test.mjs`](./test/core.test.mjs) for the discover → prove → stage regression path.

## Why WebMCP

Traditional browser automation forces an agent to infer intent from pixels, DOM structure, labels, and layout. Capability Navigator instead registers an explicit typed browser contract with `document.modelContext.registerTool(...)`.

The six tools are:

- `list_capabilities` — discover relevant public capabilities;
- `get_capability` — inspect one capability and its proof boundary;
- `find_examples` — retrieve linked public evidence;
- `draft_scope` — create a deterministic, nonbinding scope draft;
- `prepare_decision_packet` — bind scope, evidence, questions, exclusions, and human decision;
- `stage_human_review` — stage that packet in the visible current-tab workspace for a person to inspect and edit.

The first five tools are read-only. `stage_human_review` changes only browser-local UI state and is reversible. No tool can contact, submit, pay, sign, mutate an account, access a private repository, or persist a decision.

Discovery accepts short natural-language problem phrases without requiring the user or agent to know the catalog's exact wording. A bounded deterministic term matcher ranks relevant capability records and their linked public evidence; it makes no network call and introduces no hidden model dependency.

## What the pattern demonstrates

**One evidence model. Two operators. A visible authority boundary.**

The browser agent gets small typed tools rather than one giant permission. Its invocations appear in the same interface the human is using. The agent can discover, inspect, draft, prepare, and stage; the person can inspect the evidence, change constraints, and rebuild without handing the agent real-world authority.

That makes Capability Navigator useful beyond this specific demo as a reference pattern for agent-ready websites where speed and automation matter, but accountability still has to remain legible to a person.

## Native WebMCP verification

A headed Chrome acceptance run against the production URL reported `WebMCP ready`, exposed `document.modelContext`, enumerated all six registered tools, and executed all six through the native WebMCP tool path.

The canonical proof is recorded in [`DEMO_MEDIA.md`](./DEMO_MEDIA.md), including GitHub Actions run `33807187076`, head SHA `4cf4f5fa34e2572602413ac121bbf8aaa0e3039f`, artifact ID `9913424366`, and the SHA-256 of the browser-recording artifact.

That is the verified browser acceptance claim for this repository. Other clients depend on their current WebMCP support and are not claimed as independently verified here.

## Run locally

No build step or dependency install is required. Use the included server so local responses carry the same origin-isolation headers used by the hosted release:

```bash
npm run serve
```

Open `http://127.0.0.1:4173`. In a compliant browser, `self.crossOriginIsolated` should be `true`.

In an ordinary browser without WebMCP, the full human flow remains usable and the page reports the missing prerequisite. The local staging preview is shown only in fallback/error mode and is explicitly labeled as a preview; it does not write a fake WebMCP invocation into the Agent trace.

### Hosting requirements

The release includes both `vercel.json` and `_headers` with:

- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`
- `Cross-Origin-Resource-Policy: same-origin`
- `Permissions-Policy: tools=(self)`
- `X-Content-Type-Options: nosniff`

Do not deploy this build to a static host that cannot set the required response headers and then claim WebMCP readiness.

## Test

Requires Node.js 20+.

```bash
npm run verify
```

The manual release preflight runs the deterministic suite, checks the exported safety contract, tool budgets, deployment-header parity, and syntax-checks the browser modules. [`evals/tool-selection.json`](./evals/tool-selection.json) records expected calls for direct, ambiguous, and prepare-vs-stage prompts; it is an expected-call fixture, not a claimed live-model score.

The deterministic suite covers natural-language capability/evidence discovery, proof boundaries, nonbinding scope, strict rejection of invalid types and unsupported capability IDs, human-review requirements, tool annotations, local-only staging behavior, the full discover → prove → stage path through registered tools, real `document.modelContext.registerTool(...)` registration, and ordinary-browser fallback.

[`RELEASE_MANIFEST.json`](./RELEASE_MANIFEST.json) preserves the exact challenge-period release identity for provenance.

## Safety / authority boundary

This is a bounded decision-support surface, not an autonomous sales or submission agent. Public evidence may be untrusted content, so the evidence tools are annotated accordingly. Human review remains required before any real-world discovery, quote, contract, contact, submission, payment, or other external action.

## Project provenance

Capability Navigator's WebMCP product layer was built during the August 25–September 3, 2026 WebMCP Challenge period. The project itself was completed, but the final competition submission was not completed before the deadline, so it was **not included in judging and no award or placement is claimed**.

The Devpost page is retained as a public portfolio/demo artifact. [`HACKATHON.md`](./HACKATHON.md) preserves the challenge-period provenance and the distinction between pre-existing Maps + Apps public evidence and the WebMCP implementation created during that period. Historical submission materials remain in the repository for auditability.

## License

MIT. See [`LICENSE`](./LICENSE).
