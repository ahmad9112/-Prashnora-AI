
const mongoose = require("mongoose");

const studyTaskSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        task: {
            type: String,
            required: true,
            trim: true,
            maxlength: 250,
        },

        subject: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },

        exam: {
            type: String,
            default: "",
            trim: true,
        },

        topic: {
            type: String,
            default: "",
            trim: true,
        },

        duration: {
            type: Number,
            default: 30,
            min: 1,
            max: 1440,
        },

        completed: {
            type: Boolean,
            default: false,
        },

        completedAt: {
            type: Date,
            default: null,
        },

        dueDate: {
            type: Date,
            default: null,
        },

        reminderAt: {
            type: Date,
            default: null,
        },

        source: {
            type: String,
            enum: ["manual", "ai", "weak-topic", "syllabus"],
            default: "manual",
        },
    },
    { timestamps: true }
);

studyTaskSchema.index({ userId: 1, dueDate: 1 });
studyTaskSchema.index({ userId: 1, completedAt: 1 });

module.exports = mongoose.model("StudyTask", studyTaskSchema);
