const mongoose = require('mongoose');
const testResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  exam: { type: String, required: true, trim: true },
  total: { type: Number, required: true, min: 1 },
  correct: { type: Number, required: true, min: 0 },
  score: { type: Number, required: true, min: 0 },
  answers: [{ questionId: String, selectedIndex: Number, correct: Boolean }],
}, { timestamps: true });
module.exports = mongoose.model('TestResult', testResultSchema);
