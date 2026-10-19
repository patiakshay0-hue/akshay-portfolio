// Contact section and About details. All URLs come from site.config.js; any
// value left empty there is simply not rendered.
import { configuredLinks, site } from '../data/site.config.js';
import { $, $$, copyText, esc, toast } from './util.js';

export function initContact() {
  const img = $('#about-img');
  if (img) {
    img.src = site.portrait.src;
    img.alt = site.portrait.alt;
    img.addEventListener('error', () => { img.closest('figure').hidden = true; });
  }
  const edu = $('#about-edu');
  if (edu) edu.textContent = site.education ? `Education: ${site.education}` : '';
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  // Contact links (hidden entirely when nothing is configured)
  const list = $('#contact-links');
  const links = configuredLinks();
  list.innerHTML = links.map((l) => {
    const external = !['email', 'phone'].includes(l.id);
    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
    const copyVal = l.id === 'email' ? site.contact.email : l.id === 'phone' ? site.contact.phone : '';
    const copy = copyVal ? `<button class="copy" type="button" data-copy="${esc(copyVal)}">Copy</button>` : '';
    return `<li><div class="row"><a href="${esc(l.href)}"${attrs}><span>${esc(l.label)}</span><span>${esc(l.text)}</span></a>${copy}</div></li>`;
  }).join('');
  $('#contact-empty').hidden = links.length > 0;
  list.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-copy]');
    if (!b) return;
    const ok = await copyText(b.dataset.copy);
    toast(ok ? 'Copied.' : 'Could not copy. Select the text and copy it manually.');
  });

  // Inquiry composer
  const form = $('#inquiry');
  const what = $('#q-what');
  const status = $('#q-status');
  const err = $('#q-err');
  const send = $('#q-send');

  const types = () => $$('#q-types input:checked').map((c) => c.value);

  function compose() {
    const name = $('#q-name').value.trim();
    const reply = $('#q-reply').value.trim();
    return [
      `Project inquiry: ${types().join(', ') || 'Not specified'}`,
      name ? `From: ${name}` : null,
      reply ? `Reply to: ${reply}` : null,
      '',
      what.value.trim(),
    ].filter((l) => l !== null).join('\n');
  }

  function invalid() {
    const bad = !what.value.trim() || !types().length;
    err.hidden = !bad;
    err.textContent = !what.value.trim()
      ? 'Please describe what you would like to build so the inquiry has something to say.'
      : 'Please pick at least one type of work.';
    if (bad) what.setAttribute('aria-invalid', 'true'); else what.removeAttribute('aria-invalid');
    if (bad) (what.value.trim() ? $('#q-types input') : what).focus();
    return bad;
  }

  form.addEventListener('input', () => { if (what.value.trim() && types().length) { err.hidden = true; what.removeAttribute('aria-invalid'); } });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (invalid()) { status.textContent = ''; return; }
    const subject = `Project inquiry: ${types().join(', ')}`;
    if (site.formEndpoint) {
      send.disabled = true;
      status.textContent = 'Sending...';
      try {
        const res = await fetch(site.formEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            _subject: subject, types: types().join(', '), name: $('#q-name').value.trim(),
            reply: $('#q-reply').value.trim(), message: what.value.trim(),
          }),
        });
        if (!res.ok) throw new Error(String(res.status));
        status.textContent = 'Inquiry sent. Thank you, I will reply soon.';
        form.reset();
        $$('#q-types input').forEach((c) => { c.checked = c.value === 'Automation development'; });
      } catch (e2) {
        status.textContent = 'Sending failed. Use "Copy Inquiry" or contact me directly using the details above.';
      }
      send.disabled = false;
      return;
    }
    if (site.contact.email) {
      const reply = $('#q-reply').value.trim();
      const cc = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(reply) ? `&cc=${encodeURIComponent(reply)}` : '';
      const href = `mailto:${site.contact.email}?subject=${encodeURIComponent(subject)}${cc}&body=${encodeURIComponent(compose())}`;
      status.textContent = 'Opening your email app with the inquiry filled in. Press send there to deliver it. If nothing opens, use Copy Inquiry.';
      window.location.href = href;
      return;
    }
    status.textContent = 'No contact email is configured yet. Use Copy Inquiry.';
  });

  $('#q-copy').addEventListener('click', async () => {
    if (invalid()) { status.textContent = ''; return; }
    const ok = await copyText(compose());
    status.textContent = ok
      ? 'Inquiry copied to your clipboard. Paste it into an email or message.'
      : 'Could not copy automatically. Select the text in the box and copy it manually.';
    toast(ok ? 'Inquiry copied.' : 'Copy failed.');
  });
}
