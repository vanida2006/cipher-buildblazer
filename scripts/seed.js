// Loads the club's real content. Re-running this replaces members, events and activities
// (join applications and admin accounts are left untouched).
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');

const imgRoot = path.join(__dirname, '..', 'public', 'img');
const gallery = (slug, captions = {}) => {
  const dir = path.join(imgRoot, 'events', slug);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort()
    .map((f) => ({ src: `/img/events/${slug}/${f}`, caption: captions[f] || '' }));
};

function seed(database) {
  const db = database || require('../server/db');
  db.exec('DELETE FROM team_members; DELETE FROM events; DELETE FROM activities;');

  /* ---------- leadership ---------- */
  // Roles for the last five are not in the material provided — set them in /admin/ (Leadership tab).
  const members = [
    ['Elston Herold Pereira', 'President', 'elston-pereira'],
    ['Raynell Lewis', 'Vice President', 'raynell-lewis'],
    ['Nazmin Ziya', 'Treasurer', 'nazmin-ziya'],
    ['Jeslin Ninora', 'Joint Treasurer', 'jeslin-ninora'],
    ['Ruben Saldanha', 'Member', 'ruben-saldana'],
    ['Himansh Ullal', 'Member', 'himansh-ullal'],
    ['Parthipan J', 'Member', 'parthipan-j'],
    ['Chaitra RM', 'Member', 'chaitra-rm'],
    ['Shamitha KV', 'Member', 'shamitha-kv'],
  ];
  const addM = db.prepare('INSERT INTO team_members (name,role,image,sort_order) VALUES (?,?,?,?)');
  members.forEach(([n, r, img], i) => addM.run(n, r, `/img/team/${img}.jpg`, i));

  /* ---------- events (from the Cipher and AgentBlazer annual reports) ---------- */
  const addE = db.prepare(
    `INSERT INTO events (slug,title,category,event_date,venue,summary,body,gallery) VALUES (?,?,?,?,?,?,?,?)`
  );
  const ev = (slug, title, category, date, venue, summary, body, captions) =>
    addE.run(slug, title, category, date, venue, summary, JSON.stringify(body), JSON.stringify(gallery(slug, captions)));

  ev('lumiere-the-gala', 'Lumière — The Gala', 'Branch Gala', '2025-10-29', 'Kalam Auditorium',
    'The CSE branch entry programme, themed “Where Glam Meets Glow.” Organised by the Cipher Association, it welcomed students into the department and reinforced a shared sense of collective identity.',
    [
      'The Department of Computer Science and Engineering (CSE) held its branch entry programme, “Lumière – The Gala,” on 29 October 2025 at the Kalam Auditorium. Organised by the Cipher Association, the event welcomed students into the department through a formal gathering centred on the theme “Where Glam Meets Glow.” The venue featured coordinated red, gold and black décor, floral arrangements, illuminated panels and a central Lumière backdrop.',
      'The programme gave students an opportunity to interact with peers and take part in a shared departmental event beyond academics, highlighting the role of the Cipher Association in organising student-led activities and encouraging participation within the CSE community.',
      'It concluded as a formal branch entry that marked the students’ transition into the department and reinforced a sense of collective identity.',
    ]);

  ev('agentblazer-club-inauguration', 'AgentBlazer Club Inauguration', 'Club Launch', '2025-08-28', null,
    'The department inaugurated the AgentBlazer Club to foster leadership, innovation and technical excellence, with Salesforce leaders as chief guests.',
    [
      'The Department of Computer Science & Engineering formally inaugurated the AgentBlazer Club on 28 August 2025 to foster leadership, innovation and technical excellence among students. Chief Guest Mr. Santosh Rebello (Salesforce) spoke about bridging the “role–radiance gap”, while Guest of Honor Mr. Stephen Pinto (Salesforce and SJEC alumnus) encouraged continuous learning. Principal Dr. Rio D’Souza called on students to seize growth opportunities.',
      'The event, coordinated by Mr. Keith Fernandes and Ms. Nisha Roche, included a lamp-lighting ceremony, a welcome address by HOD Dr. Melwyn D’Souza, felicitations, and a vote of thanks by Student President Mr. Reuben Saldanha.',
    ]);

  ev('agentforce-technical-session', 'Agentforce Technical Session', 'Tech Talk', '2025-08-28', null,
    'Salesforce executives traced the shift from predictive to agentic AI and outlined career pathways in the Salesforce ecosystem.',
    [
      'Held alongside the club launch, Salesforce executives Mr. Santhosh Rebello and Mr. Stephen Pinto delivered an expert session on Agentforce and AI career opportunities. They traced the evolution of AI through Predictive, Copilot and Agentic AI, including autonomous systems built on Salesforce Data Cloud.',
      'The session highlighted career pathways in Salesforce Administration, Analytics and Solution Development, and urged students to build adaptability within the Trailblazer ecosystem.',
    ]);

  ev('gsoc-llm-workshop', 'Master the Future: Hands-on GSoC & LLMs Workshop', 'Workshop', '2026-02-14', null,
    'A hands-on session by Mr. Anas Khan (HackerRank) for about 55 participants on GitHub workflows, Google Summer of Code and the LLM ecosystem.',
    [
      'Organised by the Department of CSE with the AgentBlazer Club, this workshop was conducted by Mr. Anas Khan (Software Development Engineer at HackerRank) for approximately 55 participants. It gave practical GitHub workflow training (forking, cloning, pull requests), guidance on taking part in Google Summer of Code, and an overview of the AI ecosystem.',
      'Technical topics included LLM parameters (Temperature, Top-P, Max Tokens), prompt strategies, Retrieval Augmented Generation (RAG), function calling, Gemini AI, and frameworks such as LangChain, LlamaIndex, CrewAI, Gradio and Streamlit.',
      'The session opened with a welcome by Club VP Mr. Ajay D’Souza and closed with a token of appreciation from Faculty Coordinator Ms. Nisha J Roche, and a vote of thanks by Student President Mr. Ruben Saldanha, with support from HOD Dr. Melwyn D’Souza.',
    ], { '99-poster.jpg': 'Event poster' });

  ev('demystifying-generative-models', 'Demystifying Generative Models', 'Workshop', '2026-03-18', null,
    'A peer-learning workshop led by 6th-semester students on transformers, prompt engineering and today’s leading AI tools.',
    [
      'Under the guidance of Ms. Nisha J. Roche, 6th-semester CSE students Prajwal Royston Corderio and Chacko P Abraham led a hands-on peer-learning workshop on Generative AI (mapped to PO4, PO6, PO7, PO11). The session covered AI governance frameworks (LLM Council), transformer mechanisms and prompt engineering, with comparisons of LLaMA, Groq, Mistral AI, ChatGPT, GitHub Copilot and Perplexity.',
      'Students took part in an AI quiz, a three-stage model evaluation challenge and a feature-modification coding task before a valedictory session closed the programme.',
    ]);

  ev('prompt-ops-2k26', 'PROMPT OPS-2K26', 'Competition', '2026-03-25', 'Prompt Engineering Competition',
    'A technical competition on prompt engineering and AI tools by the AgentBlazer Club and Cipher. Track 1 (1st Year) covered invitation, logo and image recreation; Track 2 (2nd Year) tested JSON conversion, Python debugging and a Gemini AI security prompt challenge.',
    [
      'Organized by the AgentBlazer Club and Cipher under the guidance of Ms. Nisha J Roche, Ms. Jaishma K, and HOD Dr. Melwyn D’Souza, this technical competition focused on prompt engineering and AI tools (mapped to PO4, PO5, PO8, PO11).',
      'Track 1 (1st Year) featured invitation generation, logo recreation and image recreation rounds, with Chinmayee, Chris Royston Monteiro and Deeksha Ravi Moger taking top honors.',
      'Track 2 (2nd Year) tested students in JSON conversion, Python code debugging and a Gemini AI security prompt extraction challenge, with Harimurali KS, Venus Suhani D’Lima and Venisha Snehal D’Souza securing top positions.',
    ]);

  ev('cybersecurity-career-pathways', 'Cyber Security and Career Pathways', 'Workshop', '2026-04-01', null,
    'A hands-on session by Mr. Suhas Nayak (Ingersoll Rand) with live demos of Shodan, OSINT, Google Dorking and SQL injection, plus career guidance.',
    [
      'Organised by the Department of CSE with the AgentBlazer Club, this hands-on workshop was delivered by Mr. Suhas Nayak (Tech Lead – SecOps, Ingersoll Rand) for 6th-semester students (mapped to PO6, PO7, PO9, PO11).',
      'It gave practical exposure to core security concepts, with live demonstrations of Shodan, OSINT techniques, Google Dorking, CVE management, SQL Injection and the Cyber Kill Chain model.',
      'The session concluded with guidance on careers such as Security Analyst, SOC Analyst, Ethical Hacker and Cloud Security Engineer.',
    ]);

  ev('agentforce-workshop', 'Agentforce Workshop', 'Workshop', '2026-05-22', null,
    'A hands-on workshop with Salesforce on building AI agents and prompt-based workflow automation in Trailhead.',
    [
      'The AgentBlazer Club, in collaboration with Salesforce, organised a hands-on workshop on building AI agents and prompt-based workflow automation in the Salesforce Trailhead environment. Students designed Sales Email Prompt Templates and Flex Prompt Templates, and configured automated prompt flows to build reusable AI structures.',
      'Coordinated by faculty coordinator Ms. Nisha Roche and student coordinator Mr. Ruben Saldanha, the session ended with an interactive discussion on industry applications of AI agents and career opportunities in the Salesforce ecosystem.',
    ]);

  /* ---------- archive ---------- */
  const acts = [
    'Applied Machine Learning', 'Industrial Visit', 'LaTeX Tool', 'Robotic Process Automation using UiPath',
    'HackTO Future 20', 'How to Win at the Sport of Programming', 'Introduction to Google Crowdsource',
    'Educational Session on GitHub', 'Industrial Visit', 'UDAAN Mock Interview', 'Freshers Onboarding Programme',
    'Projects Funded by KSCST', 'Generative AI Tools for Research', 'Introduction to Blockchain: Solidity Workshop',
    'Star UML', 'Generative AI: Custom Solutions using OpenAI', 'React.js and Node.js Workshop',
  ];
  const addA = db.prepare('INSERT INTO activities (title,sort_order) VALUES (?,?)');
  acts.forEach((t, i) => addA.run(t, i));

  console.log(`Seeded ${members.length} members, ${db.prepare('SELECT COUNT(*) c FROM events').get().c} events, ${acts.length} activities.`);
}

if (require.main === module) {
  seed();
}

module.exports = { seed };
