
const mongoose = require("mongoose");

const mistakeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "Concept Gap",
        "Calculation Error",
        "Misread Question",
        "Guessing",
        "Time Pressure",
      ],
      default: "Concept Gap",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Mistake", mistakeSchema);
