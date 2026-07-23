import User from "../models/User.js";

const findById = async (id, populateTeam = false) => {
  let query = User.findById(id);
  if (populateTeam) {
    query = query.populate("team", "name");
  }
  return await query;
};

const findByEmail = async (email) => {
  return await User.findOne({ email: email.toLowerCase() });
};

const findByUsernameOrEmail = async (login) => {
  return await User.findOne({
    $or: [{ email: login.toLowerCase() }, { username: login }],
  });
};

const create = async (userData, session = null) => {
  const user = new User(userData);
  return await user.save({ session });
};

const update = async (id, updateData, session = null) => {
  return await User.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true, session }
  );
};

const findAll = async () => {
  return await User.find().populate("team", "name");
};

export default {
  findById,
  findByEmail,
  findByUsernameOrEmail,
  create,
  update,
  findAll,
};
