import Team from "../models/Team.js";

const findById = async (id) => {
  return await Team.findById(id)
    .populate("manager", "username email role")
    .populate("members", "username email role");
};

const findByName = async (name) => {
  return await Team.findOne({ name });
};

const findByManager = async (managerId) => {
  return await Team.findOne({ manager: managerId });
};

const create = async (teamData, session = null) => {
  const team = new Team(teamData);
  return await team.save({ session });
};

const update = async (id, updateData, session = null) => {
  return await Team.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true, session }
  );
};

const findAll = async (filter = {}) => {
  return await Team.find(filter)
    .populate("manager", "username email")
    .populate("members", "username email role");
};

const pullMember = async (teamId, userId, session = null) => {
  return await Team.findByIdAndUpdate(
    teamId,
    { $pull: { members: userId } },
    { new: true, session }
  );
};

const pushMember = async (teamId, userId, session = null) => {
  return await Team.findByIdAndUpdate(
    teamId,
    { $addToSet: { members: userId } },
    { new: true, session }
  );
};

export default {
  findById,
  findByName,
  findByManager,
  create,
  update,
  findAll,
  pullMember,
  pushMember,
};
