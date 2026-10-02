# Inspection demo checkpoint — October 2, 2026 UTC

Approved build: October 1 mockup; user authorized building the existing Capability Navigator into a working demo.
Base: b274f0c11710c3c0f4d2cff8c3ce138ae6c93630.
Tested runtime revision: 1489eacbafe96791437f8ce08711b8978a684180.
Browser acceptance: PASS, native=true, run https://github.com/mapsplusapps/webmcp-capability-navigator/actions/runs/36957220992.
Evidence artifact: 11206665601; contains desktop, 320, 390 and 768 screenshots and report.json.
Tests: eight deterministic tests + release preflight + syntax checks pass.
Browser coverage: guided draft, edited approval, reload persistence, asset switching, discard, scripted submit denial, four native WebMCP invocations, no horizontal overflow at tested sizes, original capability reference, no browser exceptions.
Visual review: screenshots inspected; task and evidence hierarchy follows approved concept. Phone uses stacked task panels with readable controls.
Chrome compatibility: current runner required JSON-stringified executeTool arguments. QA tries object arguments first and retries only pre-invocation parsing failure. Registration uses document.modelContext.
Runtime: root inspection workflow; original six-tool reference retained at /capabilities.html.
Data: synthetic register v1, as of Oct 1; no client data, dispatch or live model chat. Guided path explicitly deterministic. Browser-agent tools read/prepare/stage; no approval/save tool.
Persistence: browser-local localStorage only, includes edited fields, validated source binding, duplicate order prevention.

PRODUCTION: still previous revision b274f0c. New public workflow NOT deployed or verified.
BLOCKER: automatic approval review rejected POST to a temporary authenticated Sparkles Supabase helper that transfers public repository source to the existing Vercel project. Review requires explicit owner approval of this deployment mechanism. Do not bypass rejection.
Helper ops-webmcp-inspection-deploy-20261002 retired (410), version 2. No new Vercel deployment found afterward.
Next: obtain explicit mechanism approval; recreate bounded authenticated short-lived helper for exact tested revision, deploy existing project, retire helper, verify anonymous public access, source revision/content, guided approval/refresh and native tools; update project and portfolio only after public acceptance.
Sparkles project a7fab2f7-687b-4c73-8044-75867ee30211 now records implemented/tested, deployment blocked and not ready for renewed proposal use.
