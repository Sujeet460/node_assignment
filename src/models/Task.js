import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound text index on title and description for efficient search query support
taskSchema.index({ title: "text", description: "text" });

const Task = mongoose.model("Task", taskSchema);
export default Task;
