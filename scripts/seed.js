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
const ev = (slug, title, category, date, venue, summary, body, captions = {}, limit = Infinity, folder = slug) =>
  addE.run(slug, title, category, date, venue, summary, JSON.stringify(body), JSON.stringify(gallery(folder, captions, limit)), 1);

// 1. Agentforce Workshop (May 22, 2026)
ev('agentforce-workshop', 'Agentforce Workshop', 'Workshop', '2026-05-22', 'Dept. of CSE, SJEC',
  'A hands-on workshop with Salesforce on building AI agents and prompt-based workflow automation in Trailhead.',
  [
    'The AgentBlazer Club, in collaboration with Salesforce, organized a hands-on technical workshop focused on building AI agents and prompt-based workflow automation using the Salesforce Trailhead environment.',
    'Students gained practical experience in designing Sales Email Prompt Templates, Flex Prompt Templates, and configuring automated prompt flows to build reusable AI structures.',
    'Coordinated by faculty coordinator Ms. Nisha Roche and student coordinator Mr. Ruben Saldanha, the session concluded with an interactive discussion on industry applications of AI agents and career opportunities in the Salesforce ecosystem.'
  ]);

// 2. Cyber Security and Career Pathways (April 01, 2026)
ev('cybersecurity-career-pathways', 'Cyber Security and Career Pathways', 'Workshop', '2026-04-01', 'Room No. 3410, AB II, SJEC',
  'A hands-on session by Mr. Suhas Nayak (Ingersoll Rand) with live demos of Shodan, OSINT, Google Dorking and SQL Injection, plus career guidance.',
  [
    'Organized by the Department of CSE in association with the AgentBlazer Club, this hands-on workshop was delivered by Mr. Suhas Nayak (Tech Lead – SecOps, Ingersoll Rand) for 6th-semester students (mapped to PO6, PO7, PO9, PO11).',
    'The session provided practical exposure to core security concepts, live tool demonstrations including Shodan, OSINT techniques, Google Dorking, CVE management, SQL Injection, and the Cyber Kill Chain model.',
    'It concluded with actionable guidance on career roles such as Security Analyst, SOC Analyst, Ethical Hacker, and Cloud Security Engineer.'
  ], {
    '01.jpg': 'Cyber Security and Career Pathways — Session Poster',
    '02.jpg': 'Hands-on Security Demonstration',
    '03.jpg': 'Students in the Cybersecurity Lab',
    '04.jpg': 'Live OSINT & Threat Modeling Demo',
    '05.jpg': 'Interactive Q&A Session',
    '06.jpg': 'Felicitation of Resource Person'
  }, 6);

// 3. PROMPT OPS-2K26 (March 25, 2026)
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

// 4. Demystifying Generative Models (March 18, 2026)
ev('demystifying-generative-models', 'Demystifying Generative Models', 'Workshop', '2026-03-18', 'Dept. of CSE, SJEC',
  'A peer-learning workshop led by 6th-semester students on transformers, prompt engineering and today\'s leading AI tools.',
  [
    'Under the guidance of Ms. Nisha J. Roche, 6th-semester CSE students Prajwal Royston Corderio and Chacko P Abraham led a hands-on peer-learning workshop on Generative AI (mapped to PO4, PO6, PO7, PO11).',
    'The session detailed AI governance frameworks (LLM Council), transformer mechanisms, and prompt engineering, alongside comparisons of LLaMA, Groq, Mistral AI, ChatGPT, GitHub Copilot, and Perplexity.',
    'Students engaged in an AI quiz, a three-stage model evaluation challenge, and a feature-modification coding task before a valedictory session to end the program.'
  ]);

// 5. Master the Future: Hands-on GSoC & LLMs Workshop (February 14, 2026)
ev('master-the-future-gsoc-llms', 'Master the Future: Hands-on GSoC & LLMs Workshop', 'Workshop', '2026-02-14', 'Dept. of CSE, SJEC',
  'A hands-on session by Mr. Anas Khan (HackerRank) for about 55 participants on GitHub workflows, Google Summer of Code and the LLM ecosystem.',
  [
    'Organized by the Department of CSE in association with the AgentBlazer Club, this workshop was conducted by Mr. Anas Khan (Software Development Engineer at HackerRank) for approximately 55 participants.',
    'The hands-on session provided practical GitHub workflow training (forking, cloning, pull requests), guidance on Google Summer of Code (GSOC) participation, and an overview of the AI ecosystem. Key technical topics covered included LLM parameters (Temperature, Top-P, Max Tokens), prompt strategies, Retrieval Augmented Generation (RAG), function calling, Gemini AI, and development frameworks such as LangChain, LlamaIndex, CrewAI, Gradio, and Streamlit.',
    'The session opened with a welcome by Club VP Mr. Ajay D\'Souza and concluded with a token of appreciation presented by Faculty Coordinator Ms. Nisha J Roche, along with a vote of thanks by Student President Mr. Ruben Saldanha and support from HOD Dr. Melwyn D’Souza.'
  ], {
    '02.jpg': 'GSoC & LLMs Workshop — Presentation Session',
    '03.jpg': 'Hands-on Coding & Prompt Experiments',
    '04.jpg': 'Mr. Anas Khan Mentoring Students',
    '05.jpg': 'Participants Engaging in AI Frameworks',
    '06.jpg': 'Interactive Hands-on Lab Environment'
  }, 5, 'gsoc-llm-workshop');

// 6. Lumière — The Gala (October 29, 2025)
ev('lumiere-the-gala', 'Lumière — The Gala', 'Branch Gala', '2025-10-29', 'Kalam Auditorium',
  'The CSE branch entry programme, themed "Where Glam Meets Glow." Organised by the Cipher Association, it welcomed students into the department and reinforced a shared sense of collective identity.',
  [
    'The Department of Computer Science and Engineering (CSE) held its branch entry programme, “Lumière – The Gala,” 29 October 2025 at the Kalam Auditorium. Organised by the Cipher Association, the event welcomed students into the department through a formal gathering centred on the theme “Where Glam Meets Glow.” The venue featured coordinated red, gold and black décor, floral arrangements, illuminated panels and a central Lumière backdrop.',
    'The programme provided students with an opportunity to interact with peers and take part in a shared departmental event beyond academics. It also highlighted the role of the Cipher Association in organising student-led activities and encouraging participation within the CSE community.',
    'The event concluded as a formal branch entry that marked the students’ transition into the department and reinforced a sense of collective identity.'
  ]);

// 7. AgentBlazer Club Inauguration (August 28, 2025)
ev('agentblazer-club-inauguration', 'AgentBlazer Club Inauguration', 'Club Launch', '2025-08-28', 'Dept. of CSE, SJEC',
  'The department inaugurated the AgentBlazer Club to foster leadership, innovation and technical excellence, with Salesforce leaders as chief guests.',
  [
    'The Department of Computer Science & Engineering formally inaugurated the AgentBlazer Club to foster leadership, innovation, and technical excellence among students.',
    'Chief Guest Mr. Santosh Rebello (Salesforce) emphasized bridging the "role–radiance gap," while Guest of Honor Mr. Stephen Pinto (Salesforce & SJEC alumnus) encouraged continuous learning. Principal Dr. Rio D’Souza called on students to seize growth opportunities.',
    'The event, coordinated by Mr. Keith Fernandes and Ms. Nisha Roche, included a lamp-lighting ceremony, welcome address by HOD Dr. Melwyn D’Souza, felicitations, and a Vote of Thanks by Student President Mr. Reuben Saldanha.'
  ]);

// 8. Agentforce Technical Session (August 28, 2025)
ev('agentforce-technical-session', 'Agentforce Technical Session', 'Tech Talk', '2025-08-28', 'Dept. of CSE, SJEC',
  'Salesforce executives traced the shift from predictive to agentic AI and outlined career pathways in the Salesforce ecosystem.',
  [
    'Held alongside the club launch, Salesforce executives Mr. Santhosh Rebello and Mr. Stephen Pinto delivered an expert session on Agentforce and AI career opportunities (Ref: CSE/AB/2025-26/02).',
    'They traced AI evolution through Predictive, Copilot, and Agentic AI (autonomous systems using Salesforce Data Cloud), highlighted key career pathways in Salesforce Administration, Analytics, and Solution Development, and urged students to build adaptability within the Trailblazer ecosystem.'
  ]);

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
