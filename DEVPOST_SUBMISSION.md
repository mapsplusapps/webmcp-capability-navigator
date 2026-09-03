# Devpost submission packet — Capability Navigator

## Project title
Capability Navigator — Give browser agents tools, not pixels

## One-line description
A WebMCP decision workspace where people and browser agents turn fuzzy software needs into evidence-backed, human-reviewed scope using the same visible page state.

## Live project
https://webmcp-capability-navigator.vercel.app

## Public repository
https://github.com/mapsplusapps/webmcp-capability-navigator

## Demo video
**BLOCKED UNTIL REPLACEMENT:** paste the final public YouTube URL only after the live-app/WebMCP recording is complete and verified. Do not use the rejected title-only MP4 documented in `DEMO_MEDIA.md`.

## Submission description
Most software-provider websites are built for people to interpret visually. A browser agent has to scrape copy, infer what controls mean, click through UI, and hope it understood both the capability and the authority boundary correctly. Capability Navigator explores a different open-web model: the page declares a small typed contract so a person and an agent can work from the same evidence and the same visible decision surface.

A user starts with an outcome such as “create a public-data operational dashboard,” not a finished technical specification. The agent can discover evidence-backed capabilities, inspect their public proof, draft a bounded scope, prepare a decision packet, and—only when explicitly asked—stage that packet into the visible Human-review workspace. Every WebMCP invocation appears in the on-page Agent trace. A person can then change a constraint and rebuild the same packet rather than switching to a separate hidden agent state.

This is a strong fit for WebMCP because the value is not autonomous clicking; it is giving the browser agent a precise, inspectable interface to the meaning of the page. The six tools are registered with `document.modelContext.registerTool(...)` and typed JSON input schemas: `list_capabilities`, `get_capability`, `find_examples`, `draft_scope`, `prepare_decision_packet`, and `stage_human_review`. The first five are read-only. `stage_human_review` changes only reversible current-tab UI state. No tool can contact anyone, submit anything, pay, sign, mutate an account, persist state, or take an external action.

The decision logic is deterministic JavaScript over a small public capability/evidence model, so there is no hidden model call behind the tool results. The live Vercel deployment sends the origin-isolation and permissions headers required for WebMCP, and the page degrades visibly to a human fallback when the browser does not expose WebMCP.

The broader idea is simple: websites do not have to remain pages an agent operates from pixels. They can become collaborators with a typed contract while keeping evidence, assumptions, agent activity, and human authority in view.

## What was built during the challenge
The WebMCP product layer was created/meaningfully extended during the August 25–September 3, 2026 challenge period: six typed tool contracts, deterministic natural-language capability matching, public-evidence retrieval, bounded scope/packet preparation, visible agent trace, same-page human-review staging, reversible authority boundaries, WebMCP browser fallback behavior, origin-isolation hosting configuration, judge path, and release verification. Pre-existing Maps + Apps material is limited to the public portfolio evidence referenced by the capability model. See `HACKATHON.md` and the dated Git history.

## Testing instructions
1. Open the live project in ChatGPT’s in-app browser or Chrome 149+ with WebMCP testing enabled.
2. Confirm the page reports **WebMCP ready** and **6 tools**.
3. Use this exact prompt: “Using only this page's WebMCP tools, help me scope a public-data operational dashboard. Find the relevant capabilities and inspect the public evidence. Then stage a human-review packet in the visible page using the relevant capability IDs, with these constraints: Public data only; Mobile-first. Do not contact anyone, submit anything, pay, sign, commit, or perform any external action.”
4. Watch tool calls appear in the visible Agent trace and confirm the Human-review packet is staged in the page.
5. Manually add a constraint such as `Low-bandwidth field use` and click **Build decision packet**. The human and agent should now be operating on the same visible evidence model.

No login or credentials are required.

## Built with
WebMCP · JavaScript · HTML · CSS · Node.js · Vercel

## Final lock checklist
- [x] Public repo
- [x] MIT license
- [x] Runnable source/instructions present
- [x] Actual `document.modelContext.registerTool(...)` implementation present
- [x] Live judge URL reachable
- [x] Required WebMCP deployment headers present
- [x] Challenge-period provenance documented
- [ ] Replacement live-app demo recorded
- [ ] Replacement video uploaded publicly to YouTube
- [ ] YouTube URL entered in Devpost
- [ ] Devpost final submit clicked
- [ ] Submission receipt / green Submitted state captured
