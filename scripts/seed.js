// Loads the club's real content. Re-running this replaces members, events and activities
// (join applications and admin accounts are left untouched).
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const db = require('../server/db');

const imgRoot = path.join(__dirname, '..', 'public', 'img');
const gallery = (slug, captions = {}, limit = Infinity) => {
  const dir = path.join(imgRoot, 'events', slug);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort()
    .slice(0, limit)
    .map((f) => ({ src: `/img/events/${slug}/${f}`, caption: captions[f] || '' }));
};

db.exec('DELETE FROM members; DELETE FROM events; DELETE FROM activities;');

/* ---------- leadership ---------- */
const members = [
  ['Elston Herold Pereira', 'President', 'elston-pereira'],
  ['Raynell Lewis', 'Vice President', 'raynell-lewis'],
  ['Chaitra RM', 'Secretary', 'chaitra-rm'],
  ['Nazmin Ziya', 'Treasurer', 'nazmin-ziya'],
  ['Jeslin Ninora', 'Joint Treasurer', 'jeslin-ninora'],
  ['Ruben Saldana', 'Operations Head', 'ruben-saldana'],
  ['Himansh Ullal', 'Design Head', 'himansh-ullal'],
  ['Shamitha KV', 'Cultural Head', 'shamitha-kv'],
  ['Parthipan J', 'Content Head', 'parthipan-j'],
];
const addM = db.prepare('INSERT INTO members (name,role,image,sort_order) VALUES (?,?,?,?)');
members.forEach(([n, r, img], i) => addM.run(n, r, `/img/team/${img}.jpg`, i));

/* ---------- events ---------- */
const addE = db.prepare(
  `INSERT INTO events (slug,title,category,event_date,venue,summary,body,gallery,featured) VALUES (?,?,?,?,?,?,?,?,?)`
);
const ev = (slug, title, category, date, venue, summary, body, captions = {}, limit = Infinity) =>
  addE.run(slug, title, category, date, venue, summary, JSON.stringify(body), JSON.stringify(gallery(slug, captions, limit)), 1);

// 1. Lumière — The Gala
ev('lumiere-the-gala', 'Lumière — The Gala', 'Branch Gala', '2025-10-29', 'Kalam Auditorium',
  'The CSE branch entry programme at Kalam Auditorium, themed "Where Glam Meets Glow." Organised by the Cipher Association with coordinated red, gold and black decor, it welcomed students into the department and reinforced a shared sense of collective identity.',
  [
    'The Department of Computer Science and Engineering (CSE) held its branch entry programme, “Lumière – The Gala,”  29 October 2025 at the Kalam Auditorium. Organised by the Cipher Association, the event welcomed students into the department through a formal gathering centred on the theme “Where Glam Meets Glow.” The venue featured coordinated red, gold and black décor, floral arrangements, illuminated panels and a central Lumière backdrop.',
    'The programme provided students with an opportunity to interact with peers and take part in a shared departmental event beyond academics. It also highlighted the role of the Cipher Association in organising student-led activities and encouraging participation within the CSE community.',
    'The event concluded as a formal branch entry that marked the students’ transition into the department and reinforced a sense of collective identity.'
  ]);

// 2. PROMPT OPS-2K26 (limited to 6 pictures)
ev('prompt-ops-2k26', 'PROMPT OPS-2K26', 'Competition', '2026-03-25', 'Dept. of CSE, SJEC',
  'A technical competition on prompt engineering and AI tools by the AgentBlazer Club and Cipher. Track 1 (1st Year) covered invitation, logo and image recreation; Track 2 (2nd Year) tested JSON conversion, Python debugging and a Gemini AI security prompt challenge.',
  [
    'Organized by the AgentBlazer Club and Cipher under the guidance of Ms. Nisha J Roche, Ms. Jaishma K, and HOD Dr. Melwyn D’Souza, this technical competition focused on prompt engineering and AI tools (mapped to PO4, PO5, PO8, PO11).',
    'Track 1 (1st Year) featured invitation generation, logo recreation, and image recreation rounds, with Chinmayee, Chris Royston Monteiro, and Deeksha Ravi Moger taking top honors.',
    'Track 2 (2nd Year) tested students in JSON conversion, Python code debugging, and a Gemini AI security prompt extraction challenge, with Harimurali KS, Venus Suhani D’Lima, and Venisha Snehal D’Souza securing top positions.'
  ], {
    '01.jpg': 'PROMPT OPS-2K26 — Organizers & Faculty',
    '02.jpg': 'PROMPT OPS-2K26 — Competition Lab',
    '03.jpg': 'PROMPT OPS-2K26 — Student Teams at Work',
    '04.jpg': 'PROMPT OPS-2K26 — Prompt Engineering Challenge',
    '05.jpg': 'PROMPT OPS-2K26 — Participants Collaboration'
  }, 5);

/* ---------- archive ---------- */
const acts = [
  'Applied Machine Learning', 'Industrial Visit', 'LaTeX Tool', 'Robotic Process Automation using UiPath',
  'HackTO Future 20', 'How to Win at the Sport of Programming', 'Introduction to Google Crowdsource',
  'Educational Session on GitHub', 'Industrial Visit', 'UDAAN Mock Interview', 'Freshers Onboarding Programme',
  'Projects Funded by KSCST', 'Generative AI Tools for Research', 'Introduction to Blockchain: Solidity Workshop',
  'Star UML', 'Generative AI: Custom Solutions using OpenAI', 'React.js and Node.js Workshop',
  'Master the Future: Hands-on GSoC & LLMs Workshop', 'Demystifying Generative Models', 'Cyber Security and Career Pathways',
  'Agentforce Workshop', 'AgentBlazer Club Inauguration', 'Agentforce Technical Session'
];
const addA = db.prepare('INSERT INTO activities (title,sort_order) VALUES (?,?)');
acts.forEach((t, i) => addA.run(t, i));

console.log(`Seeded ${members.length} members, ${db.prepare('SELECT COUNT(*) c FROM events').get().c} events, ${acts.length} activities.`);
