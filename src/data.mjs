export const CAPABILITIES = Object.freeze([
  {
    id: 'geospatial-public-data',
    name: 'Geospatial public-data systems',
    short: 'Make fragmented public data legible in one operational view.',
    summary: 'Design and build public-facing maps, dashboards, and data systems that combine multiple sources into a usable operational view.',
    problem_types: ['public data', 'geospatial', 'dashboard', 'situational awareness'],
    delivery_patterns: ['web application', 'dashboard', 'map', 'data integration'],
    technologies_public: ['ArcGIS Online', 'ArcGIS Experience Builder', 'Python automation', 'web applications'],
    evidence_ids: ['my-community-data'],
    constraints: ['Public evidence only; private client records and active proposal material are excluded.'],
    provenance: { source_label: 'Maps + Apps — My Community Data case study', source_url: 'https://mapsplusapps.com/projects/my-community-data', verified_at: '2026-08-30', rights: 'OWNED_PUBLIC' }
  },
  {
    id: 'rapid-response-data-automation',
    name: 'Rapid-response data automation',
    short: 'Turn time-sensitive public inputs into repeatable, fail-visible updates.',
    summary: 'Build repeatable ingestion and update workflows for time-sensitive public information, with human-readable outputs and fail-visible boundaries.',
    problem_types: ['automation', 'data integration', 'emergency response', 'operational data'],
    delivery_patterns: ['automation', 'data pipeline', 'public application'],
    technologies_public: ['Python automation', 'real-time data feeds', 'ArcGIS Online'],
    evidence_ids: ['my-community-data'],
    constraints: ['This capability record does not claim authority to contact agencies, submit forms, or mutate external systems.'],
    provenance: { source_label: 'Maps + Apps — My Community Data case study', source_url: 'https://mapsplusapps.com/projects/my-community-data', verified_at: '2026-08-30', rights: 'OWNED_PUBLIC' }
  },
  {
    id: 'mobile-accessible-operations',
    name: 'Mobile-first operational interfaces',
    short: 'Keep complex information usable when the screen, time, and attention are constrained.',
    summary: 'Create mobile-optimized interfaces that make complex operational information easier to use under constrained conditions.',
    problem_types: ['mobile', 'operations', 'accessibility', 'field use'],
    delivery_patterns: ['mobile-first web application', 'progressive web application', 'dashboard'],
    technologies_public: ['mobile-first design', 'ArcGIS Experience Builder', 'progressive web application'],
    evidence_ids: ['my-community-data'],
    constraints: ['Accessibility claims must be tied to observed evidence for the specific delivery, not inferred from this capability statement.'],
    provenance: { source_label: 'Maps + Apps — My Community Data case study', source_url: 'https://mapsplusapps.com/projects/my-community-data', verified_at: '2026-08-30', rights: 'OWNED_PUBLIC' }
  }
]);

export const EXAMPLES = Object.freeze([
  {
    id: 'my-community-data',
    title: 'My Community Data',
    public_summary: 'A nonprofit disaster-response mapping platform with publicly documented multi-source and high-use operating evidence.',
    capability_ids: ['geospatial-public-data', 'rapid-response-data-automation', 'mobile-accessible-operations'],
    public_url: 'https://mapsplusapps.com/projects/my-community-data',
    proof_boundary: 'Public case-study evidence only. This record does not convert public examples into contract references, buyer endorsements, or guarantees for another project.',
    provenance: { source_label: 'Maps + Apps public case study', verified_at: '2026-08-30', rights: 'OWNED_PUBLIC' }
  }
]);

export const AUTHORITY = Object.freeze({
  authority: 'BOUNDED_BROWSER_WORKSPACE', binding: false, external_action: false,
  contact_action: false, payment_action: false, account_action: false,
  private_data: false, persistence: false, result_type: 'INFORMATIONAL_DRAFT_OR_LOCAL_UI_STATE'
});

export const DEFAULT_EXCLUSIONS = Object.freeze([
  'No external contact, send, submission, booking, payment, account mutation, or CRM action.',
  'No private client data, private repository content, credentials, internal rates, or active proposal pricing.',
  'No binding quote, contract, proposal, or commitment.'
]);
