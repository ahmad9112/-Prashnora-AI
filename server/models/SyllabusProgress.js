
const mongoose = require('mongoose');

const syllabusProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    exam: {
      type: String,
      required: true,
      trim: true
    },
    stage: {
      type: String,
      default: 'General',
      trim: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    topic: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed'],
      default: 'Not Started'
    },
    notes: {
      type: String,
      default: '',
      maxlength: 1000
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

syllabusProgressSchema.index(
  { userId: 1, exam: 1, stage: 1, subject: 1, topic: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  'SyllabusProgress',
  syllabusProgressSchema
);
