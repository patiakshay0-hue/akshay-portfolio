// Intelligent News Grouping: a small, real TF-IDF + cosine-similarity illustration.
//
// This is NOT a neural embedding model. It only sees shared vocabulary, which
// is exactly why embeddings are listed as the proposed upgrade. All headlines
// below are fictional.

export const HEADLINES = [
  'Central bank holds interest rates steady amid inflation concerns',
  'Interest rates unchanged as central bank watches inflation',
  'Stocks slip after central bank keeps interest rates on hold',
  'City council approves new metro line extension',
  'Metro line extension gets green light from city council',
  'Commuters welcome approved metro line extension plan',
  'Local team wins championship after dramatic final',
  'Dramatic final ends with championship win for local team',
  'New smartphone launch promises week-long battery',
  'Tech giant unveils phone with week-long battery life',
  'Heavy rain forecast prompts flood warnings across the coast',
];

const STOP = new Set(['the', 'a', 'an', 'of', 'for', 'as', 'and', 'with', 'after', 'amid', 'on', 'in', 'to', 'by', 'at', 'is', 'new', 'across', 'from']);

export function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/)
    .filter((w) => w && !STOP.has(w))
    .map((w) => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w));
}

export function vectorize(docs) {
  const toks = docs.map(tokenize);
  const df = new Map();
  toks.forEach((t) => new Set(t).forEach((w) => df.set(w, (df.get(w) || 0) + 1)));
  const n = docs.length;
  return toks.map((t) => {
    const tf = new Map();
    t.forEach((w) => tf.set(w, (tf.get(w) || 0) + 1));
    const v = new Map();
    tf.forEach((c, w) => v.set(w, (c / t.length) * (Math.log((1 + n) / (1 + df.get(w))) + 1)));
    return v;
  });
}

export function cosine(a, b) {
  let dot = 0; let na = 0; let nb = 0;
  a.forEach((x, w) => { na += x * x; if (b.has(w)) dot += x * b.get(w); });
  b.forEach((x) => { nb += x * x; });
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

/** Single-linkage clustering: join any two headlines whose similarity >= threshold. */
export function cluster(docs, threshold) {
  const vecs = vectorize(docs);
  const parent = docs.map((_, i) => i);
  const find = (i) => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
  for (let i = 0; i < docs.length; i += 1) {
    for (let j = i + 1; j < docs.length; j += 1) {
      if (cosine(vecs[i], vecs[j]) >= threshold) parent[find(i)] = find(j);
    }
  }
  const groups = new Map();
  docs.forEach((d, i) => {
    const r = find(i);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r).push(d);
  });
  return Array.from(groups.values()).sort((a, b) => b.length - a.length);
}
