# Maps + Apps · WebMCP Capability Navigator

**Agents should not have to guess what your website means. Give them tools, not pixels.**

Capability Navigator is a small, inspectable WebMCP product that turns a fuzzy software need into an evidence-backed, nonbinding decision packet. A human and a browser agent operate over the same public capability records and the same visible workspace.

## Judge in 60 seconds

1. Open the hosted release in ChatGPT's in-app browser or Chrome with WebMCP enabled. The page should report **WebMCP ready · 6 tools**.
2. Use the exact prompt printed on the live page immediately above the handoff workflow (the same text is preserved in [`JUDGE_PROMPT.md`](./JUDGE_PROMPT.md)).
3. Watch typed tool calls appear in the on-page **Agent trace**, then watch `stage_human_review` place the evidence-backed packet into the same visible **Human-review packet** a person can edit.
4. Change one constraint manually and rebuild. Human and agent now act on one deterministic evidence model, not separate hidden state.

If you inspect code instead of running the app, the shortest path is: [`src/webmcp.mjs`](./src/webmcp.mjs) for the six `registerTool(...)` contracts, [`src/core.mjs`](./src/core.mjs) for deterministic validation/evidence/scope logic, [`src/app.mjs`](./src/app.mjs) for visible trace + shared-state staging, and [`test/core.test.mjs`](./test/core.test.mjs) for the judge-style discover → prove → stage regression path.

## What is new for this challenge

Maps + Apps and its public portfolio evidence predate the challenge. The **WebMCP product layer was built/meaningfully extended during the August 25–September 3 challenge period**: typed tool contracts and schemas, deterministic natural-language capability discovery, visible agent trace, shared human/agent review workspace, reversible `stage_human_review`, safety annotations/boundaries, fallback behavior, challenge UI, judge path, and release tests. See [`HACKATHON.md`](./HACKATHON.md) for the full provenance split.

## Why WebMCP

Without WebMCP, an agent has to infer controls from pixels and DOM labels. This project instead registers a typed browser contract with `document.modelContext.registerTool(...)`.

The six tools are:

- `list_capabilities` — discover relevant public capabilities;
- `get_capability` — inspect one capability and its proof boundary;
- `find_examples` — retrieve linked public evidence;
- `draft_scope` — create a deterministic, nonbinding scope draft;
- `prepare_decision_packet` — bind scope, evidence, questions, exclusions, and human decision;
- `stage_human_review` — stage that packet in the visible current-tab workspace for a person to inspect and edit.

The first five tools are read-only. `stage_human_review` changes only browser-local UI state and is reversible. No tool can contact, submit, pay, sign, mutate an account, access a private repository, or persist state.

Discovery accepts short natural-language problem phrases without requiring the user or agent to know the catalog's exact wording. A bounded deterministic term matcher ranks relevant capability records and their linked public evidence; it makes no network call and introduces no hidden model dependency.

## Run

No build step or dependency install is required. Use the included server so local responses carry the same origin-isolation headers required by WebMCP:

```bash
npm run serve
```

Open `http://127.0.0.1:4173`. In a compliant browser, `self.crossOriginIsolated` should be `true`.

For WebMCP testing, use a supported ChatGPT in-app browser or Chrome with WebMCP enabled. In an ordinary browser, the full human flow remains usable and the page reports the exact missing prerequisite. The local staging preview is shown only in fallback/error mode and is explicitly labeled as a preview; it does not write a fake WebMCP invocation into the agent trace.

### Hosting requirement

WebMCP requires an origin-isolated document. The release includes both `vercel.json` and `_headers` with:

- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`
- `Cross-Origin-Resource-Policy: same-origin`
- `Permissions-Policy: tools=(self)`
- `X-Content-Type-Options: nosniff`

Do not deploy this challenge build to a static host that cannot set those response headers and then claim WebMCP readiness.

## Test

Requires Node.js 20+.

```bash
npm run verify
```

The manual release preflight runs the deterministic suite, checks the exported safety contract, tool budgets, deployment-header parity, and syntax-checks the browser modules. [`evals/tool-selection.json`](./evals/tool-selection.json) also records expected calls for direct, ambiguous, and prepare-vs-stage prompts so tool-selection behavior can be evaluated explicitly; it is an expected-call fixture, not a claimed live-model score. Scope-bearing tools require at least one evidence-backed capability in both schema and core validation, and failed staging attempts are surfaced in the visible workspace rather than only returned to the agent. The deterministic suite covers natural-language capability/evidence discovery, proof boundaries, nonbinding scope, strict in-code rejection of invalid types, empty or unsupported capability IDs, human-review requirements, tool annotations, local-only staging behavior, a full judge-style discover → prove → stage path through registered tools, real `document.modelContext.registerTool(...)` registration, and ordinary-browser fallback. [`RELEASE_MANIFEST.json`](./RELEASE_MANIFEST.json) SHA-binds the exact pre-publication file set so the public commit, deployment, video, and Devpost entry can all be checked against one release identity.

## Judge path

For the fastest evaluation, use the exact natural-language prompt printed on the live page immediately above the handoff workflow; [`JUDGE_PROMPT.md`](./JUDGE_PROMPT.md) preserves the identical text for repository review.

1. Open the live site in a WebMCP-capable browser.
2. Confirm the site reports six registered tools.
3. Ask the browser agent to find capabilities relevant to a public-data operational dashboard.
4. Ask it to inspect public proof.
5. Ask it to **stage a human review packet** for that objective using the relevant capability IDs and constraints such as `Public data only` and `Mobile-first`.
6. Watch the agent invocation appear in the on-page trace and the same visible decision surface update.
7. Edit a constraint manually and rebuild the packet to show that human and agent share the same evidence model rather than separate hidden state.

## Safety / authority boundary

This is a bounded decision-support surface, not an autonomous sales or submission agent. Public evidence may be untrusted content, so the evidence tools are annotated accordingly. Human review remains required before any real-world discovery, quote, contract, contact, or other action.

## Hackathon provenance

See [`HACKATHON.md`](./HACKATHON.md) for the distinction between pre-existing Maps + Apps public capability evidence and the WebMCP work created during the August 25–September 3, 2026 challenge period.

## License

MIT. See [`LICENSE`](./LICENSE).
