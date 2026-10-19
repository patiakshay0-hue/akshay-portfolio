// Demo data for the Automation Lab and the Pipeline scroll act.
//
// EVERYTHING in this file is fictional sample data. Companies, sources and
// postings do not exist. No request is ever made to a job site, an AI model,
// n8n or Telegram from this page.

export const STAGES = [
  {
    id: 'trigger',
    title: 'Schedule Trigger',
    short: 'Trigger',
    blurb: 'Starts a run on a timer. In a real deployment this is a cron-style schedule node.',
    input: 'Clock tick',
    output: 'Run id and start time',
  },
  {
    id: 'sources',
    title: 'Opportunity Sources',
    short: 'Sources',
    blurb: 'Collects raw postings from configured, permitted sources. Each source can fail on its own without stopping the run.',
    input: 'Source list',
    output: 'Raw posting records',
  },
  {
    id: 'normalize',
    title: 'Data Normalization',
    short: 'Normalize',
    blurb: 'Standardizes titles, organization names, locations, work mode, links and posting dates.',
    input: 'Raw records',
    output: 'Records with one consistent shape',
  },
  {
    id: 'dedupe',
    title: 'Duplicate Detection',
    short: 'Dedupe',
    blurb: 'Builds a key from the normalized organization and title (abbreviations expanded) and keeps the first record per key.',
    input: 'Normalized records',
    output: 'Unique records, duplicates logged',
  },
  {
    id: 'domain',
    title: 'AI Role Classification',
    short: 'Role',
    blurb: 'Assigns a job domain from keyword evidence in the title and description. This demo uses rules; a language-model step is the proposed upgrade.',
    input: 'Unique records',
    output: 'Domain plus the evidence used',
  },
  {
    id: 'level',
    title: 'Experience-Level Classification',
    short: 'Level',
    blurb: 'Reads experience requirements from the text. It is independent of domain, and says "Unclear / Needs Review" when evidence is missing.',
    input: 'Classified records',
    output: 'Experience level plus the evidence used',
  },
  {
    id: 'score',
    title: 'Relevance Scoring',
    short: 'Score',
    blurb: 'Adds up transparent points (domain, experience fit, skills, location, freshness), then applies the filters you set.',
    input: 'Records with domain and level',
    output: 'Score breakdown and a keep/skip decision',
  },
  {
    id: 'prepare',
    title: 'Notification Preparation',
    short: 'Prepare',
    blurb: 'Ranks the records that passed and formats one message per record.',
    input: 'Selected records',
    output: 'Formatted messages',
  },
  {
    id: 'telegram',
    title: 'Telegram Alert',
    short: 'Alert',
    blurb: 'Would call the Telegram Bot API. In this public demo it is a dry run: the message is previewed and nothing is sent.',
    input: 'Formatted messages',
    output: 'Preview only (not sent)',
  },
];

export const SOURCES = [
  { id: 'A', name: 'Sample Board A' },
  { id: 'B', name: 'Sample Board B' },
  { id: 'C', name: 'Sample Board C' },
];

// postedDaysAgo is relative to the (simulated) run time.
export const RECORDS = [
  {
    id: 'r1', source: 'A',
    title: 'ML Intern (Remote)', company: 'Nimbus Analytics Pvt Ltd', location: 'Remote, India',
    postedDaysAgo: 1,
    description: 'Six month internship. Train and evaluate classification models in Python with scikit-learn. Final-year students welcome.',
  },
  {
    id: 'r2', source: 'B',
    title: 'Machine Learning Intern', company: 'Nimbus Analytics', location: 'Remote (India)',
    postedDaysAgo: 2,
    description: 'Internship opportunity. Model training and evaluation using Python. Students and recent graduates can apply.',
  },
  {
    id: 'r3', source: 'A',
    title: 'Junior AI Automation Developer', company: 'Lattice Flow Co.', location: 'Pune, India (Hybrid)',
    postedDaysAgo: 1,
    description: '0-1 years of experience. Build n8n and Python workflows, REST API integrations and webhook handlers for client automations.',
  },
  {
    id: 'r4', source: 'B',
    title: 'Senior Full-Stack Engineer', company: 'Brightwave Labs', location: 'Bengaluru, India (Hybrid)',
    postedDaysAgo: 3,
    description: '5+ years of experience with React and Node. Lead the frontend and backend roadmap and mentor a team.',
  },
  {
    id: 'r5', source: 'A',
    title: 'Agentic AI Engineer', company: 'Orbit Works', location: 'Remote, India',
    postedDaysAgo: 2,
    description: 'Build tool-using LLM agents with Python and FastAPI. 0-2 years of experience. Fresh graduates are encouraged to apply.',
  },
  {
    id: 'r6', source: 'B',
    title: 'Data Analyst Trainee', company: 'Kestrel Retail Group', location: 'Mumbai, India (On-site)',
    postedDaysAgo: 6,
    description: 'Fresher batch. Work with SQL and dashboards to report weekly KPIs. Training provided.',
  },
  {
    id: 'r7', source: 'A',
    title: 'Software Developer', company: 'Ironleaf Systems', location: 'Remote, India',
    postedDaysAgo: 2,
    description: 'Join our engineering team and ship backend features. Competitive salary and flexible hours.',
  },
  {
    id: 'r8', source: 'B',
    title: 'Marketing Executive', company: 'Pebble & Co', location: 'Delhi, India (On-site)',
    postedDaysAgo: 1,
    description: 'Plan campaigns, manage social calendars and coordinate with vendors.',
  },
  {
    id: 'r9', source: 'C',
    title: 'Web Developer Intern', company: 'Northgate Studio', location: 'Lisbon, Portugal (On-site)',
    postedDaysAgo: 4,
    description: 'Three month internship building HTML, CSS and JavaScript websites for local businesses.',
  },
];

export const DEFAULT_SETTINGS = {
  minScore: 60,
  levels: { internship: true, entry: true, unclear: true, experienced: false, all: true },
  remoteOrIndiaOnly: true,
  simulateSourceTimeout: false,
};

// Skills the sample "profile" looks for in descriptions. Each hit adds points.
export const SKILL_KEYWORDS = [
  'n8n', 'python', 'rest api', 'api', 'webhook', 'llm', 'fastapi', 'sql',
  'scikit-learn', 'react', 'node', 'dashboards', 'workflows',
];
