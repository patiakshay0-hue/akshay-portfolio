// Lead Processing Automation: a small, real worked example on fictional leads.
// Validation, normalization, duplicate detection, categorization and routing
// are all computed here. No CRM, email or network call is involved.

export const SAMPLE_LEADS = [
  { id: 'L1', name: '  priya SHAH ', email: 'Priya.Shah@Example.com', message: 'We want to automate invoice follow-ups with n8n.' },
  { id: 'L2', name: 'Marco Rossi', email: 'marco@example.org', message: 'Need a dashboard website for our clinic.' },
  { id: 'L3', name: 'Priya Shah', email: 'priya.shah@example.com', message: 'Following up on my earlier note about workflows.' },
  { id: 'L4', name: 'Lee', email: 'lee-at-example.com', message: 'Interested in your services.' },
  { id: 'L5', name: 'anaya kulkarni', email: 'anaya@example.net', message: 'Are you hiring interns for a role this year?' },
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const titleCase = (s) => s.trim().toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());

const CATEGORIES = [
  { id: 'Automation', words: ['automate', 'workflow', 'n8n', 'automation'], route: 'Automation queue' },
  { id: 'Software', words: ['website', 'app', 'dashboard', 'software'], route: 'Software queue' },
  { id: 'Opportunity', words: ['intern', 'hiring', 'job', 'role'], route: 'Recruiting inbox' },
];

export function processLeads(leads = SAMPLE_LEADS) {
  const seen = new Map();
  return leads.map((l) => {
    const out = { id: l.id, raw: l, name: titleCase(l.name), email: l.email.trim().toLowerCase(), stage: [] };
    const problems = [];
    if (out.name.length < 2) problems.push('name missing');
    if (!EMAIL.test(out.email)) problems.push('email invalid');
    if (problems.length) {
      return { ...out, status: 'review', category: '-', route: 'Review queue', note: problems.join(', '), followUp: 'No follow-up drafted until the lead is fixed.' };
    }
    if (seen.has(out.email)) {
      return { ...out, status: 'duplicate', category: '-', route: `Merged into ${seen.get(out.email)}`, note: 'same email as an earlier lead', followUp: 'No new follow-up. The earlier lead already has one.' };
    }
    seen.set(out.email, l.id);
    const text = l.message.toLowerCase();
    const cat = CATEGORIES.find((c) => c.words.some((w) => text.includes(w)));
    const category = cat ? cat.id : 'General';
    const route = cat ? cat.route : 'Triage inbox';
    const first = out.name.split(' ')[0];
    return {
      ...out, status: 'routed', category, route, note: 'valid and unique',
      followUp: `Hi ${first}, thanks for your note about "${l.message.replace(/\.$/, '')}". I will reply with next steps shortly.`,
    };
  });
}
