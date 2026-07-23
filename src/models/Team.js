import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Team name is required"],
      unique: true,
      trim: true,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Team manager is required"],
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Team = mongoose.model("Team", teamSchema);
export default Team;
