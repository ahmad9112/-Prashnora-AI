const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const multer = require('multer');
const pdf = require('pdf-parse');
const Question = require('./models/Question');

const User = require('./models/User');
const StudyTask = require('./models/StudyTask');
const Mistake = require('./models/Mistake');
const TestResult = require('./models/TestResult');

const app = express();
const PORT = Number(process.env.PORT || 5000);
const JWT_SECRET = process.env.JWT_SECRET;
// app.use(cors({ origin: (process.env.CLIENT_URL || 'http://localhost:5174').split(',').map(v => v.trim()) }));
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
}));
app.use(express.json({ limit: '1mb' }));

function makeToken(user) {
  const b64 = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const header = b64({ alg: 'HS256', typ: 'JWT' });
  const payload = b64({ sub: String(user._id), name: user.name, email: user.email, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 });
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}
function verifyToken(token) {
  const parts = (token || '').split('.');
  if (parts.length !== 3) throw new Error('Invalid token');
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${parts[0]}.${parts[1]}`).digest();
  const actual = Buffer.from(parts[2], 'base64url');
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) throw new Error('Invalid token');
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Session expired');
  return payload;
}
function auth(req, res, next) {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : '';
    if (!token) return res.status(401).json({ success: false, message: 'Please sign in to continue.' });
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Session expired. Please sign in again.' });
  }
}
const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => new Promise((resolve, reject) => {
  crypto.scrypt(password, salt, 64, (err, key) => err ? reject(err) : resolve(`${salt}:${key.toString('hex')}`));
});
const checkPassword = (password, stored) => new Promise((resolve, reject) => {
  const [salt, keyHex] = (stored || '').split(':');
  if (!salt || !keyHex) return resolve(false);
  crypto.scrypt(password, salt, 64, (err, key) => {
    if (err) return reject(err);
    const expected = Buffer.from(keyHex, 'hex');
    resolve(expected.length === key.length && crypto.timingSafeEqual(expected, key));
  });
});
const safeUser = user => ({ id: String(user._id), name: user.name, email: user.email });

app.get('/', (_req, res) => res.json({ success: true, message: 'Prashnora backend is running.' }));
app.get('/api/health', (_req, res) => res.json({ success: true, database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));

app.post('/api/auth/signup', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (name.length < 2) return res.status(400).json({ success: false, message: 'Name must contain at least 2 characters.' });
    // if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid email address.'
      });
    }
    if (password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    if (await User.exists({ email })) return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    const user = await User.create({ name, email, passwordHash: await hashPassword(password) });
    res.status(201).json({ success: true, token: makeToken(user), user: safeUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    console.error('Signup:', error.message); res.status(500).json({ success: false, message: 'Could not create account.' });
  }
});
app.post('/api/auth/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await User.findOne({ email });
    if (!user || !(await checkPassword(password, user.passwordHash))) return res.status(401).json({ success: false, message: 'Email or password is incorrect.' });
    res.json({ success: true, token: makeToken(user), user: safeUser(user) });
  } catch (error) { console.error('Login:', error.message); res.status(500).json({ success: false, message: 'Could not sign in.' }); }
});
app.get('/api/auth/me', auth, async (req, res) => {
  const user = await User.findById(req.user.sub).select('name email');
  if (!user) return res.status(401).json({ success: false, message: 'Account not found.' });
  res.json({ success: true, user: safeUser(user) });
});


/* ============ PERSONAL STUDY PLANNER API ============ */

// Get all tasks for the signed-in user
app.get('/api/tasks', auth, async (req, res) => {
  try {
    const tasks = await StudyTask.find({
      userId: req.user.sub
    }).sort({ dueDate: 1, createdAt: -1 });

    res.json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    console.error('Fetch study tasks:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch study tasks.'
    });
  }
});

// Create a task
app.post('/api/tasks', auth, async (req, res) => {
  try {
    const task = String(req.body.task || '').trim();
    const subject = String(req.body.subject || '').trim();
    const exam = String(req.body.exam || '').trim();
    const topic = String(req.body.topic || '').trim();
    const duration = Number(req.body.duration ?? 30);

    if (!task || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Task and subject are required.'
      });
    }

    if (
      !Number.isInteger(duration) ||
      duration < 1 ||
      duration > 1440
    ) {
      return res.status(400).json({
        success: false,
        message: 'Duration must be between 1 and 1440 minutes.'
      });
    }

    const parseOptionalDate = value => {
      if (!value) return null;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? undefined : date;
    };

    const dueDate = parseOptionalDate(req.body.dueDate);
    const reminderAt = parseOptionalDate(req.body.reminderAt);

    if (dueDate === undefined || reminderAt === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid due date and reminder time.'
      });
    }

    const created = await StudyTask.create({
      userId: req.user.sub,
      task,
      subject,
      exam,
      topic,
      duration,
      dueDate,
      reminderAt,
      source: ['manual', 'ai', 'weak-topic', 'syllabus']
        .includes(req.body.source)
        ? req.body.source
        : 'manual'
    });

    res.status(201).json({
      success: true,
      task: created
    });
  } catch (error) {
    console.error('Create study task:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to save study task.'
    });
  }
});

// Update completion status or task details
app.patch('/api/tasks/:id', auth, async (req, res) => {
  try {
    const allowedFields = [
      'task',
      'subject',
      'exam',
      'topic',
      'duration',
      'dueDate',
      'reminderAt',
      'completed'
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided to update.'
      });
    }

    if (
      Object.prototype.hasOwnProperty.call(updates, 'completed') &&
      typeof updates.completed !== 'boolean'
    ) {
      return res.status(400).json({
        success: false,
        message: 'completed must be true or false.'
      });
    }

    if (typeof updates.task === 'string') {
      updates.task = updates.task.trim();
      if (!updates.task) {
        return res.status(400).json({
          success: false,
          message: 'Task cannot be empty.'
        });
      }
    }

    if (typeof updates.subject === 'string') {
      updates.subject = updates.subject.trim();
      if (!updates.subject) {
        return res.status(400).json({
          success: false,
          message: 'Subject cannot be empty.'
        });
      }
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'duration')) {
      updates.duration = Number(updates.duration);

      if (
        !Number.isInteger(updates.duration) ||
        updates.duration < 1 ||
        updates.duration > 1440
      ) {
        return res.status(400).json({
          success: false,
          message: 'Duration must be between 1 and 1440 minutes.'
        });
      }
    }

    for (const field of ['dueDate', 'reminderAt']) {
      if (Object.prototype.hasOwnProperty.call(updates, field)) {
        if (!updates[field]) {
          updates[field] = null;
        } else {
          const date = new Date(updates[field]);

          if (Number.isNaN(date.getTime())) {
            return res.status(400).json({
              success: false,
              message: `Invalid ${field}.`
            });
          }

          updates[field] = date;
        }
      }
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'completed')) {
      updates.completedAt = updates.completed ? new Date() : null;
    }

    const task = await StudyTask.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.sub
      },
      { $set: updates },
      {
        new: true,
        runValidators: true
      }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.'
      });
    }

    res.json({
      success: true,
      task
    });
  } catch (error) {
    console.error('Update study task:', error.message);
    res.status(400).json({
      success: false,
      message: 'Unable to update study task.'
    });
  }
});

// Delete a task
app.delete('/api/tasks/:id', auth, async (req, res) => {
  try {
    const task = await StudyTask.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.sub
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.'
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete study task:', error.message);
    res.status(400).json({
      success: false,
      message: 'Unable to delete study task.'
    });
  }
});

const mistakeTypes = ['Concept Gap', 'Calculation Error', 'Misread Question', 'Guessing', 'Time Pressure'];
app.get('/api/mistakes', auth, async (req, res) => {
  try { const mistakes = await Mistake.find({ userId: req.user.sub }).sort({ createdAt: -1 }); res.json({ success: true, count: mistakes.length, mistakes }); }
  catch (e) { console.error(e.message); res.status(500).json({ success: false, message: 'Failed to fetch mistakes.' }); }
});
app.post('/api/mistakes', auth, async (req, res) => {
  try {
    const question = String(req.body.question || '').trim(); const topic = String(req.body.topic || '').trim(); const type = req.body.type || 'Concept Gap';
    if (!question || !topic) return res.status(400).json({ success: false, message: 'Question and topic are required.' });
    if (!mistakeTypes.includes(type)) return res.status(400).json({ success: false, message: 'Invalid mistake type.' });
    const mistake = await Mistake.create({ userId: req.user.sub, question, topic, type }); res.status(201).json({ success: true, mistake });
  } catch (e) { console.error(e.message); res.status(500).json({ success: false, message: 'Failed to save mistake.' }); }
});
app.delete('/api/mistakes/:id', auth, async (req, res) => {
  try { const mistake = await Mistake.findOneAndDelete({ _id: req.params.id, userId: req.user.sub }); if (!mistake) return res.status(404).json({ success: false, message: 'Mistake not found.' }); res.json({ success: true }); }
  catch { res.status(400).json({ success: false, message: 'Unable to delete mistake.' }); }
});

const sampleQuestionBank = [
  { id: 'q1', exam: 'UPSC CSE', stage: 'Prelims', section: 'General Studies I', subject: 'Polity', topic: 'Fundamental Rights', question: 'Which part of the Indian Constitution contains Fundamental Rights?', options: ['Part II', 'Part III', 'Part IV', 'Part IVA'], answer: 1, explanation: 'Fundamental Rights are listed in Part III (Articles 12–35).', difficulty: 'Easy' },
  { id: 'q2', exam: 'UPSC CSE', stage: 'Prelims', section: 'General Studies I', subject: 'Polity', topic: 'Union Executive', question: 'Who is the constitutional head of the Union Executive?', options: ['Prime Minister', 'Chief Justice of India', 'President', 'Lok Sabha Speaker'], answer: 2, explanation: 'The President is the constitutional head of the Union Executive.', difficulty: 'Easy' },
  { id: 'q3', exam: 'UPSC CSE', stage: 'Prelims', section: 'General Studies I', subject: 'Geography', topic: 'Indian Rivers', question: 'Which is the longest river that flows entirely within India?', options: ['Ganga', 'Godavari', 'Narmada', 'Krishna'], answer: 1, explanation: 'The Godavari is commonly described as the longest river flowing entirely within India.', difficulty: 'Easy' },
  { id: 'q4', exam: 'UPSC CSE', stage: 'Prelims', section: 'General Studies I', subject: 'History', topic: 'National Movement', question: 'The Quit India Movement began in which year?', options: ['1919', '1930', '1942', '1946'], answer: 2, explanation: 'The Quit India Movement was launched in August 1942.', difficulty: 'Easy' },
  { id: 'q5', exam: 'SSC CGL', stage: 'Tier I', section: 'General Awareness', subject: 'Polity', topic: 'Constitution', question: 'Which part of the Indian Constitution contains Fundamental Rights?', options: ['Part II', 'Part III', 'Part IV', 'Part IVA'], answer: 1, explanation: 'Fundamental Rights are listed in Part III (Articles 12–35).', difficulty: 'Easy' },
  { id: 'q6', exam: 'State PCS', stage: 'Prelims', section: 'General Studies', subject: 'Polity', topic: 'Constitution', question: 'Directive Principles of State Policy are in which part of the Constitution?', options: ['Part III', 'Part IV', 'Part V', 'Part VI'], answer: 1, explanation: 'Directive Principles are contained in Part IV.', difficulty: 'Easy' },
  { id: 'q7', exam: 'JEE Main', stage: 'Paper 1', section: 'Physics', subject: 'Physics', topic: 'Units and Dimensions', question: 'What is the SI unit of electric current?', options: ['Volt', 'Ohm', 'Ampere', 'Watt'], answer: 2, explanation: 'The SI unit of electric current is the ampere.', difficulty: 'Easy' },
  { id: 'q8', exam: 'JEE Main', stage: 'Paper 1', section: 'Mathematics', subject: 'Mathematics', topic: 'Quadratic Equations', question: 'The sum of roots of ax² + bx + c = 0, where a ≠ 0, is:', options: ['c/a', '-b/a', 'b/a', '-c/a'], answer: 1, explanation: 'By Vieta’s formulas, the sum of roots is -b/a.', difficulty: 'Easy' },
  { id: 'q9', exam: 'GATE', stage: 'Computer Science', section: 'Core CS', subject: 'Computer Science', topic: 'Data Structures', question: 'Which data structure follows the LIFO principle?', options: ['Queue', 'Stack', 'Linked list', 'Binary tree'], answer: 1, explanation: 'A stack follows Last In, First Out (LIFO).', difficulty: 'Easy' },
  { id: 'q10', exam: 'NEET-UG', stage: 'UG', section: 'Biology', subject: 'Biology', topic: 'Cell Biology', question: 'Which organelle is the primary site of aerobic ATP production in eukaryotic cells?', options: ['Golgi apparatus', 'Lysosome', 'Mitochondrion', 'Ribosome'], answer: 2, explanation: 'Mitochondria carry out most aerobic cellular respiration and ATP production.', difficulty: 'Easy' },
  { id: 'q11', exam: 'IBPS PO', stage: 'Prelims', section: 'Quantitative Aptitude', subject: 'Quantitative Aptitude', topic: 'Percentages', question: 'A value of 80 is increased by 25%. What is the new value?', options: ['90', '95', '100', '105'], answer: 2, explanation: '25% of 80 is 20, so the new value is 100.', difficulty: 'Easy' },
  { id: 'q12', exam: 'CAT', stage: 'Entrance', section: 'Quantitative Aptitude', subject: 'Quantitative Aptitude', topic: 'Percentages', question: 'A quantity rises from 200 to 250. What is the percentage increase?', options: ['20%', '25%', '30%', '50%'], answer: 1, explanation: 'Increase is 50; 50/200 × 100 = 25%.', difficulty: 'Easy' },
];
const examBlueprints = {
  'GATE': { stages: ['Computer Science', 'Mechanical Engineering', 'Electrical Engineering', 'Civil Engineering', 'Electronics and Communication', 'Data Science and AI'], subjects: ['Engineering Mathematics', 'General Aptitude', 'Computer Science', 'Digital Logic', 'Computer Organization', 'Programming and Data Structures', 'Algorithms', 'Operating Systems', 'DBMS', 'Computer Networks', 'Theory of Computation', 'Compiler Design'] },
  'JEE Main': { stages: ['Paper 1'], subjects: ['Physics', 'Chemistry', 'Mathematics'] },
  'JEE Advanced': { stages: ['Paper 1', 'Paper 2'], subjects: ['Physics', 'Chemistry', 'Mathematics'] },
  'UPSC CSE': { stages: ['Prelims', 'Mains', 'CSAT'], subjects: ['Polity', 'History', 'Geography', 'Economy', 'Environment', 'Science and Technology', 'Current Affairs', 'CSAT'] },
  'SSC CGL': { stages: ['Tier I', 'Tier II'], subjects: ['Quantitative Aptitude', 'Reasoning', 'English', 'General Awareness', 'Computer Knowledge'] },
  'State PCS': { stages: ['Prelims', 'Mains'], subjects: ['State GK', 'Polity', 'History', 'Geography', 'Economy', 'Environment', 'Current Affairs'] },
  'NEET-UG': { stages: ['UG'], subjects: ['Physics', 'Chemistry', 'Botany', 'Zoology'] },
  'IBPS PO': { stages: ['Prelims', 'Mains'], subjects: ['Quantitative Aptitude', 'Reasoning', 'English', 'Banking Awareness', 'General Awareness', 'Computer Aptitude'] },
  'IBPS Clerk': { stages: ['Prelims', 'Mains'], subjects: ['Quantitative Aptitude', 'Reasoning', 'English', 'Banking Awareness'] },
  'SBI PO': { stages: ['Prelims', 'Mains'], subjects: ['Quantitative Aptitude', 'Reasoning', 'English', 'Banking Awareness'] },
  'CAT': { stages: ['Entrance'], subjects: ['VARC', 'DILR', 'Quantitative Aptitude'] },
};
const cleanText = value => String(value || '').trim();
const fingerprint = q => crypto.createHash('sha256').update(`${cleanText(q.exam).toLowerCase()}|${cleanText(q.subject).toLowerCase()}|${cleanText(q.topic).toLowerCase()}|${cleanText(q.question).toLowerCase().replace(/\s+/g, ' ')}`).digest('hex');
const normalizeQuestion = (q, defaults = {}) => {
  const options = Array.isArray(q.options) ? q.options.map(String) : [];
  const answer = Number(q.answer);
  const normalized = { exam: cleanText(q.exam || defaults.exam), stage: cleanText(q.stage || defaults.stage || 'General'), section: cleanText(q.section || defaults.section || q.subject || 'General'), subject: cleanText(q.subject || defaults.subject), topic: cleanText(q.topic || defaults.topic || 'General'), question: cleanText(q.question), options, answer, explanation: cleanText(q.explanation), difficulty: ['Easy', 'Medium', 'Hard'].includes(q.difficulty) ? q.difficulty : 'Medium', source: q.source || defaults.source || 'Admin upload' };
  if (!normalized.exam || !normalized.subject || !normalized.topic || normalized.question.length < 5 || options.length !== 4 || options.some(x => !x.trim()) || !Number.isInteger(answer) || answer < 0 || answer > 3) return null;
  normalized.fingerprint = fingerprint(normalized);
  return normalized;
};
const adminOnly = (req, res, next) => {
  const admins = (process.env.ADMIN_EMAILS || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
  if (!admins.includes(String(req.user.email || '').toLowerCase())) return res.status(403).json({ success: false, message: 'Admin access required. Add your account email to ADMIN_EMAILS in server/.env.' });
  next();
};
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024, files: 1 } });
app.get('/api/tests/catalog', auth, async (_req, res) => {
  try {
    const exams = new Set([...Object.keys(examBlueprints), ...sampleQuestionBank.map(q => q.exam)]);
    const counts = await Question.aggregate([{ $group: { _id: '$exam', count: { $sum: 1 } } }]);
    const countMap = Object.fromEntries(counts.map(c => [c._id, c.count]));
    res.json({ success: true, exams: [...exams].map(name => ({ name, stages: examBlueprints[name]?.stages || ['General'], subjects: examBlueprints[name]?.subjects || [], count: countMap[name] || 0 })) });
  } catch (e) { console.error(e.message); res.status(500).json({ success: false, message: 'Could not load exam catalogue.' }); }
});
app.get('/api/tests/topics', auth, async (req, res) => {
  const { exam, subject } = req.query;
  if (!exam || !subject) return res.status(400).json({ success: false, message: 'Exam and subject are required.' });
  try {
    const stored = await Question.distinct('topic', { exam, subject });
    const sample = sampleQuestionBank.filter(q => q.exam === exam && q.subject === subject).map(q => q.topic);
    res.json({ success: true, topics: [...new Set([...stored, ...sample])] });
  } catch (e) { res.status(500).json({ success: false, message: 'Could not load topics.' }); }
});
app.get('/api/tests/questions', auth, async (req, res) => {
  try {
    const exam = cleanText(req.query.exam || 'UPSC CSE');
    const subject = cleanText(req.query.subject);
    const topic = cleanText(req.query.topic);
    const stage = cleanText(req.query.stage);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));
    const filter = { exam, ...(subject ? { subject } : {}), ...(topic ? { topic } : {}), ...(stage ? { stage } : {}) };
    let found = await Question.find(filter).lean();
    if (!found.length) found = sampleQuestionBank.filter(q => q.exam === exam && (!subject || q.subject === subject) && (!topic || q.topic === topic) && (!stage || q.stage === stage));
    found = found.sort(() => Math.random() - 0.5).slice(0, limit);
    const questions = found.map(q => ({ id: String(q._id || q.id), exam: q.exam, stage: q.stage, section: q.section, subject: q.subject, topic: q.topic, question: q.question, options: q.options, difficulty: q.difficulty }));
    res.json({ success: true, questions, count: questions.length, available: found.length, filters: { exam, subject, topic, stage } });
  } catch (e) { console.error(e.message); res.status(500).json({ success: false, message: 'Could not fetch questions.' }); }
});
app.post('/api/tests/submit', auth, async (req, res) => {
  try {
    const submitted = Array.isArray(req.body.answers) ? req.body.answers : [];
    if (!submitted.length) return res.status(400).json({ success: false, message: 'Submit at least one answer.' });
    const ids = submitted.map(a => String(a.questionId));
    const stored = await Question.find({ _id: { $in: ids.filter(id => mongoose.isValidObjectId(id)) } }).lean();
    const byId = new Map(stored.map(q => [String(q._id), q]));
    for (const q of sampleQuestionBank) byId.set(q.id, q);
    const answers = submitted.map(a => { const q = byId.get(String(a.questionId)); return q ? { questionId: String(a.questionId), selectedIndex: Number.isInteger(a.selectedIndex) ? a.selectedIndex : -1, correct: Number(a.selectedIndex) === q.answer, question: q } : null; }).filter(Boolean);
    if (!answers.length) return res.status(400).json({ success: false, message: 'Questions were not found. Start a new test and try again.' });
    const correct = answers.filter(a => a.correct).length; const score = Math.round(correct / answers.length * 100);
    const exam = String(req.body.exam || 'General Studies');
    const result = await TestResult.create({ userId: req.user.sub, exam, total: answers.length, correct, score, answers: answers.map(a => ({ questionId: a.questionId, selectedIndex: a.selectedIndex, correct: a.correct })) });
    res.status(201).json({ success: true, result: { id: result._id, exam, total: answers.length, correct, score, createdAt: result.createdAt }, review: answers.map(a => ({ id: a.questionId, ...a.question, selectedIndex: a.selectedIndex, correct: a.correct })) });
  } catch (e) { console.error(e.message); res.status(500).json({ success: false, message: 'Could not save test result.' }); }
});
app.get('/api/admin/question-stats', auth, adminOnly, async (_req, res) => {
  const stats = await Question.aggregate([{ $group: { _id: { exam: '$exam', subject: '$subject', topic: '$topic' }, count: { $sum: 1 } } }, { $sort: { '_id.exam': 1, '_id.subject': 1, '_id.topic': 1 } }]);
  res.json({ success: true, total: stats.reduce((n, x) => n + x.count, 0), stats });
});

app.post('/api/admin/generate', auth, adminOnly, async (req, res) => {
  const exam = cleanText(req.body.exam);
  const stage = cleanText(req.body.stage || 'General');
  const subject = cleanText(req.body.subject);
  const topic = cleanText(req.body.topic);
  const count = Number(req.body.count) || 10;

  if (!exam || !subject || !topic) {
    return res.status(400).json({
      success: false,
      message: 'Exam, subject and topic are required.'
    });
  }

  if (![5, 10, 20, 30, 50, 100, 200, 500, 1000].includes(count)) {
    return res.status(400).json({
      success: false,
      message: 'Choose a supported batch size.'
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({
      success: false,
      message: 'GEMINI_API_KEY is missing in server/.env.'
    });
  }

  let inserted = 0;
  let duplicates = 0;
  let invalid = 0;
  let generated = 0;
  const batchSize = 10;
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });

  try {
    while (generated < count) {
      const size = Math.min(batchSize, count - generated);

      const prompt = `
Create exactly ${size} original multiple-choice questions.
Exam: ${exam}
Stage/Paper: ${stage}
Subject: ${subject}
Topic: ${topic}

Return only a JSON array. Each item must contain:
question: string
options: exactly four strings
answer: zero-based integer from 0 to 3
explanation: string
difficulty: Easy, Medium, or Hard

Ensure the answer is correct. Avoid repeated questions.
Do not claim generated questions are official previous-year questions.
`;

      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                question: { type: 'STRING' },
                options: {
                  type: 'ARRAY',
                  items: { type: 'STRING' }
                },
                answer: { type: 'INTEGER' },
                explanation: { type: 'STRING' },
                difficulty: { type: 'STRING' }
              },
              required: [
                'question',
                'options',
                'answer',
                'explanation',
                'difficulty'
              ]
            }
          }
        }
      });

      const raw = String(response.text || '').trim();
      const parsed = JSON.parse(raw);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('AI returned an empty or invalid question batch.');
      }

      const docs = parsed
        .map(q => normalizeQuestion({
          ...q,
          exam,
          stage,
          section: subject,
          subject,
          topic,
          source: 'AI practice'
        }))
        .filter(Boolean);

      invalid += parsed.length - docs.length;

      if (docs.length) {
        try {
          const result = await Question.insertMany(docs, {
            ordered: false
          });
          inserted += result.length;
        } catch (dbError) {
          // MongoDB may save valid documents even when duplicates exist.
          inserted += dbError.insertedDocs?.length || 0;

          if (dbError.code === 11000 || dbError.writeErrors) {
            duplicates += dbError.writeErrors?.length || 1;
          } else {
            throw dbError;
          }
        }
      }

      generated += parsed.length;

      // Stop safely if the AI returns fewer questions than requested.
      if (parsed.length < size) {
        break;
      }
    }

    return res.json({
      success: true,
      requested: count,
      generated,
      inserted,
      duplicates,
      invalid,
      message: `Generation finished. Saved ${inserted} new questions to MongoDB.`
    });

  } catch (error) {
    console.error('Question generation error:', error.message);

    return res.status(502).json({
      success: false,
      requested: count,
      generated,
      inserted,
      duplicates,
      invalid,
      message:
        `Generation stopped after ${generated} questions. ` +
        `${inserted} were saved. ${error.message}`
    });
  }
});

app.post('/api/admin/import', auth, adminOnly, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Choose a JSON, CSV or text-based PDF file.' });
    const ext = (req.file.originalname.split('.').pop() || '').toLowerCase();
    let rows = [];
    if (ext === 'json') { const parsed = JSON.parse(req.file.buffer.toString('utf8')); rows = Array.isArray(parsed) ? parsed : (parsed.questions || []); }
    else if (ext === 'csv') {
      const lines = req.file.buffer.toString('utf8').split(/\r?\n/).filter(Boolean);
      const headers = (lines.shift() || '').split(',').map(h => h.trim().toLowerCase());
      rows = lines.map(line => { const vals = line.split(',').map(v => v.trim()); const row = Object.fromEntries(headers.map((h, i) => [h, vals[i] || ''])); row.options = [row.option1, row.option2, row.option3, row.option4]; row.answer = /^\d+$/.test(row.answer) ? Number(row.answer) : ['a', 'b', 'c', 'd'].indexOf(String(row.answer).toLowerCase()); return row; });
    } else if (ext === 'pdf') {
      const data = await pdf(req.file.buffer);
      const extractedText = String(data.text || '').trim();
      if (!extractedText) return res.status(422).json({ success: false, message: 'No selectable text found in this PDF. It may be scanned; run OCR or convert it to JSON/CSV first.' });
      if (!process.env.GEMINI_API_KEY) return res.status(503).json({ success: false, message: 'PDF text was extracted, but GEMINI_API_KEY is needed to structure questions. Use JSON/CSV import or configure Gemini.' });
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Extract only multiple-choice questions actually present in the supplied exam paper text. Do not invent missing questions or answer keys. Return ONLY a JSON array; each item must contain question, options (exactly four strings), answer (zero-based integer 0-3 only if the correct answer is explicitly present or can be confidently determined), explanation, difficulty (Easy/Medium/Hard), subject and topic. Skip questions where options or answer cannot be reliably determined. Default exam: ${cleanText(req.body.exam)}; stage: ${cleanText(req.body.stage)}; default subject: ${cleanText(req.body.subject)}; default topic: ${cleanText(req.body.topic)}. Paper text:\n${extractedText.slice(0, 28000)}`;
      const response = await ai.models.generateContent({ model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite', contents: prompt });
      const raw = String(response.text || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      rows = JSON.parse(raw);
      if (!Array.isArray(rows)) throw new Error('AI could not structure the PDF. Try JSON/CSV import instead.');
    } else return res.status(400).json({ success: false, message: 'Supported formats: JSON, CSV, PDF.' });
    const defaults = { exam: req.body.exam, stage: req.body.stage, subject: req.body.subject, topic: req.body.topic, source: 'Admin upload', createdBy: req.user.email };
    let inserted = 0, duplicates = 0, invalid = 0;
    for (const row of rows) { const q = normalizeQuestion({ ...row, createdBy: req.user.email }, defaults); if (!q) { invalid++; continue; } try { await Question.create(q); inserted++; } catch (e) { if (e.code === 11000) duplicates++; else throw e; } }
    res.json({ success: true, inserted, duplicates, invalid, totalRows: rows.length });
  } catch (e) { res.status(400).json({ success: false, message: `Import failed: ${e.message}` }); }
});
app.get('/api/results', auth, async (req, res) => {
  try { const results = await TestResult.find({ userId: req.user.sub }).sort({ createdAt: -1 }).limit(30).select('-answers'); res.json({ success: true, results }); }
  catch { res.status(500).json({ success: false, message: 'Could not load results.' }); }
});

/* ============ AI STUDY PLANNER API ============ */

app.post('/api/planner/generate', auth, async (req, res) => {
  try {
    const exam = String(req.body.exam || 'UPSC CSE').trim();
    const dailyHours = Number(req.body.dailyHours ?? 4);
    const preferredSessionMinutes = Number(
      req.body.preferredSessionMinutes ?? 90
    );
    const priority = String(req.body.priority || 'weak').trim();
    const examDate = req.body.examDate || null;

    // Validate inputs
    if (!exam || exam.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid exam name.'
      });
    }

    if (
      !Number.isFinite(dailyHours) ||
      dailyHours < 1 ||
      dailyHours > 12
    ) {
      return res.status(400).json({
        success: false,
        message: 'Daily study hours must be between 1 and 12.'
      });
    }

    if (![45, 60, 90, 120].includes(preferredSessionMinutes)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid preferred session duration.'
      });
    }

    if (!['weak', 'balanced', 'revision'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid study priority.'
      });
    }

    let validatedExamDate = null;

    if (examDate) {
      validatedExamDate = new Date(examDate);

      if (Number.isNaN(validatedExamDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid exam date.'
        });
      }

      validatedExamDate = validatedExamDate.toISOString().slice(0, 10);
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'GEMINI_API_KEY missing in server/.env'
      });
    }

    // Get only the signed-in user's mistakes
    const mistakes = await Mistake.find({
      userId: req.user.sub
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('topic type question createdAt')
      .lean();

    // Count repeated mistakes by topic
    const topicCounts = {};

    for (const mistake of mistakes) {
      const topic = String(mistake.topic || '').trim();

      if (topic) {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      }
    }

    const weakTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([topic, count]) => ({
        topic,
        mistakes: count
      }));

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    const totalMinutes = dailyHours * 60;

    const prompt = `
You are the AI study planner for Prashnora AI.

Create a practical one-day study timetable.

STUDENT SETTINGS
Exam: ${exam}
Daily available study time: ${dailyHours} hours
Maximum study duration: ${totalMinutes} minutes
Preferred session length: ${preferredSessionMinutes} minutes
Priority: ${priority}
Exam date: ${validatedExamDate || 'Not provided'}

STUDENT'S RECORDED WEAK TOPICS
${weakTopics.length
  ? JSON.stringify(weakTopics)
  : 'No recorded weak topics. Do not claim any topic is a proven weakness.'}

RULES
1. Use relevant subjects and topics for the selected exam.
2. Total session duration must not exceed ${totalMinutes} minutes.
3. Prefer sessions of approximately ${preferredSessionMinutes} minutes.
4. A shorter final session is allowed to fit the time limit.
5. For "weak", put recorded weak topics first when available.
6. If no weak topics are recorded, begin with important foundational topics.
7. For "balanced", combine syllabus coverage, practice and revision.
8. For "revision", focus on revision, active recall and practice questions.
9. Include realistic tasks, not vague instructions.
10. Do not invent an official exam date.
11. Do not include break time in study-session duration.
12. Return ONLY valid JSON, without Markdown fences.

Required JSON format:
{
  "plan": [
    {
      "task": "Revise Fundamental Rights",
      "subject": "Polity",
      "topic": "Fundamental Rights",
      "duration": 90,
      "reason": "Revise key constitutional provisions and solve practice questions"
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const rawText = String(response.text || '').trim();

    if (!rawText) {
      return res.status(502).json({
        success: false,
        message: 'Gemini returned an empty timetable.'
      });
    }

    let parsed;

    try {
      parsed = JSON.parse(rawText);
    } catch (error) {
      console.error('Invalid timetable JSON:', error.message);

      return res.status(502).json({
        success: false,
        message: 'AI returned an invalid timetable. Please try again.'
      });
    }

    if (!Array.isArray(parsed.plan) || parsed.plan.length === 0) {
      return res.status(502).json({
        success: false,
        message: 'No study sessions were generated.'
      });
    }

    // Enforce the daily study-time limit on the server
    let remainingMinutes = totalMinutes;
    const plan = [];

    for (const item of parsed.plan.slice(0, 12)) {
      if (remainingMinutes <= 0) break;

      const requestedDuration = Number(item.duration);

      const safeRequestedDuration =
        Number.isFinite(requestedDuration) && requestedDuration > 0
          ? Math.round(requestedDuration)
          : preferredSessionMinutes;

      const duration = Math.min(
        safeRequestedDuration,
        remainingMinutes
      );

      const task = String(item.task || '').trim();
      const subject = String(item.subject || '').trim();
      const topic = String(item.topic || '').trim();
      const reason = String(item.reason || '').trim();

      if (!task || !subject) continue;

      plan.push({
        task: task.slice(0, 250),
        subject: subject.slice(0, 150),
        topic: topic.slice(0, 150),
        duration,
        reason: reason.slice(0, 500)
      });

      remainingMinutes -= duration;
    }

    if (!plan.length) {
      return res.status(502).json({
        success: false,
        message: 'AI did not return usable study sessions.'
      });
    }

    return res.json({
      success: true,
      exam,
      dailyHours,
      preferredSessionMinutes,
      priority,
      examDate: validatedExamDate,
      weakTopicsUsed: weakTopics,
      totalPlannedMinutes: plan.reduce(
        (total, item) => total + item.duration,
        0
      ),
      plan
    });
  } catch (error) {
    console.error('AI timetable error:', error.message || error);

    return res.status(502).json({
      success: false,
      message: 'Could not generate the AI timetable. Check Gemini configuration and try again.'
    });
  }
});


/* ============ WEEKLY AI STUDY PLANNER ============ */

app.post('/api/planner/generate-weekly', auth, async (req, res) => {
  try {
    const exam = String(req.body.exam || 'UPSC CSE').trim();
    const dailyHours = Number(req.body.dailyHours ?? 4);
    const preferredSessionMinutes = Number(
      req.body.preferredSessionMinutes ?? 90
    );
    const priority = String(req.body.priority || 'weak');

    if (!exam || exam.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid exam name.'
      });
    }

    if (!Number.isFinite(dailyHours) || dailyHours < 1 || dailyHours > 12) {
      return res.status(400).json({
        success: false,
        message: 'Daily hours must be between 1 and 12.'
      });
    }

    if (![45, 60, 90, 120].includes(preferredSessionMinutes)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session duration.'
      });
    }

    if (!['weak', 'balanced', 'revision'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority.'
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'GEMINI_API_KEY is missing.'
      });
    }

    // Start with the next Monday, so the plan covers a full week.
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const daysUntilMonday = (8 - start.getUTCDay()) % 7 || 7;
    start.setUTCDate(start.getUTCDate() + daysUntilMonday);

    const weekDates = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + index);
      return date.toISOString().slice(0, 10);
    });

    const mistakes = await Mistake.find({
      userId: req.user.sub
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('topic question type')
      .lean();

    const counts = {};

    for (const mistake of mistakes) {
      const topic = String(mistake.topic || '').trim();
      if (topic) counts[topic] = (counts[topic] || 0) + 1;
    }

    const weakTopics = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([topic, count]) => ({ topic, mistakes: count }));

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    const prompt = `
Create a realistic 7-day study timetable for ${exam}.

Dates, in order:
${weekDates.join(', ')}

Daily study limit: ${dailyHours * 60} minutes.
Preferred session duration: ${preferredSessionMinutes} minutes.
Priority: ${priority}.
Recorded weak topics: ${JSON.stringify(weakTopics)}.

Rules:
- Return sessions for all 7 dates.
- Each date must have at least one session.
- Total study duration for each date must not exceed ${dailyHours * 60} minutes.
- Use approximately ${preferredSessionMinutes}-minute sessions.
- Shorter final sessions are allowed.
- For weak priority, use recorded weak topics first when available.
- If no recorded weaknesses exist, do not claim a topic is weak.
- Use exam-relevant subjects and realistic tasks.
- Balance new learning, practice and revision across the week.
- Dates must match the supplied dates exactly.
- Return ONLY valid JSON, no Markdown.

Format:
{
  "plan": [
    {
      "date": "${weekDates[0]}",
      "day": "Monday",
      "task": "Revise Fundamental Rights",
      "subject": "Polity",
      "topic": "Fundamental Rights",
      "duration": 90,
      "reason": "Revise key provisions and solve practice questions"
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const raw = String(response.text || '').trim();
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed.plan)) {
      return res.status(502).json({
        success: false,
        message: 'AI returned an invalid weekly plan.'
      });
    }

    const plan = [];

    // Enforce the daily limit independently for every date.
    for (const date of weekDates) {
      let remaining = dailyHours * 60;

      const sessions = parsed.plan
        .filter(item => item.date === date)
        .slice(0, 12);

      for (const item of sessions) {
        if (remaining <= 0) break;

        const requested = Number(item.duration);
        const duration = Math.min(
          remaining,
          Number.isFinite(requested) && requested > 0
            ? Math.round(requested)
            : preferredSessionMinutes
        );

        const task = String(item.task || '').trim();
        const subject = String(item.subject || '').trim();

        if (!task || !subject) continue;

        plan.push({
          date,
          day: String(item.day || '').slice(0, 20),
          task: task.slice(0, 250),
          subject: subject.slice(0, 150),
          topic: String(item.topic || '').slice(0, 150),
          duration,
          reason: String(item.reason || '').slice(0, 500)
        });

        remaining -= duration;
      }
    }

    if (!plan.length) {
      return res.status(502).json({
        success: false,
        message: 'AI did not generate usable weekly sessions.'
      });
    }

    res.json({
      success: true,
      exam,
      dailyHours,
      weekStart: weekDates[0],
      weekEnd: weekDates[6],
      totalSessions: plan.length,
      totalPlannedMinutes: plan.reduce(
        (sum, session) => sum + session.duration, 0
      ),
      plan
    });
  } catch (error) {
    console.error('Weekly timetable error:', error.message);

    res.status(502).json({
      success: false,
      message: 'Could not generate weekly timetable. Check Gemini configuration and try again.'
    });
  }
});


app.post('/api/mentor', auth, async (req, res) => {
  try {
    const question = String(req.body.message || '').trim();

    if (!question) {
      return res.status(400).json({
        success: false,
        message: 'Type a question first.'
      });
    }

    if (question.length > 3000) {
      return res.status(400).json({
        success: false,
        message: 'Please keep your question under 3000 characters.'
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'GEMINI_API_KEY missing in server/.env'
      });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',

      contents: `You are Prashnora AI, an expert educational mentor.

IMPORTANT LANGUAGE RULE:
- Reply in the same language as the student's latest question.
- If the question is in English, answer entirely in English.
- If the question is in Hindi, answer in Hindi.
- If the question is in Hinglish, answer in Hinglish using Roman script.
- Never switch to Hindi when the student asks in English.
- Do not use Devanagari script for Hinglish questions.
- Use clear headings, bullet points, and examples where useful.
- Explain topics step by step for exam preparation.
- Help with UPSC, SSC, Banking, Railway, coding, science, maths,
  history, geography, current affairs, and other educational topics.

Student question: ${question}`

    });

    const answer = response.text;

    if (!answer) {
      return res.status(502).json({
        success: false,
        message: 'No answer generated. Please try again.'
      });
    }

    return res.json({
      success: true,
      answer,
      mode: 'ai'
    });

  } catch (error) {
    console.error('Gemini Mentor error:', error.message || error);

    return res.status(502).json({
      success: false,
      message: 'Gemini AI unavailable. Check your API key and model.'
    });
  }
});


app.use((err, _req, res, _next) => { console.error(err.message); res.status(500).json({ success: false, message: 'Unexpected server error.' }); });
async function startServer() {
  try {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing in server/.env');
    if (!JWT_SECRET || JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be at least 32 characters in server/.env');
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('MongoDB connected successfully');
    app.listen(PORT, () => console.log(`Prashnora backend running at http://localhost:${PORT}`));
  } catch (error) { console.error('Backend startup failed:', error.message); process.exit(1); }
}
startServer();
