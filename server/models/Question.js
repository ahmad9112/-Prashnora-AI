const mongoose = require('mongoose');
const questionSchema = new mongoose.Schema({
  exam: { type: String, required: true, trim: true, index: true },
  stage: { type: String, default: 'General', trim: true },
  section: { type: String, default: 'General', trim: true },
  subject: { type: String, required: true, trim: true, index: true },
  topic: { type: String, required: true, trim: true, index: true },
  question: { type: String, required: true, trim: true },
  options: { type: [String], validate: v => v.length === 4, required: true },
  answer: { type: Number, min: 0, max: 3, required: true },
  explanation: { type: String, default: '' },
  difficulty: { type: String, enum: ['Easy','Medium','Hard'], default: 'Medium' },
  source: { type: String, enum: ['AI practice','Admin upload','Verified PYQ'], default: 'AI practice' },
  fingerprint: { type: String, unique: true, sparse: true },
  createdBy: { type: String, default: 'system' }
}, { timestamps: true });
questionSchema.index({ exam: 1, subject: 1, topic: 1 });
module.exports = mongoose.model('Question', questionSchema);
