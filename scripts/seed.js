require('dotenv').config();
const db = require('../server/db');

db.exec('DELETE FROM members; DELETE FROM events; DELETE FROM activities;');

const members = [
  ['Elston Herold Pereira', 'President'],
  ['Raynell Lewis', 'Vice President'],
  ['Nazmin Ziya', 'Treasurer'],
  ['Jeslin Ninora', 'Joint Treasurer'],
];
const addM = db.prepare('INSERT INTO members (name,role,sort_order) VALUES (?,?,?)');
members.forEach(([n, r], i) => addM.run(n, r, i));

const addE = db.prepare(
  `INSERT INTO events (slug,title,category,event_date,venue,summary,body,gallery) VALUES (?,?,?,?,?,?,?,?)`
);
addE.run(
  'lumiere-the-gala', 'Lumière — The Gala', 'Branch Gala', '2025-10-29', 'Kalam Auditorium',
  'The CSE branch entry programme at Kalam Auditorium, themed “Where Glam Meets Glow.” Organised by the Cipher Association with coordinated red, gold and black décor, it welcomed students into the department and reinforced a shared sense of collective identity.',
  JSON.stringify([
    'The Department of Computer Science and Engineering (CSE) held its branch entry programme, “Lumière – The Gala,” on 29 October 2025 at the Kalam Auditorium. Organised by the Cipher Association, the event welcomed students into the department through a formal gathering centred on the theme “Where Glam Meets Glow.”',
    'The programme gave students an opportunity to interact with peers and take part in a shared departmental event beyond academics, highlighting the role of the Cipher Association in organising student-led activities.',
  ]),
  '[]'
);
addE.run(
  'prompt-ops-2k26', 'PROMPT OPS-2K26', 'Competition', '2026-03-25', 'Prompt Engineering Competition',
  'A technical competition on prompt engineering and AI tools by the AgentBlazer Club and Cipher. Track 1 (1st Year) covered invitation, logo and image recreation; Track 2 (2nd Year) tested JSON conversion, Python debugging and a Gemini AI security prompt challenge.',
  JSON.stringify([
    'Organized by the AgentBlazer Club and Cipher under the guidance of Ms. Nisha J Roche, Ms. Jaishma K, and HOD Dr. Melwyn D’Souza, this technical competition focused on prompt engineering and AI tools.',
    'Track 1 (1st Year) featured invitation generation, logo recreation, and image recreation rounds. Track 2 (2nd Year) tested students in JSON conversion, Python code debugging, and a Gemini AI security prompt extraction challenge.',
  ]),
  '[]'
);

const acts = [
  'Applied Machine Learning', 'Industrial Visit', 'LaTeX Tool', 'Robotic Process Automation using UiPath',
  'HackTO Future 20', 'How to Win at the Sport of Programming', 'Introduction to Google Crowdsource',
  'Educational Session on GitHub', 'Industrial Visit', 'UDAAN Mock Interview', 'Freshers Onboarding Programme',
  'Projects Funded by KSCST', 'Generative AI Tools for Research', 'Introduction to Blockchain: Solidity Workshop',
  'Star UML', 'Generative AI: Custom Solutions using OpenAI', 'React.js and Node.js Workshop',
];
const addA = db.prepare('INSERT INTO activities (title,sort_order) VALUES (?,?)');
acts.forEach((t, i) => addA.run(t, i));

console.log('Seeded members, events, activities.');
