// Project data. Edit this file to change anything in the project explorer,
// the product-builds section and the detail dialogs.
//
// status: 'implemented' | 'prototype' | 'concept'
//   implemented  working code you can run today
//   prototype    partly working, not production hardened
//   concept      designed or planned; may have a small illustration on this page
//
// IMPORTANT: statuses below are conservative first drafts. Confirm each one
// against your real code before publishing, and fill `links` only with URLs
// that exist. Empty links are hidden automatically.
//
// categories: 'automation' | 'ai' | 'software' | 'data'

export const CATEGORIES = [
  { id: 'all', label: 'All Projects' },
  { id: 'automation', label: 'AI Automation' },
  { id: 'ai', label: 'AI & Agentic Systems' },
  { id: 'software', label: 'Software Development' },
  { id: 'data', label: 'Data & Analytics' },
];

export const STATUS = {
  implemented: { label: 'Implemented', hint: 'Working code you can run today.' },
  prototype: { label: 'Prototype', hint: 'Partly working. Not production hardened.' },
  concept: { label: 'Concept', hint: 'Designed or planned. May include a small illustration on this page.' },
};

export const projects = [
  {
    id: 'job-hunter',
    title: 'AI Job Opportunity Hunter',
    categories: ['automation', 'ai', 'data'],
    status: 'prototype',
    statusNote:
      'Prototype workflow built in n8n. The Automation Lab on this page is a separate browser simulation on fictional data: it does not run n8n, call job sites or AI models, or send Telegram messages.',
    visual: 'workflow',
    featured: true,
    summary: 'Collects job, internship and entry-level postings, removes duplicates, classifies them and sends ranked Telegram alerts.',
    problem:
      'Finding relevant jobs and internships across several sources means repeating the same manual review: read each posting, work out its category, check the experience requirement, and decide whether it deserves attention.',
    solution:
      'A scheduled workflow collects postings from configured sources, standardizes them, drops duplicates, labels the job domain and experience level as two independent fields, scores relevance with an explainable breakdown, applies filters and formats Telegram alerts.',
    workflow: ['Schedule', 'Sources', 'Normalize', 'Dedupe', 'Role class', 'Level class', 'Score', 'Prepare', 'Telegram'],
    stack: ['n8n', 'Telegram Bot API', 'REST APIs', 'JavaScript (Code nodes)', 'Scheduled triggers', 'LLM classification (proposed)'],
    challenges: [
      'A Telegram bot cannot message someone who has never started it. Alerts failed until the bot was started and the chat id was confirmed.',
      'Supply was the bottleneck, not scoring: some opportunity types are rare in the configured sources, so raising the target count meant lowering the threshold or adding sources.',
      'Domain and experience level had to be separate fields, otherwise every software role collapsed into "entry-level".',
    ],
    links: { repo: '', demo: '' },
    labLink: true,
  },
  {
    id: 'news-grouping',
    title: 'Intelligent News Grouping',
    categories: ['ai', 'data'],
    status: 'concept',
    statusNote:
      'Concept. A small TF-IDF and cosine-similarity illustration is implemented in the detail view below. It is not a neural embedding model; embeddings are the proposed upgrade.',
    visual: 'cluster',
    summary: 'Groups related headlines into topics by measuring how similar their text is.',
    problem: 'A news feed repeats the same story across many headlines. Reading them one by one hides the real topics.',
    solution:
      'Turn each headline into a vector, measure similarity between vectors, then cluster headlines whose similarity passes a threshold. Each cluster becomes a topic group.',
    workflow: ['Headline input', 'Text preprocessing', 'Text embeddings', 'Similarity calculation', 'Clustering', 'Topic groups'],
    stack: ['Python', 'Text vectors (TF-IDF in the illustration)', 'Cosine similarity', 'Embedding models (proposed)'],
    explainer: [
      'An embedding turns a piece of text into a list of numbers so that texts with similar meaning sit close together. The illustration below uses TF-IDF, which counts weighted words, so it only sees shared vocabulary.',
      'Neural embeddings also capture paraphrases ("shares fall" and "stocks slide"), which is why they are the proposed next step.',
      'Clustering then groups vectors whose cosine similarity is above a threshold. Lowering the threshold merges more headlines into one topic.',
    ],
    challenges: [
      'Choosing the similarity threshold: too low merges unrelated stories, too high splits one story into many.',
      'Vocabulary-based vectors miss paraphrases, which is the main reason to move to embeddings.',
    ],
    links: { repo: '', demo: '' },
    extra: 'news-demo',
  },
  {
    id: 'document-intelligence',
    title: 'Document Intelligence Workflow',
    categories: ['ai', 'data'],
    status: 'concept',
    statusNote: 'Concept architecture for a retrieval-based document workflow. Not presented as a production document-processing service.',
    visual: 'doc',
    summary: 'Turns uploaded documents into searchable knowledge and answers questions with the relevant passages.',
    problem: 'Useful facts are buried inside long PDFs and reports, and keyword search misses what the reader actually means.',
    solution:
      'Extract text, split it into chunks, embed each chunk, store the vectors in a search index, retrieve the most relevant chunks for a question and have a language model answer using only those chunks.',
    workflow: ['Document upload', 'Text extraction', 'Chunking', 'Embedding generation', 'Search index', 'Relevant retrieval', 'Answer generation'],
    stack: ['Python', 'FastAPI', 'Embeddings', 'Vector search', 'LLM integration', 'Structured outputs'],
    explainer: [
      'Text extraction reads the file into plain text. Chunking splits it into passages small enough to embed and retrieve precisely.',
      'Embeddings place each chunk in a space where similar meaning is close. Retrieval finds the chunks nearest to the question.',
      'The language model only writes the answer; the retrieved chunks are the evidence, which is what keeps answers grounded.',
    ],
    challenges: [
      'Chunk size is a trade-off: small chunks retrieve precisely but lose context, large chunks do the opposite.',
      'Scanned or table-heavy PDFs extract badly, so extraction quality sets a ceiling on everything after it.',
    ],
    links: { repo: '', demo: '' },
  },
  {
    id: 'lead-processing',
    title: 'Lead Processing Automation',
    categories: ['automation', 'data'],
    status: 'concept',
    statusNote: 'Concept with a worked example on fictional lead data below. No CRM or email service is connected.',
    visual: 'leads',
    summary: 'Validates, cleans, de-duplicates, categorizes and routes incoming leads so follow-up starts from tidy data.',
    problem: 'Leads arrive from forms and inboxes with missing fields, inconsistent formatting and duplicates, and someone has to sort them by hand.',
    solution:
      'A pipeline validates required fields, normalizes names, emails and phone numbers, detects duplicates, assigns a category, routes each lead to an owner and drafts the follow-up.',
    workflow: ['Incoming lead', 'Field validation', 'Data normalization', 'Duplicate detection', 'Categorization', 'Routing', 'Follow-up preparation'],
    stack: ['n8n', 'Webhooks', 'REST APIs', 'Data transformation', 'Google Sheets or a database (proposed)'],
    challenges: [
      'Deciding what counts as a duplicate: same email is clear, same name and company is only a likely match.',
      'Rejecting a lead silently loses revenue, so invalid leads go to a review queue instead of disappearing.',
    ],
    links: { repo: '', demo: '' },
    extra: 'lead-sample',
  },
  {
    id: 'workflow-assistant',
    title: 'AI Workflow Assistant',
    categories: ['ai', 'automation'],
    status: 'concept',
    statusNote: 'Conceptual tool-using assistant architecture. It is not an implemented autonomous agent and nothing here runs unattended.',
    visual: 'agent',
    summary: 'A tool-using assistant design where every action passes an approval step before it runs.',
    problem: 'People repeat multi-step tasks across tools. A fully autonomous agent is risky because a wrong action can be hard to undo.',
    solution:
      'The assistant interprets a request, drafts a plan, selects tools from an allow-list, asks for approval on anything with side effects, executes, validates each result and then responds.',
    workflow: ['User request', 'Request interpretation', 'Planning', 'Tool selection', 'Approved execution', 'Result validation', 'Final response'],
    stack: ['LLM integration', 'Structured outputs', 'Tool calling', 'n8n (tool layer)', 'Approval step'],
    challenges: [
      'Autonomy versus control: the useful design keeps a human approval on every side effect.',
      'Validating results matters as much as planning, because a tool can succeed technically and still return the wrong thing.',
    ],
    links: { repo: '', demo: '' },
  },
  {
    id: 'voice-assistant',
    title: 'AI Desktop Voice Assistant',
    categories: ['ai', 'software'],
    status: 'prototype',
    statusNote: 'Prototype. Confirm exactly which commands work before publishing, and move unfinished items to the proposed list.',
    visual: 'voice',
    summary: 'A desktop assistant that listens to voice commands, runs actions on the computer and answers aloud.',
    problem: 'Common desktop tasks (opening apps, searching, quick lookups) take several clicks when you could just ask.',
    solution:
      'Python captures speech, converts it to text, interprets the command, runs the matching desktop or web action and speaks the result.',
    workflow: ['Microphone input', 'Speech recognition', 'Command interpretation', 'Action execution', 'Voice response'],
    stack: ['Python', 'Speech recognition', 'Text-to-speech', 'Desktop and application integration'],
    proposed: ['Wake word', 'Language-model command understanding', 'Per-command confirmation for risky actions'],
    challenges: [
      'Speech recognition errors make confirmation important before running anything with side effects.',
      'Background noise changes accuracy a lot, so the microphone setup matters.',
    ],
    links: { repo: '', demo: '' },
  },
  {
    id: 'studysphere',
    title: 'StudySphere',
    categories: ['software', 'ai'],
    status: 'concept',
    statusNote: 'Educational platform concept with written project documentation. Update this status if you have a working build.',
    visual: 'study',
    product: true,
    summary: 'A learning platform concept: study from your own documents, find resources and practise mock interviews.',
    problem: 'Students keep notes, readings and interview preparation in separate places, and generic study tools do not know their own material.',
    solution:
      'One platform where uploaded documents become study material, resources are organized by topic and mock interviews are generated from what the student is actually studying.',
    workflow: ['Upload documents', 'Extract and organize', 'Study resources', 'Mock interview practice', 'Feedback'],
    stack: ['Full-stack web application', 'Document processing', 'LLM integration (proposed)', 'Database'],
    users: 'Students preparing for exams and interviews.',
    features: ['Document-based learning', 'Study resource library', 'Mock interview preparation'],
    challenges: ['Keeping generated questions faithful to the uploaded source rather than to general knowledge.'],
    links: { repo: '', demo: '' },
  },
  {
    id: 'dataforge-ai',
    title: 'Dataforge AI',
    categories: ['data', 'ai', 'software'],
    status: 'concept',
    statusNote: 'Product concept. Describe what is actually built here once you confirm it.',
    visual: 'data',
    product: true,
    summary: 'An AI and data-focused product concept for preparing and understanding datasets.',
    problem: 'Raw data is messy, and cleaning and profiling it by hand takes time before any analysis can start.',
    solution:
      'A tool that profiles incoming data, suggests cleaning and normalization steps, and explains what changed, so the analysis starts from data you can trust.',
    workflow: ['Ingest data', 'Profile', 'Clean and normalize', 'Explain changes', 'Export'],
    stack: ['Python', 'Data cleaning', 'Data normalization', 'SQL', 'LLM integration (proposed)'],
    users: 'Analysts and small teams who work with spreadsheets and exports.',
    features: ['Data profiling', 'Cleaning suggestions', 'Change explanations'],
    challenges: ['Cleaning rules that look right on one dataset can quietly damage another, so every change needs to be reviewable.'],
    links: { repo: '', demo: '' },
  },
  {
    id: 'this-portfolio',
    title: 'This Portfolio',
    categories: ['software'],
    status: 'implemented',
    statusNote: 'Implemented. You are looking at it. The source is this project.',
    visual: 'site',
    product: true,
    summary: 'A scroll-driven portfolio with a working automation simulator, built on the ScrollCraft engine.',
    problem: 'A static page cannot show how an automation behaves, only describe it.',
    solution:
      'A vanilla JavaScript site whose Automation Lab runs real classification and scoring code on sample data, so visitors can operate a workflow instead of reading about one.',
    workflow: ['Data and config files', 'Pure pipeline logic', 'Interactive modules', 'ScrollCraft scroll scenes', 'Static build'],
    stack: ['HTML', 'CSS', 'JavaScript (ES modules)', 'Vite', 'ScrollCraft engine', 'SVG'],
    users: 'Anyone deciding whether to work with me.',
    features: ['Operable workflow simulation', 'Filterable project explorer', 'Reduced-motion support', 'Unit-tested pipeline logic'],
    challenges: [
      'Keeping a pinned, scroll-driven scene readable on phones and under reduced motion.',
      'Making sure the demo is honest: labelled sample data, no real messages, no overstated claims.',
    ],
    links: { repo: '', demo: '' },
  },
];

export function getProject(id) {
  return projects.find((p) => p.id === id) || null;
}
