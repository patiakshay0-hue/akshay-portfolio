// Central configuration: contact details and external URLs.
//
// Leave a value as '' to hide the matching link everywhere on the site.
// Nothing here is invented: every field starts empty until you fill it in.
export const site = {
  name: 'Akshay Patil',
  wordmark: 'AP/',
  role: 'AI Automation Engineer & Software Developer',

  contact: {
    email: 'akshaypradippatil818@gmail.com',
    phone: '8454813220',
    github: '',     // e.g. 'https://github.com/your-handle'
    linkedin: '',   // e.g. 'https://www.linkedin.com/in/your-handle'
    resume: '',     // e.g. 'resume.pdf' (put the file in /public) or a full URL
  },

  // Optional. Paste a form-backend URL (for example a Formspree endpoint like
  // 'https://formspree.io/f/xxxxxxx') and inquiries are POSTed there and land in
  // your inbox without the visitor's mail app. Leave '' to use the email draft.
  formEndpoint: '',

  // Shown on the About section. Education is a secondary detail.
  education: 'Master of Computer Applications (MCA)',

  // File in /public used on the About section.
  portrait: {
    src: 'img/akshay.jpg',
    alt: 'Akshay Patil in profile, wearing aviator sunglasses and a striped shirt',
  },
};

/** Returns the contact entries that are configured, in display order. */
export function configuredLinks() {
  const c = site.contact;
  const out = [];
  if (c.email) out.push({ id: 'email', label: 'Email', href: `mailto:${c.email}`, text: c.email });
  if (c.phone) out.push({ id: 'phone', label: 'Phone', href: `tel:${c.phone}`, text: c.phone });
  if (c.github) out.push({ id: 'github', label: 'GitHub', href: c.github, text: c.github.replace(/^https?:\/\//, '') });
  if (c.linkedin) out.push({ id: 'linkedin', label: 'LinkedIn', href: c.linkedin, text: c.linkedin.replace(/^https?:\/\//, '') });
  if (c.resume) out.push({ id: 'resume', label: 'Résumé', href: c.resume, text: 'Download résumé' });
  return out;
}
