import { useCallback, useEffect, useMemo, useState } from 'react';

import './index.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const navItems = [

  { id: 'dashboard', label: 'Dashboard', icon: '⌂' },

  { id: 'exams', label: 'Explore Exams', icon: '▦' },

  { id: 'tests', label: 'Mock Tests', icon: '✓' },

  { id: 'planner', label: 'Study Planner', icon: '▤' },
  { id: 'syllabus', label: 'Syllabus Tracker', icon: '📚' },

  { id: 'performance', label: 'Performance', icon: '↗' },

  { id: 'mistakes', label: 'Mistake DNA', icon: '◈' },

  { id: 'mentor', label: 'AI Mentor', icon: '✧' },

  { id: 'admin', label: 'Question Bank Admin', icon: '⚙' },

];

const examGroups = [

  {

    category: 'Government', icon: '🏛️', exams: [

      { name: 'UPSC CSE', desc: 'Civil Services Prelims and Mains', subjects: 'GS · CSAT · Optional' },

      { name: 'State PCS', desc: 'State civil services preparation', subjects: 'GS · State GK · CSAT' },

      { name: 'SSC CGL', desc: 'Graduate-level recruitment', subjects: 'Maths · Reasoning · English · GK' },

      { name: 'SSC CHSL', desc: 'Higher secondary recruitment', subjects: 'Maths · Reasoning · English · GK' },

      { name: 'Railway RRB', desc: 'Railway recruitment examinations', subjects: 'Maths · Reasoning · Science · GK' },

      { name: 'Defence Exams', desc: 'NDA and CDS preparation', subjects: 'Maths · English · General ability' },

      { name: 'Teaching Exams', desc: 'CTET and state TET', subjects: 'Pedagogy · Languages · Subject knowledge' },

    ]

  },

  {

    category: 'Engineering', icon: '⚙️', exams: [

      { name: 'JEE Main', desc: 'NITs, IIITs and engineering colleges', subjects: 'Physics · Chemistry · Maths' },

      { name: 'JEE Advanced', desc: 'IIT entrance preparation', subjects: 'Physics · Chemistry · Maths' },

      { name: 'GATE', desc: 'Postgraduate engineering entrance', subjects: 'Technical subjects · Aptitude' },

    ]

  },

  {

    category: 'Medical', icon: '🩺', exams: [

      { name: 'NEET-UG', desc: 'Medical and dental entrance preparation', subjects: 'Physics · Chemistry · Biology' },

      { name: 'AIIMS Nursing', desc: 'Nursing entrance preparation', subjects: 'Science · General aptitude' },

    ]

  },

  {

    category: 'School & Boards', icon: '📚', exams: [

      { name: 'CBSE Class 10', desc: 'Board exams and chapter practice', subjects: 'All major subjects' },

      { name: 'CBSE Class 12', desc: 'Board preparation and sample papers', subjects: 'Science · Commerce · Humanities' },

      { name: 'ICSE / ISC', desc: 'ICSE and ISC exam preparation', subjects: 'Board-specific subjects' },

    ]

  },

  {

    category: 'Management', icon: '📈', exams: [

      { name: 'CAT', desc: 'MBA entrance preparation', subjects: 'VARC · DILR · Quantitative Aptitude' },

      { name: 'CUET-UG', desc: 'University admission preparation', subjects: 'Domain subjects · Languages · GAT' },

      { name: 'CLAT', desc: 'Law entrance preparation', subjects: 'English · Legal · Logical · GK · Quant' },

    ]

  },

  {

    category: 'Banking', icon: '🏦', exams: [

      { name: 'IBPS PO', desc: 'Bank probationary officer exams', subjects: 'Reasoning · Quant · English · Banking' },

      { name: 'IBPS Clerk', desc: 'Bank clerical recruitment', subjects: 'Reasoning · Quant · English · Awareness' },

      { name: 'SBI PO', desc: 'State Bank officer recruitment', subjects: 'Reasoning · Quant · English · Banking' },

      { name: 'RBI Grade B', desc: 'Central bank officer examination', subjects: 'Finance · Economics · Management · English' },

    ]

  },

];

const allExams = examGroups.flatMap(group => group.exams.map(exam => ({ ...exam, category: group.category, icon: group.icon })));

// Exam-specific structure used by Mock Tests and Question Bank Admin.

// Keep labels consistent with the metadata saved in MongoDB for questions to match.

const examBlueprints = {

  'UPSC CSE': {

    stages: ['Prelims', 'Mains'],

    subjects: {

      Prelims: ['General Studies Paper I', 'CSAT (Paper II)'],

      Mains: ['Essay', 'GS Paper I', 'GS Paper II', 'GS Paper III', 'GS Paper IV', 'Optional Paper I', 'Optional Paper II', 'English Qualifying', 'Indian Language Qualifying']

    },

    topics: {

      'General Studies Paper I': ['History', 'Ancient India', 'Medieval India', 'Modern India', 'Art and Culture', 'Geography', 'Indian Geography', 'World Geography', 'Indian Polity', 'Constitution', 'Fundamental Rights', 'Parliament', 'Judiciary', 'Governance', 'Indian Economy', 'Budget', 'Environment and Ecology', 'Biodiversity', 'Climate Change', 'Science and Technology', 'Current Affairs'],

      'CSAT (Paper II)': ['Comprehension', 'Logical Reasoning', 'Analytical Ability', 'Basic Numeracy', 'Data Interpretation', 'Decision Making'],

      'Essay': ['Society', 'Governance', 'Economy', 'Science and Technology', 'Environment', 'Ethics'],

      'GS Paper I': ['Indian Heritage and Culture', 'Modern Indian History', 'World History', 'Indian Society', 'Geography'],

      'GS Paper II': ['Constitution', 'Polity', 'Governance', 'Social Justice', 'International Relations'],

      'GS Paper III': ['Economy', 'Agriculture', 'Science and Technology', 'Environment', 'Disaster Management', 'Internal Security'],

      'GS Paper IV': ['Ethics', 'Integrity', 'Aptitude', 'Case Studies']

    }

  },

  'State PCS': { stages: ['Prelims', 'Mains', 'Interview'], subjects: { Prelims: ['General Studies', 'State GK', 'CSAT'], Mains: ['General Hindi', 'Essay', 'GS Paper I', 'GS Paper II', 'GS Paper III', 'GS Paper IV', 'State-Specific Studies'], Interview: ['Personality Test'] }, topics: { 'General Studies': ['History', 'Geography', 'Polity', 'Economy', 'Environment', 'Science', 'Current Affairs'], 'State GK': ['State History', 'State Geography', 'State Polity', 'State Economy', 'Culture', 'Schemes'], CSAT: ['Comprehension', 'Reasoning', 'Numeracy', 'Data Interpretation'] } },

  'SSC CGL': { stages: ['Tier I', 'Tier II'], subjects: { 'Tier I': ['General Intelligence and Reasoning', 'Quantitative Aptitude', 'English Comprehension', 'General Awareness'], 'Tier II': ['Mathematical Abilities', 'Reasoning and General Intelligence', 'English Language and Comprehension', 'General Awareness', 'Computer Knowledge', 'Data Entry Speed Test'] }, topics: { 'General Intelligence and Reasoning': ['Analogy', 'Classification', 'Series', 'Coding-Decoding', 'Syllogism', 'Puzzles', 'Direction Sense'], 'Quantitative Aptitude': ['Percentage', 'Ratio and Proportion', 'Profit and Loss', 'Time and Work', 'Speed Time Distance', 'Algebra', 'Geometry', 'Mensuration', 'Data Interpretation'], 'English Comprehension': ['Grammar', 'Vocabulary', 'Synonyms and Antonyms', 'Reading Comprehension'], 'General Awareness': ['History', 'Geography', 'Polity', 'Economy', 'Science', 'Current Affairs'] } },

  'SSC CHSL': { stages: ['Tier I', 'Tier II'], subjects: { 'Tier I': ['English Language', 'General Intelligence', 'Quantitative Aptitude', 'General Awareness'], 'Tier II': ['Mathematical Abilities', 'Reasoning', 'English Language', 'General Awareness', 'Computer Knowledge'] }, topics: { 'Quantitative Aptitude': ['Percentage', 'Ratio', 'Profit and Loss', 'Average', 'Time and Work', 'Geometry', 'Mensuration'], 'General Intelligence': ['Analogy', 'Series', 'Coding-Decoding', 'Puzzles', 'Direction Sense'], 'English Language': ['Grammar', 'Vocabulary', 'Comprehension'], 'General Awareness': ['History', 'Geography', 'Polity', 'Science', 'Current Affairs'] } },

  'Railway RRB': { stages: ['CBT 1', 'CBT 2'], subjects: { 'CBT 1': ['Mathematics', 'General Intelligence and Reasoning', 'General Awareness', 'General Science'], 'CBT 2': ['Mathematics', 'Reasoning', 'General Awareness', 'General Science'] }, topics: { Mathematics: ['Number System', 'Percentage', 'Ratio', 'Profit and Loss', 'Time and Work', 'Geometry'], 'General Intelligence and Reasoning': ['Analogy', 'Series', 'Coding-Decoding', 'Syllogism', 'Puzzles'], 'General Awareness': ['History', 'Geography', 'Polity', 'Economy', 'Current Affairs'], 'General Science': ['Physics', 'Chemistry', 'Biology'] } },

  'Defence Exams': { stages: ['NDA - Mathematics', 'NDA - GAT', 'CDS - English', 'CDS - General Knowledge', 'CDS - Elementary Mathematics'], subjects: { 'NDA - Mathematics': ['Mathematics'], 'NDA - GAT': ['English', 'Physics', 'Chemistry', 'General Science', 'History', 'Geography', 'Current Affairs'], 'CDS - English': ['English'], 'CDS - General Knowledge': ['General Knowledge'], 'CDS - Elementary Mathematics': ['Mathematics'] }, topics: { Mathematics: ['Algebra', 'Trigonometry', 'Geometry', 'Calculus', 'Statistics'], English: ['Grammar', 'Vocabulary', 'Comprehension'], 'General Knowledge': ['History', 'Geography', 'Polity', 'Science', 'Current Affairs'] } },

  'Teaching Exams': { stages: ['CTET Paper I', 'CTET Paper II', 'State TET'], subjects: { 'CTET Paper I': ['Child Development and Pedagogy', 'Language I', 'Language II', 'Mathematics', 'Environmental Studies'], 'CTET Paper II': ['Child Development and Pedagogy', 'Language I', 'Language II', 'Mathematics and Science', 'Social Studies'], 'State TET': ['Pedagogy', 'Language', 'Subject Knowledge'] }, topics: { 'Child Development and Pedagogy': ['Child Development', 'Inclusive Education', 'Learning and Pedagogy'], Mathematics: ['Number System', 'Geometry', 'Measurement'], 'Environmental Studies': ['Family', 'Food', 'Water', 'Environment'] } },

  'GATE': { stages: ['Computer Science', 'Mechanical Engineering', 'Electrical Engineering', 'Civil Engineering', 'Electronics and Communication', 'Data Science and AI'], subjects: { 'Computer Science': ['Computer Science', 'Engineering Mathematics', 'General Aptitude', 'Digital Logic', 'Computer Organization', 'Programming and Data Structures', 'Algorithms', 'Operating Systems', 'DBMS', 'Computer Networks', 'Theory of Computation', 'Compiler Design'], 'Mechanical Engineering': ['Engineering Mathematics', 'General Aptitude', 'Engineering Mechanics', 'Strength of Materials', 'Thermodynamics', 'Fluid Mechanics', 'Manufacturing'], 'Electrical Engineering': ['Engineering Mathematics', 'General Aptitude', 'Electric Circuits', 'Electromagnetic Fields', 'Electrical Machines', 'Power Systems', 'Control Systems'], 'Civil Engineering': ['Engineering Mathematics', 'General Aptitude', 'Engineering Mechanics', 'Structural Engineering', 'Geotechnical Engineering', 'Environmental Engineering', 'Transportation Engineering'], 'Electronics and Communication': ['Engineering Mathematics', 'General Aptitude', 'Networks', 'Electronic Devices', 'Analog Circuits', 'Digital Circuits', 'Signals and Systems', 'Communication Systems'], 'Data Science and AI': ['Engineering Mathematics', 'General Aptitude', 'Probability and Statistics', 'Linear Algebra', 'Programming', 'Data Structures and Algorithms', 'Machine Learning', 'Artificial Intelligence', 'DBMS'] }, topics: { 'Computer Science': ['Data Structures', 'Programming', 'Algorithms', 'C Programming', 'Trees', 'Graphs', 'Stacks and Queues', 'Sorting', 'Searching'], 'Programming and Data Structures': ['C Programming', 'Recursion', 'Arrays', 'Linked Lists', 'Stacks', 'Queues', 'Trees', 'Graphs', 'Hashing'], Algorithms: ['Time Complexity', 'Sorting', 'Searching', 'Greedy Algorithms', 'Dynamic Programming', 'Graph Algorithms'], 'Operating Systems': ['Processes and Threads', 'CPU Scheduling', 'Deadlocks', 'Memory Management', 'Virtual Memory', 'File Systems'], DBMS: ['ER Model', 'Relational Algebra', 'SQL', 'Normalization', 'Transactions', 'Indexing'], 'Computer Networks': ['OSI Model', 'TCP/IP', 'Routing', 'Congestion Control', 'Application Layer'], 'Digital Logic': ['Boolean Algebra', 'Combinational Circuits', 'Sequential Circuits', 'Number Systems'], 'Computer Organization': ['Instruction Pipelining', 'Cache Memory', 'Addressing Modes', 'CPU Architecture'], 'Engineering Mathematics': ['Linear Algebra', 'Calculus', 'Probability', 'Statistics', 'Discrete Mathematics'], 'General Aptitude': ['Quantitative Aptitude', 'Verbal Aptitude', 'Logical Reasoning'] } },

  'JEE Main': { stages: ['Paper 1 (B.E./B.Tech)', 'Paper 2A (B.Arch)', 'Paper 2B (B.Planning)'], subjects: { 'Paper 1 (B.E./B.Tech)': ['Physics', 'Chemistry', 'Mathematics'], 'Paper 2A (B.Arch)': ['Mathematics', 'Aptitude Test', 'Drawing'], 'Paper 2B (B.Planning)': ['Mathematics', 'Aptitude Test', 'Planning'] }, topics: { Physics: ['Mechanics', 'Thermodynamics', 'Electrostatics', 'Current Electricity', 'Optics', 'Modern Physics'], Chemistry: ['Physical Chemistry', 'Organic Chemistry', 'Inorganic Chemistry', 'Chemical Bonding', 'Equilibrium', 'Coordination Compounds'], Mathematics: ['Algebra', 'Trigonometry', 'Coordinate Geometry', 'Calculus', 'Vectors and 3D Geometry', 'Probability'] } },

  'JEE Advanced': { stages: ['Paper 1', 'Paper 2'], subjects: { 'Paper 1': ['Physics', 'Chemistry', 'Mathematics'], 'Paper 2': ['Physics', 'Chemistry', 'Mathematics'] }, topics: { Physics: ['Mechanics', 'Electrodynamics', 'Thermal Physics', 'Optics', 'Modern Physics'], Chemistry: ['Physical Chemistry', 'Organic Chemistry', 'Inorganic Chemistry'], Mathematics: ['Algebra', 'Coordinate Geometry', 'Calculus', 'Vectors', 'Probability'] } },

  'NEET-UG': { stages: ['NEET-UG'], subjects: { 'NEET-UG': ['Physics', 'Chemistry', 'Botany', 'Zoology', 'Biology'] }, topics: { Physics: ['Mechanics', 'Thermodynamics', 'Electrostatics', 'Optics', 'Modern Physics'], Chemistry: ['Physical Chemistry', 'Organic Chemistry', 'Inorganic Chemistry'], Botany: ['Plant Physiology', 'Genetics', 'Ecology', 'Plant Diversity'], Zoology: ['Human Physiology', 'Human Reproduction', 'Evolution', 'Animal Diversity'], Biology: ['Botany', 'Zoology', 'Genetics', 'Ecology'] } },

  'IBPS PO': { stages: ['Prelims', 'Mains'], subjects: { Prelims: ['English Language', 'Quantitative Aptitude', 'Reasoning Ability'], Mains: ['Reasoning and Computer Aptitude', 'Data Analysis and Interpretation', 'English Language', 'General/Economy/Banking Awareness'] }, topics: { 'English Language': ['Reading Comprehension', 'Cloze Test', 'Error Detection', 'Vocabulary'], 'Quantitative Aptitude': ['Simplification', 'Percentage', 'Ratio', 'Profit and Loss', 'Data Interpretation'], 'Reasoning Ability': ['Puzzles', 'Seating Arrangement', 'Syllogism', 'Coding-Decoding'], 'General/Economy/Banking Awareness': ['Banking Awareness', 'Economy', 'Current Affairs'] } },

  'IBPS Clerk': { stages: ['Prelims', 'Mains'], subjects: { Prelims: ['English Language', 'Numerical Ability', 'Reasoning Ability'], Mains: ['General/Financial Awareness', 'General English', 'Reasoning Ability', 'Quantitative Aptitude', 'Computer Aptitude'] }, topics: { 'Numerical Ability': ['Number System', 'Percentage', 'Ratio', 'Profit and Loss', 'Data Interpretation'], 'Reasoning Ability': ['Puzzles', 'Syllogism', 'Series', 'Coding-Decoding'], 'General/Financial Awareness': ['Banking Awareness', 'Financial Awareness', 'Current Affairs'] } },

  'SBI PO': { stages: ['Prelims', 'Mains', 'Psychometric Test and Interview'], subjects: { Prelims: ['English Language', 'Quantitative Aptitude', 'Reasoning Ability'], Mains: ['Reasoning and Computer Aptitude', 'Data Analysis and Interpretation', 'English Language', 'General/Economy/Banking Awareness'], 'Psychometric Test and Interview': ['Psychometric Assessment', 'Interview'] }, topics: { 'English Language': ['Reading Comprehension', 'Cloze Test', 'Grammar'], 'Quantitative Aptitude': ['Percentage', 'Ratio', 'Profit and Loss', 'Data Interpretation'], 'Reasoning Ability': ['Puzzles', 'Syllogism', 'Coding-Decoding'], 'General/Economy/Banking Awareness': ['Banking Awareness', 'Economy', 'Current Affairs'] } },

  'RBI Grade B': { stages: ['Phase I', 'Phase II', 'Interview'], subjects: { 'Phase I': ['General Awareness', 'Reasoning', 'Quantitative Aptitude', 'English'], 'Phase II': ['Economic and Social Issues', 'Finance and Management', 'English Writing Skills'], Interview: ['Interview'] }, topics: { 'General Awareness': ['Current Affairs', 'Banking Awareness', 'Economy'], 'Economic and Social Issues': ['Growth and Development', 'Poverty', 'Sustainable Development', 'Indian Economy'], 'Finance and Management': ['Financial Markets', 'Risk Management', 'Management', 'Corporate Governance'] } },

  'CAT': { stages: ['VARC', 'DILR', 'Quantitative Aptitude'], subjects: { VARC: ['Verbal Ability', 'Reading Comprehension'], DILR: ['Data Interpretation', 'Logical Reasoning'], 'Quantitative Aptitude': ['Arithmetic', 'Algebra', 'Geometry', 'Number System'] }, topics: { 'Verbal Ability': ['Para Jumbles', 'Para Summary', 'Odd Sentence'], 'Reading Comprehension': ['Main Idea', 'Inference', 'Tone'], 'Data Interpretation': ['Tables', 'Charts', 'Caselets'], 'Logical Reasoning': ['Arrangements', 'Games and Tournaments'], Arithmetic: ['Percentage', 'Ratio', 'Profit and Loss', 'Time and Work'], Algebra: ['Equations', 'Functions', 'Inequalities'] } },

  'CUET-UG': { stages: ['Language', 'Domain Subjects', 'General Test'], subjects: { Language: ['English', 'Hindi', 'Other Languages'], 'Domain Subjects': ['Accountancy', 'Business Studies', 'Economics', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'History', 'Political Science', 'Geography'], 'General Test': ['General Knowledge', 'Current Affairs', 'Numerical Ability', 'Reasoning'] }, topics: { English: ['Comprehension', 'Vocabulary', 'Grammar'], Economics: ['Microeconomics', 'Macroeconomics', 'Indian Economy'], Physics: ['Mechanics', 'Electricity', 'Optics'], Mathematics: ['Algebra', 'Calculus', 'Probability'] } },

  'CLAT': { stages: ['UG'], subjects: { UG: ['English Language', 'Current Affairs including GK', 'Legal Reasoning', 'Logical Reasoning', 'Quantitative Techniques'] }, topics: { 'English Language': ['Comprehension', 'Vocabulary', 'Grammar'], 'Current Affairs including GK': ['National Affairs', 'International Affairs', 'Legal Current Affairs'], 'Legal Reasoning': ['Legal Principles', 'Constitutional Law', 'Torts', 'Contracts'], 'Logical Reasoning': ['Arguments', 'Assumptions', 'Inference'], 'Quantitative Techniques': ['Arithmetic', 'Ratios', 'Percentages', 'Data Interpretation'] } },

  'AIIMS Nursing': { stages: ['B.Sc. Nursing Entrance'], subjects: { 'B.Sc. Nursing Entrance': ['Physics', 'Chemistry', 'Biology', 'General Knowledge', 'Aptitude'] }, topics: { Physics: ['Mechanics', 'Electricity', 'Optics'], Chemistry: ['Organic Chemistry', 'Inorganic Chemistry'], Biology: ['Human Physiology', 'Genetics', 'Ecology'] } },

  'CBSE Class 10': { stages: ['Class 10 Board'], subjects: { 'Class 10 Board': ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi'] }, topics: { Mathematics: ['Real Numbers', 'Polynomials', 'Linear Equations', 'Quadratic Equations', 'Triangles', 'Statistics'], Science: ['Chemical Reactions', 'Life Processes', 'Electricity', 'Light', 'Environment'], 'Social Science': ['History', 'Geography', 'Political Science', 'Economics'] } },

  'CBSE Class 12': { stages: ['Class 12 Board'], subjects: { 'Class 12 Board': ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Accountancy', 'Business Studies', 'Economics', 'English'] }, topics: { Physics: ['Electrostatics', 'Current Electricity', 'Magnetism', 'Optics'], Chemistry: ['Solutions', 'Electrochemistry', 'Chemical Kinetics', 'Organic Chemistry'], Mathematics: ['Relations and Functions', 'Calculus', 'Vectors', 'Probability'], Biology: ['Genetics', 'Biotechnology', 'Ecology'] } },

  'ICSE / ISC': { stages: ['ICSE Class 10', 'ISC Class 11', 'ISC Class 12'], subjects: { 'ICSE Class 10': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'History and Civics', 'Geography', 'English'], 'ISC Class 11': ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Commerce', 'Humanities'], 'ISC Class 12': ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Commerce', 'Humanities'] }, topics: { Mathematics: ['Algebra', 'Geometry', 'Trigonometry', 'Calculus'], Physics: ['Mechanics', 'Electricity', 'Optics'], Chemistry: ['Organic Chemistry', 'Inorganic Chemistry'] } }

};

function getStages(exam) {

  return examBlueprints[exam]?.stages || ['General'];

}

function getSubjects(exam, stage) {

  const blueprint = examBlueprints[exam];

  if (!blueprint) return ['General Studies', 'Quantitative Aptitude', 'Reasoning', 'English', 'General Awareness'];

  if (!stage) return [...new Set(Object.values(blueprint.subjects).flat())];

  return blueprint.subjects[stage] || [...new Set(Object.values(blueprint.subjects).flat())];

}

function getFallbackTopics(exam, subject) {

  return examBlueprints[exam]?.topics?.[subject] || [];

}

const mistakeTypes = ['Concept Gap', 'Calculation Error', 'Misread Question', 'Guessing', 'Time Pressure'];

async function api(path, { token, ...options } = {}) {

  const response = await fetch(`${API_URL}${path}`, {

    ...options,

    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) },

  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) throw new Error(data.message || `Request failed (${response.status})`);

  return data;

}

function AuthScreen({ onAuth }) {

  const [mode, setMode] = useState('login');

  const [name, setName] = useState('');

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [busy, setBusy] = useState(false);

  const [error, setError] = useState('');

  const submit = async event => {

    event.preventDefault(); setBusy(true); setError('');

    try {

      const data = await api(`/auth/${mode === 'signup' ? 'signup' : 'login'}`, { method: 'POST', body: JSON.stringify({ name, email, password }) });

      localStorage.setItem('prashnora_token', data.token); onAuth(data.user, data.token);

    } catch (err) { setError(err.message); } finally { setBusy(false); }

  };

  return <div className="min-h-screen bg-slate-50 p-4 flex items-center justify-center">

    <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl md:grid-cols-2">

      <div className="hidden bg-gradient-to-br from-blue-800 via-blue-600 to-cyan-500 p-10 text-white md:flex md:flex-col md:justify-between">

        <Brand light />

        <div><p className="text-xs font-bold tracking-[.2em] text-blue-100">YOUR PERSONAL EXAM MENTOR</p><h1 className="mt-4 text-4xl font-black leading-tight">Build a smarter study habit.</h1><p className="mt-4 leading-7 text-blue-50">Plan your day, practice questions, learn from mistakes and keep your progress in one place.</p></div>

        <p className="text-sm text-blue-100">One platform. Your learning journey.</p>

      </div>

      <form onSubmit={submit} className="p-7 sm:p-10">

        <div className="mb-8 md:hidden"><Brand /></div>

        <p className="text-xs font-bold tracking-[.18em] text-blue-700">WELCOME TO PRASHNORA</p>

        <h2 className="mt-2 text-3xl font-extrabold text-slate-900">{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h2>

        <p className="mt-2 text-sm text-slate-500">{mode === 'signup' ? 'Start building your personal study space.' : 'Sign in to continue your preparation.'}</p>

        {mode === 'signup' && <label className="mt-6 block text-sm font-semibold">Full name<input className="field mt-2" value={name} onChange={e => setName(e.target.value)} required minLength={2} placeholder="Your name" autoComplete="name" /></label>}

        <label className="mt-6 block text-sm font-semibold">Email address<input className="field mt-2" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" autoComplete="email" /></label>

        <label className="mt-4 block text-sm font-semibold">Password<input className="field mt-2" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} placeholder="At least 8 characters" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} /></label>

        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <button disabled={busy} className="mt-6 w-full rounded-xl bg-blue-700 px-5 py-3.5 font-bold text-white transition hover:bg-blue-800 disabled:opacity-60">{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}</button>

        <p className="mt-5 text-center text-sm text-slate-500">{mode === 'signup' ? 'Already registered?' : 'New to Prashnora?'} <button type="button" onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(''); }} className="font-bold text-blue-700">{mode === 'signup' ? 'Sign in' : 'Create an account'}</button></p>

        <p className="mt-6 text-center text-xs text-slate-400">Your study data is linked to your account.</p>

      </form>

    </div>

  </div>;

}

function Brand({ light = false }) { return <div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-700 to-cyan-500 text-2xl font-black text-white shadow-lg">P</div><div><p className={`text-xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-slate-900'}`}>Prashnora <span className={light ? 'text-cyan-100' : 'text-blue-700'}>AI</span></p><p className={`text-[9px] font-bold tracking-[1.5px] ${light ? 'text-blue-100' : 'text-slate-400'}`}>YOUR PERSONAL EXAM MENTOR</p></div></div>; }

function Stat({ label, value, detail, tone = 'blue' }) { const tones = { blue: 'bg-blue-50 text-blue-700', green: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', violet: 'bg-violet-50 text-violet-700' }; return <div className={`rounded-2xl p-5 ${tones[tone]}`}><p className="text-sm opacity-80">{label}</p><p className="mt-2 text-3xl font-extrabold">{value}</p>{detail && <p className="mt-1 text-xs opacity-70">{detail}</p>}</div>; }

function SectionTitle({ eyebrow, title, description, action }) { return <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold tracking-[.16em] text-blue-700">{eyebrow}</p><h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">{title}</h2>{description && <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>}</div>{action}</div>; }

function normalizeTaskValue(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function taskDuplicateKey(task) {
  const due = task.dueDate ? String(task.dueDate).slice(0, 10) : '';
  return [task.exam, task.subject, task.topic, task.task, due]
    .map(normalizeTaskValue)
    .join('|');
}

export default function App() {

  const [token, setToken] = useState(() => localStorage.getItem('prashnora_token') || '');

  const [user, setUser] = useState(null);

  const [authChecking, setAuthChecking] = useState(Boolean(localStorage.getItem('prashnora_token')));

  const [active, setActive] = useState('dashboard');
  const [syllabusExam, setSyllabusExam] = useState('UPSC CSE');
  const [syllabusStage, setSyllabusStage] = useState('Prelims');
  const [syllabusSubject, setSyllabusSubject] = useState('');
  const [syllabusTopics, setSyllabusTopics] = useState([]);
  const [syllabusProgress, setSyllabusProgress] = useState([]);
  const [syllabusBusy, setSyllabusBusy] = useState(false);

  const [tasks, setTasks] = useState([]); const [mistakes, setMistakes] = useState([]); const [results, setResults] = useState([]);

  const [loading, setLoading] = useState(false); const [notice, setNotice] = useState(''); const [error, setError] = useState('');

  const [taskText, setTaskText] = useState(''); const [taskSubject, setTaskSubject] = useState(''); const [taskDuration, setTaskDuration] = useState('30'); const [taskBusy, setTaskBusy] = useState(false);
  const [taskExam, setTaskExam] = useState('UPSC CSE');
  const [taskTopic, setTaskTopic] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [planHours, setPlanHours] = useState('4');
  const [planSessionMinutes, setPlanSessionMinutes] = useState('90');
  const [planPriority, setPlanPriority] = useState('weak');
  const [planExamDate, setPlanExamDate] = useState('');
  const [generatedPlan, setGeneratedPlan] = useState([]);
  const [planBusy, setPlanBusy] = useState(false);
  const [savingPlanIndex, setSavingPlanIndex] = useState(-1);
  const [weeklyPlan, setWeeklyPlan] = useState([]);
  const [weeklyBusy, setWeeklyBusy] = useState(false);
  const [savingWeekly, setSavingWeekly] = useState(false);

  const [mistakeQuestion, setMistakeQuestion] = useState(''); const [mistakeTopic, setMistakeTopic] = useState(''); const [mistakeType, setMistakeType] = useState('Concept Gap'); const [mistakeBusy, setMistakeBusy] = useState(false);

  const [examSearch, setExamSearch] = useState(''); const [examCategory, setExamCategory] = useState('All Exams'); const [selectedExam, setSelectedExam] = useState('UPSC CSE');

  const [questions, setQuestions] = useState([]); const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [markedQuestions, setMarkedQuestions] = useState([]);
  const [testDraftLoaded, setTestDraftLoaded] = useState(false);
  const [testStage, setTestStage] = useState(''); const [testSubject, setTestSubject] = useState(''); const [testTopic, setTestTopic] = useState(''); const [testCount, setTestCount] = useState('10'); const [topicOptions, setTopicOptions] = useState([]); const [questionCount, setQuestionCount] = useState(0);

  const [adminExam, setAdminExam] = useState('GATE'); const [adminStage, setAdminStage] = useState('Computer Science'); const [adminSubject, setAdminSubject] = useState('Computer Science'); const [adminTopic, setAdminTopic] = useState('Data Structures'); const [adminCount, setAdminCount] = useState('20'); const [adminBusy, setAdminBusy] = useState(false); const [adminMessage, setAdminMessage] = useState(''); const [adminFile, setAdminFile] = useState(null); const [testResult, setTestResult] = useState(null); const [testReview, setTestReview] = useState([]); const [testBusy, setTestBusy] = useState(false); const [seconds, setSeconds] = useState(600); const [testStarted, setTestStarted] = useState(false);
  const [aiWeakAnalysis, setAiWeakAnalysis] = useState('');
  const [aiWeakBusy, setAiWeakBusy] = useState(false);

  const [mentorInput, setMentorInput] = useState(''); const [mentorMessages, setMentorMessages] = useState([{ role: 'assistant', content: 'Hi! I’m Prashnora Mentor. Ask me to explain a concept, plan a revision session, or help you learn from a mistake.' }]); const [mentorBusy, setMentorBusy] = useState(false);

  const logout = useCallback(() => { localStorage.removeItem('prashnora_token'); setToken(''); setUser(null); setTasks([]); setMistakes([]); setResults([]); setActive('dashboard'); }, []);

  const loadData = useCallback(async currentToken => {

    setLoading(true); setError('');

    try {

      const [taskData, mistakeData, resultData] = await Promise.all([

        api('/tasks', { token: currentToken }), api('/mistakes', { token: currentToken }), api('/results', { token: currentToken }),

      ]);

      setTasks((taskData.tasks || []).map(t => ({ ...t, id: t._id || t.id })));

      setMistakes((mistakeData.mistakes || []).map(m => ({ ...m, id: m._id || m.id })));

      setResults(resultData.results || []);

    } catch (err) { setError(err.message); if (/session|sign in|account not found/i.test(err.message)) logout(); }

    finally { setLoading(false); }

  }, [logout]);

  useEffect(() => {
    if (!token || !user) return;

    const userKey = user.id || user._id || user.email;
    const draftKey = `prashnora-test-draft-${userKey}`;

    try {
      const saved = localStorage.getItem(draftKey);

      if (saved) {
        const draft = JSON.parse(saved);

        if (draft.testStarted && Array.isArray(draft.questions) && draft.questions.length > 0) {
          console.log('RESTORING TEST DRAFT:', draft.questions?.length, draft.testStarted);
          setQuestions(draft.questions);
          setAnswers(draft.answers || {});
          setCurrentQuestion(Math.min(
            Math.max(0, Number(draft.currentQuestion) || 0),
            draft.questions.length - 1
          ));
          setMarkedQuestions(draft.markedQuestions || []);
          setSelectedExam(draft.selectedExam || 'UPSC CSE');
          setTestStage(draft.testStage || '');
          setTestSubject(draft.testSubject || '');
          setTestTopic(draft.testTopic || '');
          setTestCount(draft.testCount || '10');
          setQuestionCount(draft.questions.length);
          setSeconds(Math.max(0, Number(draft.seconds) || 0));
          setTestStarted(true);
          setTestResult(null);
          setTestReview([]);
          setActive('tests');
          setNotice('Your previous test has been restored.');
        }
      }
    } catch (err) {
      console.error('Could not restore saved test:', err);
    } finally {
      setTestDraftLoaded(true);
    }
  }, [token, user]);

  useEffect(() => {
    if (!token || !user || !testDraftLoaded) return;

    const userKey = user.id || user._id || user.email;
    const draftKey = `prashnora-test-draft-${userKey}`;

    try {
      if (testStarted && questions.length > 0 && !testResult) {
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            questions,
            answers,
            currentQuestion,
            markedQuestions,
            selectedExam,
            testStage,
            testSubject,
            testTopic,
            testCount,
            seconds,
            testStarted
          })
        );
      }
    } catch (err) {
      console.error('Could not save test draft:', err);
    }
  }, [
    token,
    user,
    testDraftLoaded,
    testStarted,
    testResult,
    questions,
    answers,
    currentQuestion,
    markedQuestions,
    selectedExam,
    testStage,
    testSubject,
    testTopic,
    testCount,
    seconds
  ]);
  useEffect(() => {

    let cancelled = false;

    if (!token) { setAuthChecking(false); return undefined; }

    api('/auth/me', { token }).then(data => { if (!cancelled) setUser(data.user); }).catch(() => { if (!cancelled) logout(); }).finally(() => { if (!cancelled) setAuthChecking(false); });

    return () => { cancelled = true; };

  }, [token, logout]);

  useEffect(() => { if (token && user) loadData(token); }, [token, user, loadData]);

  useEffect(() => { if (!testStarted || testResult) return undefined; const timer = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000); return () => clearInterval(timer); }, [testStarted, testResult]);

  useEffect(() => { if (testStarted && seconds === 0 && !testResult) submitTest(); /* timer auto-submit */ }, [seconds, testStarted, testResult]);

  const completed = tasks.filter(t => t.completed).length;

  const progress = tasks.length ? Math.round(completed / tasks.length * 100) : 0;

  // ===== DAILY STUDY STREAK & CALENDAR DATA =====
  const getDateKey = date => {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayKey = getDateKey(new Date());

  const completedDates = new Set(
    tasks
      .filter(task => task.completed && task.completedAt)
      .map(task => getDateKey(task.completedAt))
      .filter(Boolean)
  );

  const studyStreak = (() => {
    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    // If today has no completed task yet, allow the streak
    // to continue from yesterday.
    if (!completedDates.has(todayKey)) {
      cursor.setDate(cursor.getDate() - 1);
    }

    while (completedDates.has(getDateKey(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  })();

  const lastSevenDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));

    const key = getDateKey(date);
    const dayTasks = tasks.filter(task => {
      return task.dueDate && getDateKey(task.dueDate) === key;
    });

    const completedOnDay = tasks.filter(task => {
      return task.completed &&
        task.completedAt &&
        getDateKey(task.completedAt) === key;
    });

    return {
      key,
      label: date.toLocaleDateString('en-IN', { weekday: 'short' }),
      dateLabel: date.getDate(),
      planned: dayTasks.length,
      completed: completedOnDay.length,
      minutes: completedOnDay.reduce(
        (sum, task) => sum + (Number(task.duration) || 0),
        0
      ),
      studied: completedDates.has(key)
    };
  });

  const todayStudyMinutes = tasks
    .filter(task =>
      task.completed &&
      task.completedAt &&
      getDateKey(task.completedAt) === todayKey
    )
    .reduce((sum, task) => sum + (Number(task.duration) || 0), 0);

  const dailyTargetMinutes = Number(planHours || 4) * 60;
  const dailyTargetProgress = Math.min(
    100,
    Math.round((todayStudyMinutes / dailyTargetMinutes) * 100)
  );


  // ===== DUE-DATE REMINDERS =====
  const dueDateKey = date => {
    if (!date) return '';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    return getDateKey(d);
  };
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const reminderWindowEnd = new Date(todayStart);
  reminderWindowEnd.setDate(reminderWindowEnd.getDate() + 3);
  const dueReminderTasks = tasks
    .filter(task => !task.completed && task.dueDate)
    .map(task => ({ ...task, dueKey: dueDateKey(task.dueDate) }))
    .filter(task => task.dueKey && new Date(`${task.dueKey}T00:00:00`) <= reminderWindowEnd)
    .sort((a, b) => new Date(a.dueKey) - new Date(b.dueKey));
  const getDueLabel = dateKey => {
    const due = new Date(`${dateKey}T00:00:00`);
    const diffDays = Math.round((due - todayStart) / 86400000);
    if (diffDays < 0) return `${Math.abs(diffDays)} day(s) overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  // Notify once per task per day when an overdue task or task due today is found.
  useEffect(() => {
    if (!token || !user || !('Notification' in window) || Notification.permission !== 'granted') return;
    const urgentTasks = dueReminderTasks.filter(task => task.dueKey <= todayKey);
    urgentTasks.forEach(task => {
      const storageKey = `prashnora-notified-${user.id || user._id || user.email}-${todayKey}-${task.id}`;
      if (localStorage.getItem(storageKey)) return;
      try {
        new Notification(task.dueKey < todayKey ? 'Prashnora: Overdue study task' : 'Prashnora: Task due today', {
          body: `${task.task} · ${task.subject}`,
          tag: storageKey
        });
        localStorage.setItem(storageKey, '1');
      } catch (notificationError) {
        console.warn('Could not show study reminder notification:', notificationError);
      }
    });
  }, [token, user, tasks, todayKey]);


  const enableStudyNotifications = async () => {
    if (!('Notification' in window)) {
      setError('This browser does not support notifications.');
      return;
    }

    try {
      let permission = Notification.permission;

      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      if (permission === 'granted') {
        setNotice('Browser notifications enabled successfully.');

        new Notification('Prashnora AI', {
          body: 'Study reminders are enabled successfully!',
        });
      } else if (permission === 'denied') {
        setError(
          'Notifications are blocked. Open Chrome Site Settings and allow Notifications for localhost.'
        );
      } else {
        setNotice('Please allow notifications when Chrome asks for permission.');
      }
    } catch (error) {
      console.error('Notification error:', error);
      setError('Unable to enable notifications. Please try again.');
    }
  };


  const uniqueTopics = new Set(mistakes.map(m => String(m.topic).toLowerCase())).size;

  const filteredExams = useMemo(() => allExams.filter(e => (examCategory === 'All Exams' || e.category === examCategory) && `${e.name} ${e.desc} ${e.category}`.toLowerCase().includes(examSearch.toLowerCase())), [examCategory, examSearch]);

  const averageScore = results.length ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length) : 0;

  const formattedTime = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  const run = async fn => { setError(''); setNotice(''); try { await fn(); } catch (err) { setError(err.message); } };

  const addTask = async event => {
    event.preventDefault();
    if (!taskText.trim() || !taskSubject.trim()) return setError('Please enter both task and subject.');

    const candidate = {
      task: taskText.trim(), subject: taskSubject.trim(), exam: taskExam,
      topic: taskTopic.trim(), dueDate: taskDueDate || null
    };
    const duplicate = tasks.some(task => !task.completed && taskDuplicateKey(task) === taskDuplicateKey(candidate));
    if (duplicate) {
      setError('This task already exists in your pending task list. Change the task, topic or due date to add it again.');
      return;
    }

    setTaskBusy(true);
    await run(async () => {
      const data = await api('/tasks', {
        token, method: 'POST',
        body: JSON.stringify({ ...candidate, duration: Number(taskDuration), source: 'manual' })
      });
      setTasks(old => [{ ...data.task, id: data.task._id || data.task.id }, ...old]);
      setTaskText(''); setTaskSubject(''); setTaskTopic(''); setTaskDueDate('');
      setNotice('Study task saved to your account.');
    });
    setTaskBusy(false);
  };

  const generateTimetable = async event => {
    event.preventDefault();
    setPlanBusy(true);
    setGeneratedPlan([]);
    await run(async () => {
      const data = await api('/planner/generate', {
        token,
        method: 'POST',
        body: JSON.stringify({
          exam: taskExam || 'UPSC CSE',
          dailyHours: Number(planHours),
          preferredSessionMinutes: Number(planSessionMinutes),
          priority: planPriority,
          examDate: planExamDate || null
        })
      });
      if (!Array.isArray(data.plan) || !data.plan.length) {
        throw new Error('AI did not return a timetable. Please try again.');
      }
      setGeneratedPlan(data.plan);
      setNotice('AI study timetable generated. Save any session you want to add to your task list.');
    });
    setPlanBusy(false);
  };

  const generateWeeklyTimetable = async () => {
    setWeeklyBusy(true);
    setWeeklyPlan([]);

    await run(async () => {
      const data = await api('/planner/generate-weekly', {
        token,
        method: 'POST',
        body: JSON.stringify({
          exam: taskExam || 'UPSC CSE',
          dailyHours: Number(planHours),
          preferredSessionMinutes: Number(planSessionMinutes),
          priority: planPriority
        })
      });

      if (!Array.isArray(data.plan) || !data.plan.length) {
        throw new Error('No weekly sessions were generated.');
      }

      setWeeklyPlan(data.plan);
      setNotice(
        `Weekly plan generated: ${data.totalSessions} sessions, ${data.weekStart} to ${data.weekEnd}.`
      );
    });

    setWeeklyBusy(false);
  };

  const saveWeeklyTimetable = async () => {
    if (!weeklyPlan.length) return setError('Generate a weekly plan first.');

    const existingKeys = new Set(tasks.filter(task => !task.completed).map(taskDuplicateKey));
    const seenKeys = new Set(existingKeys);
    const sessionsToSave = weeklyPlan.filter(session => {
      const candidate = {
        task: session.task, subject: session.subject, exam: taskExam || 'UPSC CSE',
        topic: session.topic || '', dueDate: session.date || null
      };
      const key = taskDuplicateKey(candidate);
      if (seenKeys.has(key)) return false;
      seenKeys.add(key);
      return true;
    });

    if (!sessionsToSave.length) {
      setNotice('These weekly sessions are already in your task list. No duplicates were added.');
      return;
    }

    setSavingWeekly(true);
    await run(async () => {
      let savedCount = 0;
      for (const session of sessionsToSave) {
        await api('/tasks', {
          token, method: 'POST',
          body: JSON.stringify({
            task: session.task, subject: session.subject, exam: taskExam || 'UPSC CSE',
            topic: session.topic || '', duration: Number(session.duration),
            dueDate: session.date || null, source: 'ai'
          })
        });
        savedCount++;
      }
      await loadData(token);
      const skipped = weeklyPlan.length - savedCount;
      setNotice(`${savedCount} weekly sessions saved${skipped ? `; ${skipped} duplicate session(s) skipped` : ''}.`);
    });
    setSavingWeekly(false);
  };


  const savePlanSession = async (session, index) => {
    const candidate = {
      task: String(session.task || session.title || 'Study session').slice(0, 250),
      subject: String(session.subject || 'General Studies').slice(0, 150),
      exam: taskExam || 'UPSC CSE', topic: String(session.topic || '').slice(0, 150),
      dueDate: session.dueDate || null
    };
    if (tasks.some(task => !task.completed && taskDuplicateKey(task) === taskDuplicateKey(candidate))) {
      setError('This AI session is already in your pending tasks.');
      return;
    }
    setSavingPlanIndex(index);
    await run(async () => {
      const data = await api('/tasks', {
        token,
        method: 'POST',
        body: JSON.stringify({
          task: candidate.task,
          subject: candidate.subject,
          exam: candidate.exam,
          topic: candidate.topic,
          duration: Math.min(1440, Math.max(1, Number(session.duration) || Number(planSessionMinutes))),
          dueDate: session.dueDate || null,
          source: 'ai'
        })
      });
      setTasks(old => [{ ...data.task, id: data.task._id || data.task.id }, ...old]);
      setNotice('AI session saved to your Study Planner.');
    });
    setSavingPlanIndex(-1);
  };

  const toggleTask = async task => { await run(async () => { const data = await api(`/tasks/${task.id}`, { token, method: 'PATCH', body: JSON.stringify({ completed: !task.completed }) }); setTasks(old => old.map(t => t.id === task.id ? { ...t, ...data.task, id: data.task._id } : t)); }); };

  const deleteTask = async id => { await run(async () => { await api(`/tasks/${id}`, { token, method: 'DELETE' }); setTasks(old => old.filter(t => t.id !== id)); setNotice('Task removed.'); }); };

  const addMistake = async event => { event.preventDefault(); if (!mistakeQuestion.trim() || !mistakeTopic.trim()) return setError('Please enter the mistake and its topic.'); setMistakeBusy(true); await run(async () => { const data = await api('/mistakes', { token, method: 'POST', body: JSON.stringify({ question: mistakeQuestion.trim(), topic: mistakeTopic.trim(), type: mistakeType }) }); setMistakes(old => [{ ...data.mistake, id: data.mistake._id }, ...old]); setMistakeQuestion(''); setMistakeTopic(''); setMistakeType('Concept Gap'); setNotice('Mistake saved. Use it to guide your revision.'); }); setMistakeBusy(false); };

  const deleteMistake = async id => { await run(async () => { await api(`/mistakes/${id}`, { token, method: 'DELETE' }); setMistakes(old => old.filter(m => m.id !== id)); setNotice('Mistake removed.'); }); };

  const startTest = async () => {
    await run(async () => {
      const params = new URLSearchParams({ exam: selectedExam, limit: testCount }); if (testStage) params.set('stage', testStage); if (testSubject) params.set('subject', testSubject); if (testTopic) params.set('topic', testTopic); const data = await api(`/tests/questions?${params.toString()}`, { token }); if (!data.questions?.length) throw new Error('No questions found for these filters yet. Ask an admin to import questions or generate an AI batch.'); setQuestions(data.questions); setQuestionCount(data.questions.length); setAnswers({}); setTestResult(null); setTestReview([]);
      setCurrentQuestion(0);
      setMarkedQuestions([]); setSeconds(Math.max(600, Number(testCount) * 60)); setTestStarted(true);
      const draftKey = `prashnora-test-draft-${user.id || user._id || user.email}`;
      try {
        localStorage.setItem(draftKey, JSON.stringify({
          questions: data.questions, answers: {}, currentQuestion: 0,
          markedQuestions: [], selectedExam, testStage, testSubject, testTopic,
          testCount, seconds: Math.max(600, Number(testCount) * 60), testStarted: true
        }));
      } catch (storageError) {
        console.error('Could not save new test draft:', storageError);
      }
      setNotice(`${data.questions.length}-question ${selectedExam} practice test started.`);
    });
  };

  const loadSyllabus = async () => {
    setSyllabusBusy(true);
    setError('');
    setNotice('');

    const subjects = getSubjects(syllabusExam, syllabusStage);
    const subject = syllabusSubject && subjects.includes(syllabusSubject)
      ? syllabusSubject
      : (subjects[0] || 'General Studies');
    setSyllabusSubject(subject);

    // Build a local syllabus immediately from the exam blueprint, so the page
    // still displays topics if the optional syllabus GET endpoint is not ready.
    const localTopics = getFallbackTopics(syllabusExam, subject);
    setSyllabusTopics(localTopics);

    try {
      const data = await api(
        `/syllabus?exam=${encodeURIComponent(syllabusExam)}&stage=${encodeURIComponent(syllabusStage)}&subject=${encodeURIComponent(subject)}`,
        { token }
      );
      if (Array.isArray(data.topics) && data.topics.length) setSyllabusTopics(data.topics);
      setSyllabusProgress(Array.isArray(data.progress) ? data.progress : []);
    } catch (err) {
      // Local blueprint remains usable; saving progress still requires the backend route.
      setSyllabusProgress([]);
      setNotice(`Showing built-in ${syllabusExam} topics. Saved progress will load when the syllabus API is available.`);
    } finally {
      setSyllabusBusy(false);
    }
  };

  useEffect(() => {
    if (!token || !user || active !== 'syllabus') return;

    loadSyllabus();
  }, [token, user, active]);

  const updateSyllabusProgress = async (topic, status) => {
    setError('');
    setNotice('');
    const existing = syllabusProgress.find(item =>
      item.topic === topic && item.exam === syllabusExam &&
      (item.stage || 'General') === syllabusStage && item.subject === syllabusSubject
    );
    const previous = existing?.status || 'Not Started';
    setSyllabusProgress(old => {
      const filtered = old.filter(item => !(item.topic === topic && item.exam === syllabusExam &&
        (item.stage || 'General') === syllabusStage && item.subject === syllabusSubject));
      return [...filtered, {
        ...(existing || {}), exam: syllabusExam, stage: syllabusStage,
        subject: syllabusSubject, topic, status
      }];
    });

    try {
      await api('/syllabus/progress', {
        token,
        method: 'POST',
        body: JSON.stringify({
          exam: syllabusExam, stage: syllabusStage,
          subject: syllabusSubject, topic, status
        })
      });
      setNotice(`“${topic}” marked ${status.toLowerCase()}.`);
    } catch (err) {
      setSyllabusProgress(old => {
        const filtered = old.filter(item => !(item.topic === topic && item.exam === syllabusExam &&
          (item.stage || 'General') === syllabusStage && item.subject === syllabusSubject));
        return existing ? [...filtered, existing] : filtered;
      });
      setError(`Could not save topic progress: ${err.message}. Check that POST /api/syllabus/progress exists in server/index.js.`);
    }
  };


  const submitTest = async () => {
    if (testBusy || testResult || !questions.length) return;

    setTestBusy(true);

    try {
      const data = await api('/tests/submit', {
        token,
        method: 'POST',
        body: JSON.stringify({
          exam: selectedExam,
          answers: questions.map(q => ({
            questionId: q.id,
            selectedIndex: answers[q.id] ?? -1
          }))
        })
      });

      const review = data.review || [];

      setTestResult(data.result);
      setTestReview(review);
      setTestStarted(false);

      localStorage.removeItem(
        `prashnora-test-draft-${user.id || user._id || user.email}`
      );

      // Automatically save incorrect and unanswered questions to Mistake DNA.
      const wrongQuestions = review.filter(q => !q.correct);

      let savedMistakes = 0;

      for (const q of wrongQuestions) {
        const topic = String(
          q.topic || q.subject || 'General Practice'
        ).trim();

        const question = String(
          q.question || 'Question from mock test'
        ).trim();

        const alreadyExists = mistakes.some(
          m =>
            String(m.topic || '').trim().toLowerCase() === topic.toLowerCase() &&
            String(m.question || '').trim().toLowerCase() === question.toLowerCase()
        );

        if (alreadyExists) continue;

        try {
          const mistakeData = await api('/mistakes', {
            token,
            method: 'POST',
            body: JSON.stringify({
              question,
              topic,
              type: q.selectedIndex < 0
                ? 'Time Pressure'
                : 'Concept Gap'
            })
          });

          setMistakes(old => [
            {
              ...mistakeData.mistake,
              id: mistakeData.mistake._id || mistakeData.mistake.id
            },
            ...old
          ]);

          savedMistakes++;
        } catch (mistakeError) {
          console.error(
            'Could not save mock test mistake:',
            mistakeError
          );
        }
      }

      setNotice(
        `Result saved. ${savedMistakes} new mistake(s) added to Mistake DNA.`
      );

      const history = await api('/results', { token });
      setResults(history.results || []);

    } catch (err) {
      setError(err.message);
    } finally {
      setTestBusy(false);
    }
  };

  const generateWeakTopicAnalysis = async () => {
    if (!testReview.length || aiWeakBusy) return;

    setAiWeakBusy(true);
    setAiWeakAnalysis('');
    setError('');

    const reviewSummary = testReview.map((q, index) => ({
      questionNumber: index + 1,
      topic: q.topic || q.subject || 'General Practice',
      question: q.question,
      selectedAnswer:
        q.selectedIndex >= 0
          ? q.options?.[q.selectedIndex]
          : 'Not answered',
      correctAnswer: q.options?.[q.answer],
      correct: Boolean(q.correct)
    }));

    try {
      const data = await api('/mentor', {
        token,
        method: 'POST',
        body: JSON.stringify({
          message: `You are an exam preparation mentor for ${selectedExam || 'UPSC CSE'}.

Analyze this mock test review:
${JSON.stringify(reviewSummary).slice(0, 1800)}

Provide:
1. Weakest topics.
2. Why the student may be struggling.
3. Three revision actions.
4. A 3-day revision plan.
5. Five concepts to revise first.

Use only the supplied results. Keep the advice concise.`
        })
      });

      setAiWeakAnalysis(
        data.answer || 'The AI mentor returned no analysis. Please try again.'
      );
    } catch (err) {
      setError(`AI analysis failed: ${err.message}`);
    } finally {
      setAiWeakBusy(false);
    }
  };
  const askMentor = async event => { event.preventDefault(); const message = mentorInput.trim(); if (!message || mentorBusy) return; setMentorInput(''); setMentorMessages(old => [...old, { role: 'user', content: message }]); setMentorBusy(true); try { const data = await api('/mentor', { token, method: 'POST', body: JSON.stringify({ message }) }); setMentorMessages(old => [...old, { role: 'assistant', content: data.answer, mode: data.mode }]); } catch (err) { setMentorMessages(old => [...old, { role: 'assistant', content: `I couldn't answer that just now: ${err.message}` }]); } finally { setMentorBusy(false); } };

  if (authChecking) return <div className="min-h-screen grid place-items-center bg-slate-50"><p className="font-semibold text-slate-500">Loading your study space…</p></div>;

  if (!token || !user) return <AuthScreen onAuth={(newUser, newToken) => { setUser(newUser); setToken(newToken); }} />;

  const card = 'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm';

  return <div className="min-h-screen bg-slate-50 text-slate-800 md:flex">

    <aside className="flex w-full flex-col border-r border-slate-200 bg-white p-5 md:fixed md:inset-y-0 md:w-64 md:overflow-y-auto"><Brand /><p className="mb-3 mt-9 text-xs font-bold tracking-widest text-slate-400">WORKSPACE</p><nav className="flex gap-2 overflow-x-auto md:flex-col">{navItems.map(item => <button key={item.id} onClick={() => { setActive(item.id); setError(''); setNotice(''); }} className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${active === item.id ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}><span className="w-5 text-center text-lg">{item.icon}</span>{item.label}</button>)}</nav><div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5 md:mt-auto"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-100 font-bold text-blue-700">{user.name?.[0]?.toUpperCase() || 'S'}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{user.name}</p><p className="truncate text-xs text-slate-400">{user.email}</p></div><button title="Sign out" onClick={logout} className="rounded-lg px-2 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100">Exit</button></div></aside>

    <main className="min-w-0 flex-1 p-4 md:ml-64 md:p-9">

      <header className="mb-7 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold tracking-[.18em] text-blue-700">YOUR LEARNING SPACE</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{navItems.find(n => n.id === active)?.label || 'Dashboard'}</h1><p className="mt-2 text-sm text-slate-500">A focused space for your exam preparation.</p></div><div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold">✨ Personal study space</div></header>

      {error && <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><span>{error}</span><button onClick={() => setError('')} className="font-bold">×</button></div>}

      {notice && <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><span>{notice}</span><button onClick={() => setNotice('')} className="font-bold">×</button></div>}

      {loading && <p className="mb-4 text-xs text-slate-400">Syncing your saved data…</p>}

      {active === 'dashboard' && <>

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-800 via-blue-600 to-cyan-500 p-7 text-white shadow-xl shadow-blue-100 md:p-10"><div className="relative z-10 max-w-2xl"><span className="rounded-full border border-white/30 bg-white/10 px-3 py-2 text-xs font-semibold">✦ YOUR AI STUDY PARTNER</span><h2 className="mt-7 text-4xl font-extrabold leading-tight md:text-5xl">Every exam.<br />One smarter way to prepare.</h2><p className="mt-4 max-w-lg text-sm leading-6 text-blue-50">Plan your work, practice with timed MCQs and learn from your mistakes. Your data is saved to your account.</p><button onClick={() => setActive('exams')} className="mt-7 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-800 hover:bg-blue-50">Explore exams →</button></div><div className="pointer-events-none absolute -right-12 -top-20 h-72 w-72 rounded-full border-[35px] border-white/10" /></section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Available exams" value={`${allExams.length}`} detail="Across 6 categories" /><Stat label="Study tasks" value={tasks.length} detail={`${completed} completed`} tone="green" /><Stat label="Mistakes tracked" value={mistakes.length} detail={`${uniqueTopics} topics to review`} tone="amber" /><Stat label="Average test score" value={`${averageScore}%`} detail={`${results.length} saved tests`} tone="violet" /></section>

        <div className="mt-6 grid gap-6 xl:grid-cols-2"><section className={card}><SectionTitle eyebrow="NEXT ACTION" title="Today's study plan" description="Keep the next step small and achievable." action={<button onClick={() => setActive('planner')} className="text-sm font-bold text-blue-700">Open planner →</button>} />
          {tasks.filter(t => !t.completed).slice(0, 4).map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActive('planner')}
              className="mb-2 flex w-full items-center gap-3 rounded-xl bg-slate-50 p-3 text-left transition hover:bg-blue-50 hover:shadow-sm cursor-pointer"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-100 text-blue-700">
                ▤
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{t.task}</p>
                <p className="text-xs text-slate-500">
                  {t.subject} · {t.duration} min
                </p>
              </div>

              <span className="text-blue-600">→</span>
            </button>
          ))}
          {!tasks.some(t => !t.completed) && <p className="rounded-xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">No pending tasks. Add a task to plan your next session.</p>}</section><section className={card}><SectionTitle eyebrow="LEARN FROM ERRORS" title="Topics to revisit" description="Mistake DNA helps turn errors into a revision plan." action={<button onClick={() => setActive('mistakes')} className="text-sm font-bold text-blue-700">Review →</button>} />{mistakes.slice(0, 4).map(m => <div key={m.id} className="mb-2 flex items-start gap-3 rounded-xl bg-amber-50/70 p-3"><span>◈</span><div><p className="text-sm font-bold">{m.topic}</p><p className="text-xs text-slate-600">{m.question}</p></div></div>)}{!mistakes.length && <p className="rounded-xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">No mistakes tracked yet. Record one after your next practice session.</p>}</section></div>

      </>}

      {active === 'exams' && <section className={card}><SectionTitle eyebrow="YOUR NEXT OPPORTUNITY" title="Explore exams" description="Browse the starter catalogue. Syllabus and question coverage should be verified for your target exam." /><div className="flex flex-col gap-3 md:flex-row"><input className="field flex-1" value={examSearch} onChange={e => setExamSearch(e.target.value)} placeholder="Search UPSC, JEE, NEET, SSC…" /><select className="field md:max-w-xs" value={examCategory} onChange={e => setExamCategory(e.target.value)}>{['All Exams', ...examGroups.map(g => g.category)].map(c => <option key={c}>{c}</option>)}</select></div><p className="mt-4 text-xs text-slate-400">{filteredExams.length} exams found</p><div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{filteredExams.map(exam => <article key={exam.name} className="rounded-2xl border border-slate-200 p-5 transition hover:border-blue-200 hover:shadow-lg"><div className="flex items-start justify-between gap-3"><span className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-2xl">{exam.icon}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-500">{exam.category}</span></div><h3 className="mt-5 text-lg font-extrabold">{exam.name}</h3><p className="mt-2 min-h-10 text-sm text-slate-500">{exam.desc}</p><p className="mt-3 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-600">{exam.subjects}</p><button onClick={() => { setSelectedExam(exam.name); setActive('tests'); setTestResult(null); }} className="mt-4 w-full rounded-xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 hover:bg-blue-700 hover:text-white">Practice questions →</button></article>)}</div></section>}

      {/* ===== DAILY STREAK & STUDY CALENDAR ===== */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">

        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
          <p className="text-sm font-semibold text-orange-800">
            🔥 Current Study Streak
          </p>

          <p className="mt-2 text-4xl font-extrabold text-orange-700">
            {studyStreak} <span className="text-lg">days</span>
          </p>

          <p className="mt-2 text-sm text-orange-800">
            {studyStreak > 0
              ? 'Great work! Keep your consistency going.'
              : 'Complete a study task today to start your streak.'}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-blue-800">
                Today's Study Target
              </p>
              <p className="mt-1 text-2xl font-extrabold text-blue-700">
                {todayStudyMinutes} / {dailyTargetMinutes} minutes
              </p>
            </div>

            <p className="text-xl font-extrabold text-blue-700">
              {dailyTargetProgress}%
            </p>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-blue-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${dailyTargetProgress}%` }}
            />
          </div>

          <p className="mt-2 text-xs text-blue-700">
            Completed tasks count toward today's target.
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-extrabold text-slate-900">
          📅 Last 7 Days
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Your completed study sessions and scheduled tasks.
        </p>

        <div className="mt-5 grid grid-cols-7 gap-2">
          {lastSevenDays.map(day => (
            <div
              key={day.key}
              className={`rounded-xl border p-2 text-center ${day.studied
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-slate-200 bg-slate-50'
                }`}
            >
              <p className="text-xs font-semibold text-slate-500">
                {day.label}
              </p>

              <p className="mt-1 text-lg font-extrabold text-slate-900">
                {day.dateLabel}
              </p>

              <p className={`mt-1 text-xs font-bold ${day.studied ? 'text-emerald-700' : 'text-slate-400'
                }`}>
                {day.studied ? 'Studied' : '—'}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {day.minutes} min
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {day.completed}/{day.planned} tasks
              </p>
            </div>
          ))}
        </div>
      </div>

      {active === 'planner' && <section className={card}><SectionTitle eyebrow="YOUR DAILY ROUTINE" title="Personal Study Planner" description="Generate an AI timetable, then save sessions to your MongoDB-backed task list." />
        <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
          <h3 className="text-lg font-extrabold text-slate-900">✨ AI Study Timetable</h3>
          <p className="mt-1 text-sm text-slate-600">Generate a daily plan using your exam, available hours and weak-topic revision priority.</p>
          <form onSubmit={generateTimetable} className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="text-sm font-semibold">Target exam
              <select className="field mt-2" value={taskExam} onChange={e => setTaskExam(e.target.value)} required>
                {allExams.map(exam => <option key={exam.name} value={exam.name}>{exam.name}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold">Daily study time
              <select className="field mt-2" value={planHours} onChange={e => setPlanHours(e.target.value)}>
                {[2, 3, 4, 5, 6, 8].map(n => <option key={n} value={n}>{n} hours</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold">Preferred session
              <select className="field mt-2" value={planSessionMinutes} onChange={e => setPlanSessionMinutes(e.target.value)}>
                {[45, 60, 90, 120].map(n => <option key={n} value={n}>{n} minutes</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold">Priority
              <select className="field mt-2" value={planPriority} onChange={e => setPlanPriority(e.target.value)}>
                <option value="weak">Weak topics first</option>
                <option value="balanced">Balanced syllabus coverage</option>
                <option value="revision">Revision and mock tests</option>
              </select>
            </label>
            <label className="text-sm font-semibold sm:col-span-2">Exam date (optional)
              <input className="field mt-2" type="date" min={new Date().toISOString().slice(0, 10)} value={planExamDate} onChange={e => setPlanExamDate(e.target.value)} />
            </label>
            <button disabled={planBusy} className="self-end rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800 disabled:opacity-60 sm:col-span-2">{planBusy ? 'Generating timetable…' : 'Generate AI timetable'}</button>
          </form>
          {generatedPlan.length > 0 && <div className="mt-5 space-y-3">
            <div><h4 className="font-bold text-slate-900">Your generated plan</h4><p className="text-xs text-slate-500">AI suggestions should be checked against the official syllabus. Save sessions individually.</p></div>
            {generatedPlan.map((session, index) => <article key={`${session.day || 'day'}-${index}`} className="rounded-xl border border-blue-100 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wide text-blue-700">{session.day || `Session ${index + 1}`} · {Number(session.duration) || Number(planSessionMinutes)} minutes</p><h5 className="mt-1 font-bold">{session.task || session.title || 'Study session'}</h5><p className="mt-1 text-sm text-slate-600">{session.subject || 'General Studies'}{session.topic ? ` · ${session.topic}` : ''}</p>{session.reason && <p className="mt-2 text-sm text-slate-500">{session.reason}</p>}</div><button disabled={savingPlanIndex === index} onClick={() => savePlanSession(session, index)} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white disabled:opacity-60">{savingPlanIndex === index ? 'Saving…' : 'Add to tasks'}</button></div>
            </article>)}
          </div>}
        </div>

        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
          <h3 className="text-lg font-extrabold">
            📅 Weekly AI Study Timetable
          </h3>

          <p className="mt-1 text-sm text-slate-600">
            Generate the next Monday–Sunday study plan using your current exam,
            daily study hours and revision priority.
          </p>

          <button
            type="button"
            onClick={generateWeeklyTimetable}
            disabled={weeklyBusy}
            className="mt-4 rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white disabled:opacity-60"
          >
            {weeklyBusy ? 'Generating week…' : 'Generate Weekly Timetable'}
          </button>

          {weeklyPlan.length > 0 && (
            <>
              <div className="mt-5 space-y-3">
                {weeklyPlan.map((session, index) => (
                  <article
                    key={`${session.date}-${index}`}
                    className="rounded-xl border border-emerald-100 bg-white p-4"
                  >
                    <p className="text-xs font-bold uppercase text-emerald-700">
                      {session.day} · {session.date} · {session.duration} minutes
                    </p>

                    <h4 className="mt-1 font-bold">{session.task}</h4>

                    <p className="mt-1 text-sm text-slate-600">
                      {session.subject}
                      {session.topic ? ` · ${session.topic}` : ''}
                    </p>

                    {session.reason && (
                      <p className="mt-2 text-sm text-slate-500">
                        {session.reason}
                      </p>
                    )}
                  </article>
                ))}
              </div>

              <button
                type="button"
                onClick={saveWeeklyTimetable}
                disabled={savingWeekly}
                className="mt-4 w-full rounded-xl bg-blue-700 px-5 py-3 font-bold text-white disabled:opacity-60"
              >
                {savingWeekly ? 'Saving weekly plan…' : 'Save Entire Week to Study Planner'}
              </button>
            </>
          )}
        </div>

        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-extrabold text-amber-900">🔔 Study Reminders</h3>
              <p className="mt-1 text-sm text-amber-800">Overdue tasks and upcoming deadlines for the next 3 days.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-amber-800">{dueReminderTasks.length} pending</span>
              <button type="button" onClick={enableStudyNotifications} disabled={typeof Notification !== 'undefined' && Notification.permission === 'granted'} className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 disabled:cursor-default disabled:opacity-70">
                {typeof Notification !== 'undefined' && Notification.permission === 'granted' ? '✓ Notifications enabled' : 'Enable browser notifications'}
              </button>
            </div>
          </div>
          {dueReminderTasks.length > 0 ? (
            <div className="mt-4 space-y-2">
              {dueReminderTasks.map(task => {
                const overdue = task.dueKey < todayKey;
                return (
                  <div key={task.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-100 bg-white p-3">
                    <div className={`grid h-9 w-9 place-items-center rounded-lg ${overdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>⏰</div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900">{task.task}</p>
                      <p className="mt-1 text-xs text-slate-500">{task.subject}{task.topic ? ` · ${task.topic}` : ''} · {task.duration} minutes</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${overdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
                      {getDueLabel(task.dueKey)}
                    </span>
                    <button type="button" onClick={() => toggleTask(task)} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800">Mark complete</button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-amber-200 bg-white/70 p-4 text-sm text-slate-600">You're all clear. No overdue tasks or deadlines in the next 3 days.</p>
          )}
          <p className="mt-3 text-xs text-amber-800">Browser notifications are sent for tasks due today or overdue while Prashnora is open. Email notifications and reminders while the browser is closed are not enabled.</p>
        </div>

        <form onSubmit={addTask} className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="text-sm font-semibold">Study task
            <input className="field mt-2" value={taskText} onChange={e => setTaskText(e.target.value)} placeholder="e.g. Revise Fundamental Rights" required />
          </label>
          <label className="text-sm font-semibold">Exam
            <select className="field mt-2" value={taskExam} onChange={e => { setTaskExam(e.target.value); setTaskSubject(''); setTaskTopic(''); }} required>
              {allExams.map(exam => <option key={exam.name} value={exam.name}>{exam.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">Subject
            <select className="field mt-2" value={taskSubject} onChange={e => { setTaskSubject(e.target.value); setTaskTopic(''); }} required>
              <option value="">Choose subject</option>
              {getSubjects(taskExam).map(subject => <option key={subject} value={subject}>{subject}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">Topic
            <select className="field mt-2" value={taskTopic} onChange={e => setTaskTopic(e.target.value)}>
              <option value="">Choose topic (optional)</option>
              {getFallbackTopics(taskExam, taskSubject).map(topic => <option key={topic} value={topic}>{topic}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">Due date
            <input className="field mt-2" type="date" value={taskDueDate} min={new Date().toISOString().slice(0, 10)} onChange={e => setTaskDueDate(e.target.value)} />
          </label>
          <label className="text-sm font-semibold">Study duration
            <select className="field mt-2" value={taskDuration} onChange={e => setTaskDuration(e.target.value)}>
              {[15, 30, 45, 60, 90, 120].map(n => <option value={n} key={n}>{n} minutes</option>)}
            </select>
          </label>
          <button disabled={taskBusy} className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800 disabled:opacity-60 md:col-span-2 xl:col-span-3">{taskBusy ? 'Saving…' : '+ Add Study Task'}</button>
        </form><div className="mt-6 grid gap-4 sm:grid-cols-3"><Stat label="Total tasks" value={tasks.length} /><Stat label="Completed" value={completed} tone="green" /><Stat label="Progress" value={`${progress}%`} tone="amber" /></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} /></div><div className="mt-5 space-y-3">{tasks.map(task => <div key={task.id} className={`flex flex-wrap items-center gap-3 rounded-xl border p-4 ${task.completed ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200'}`}><input type="checkbox" checked={Boolean(task.completed)} onChange={() => toggleTask(task)} className="h-5 w-5 accent-blue-700" /><div className="min-w-0 flex-1"><p className={`font-bold ${task.completed ? 'text-slate-400 line-through' : ''}`}>{task.task}</p><p className="mt-1 text-sm text-slate-500">{task.exam ? `${task.exam} · ` : ''}{task.subject} · {task.duration} minutes{task.topic ? ` · ${task.topic}` : ''}{task.dueDate ? ` · Due ${new Date(task.dueDate).toLocaleDateString()}` : ''}</p></div><button onClick={() => deleteTask(task.id)} className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">Remove</button></div>)}{!tasks.length && <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No study tasks yet. Add your first task above.</p>}</div></section>}

      {active === 'syllabus' && <section className={card}>
        <SectionTitle eyebrow="TRACK YOUR PREPARATION" title="Exam Syllabus Tracker" description="Choose an exam, paper and subject, then track each topic as you study." />
        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm font-semibold">Exam
            <select className="field mt-2" value={syllabusExam} onChange={e => {
              const exam = e.target.value;
              const stage = getStages(exam)[0] || 'General';
              const subject = getSubjects(exam, stage)[0] || '';
              setSyllabusExam(exam); setSyllabusStage(stage); setSyllabusSubject(subject);
              setSyllabusTopics([]); setSyllabusProgress([]);
            }}>
              {allExams.map(exam => <option key={exam.name} value={exam.name}>{exam.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">Stage / Paper
            <select className="field mt-2" value={syllabusStage} onChange={e => {
              const stage = e.target.value;
              setSyllabusStage(stage);
              setSyllabusSubject(getSubjects(syllabusExam, stage)[0] || '');
              setSyllabusTopics([]); setSyllabusProgress([]);
            }}>
              {getStages(syllabusExam).map(stage => <option key={stage} value={stage}>{stage}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">Subject
            <select className="field mt-2" value={syllabusSubject} onChange={e => {
              setSyllabusSubject(e.target.value); setSyllabusTopics([]); setSyllabusProgress([]);
            }}>
              {getSubjects(syllabusExam, syllabusStage).map(subject => <option key={subject} value={subject}>{subject}</option>)}
            </select>
          </label>
        </div>
        <button type="button" onClick={loadSyllabus} disabled={syllabusBusy} className="mt-4 rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800 disabled:opacity-60">
          {syllabusBusy ? 'Loading syllabus…' : 'Load Syllabus Topics'}
        </button>

        {(() => {
          const topicNames = syllabusTopics.map(item => typeof item === 'string' ? item : item.topic || item.name || item.title).filter(Boolean);
          const getStatus = topic => syllabusProgress.find(item => item.topic === topic && item.exam === syllabusExam && (item.stage || 'General') === syllabusStage && item.subject === syllabusSubject)?.status || 'Not Started';
          const done = topicNames.filter(topic => getStatus(topic) === 'Completed').length;
          const percent = topicNames.length ? Math.round(done / topicNames.length * 100) : 0;
          return <>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Stat label="Total topics" value={topicNames.length} />
              <Stat label="Completed" value={done} tone="green" />
              <Stat label="Syllabus progress" value={`${percent}%`} tone="violet" />
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${percent}%` }} /></div>
            <div className="mt-5 space-y-3">
              {topicNames.map(topic => {
                const status = getStatus(topic);
                return <article key={topic} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-4">
                  <div className="min-w-0 flex-1"><p className="font-bold">{topic}</p><p className="mt-1 text-xs text-slate-500">{syllabusSubject} · {syllabusStage}</p></div>
                  <select aria-label={`Status for ${topic}`} className="field sm:max-w-48" value={status} onChange={e => updateSyllabusProgress(topic, e.target.value)}>
                    {['Not Started', 'In Progress', 'Completed'].map(value => <option key={value} value={value}>{value}</option>)}
                  </select>
                </article>;
              })}
              {!topicNames.length && <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Select an exam, stage and subject, then click “Load Syllabus Topics”.</p>}
            </div>
          </>;
        })()}
        <p className="mt-4 text-xs text-slate-400">Topic lists come from the syllabus blueprint in this app. Progress is saved to your account only when the backend syllabus progress endpoint is configured.</p>
      </section>}

      {active === 'mistakes' && <section className={card}><SectionTitle eyebrow="UNDERSTAND YOUR ERRORS" title="Mistake DNA" description="Record errors and identify topics that need more practice." /><form onSubmit={addMistake}><div className="grid gap-3 md:grid-cols-2"><input className="field" value={mistakeQuestion} onChange={e => setMistakeQuestion(e.target.value)} placeholder="Question or mistake (e.g. confused two articles)" required /><input className="field" value={mistakeTopic} onChange={e => setMistakeTopic(e.target.value)} placeholder="Topic (e.g. Fundamental Rights)" required /></div><div className="mt-3 flex flex-col gap-3 sm:flex-row"><select className="field sm:max-w-xs" value={mistakeType} onChange={e => setMistakeType(e.target.value)}>{mistakeTypes.map(t => <option key={t}>{t}</option>)}</select><button disabled={mistakeBusy} className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800 disabled:opacity-60">{mistakeBusy ? 'Saving…' : '+ Add Mistake'}</button></div></form><div className="mt-6 grid gap-4 sm:grid-cols-2"><Stat label="Mistakes recorded" value={mistakes.length} /><Stat label="Topics to review" value={uniqueTopics} tone="amber" /></div><div className="mt-5 space-y-3">{mistakes.map(m => <article key={m.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 p-4"><div className="min-w-0 flex-1"><p className="font-bold">{m.topic}</p><p className="mt-1 break-words text-sm text-slate-600">{m.question}</p><span className="mt-2 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{m.type}</span></div><button onClick={() => deleteMistake(m.id)} className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">Remove</button></article>)}{!mistakes.length && <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No mistakes recorded yet. Add your first mistake above.</p>}</div></section>}

      {active === 'tests' && <section className={card}><SectionTitle eyebrow="PERSONALISED PRACTICE ENGINE" title="Mock Test Centre" description="Choose an exam, stage, subject and topic. Tests draw only from the matching question bank." /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">

        <label className="text-sm font-semibold">Exam<select className="field mt-2" value={selectedExam} onChange={e => { const exam = e.target.value; setSelectedExam(exam); setTestStage(''); setTestSubject(''); setTestTopic(''); setTopicOptions([]); }}><option value="">Choose exam</option>{allExams.map(exam => <option key={exam.name} value={exam.name}>{exam.name}</option>)}</select></label>

        <label className="text-sm font-semibold">Stage / Paper<select className="field mt-2" value={testStage} onChange={e => { setTestStage(e.target.value); setTestSubject(''); setTestTopic(''); setTopicOptions([]); }}><option value="">All stages / papers</option>{getStages(selectedExam).map(x => <option key={x} value={x}>{x}</option>)}</select></label>

        <label className="text-sm font-semibold">Subject<select className="field mt-2" value={testSubject} onChange={async e => { const sub = e.target.value; setTestSubject(sub); setTestTopic(''); const fallback = getFallbackTopics(selectedExam, sub); setTopicOptions(fallback); if (sub) { try { const d = await api(`/tests/topics?exam=${encodeURIComponent(selectedExam)}&subject=${encodeURIComponent(sub)}`, { token }); if (d.topics?.length) setTopicOptions([...new Set([...fallback, ...d.topics])]); } catch { } } }}><option value="">All subjects</option>{getSubjects(selectedExam, testStage).map(x => <option key={x} value={x}>{x}</option>)}</select></label>

        <label className="text-sm font-semibold">Topic<select className="field mt-2" value={testTopic} onChange={e => setTestTopic(e.target.value)}><option value="">All topics</option>{topicOptions.map(x => <option key={x} value={x}>{x}</option>)}</select></label>

        <label className="text-sm font-semibold">Number of questions<select className="field mt-2" value={testCount} onChange={e => setTestCount(e.target.value)}>{['5', '10', '20', '30', '50', '100', '200', '500', '1000'].map(x =>

          <option key={x} value={x}>{x} questions</option>

        )}</select></label>

      </div><div className="mt-4 flex flex-wrap items-center gap-3"><button onClick={startTest} disabled={testStarted || testBusy} className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800 disabled:opacity-50">{testStarted ? 'Test in progress' : `Start ${testCount}-question test →`}</button>{testStarted && <span className={`rounded-xl px-4 py-3 font-extrabold ${seconds < 60 ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>⏱ {formattedTime}</span>}<span className="text-sm text-slate-500">Questions available depend on the selected exam and filters.</span></div>


        {testStarted && (
          <div className="mt-6">
            <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold text-slate-800">Question Palette</p>
                <p className="text-sm text-slate-500">
                  Answered: {Object.keys(answers).filter(id => answers[id] !== undefined).length}
                  {" / "}{questions.length}
                </p>
              </div>

              <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
                {questions.map((q, i) => {
                  const answered = answers[q.id] !== undefined;
                  const marked = markedQuestions.includes(q.id);

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentQuestion(i)}
                      className={`relative h-10 rounded-lg border text-sm font-bold ${currentQuestion === i
                        ? 'border-blue-700 bg-blue-700 text-white'
                        : marked
                          ? 'border-amber-400 bg-amber-100 text-amber-900'
                          : answered
                            ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
                            : 'border-slate-200 bg-white text-slate-600'
                        }`}
                    >
                      {i + 1}
                      {marked && <span className="absolute -right-1 -top-1">★</span>}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                <span>⬜ Not answered</span>
                <span>🟩 Answered</span>
                <span>🟨 Marked for review</span>
              </div>
            </div>

            {questions[currentQuestion] && (() => {
              const q = questions[currentQuestion];
              const isMarked = markedQuestions.includes(q.id);

              return (
                <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
                      Question {currentQuestion + 1} of {questions.length}
                    </p>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {q.subject || q.topic || 'Practice'}
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-bold leading-7 text-slate-900">
                    {q.question}
                  </h3>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {q.options.map((option, idx) => (
                      <label
                        key={`${q.id}-${idx}`}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm transition ${answers[q.id] === idx
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:bg-slate-50'
                          }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          checked={answers[q.id] === idx}
                          onChange={() =>
                            setAnswers(old => ({ ...old, [q.id]: idx }))
                          }
                          className="mt-1 accent-blue-700"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={currentQuestion === 0}
                      onClick={() => setCurrentQuestion(i => i - 1)}
                      className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold disabled:opacity-40"
                    >
                      ← Previous
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setMarkedQuestions(old =>
                          isMarked
                            ? old.filter(id => id !== q.id)
                            : [...old, q.id]
                        )
                      }
                      className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-800"
                    >
                      {isMarked ? '★ Remove Review Mark' : '☆ Mark for Review'}
                    </button>

                    <button
                      type="button"
                      disabled={currentQuestion === questions.length - 1}
                      onClick={() => setCurrentQuestion(i => i + 1)}
                      className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
                    >
                      Next →
                    </button>
                  </div>
                </article>
              );
            })()}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                {questions.filter(q => answers[q.id] === undefined).length} unanswered
                {" · "}{markedQuestions.length} marked for review
              </p>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to submit this test?')) {
                    submitTest();
                  }
                }}
                disabled={testBusy}
                className="rounded-xl bg-emerald-700 px-6 py-3 font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                {testBusy ? 'Submitting…' : 'Submit Test'}
              </button>
            </div>
          </div>
        )}


        {testResult && <div className="mt-6"><div className="rounded-2xl bg-blue-50 p-6"><p className="text-sm font-semibold text-blue-700">Test submitted · {testResult.exam}</p><p className="mt-2 text-4xl font-black text-slate-900">{testResult.score}%</p>
          <p className="mt-2 text-sm text-slate-600">
            {testResult.correct} correct out of {testResult.total}. Result saved to your account.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm text-emerald-700">Correct</p>
              <p className="mt-1 text-2xl font-extrabold text-emerald-800">
                {testResult.correct}
              </p>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">Incorrect</p>
              <p className="mt-1 text-2xl font-extrabold text-red-800">
                {testReview.filter(q => q.selectedIndex >= 0 && !q.correct).length}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-600">Unanswered</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-800">
                {testReview.filter(q => q.selectedIndex < 0).length}
              </p>
            </div>
          </div>
          <button onClick={startTest} className="mt-4 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white">Try again</button></div>
          <div className="mt-5 rounded-xl border border-blue-200 bg-white p-5">
            <h3 className="text-lg font-extrabold text-slate-900">
              Performance Insights
            </h3>

            <p className="mt-3 text-sm text-slate-600">
              Accuracy:{" "}
              <span className="font-bold text-blue-700">
                {testResult.total > 0
                  ? Math.round(
                    (testResult.correct / testResult.total) * 100
                  )
                  : 0}%
              </span>
            </p>

            <p className="mt-2 text-sm text-slate-600">
              {testResult.score >= 70
                ? "Great work! Keep practising to maintain your performance."
                : testResult.score >= 40
                  ? "Good attempt. Review incorrect answers and practise weak topics."
                  : "Focus on understanding the concepts and revise the explanations before your next test."}
            </p>

            <button
              type="button"
              onClick={() => setActive("performance")}
              className="mt-4 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800"
            >
              View Performance Dashboard →
            </button>
          </div>

          {/* Weak Topics Analysis */}
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h3 className="text-lg font-extrabold text-slate-900">
              Weak Topics Analysis
            </h3>

            <p className="mt-1 text-sm text-slate-600">
              Revise topics where you answered incorrectly or left questions unanswered.
              <button
                type="button"
                onClick={generateWeakTopicAnalysis}
                disabled={aiWeakBusy || !testReview.length}
                className="mt-4 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50"
              >
                {aiWeakBusy ? 'Analyzing your results…' : '✨ Generate AI Revision Plan'}
              </button>

              {aiWeakAnalysis && (
                <div className="mt-4 rounded-2xl border border-blue-200 bg-white p-5 text-sm leading-7 text-slate-700">
                  <h4 className="mb-4 text-lg font-extrabold text-blue-800">
                    ✨ Your Personalized AI Analysis
                  </h4>
                  <div className="whitespace-pre-wrap break-words">
                    {aiWeakAnalysis
                      .replace(/^### /gm, '')
                      .replace(/^## /gm, '')
                      .replace(/^# /gm, '')
                      .replace(/\*\*(.*?)\*\*/g, '$1')
                      .replace(/^\s*\*\s+/gm, '• ')
                      .replace(/^\|[-:\s|]+\|$/gm, '')}
                  </div>
                </div>
              )}
            </p>

            {Object.entries(
              testReview.reduce((groups, q) => {
                const topic = q.topic || q.subject || "General Practice";

                if (!groups[topic]) {
                  groups[topic] = { wrong: 0, unanswered: 0 };
                }

                if (q.selectedIndex < 0) {
                  groups[topic].unanswered += 1;
                } else if (!q.correct) {
                  groups[topic].wrong += 1;
                }

                return groups;
              }, {})
            ).filter(([, stats]) => stats.wrong + stats.unanswered > 0).length > 0 ? (
              <div className="mt-4 space-y-3">
                {Object.entries(
                  testReview.reduce((groups, q) => {
                    const topic = q.topic || q.subject || "General Practice";

                    if (!groups[topic]) {
                      groups[topic] = { wrong: 0, unanswered: 0 };
                    }

                    if (q.selectedIndex < 0) {
                      groups[topic].unanswered += 1;
                    } else if (!q.correct) {
                      groups[topic].wrong += 1;
                    }

                    return groups;
                  }, {})
                )
                  .filter(([, stats]) => stats.wrong + stats.unanswered > 0)
                  .map(([topic, stats]) => (
                    <div
                      key={topic}
                      className="rounded-xl border border-amber-200 bg-white p-4"
                    >
                      <p className="font-bold text-slate-800">{topic}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        Incorrect: {stats.wrong} · Unanswered: {stats.unanswered}
                      </p>
                      <div className="mt-2 text-sm font-semibold text-amber-800">
                        <p>Suggested action: Revise this topic and practise more questions.</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const exam = selectedExam || "UPSC CSE";
                              const topicName = String(topic || "").trim();
                              const subjectMap = {
                                Geography: "General Studies Paper I",
                                "Fundamental Rights": "General Studies Paper I",
                                Constitution: "General Studies Paper I",
                                Polity: "General Studies Paper I",
                              };
                              const subject =
                                subjectMap[topicName] ||
                                getSubjects(exam).find(s =>
                                  getFallbackTopics(exam, s).includes(topicName)
                                ) ||
                                getSubjects(exam)[0] ||
                                "";
                              setTaskExam(exam);
                              setTaskText(`Revise ${topicName}`);
                              setTaskSubject(subject);
                              setTaskTopic(
                                getFallbackTopics(exam, subject).includes(topicName)
                                  ? topicName
                                  : ""
                              );
                              setTaskDuration("45");
                              setActive("planner");
                            }}
                            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800"
                          >
                            Add to Study Planner →
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMentorInput(
                                `I am preparing for ${selectedExam || "UPSC CSE"}. Explain "${topic}" in simple language. My weak-topic analysis shows ${stats.wrong} incorrect and ${stats.unanswered} unanswered questions. Explain the key concepts, common mistakes, and give me 5 practice MCQs with answers.`
                              );
                              setActive("mentor");
                            }}
                            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800"
                          >
                            Ask AI Mentor →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="mt-4 rounded-xl bg-white p-4 text-sm text-emerald-700">
                Great work! No weak topics identified in this test.
              </p>
            )}
          </div>

          <h3 className="mt-6 text-lg font-extrabold">Answer review</h3><div className="mt-3 space-y-3">{testReview.map((q, i) => <div key={q.id} className={`rounded-xl border p-4 ${q.correct ? 'border-emerald-200' : 'border-red-200'}`}><p className="font-bold">{i + 1}. {q.question}</p><p className="mt-2 text-sm">Your answer: {q.selectedIndex >= 0 ? q.options[q.selectedIndex] : 'Not answered'}</p><p className="mt-1 text-sm font-semibold text-emerald-700">Correct answer: {q.options[q.answer]}</p><p className="mt-2 text-sm text-slate-500">{q.explanation}</p></div>)}</div></div>}

        {!testStarted && !testResult && <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center"><span className="text-3xl">🧠</span><p className="mt-3 font-bold">Practice by exam, subject or topic</p><p className="mt-1 text-sm text-slate-500">If a topic has no saved questions yet, generate a batch from Question Bank Admin or import structured questions.</p></div>}

      </section>}

      {active === 'admin' && <section className={card}><SectionTitle eyebrow="CONTENT WORKSHOP" title="Question Bank Admin" description="Build a reusable question library by exam, paper, subject and topic. Admin endpoints require ADMIN_EMAILS in server/.env." /><form onSubmit={async e => { e.preventDefault(); setAdminBusy(true); setAdminMessage('Generating questions with Gemini…'); try { const d = await api('/admin/generate', { token, method: 'POST', body: JSON.stringify({ exam: adminExam, stage: adminStage, subject: adminSubject, topic: adminTopic, count: Number(adminCount) }) }); setAdminMessage(`${d.message} Duplicates: ${d.duplicates}; invalid: ${d.invalid}.`); } catch (err) { setAdminMessage(err.message); } finally { setAdminBusy(false); } }} className="space-y-4"><h3 className="text-lg font-bold">Generate a question batch with AI</h3><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold">Exam<select className="field mt-2" value={adminExam} onChange={e => { const exam = e.target.value; const stages = getStages(exam); const subjects = getSubjects(exam, stages[0]); setAdminExam(exam); setAdminStage(stages[0] || 'General'); setAdminSubject(subjects[0] || 'General'); setAdminTopic(getFallbackTopics(exam, subjects[0])[0] || 'General'); }} required>{allExams.map(exam => <option key={exam.name} value={exam.name}>{exam.name}</option>)}</select></label><label className="text-sm font-semibold">Stage / paper<select className="field mt-2" value={adminStage} onChange={e => { const stage = e.target.value; const subjects = getSubjects(adminExam, stage); setAdminStage(stage); setAdminSubject(subjects[0] || 'General'); setAdminTopic(getFallbackTopics(adminExam, subjects[0])[0] || 'General'); }} required>{getStages(adminExam).map(x => <option key={x} value={x}>{x}</option>)}</select></label><label className="text-sm font-semibold">Subject<select className="field mt-2" value={adminSubject} onChange={e => { setAdminSubject(e.target.value); setAdminTopic(getFallbackTopics(adminExam, e.target.value)[0] || 'General'); }} required>{getSubjects(adminExam, adminStage).map(x => <option key={x} value={x}>{x}</option>)}</select></label><label className="text-sm font-semibold">Topic<select className="field mt-2" value={adminTopic} onChange={e => setAdminTopic(e.target.value)} required>{[...new Set([...(getFallbackTopics(adminExam, adminSubject)), adminTopic].filter(Boolean))].map(x => <option key={x} value={x}>{x}</option>)}</select></label><label className="text-sm font-semibold">Batch size<select className="field mt-2" value={adminCount} onChange={e => setAdminCount(e.target.value)}>{['5', '10', '20', '30', '50', '100', '200', '500', '1000'].map(x => (

        <option key={x} value={x}>{x}</option>

      ))}</select></label></div><button disabled={adminBusy} className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white disabled:opacity-50">{adminBusy ? 'Generating…' : 'Generate and save batch'}</button></form><div className="my-6 border-t border-slate-200" /><form onSubmit={async e => { e.preventDefault(); if (!adminFile) return setAdminMessage('Choose a JSON, CSV or text-based PDF file.'); setAdminBusy(true); setAdminMessage('Importing file…'); try { const form = new FormData(); form.append('file', adminFile); form.append('exam', adminExam); form.append('stage', adminStage); form.append('subject', adminSubject); form.append('topic', adminTopic); const response = await fetch(`${API_URL}/admin/import`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form }); const d = await response.json(); if (!response.ok || d.success === false) throw new Error(d.message || 'Import failed'); setAdminMessage(`Import complete. Inserted: ${d.inserted || 0}, duplicates: ${d.duplicates || 0}, invalid: ${d.invalid || 0}. ${d.extractedTextPreview ? `PDF preview: ${d.extractedTextPreview.slice(0, 300)}` : ''}`); } catch (err) { setAdminMessage(err.message); } finally { setAdminBusy(false); } }} className="space-y-3"><h3 className="text-lg font-bold">Import questions from a file</h3><p className="text-sm text-slate-500">JSON and CSV can be imported as structured questions. Text-based PDFs can be extracted for preview; convert/verify them into the template before publishing. Scanned PDFs need OCR first.</p><input className="field" type="file" accept=".json,.csv,.pdf" onChange={e => setAdminFile(e.target.files?.[0] || null)} required /><button disabled={adminBusy} className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 disabled:opacity-50">Upload / import</button><a className="ml-3 text-sm font-semibold text-blue-700 underline" href="/question-template.json" download>Download JSON template</a></form>{adminMessage && <p className="mt-4 whitespace-pre-wrap rounded-xl bg-blue-50 p-4 text-sm text-blue-800">{adminMessage}</p>}</section>}

      {active === 'performance' && <section className={card}><SectionTitle eyebrow="YOUR PROGRESS" title="Performance overview" description="A summary of your saved study activity and mock test attempts." /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Tests attempted" value={results.length} /><Stat label="Average score" value={`${averageScore}%`} tone="green" /><Stat label="Tasks completed" value={completed} tone="violet" /><Stat label="Mistakes reviewed" value={mistakes.length} tone="amber" /></div>
        <h3 className="mt-8 text-lg font-extrabold">
          Recent Test Performance
        </h3>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
          {results.length > 0 ? (
            <div className="space-y-4">
              {results.slice(0, 7).reverse().map((r, i) => (
                <div key={r._id || i}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-slate-700">
                      {r.exam} · {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                    <span className="font-bold text-blue-700">
                      {r.score}%
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all"
                      style={{
                        width: `${Math.max(0, Math.min(100, Number(r.score) || 0))}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Complete a mock test to see your performance chart.
            </p>
          )}
        </div>
        <h3 className="mt-8 text-lg font-extrabold">Test history</h3><div className="mt-3 space-y-3">{results.map(r => <div key={r._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"><div><p className="font-bold">{r.exam}</p><p className="mt-1 text-xs text-slate-500">{new Date(r.createdAt).toLocaleString()} · {r.correct}/{r.total} correct</p></div><span className={`rounded-xl px-4 py-2 font-extrabold ${r.score >= 70 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{r.score}%</span></div>)}{!results.length && <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Complete your first mock test to see your results here.</p>}</div></section>}

      {active === 'mentor' && <section className={card}><SectionTitle eyebrow="ASK · UNDERSTAND · IMPROVE" title="Prashnora AI Mentor" description="Ask for concept explanations, revision plans, or help understanding mistakes." /><div className="mb-4 flex flex-wrap gap-2">{['Explain Fundamental Rights simply', 'Make a 3-hour study plan', 'Explain percentage calculation'].map(prompt => <button key={prompt} onClick={() => setMentorInput(prompt)} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100">{prompt}</button>)}</div><div className="max-h-[52vh] min-h-64 space-y-4 overflow-y-auto rounded-2xl bg-slate-50 p-4">{mentorMessages.map((m, i) => <div key={`${i}-${m.role}`} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${m.role === 'user' ? 'bg-blue-700 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>{m.content}{m.mode === 'built-in' && <p className="mt-3 border-t border-slate-100 pt-2 text-[10px] text-slate-400">Built-in guidance mode</p>}</div></div>)}{mentorBusy && <p className="text-sm text-slate-400">Mentor is thinking…</p>}</div><form onSubmit={askMentor} className="mt-4 flex flex-col gap-3 sm:flex-row"><textarea className="field min-h-14 flex-1 resize-y" rows="2" value={mentorInput} onChange={e => setMentorInput(e.target.value)} placeholder="Ask a question or describe a topic…" maxLength={3000} required /><button disabled={mentorBusy} className="rounded-xl bg-blue-700 px-6 py-3 font-bold text-white hover:bg-blue-800 disabled:opacity-50">{mentorBusy ? 'Thinking…' : 'Ask mentor ↑'}</button></form><p className="mt-3 text-xs text-slate-400">AI responses can be incorrect. Verify important exam facts against trusted sources.</p></section>}

      <footer className="py-8 text-center text-xs text-slate-400">© 2026 Prashnora · Learn smarter, every day.</footer>

    </main>

  </div>;

}
