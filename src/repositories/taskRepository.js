import Task from "../models/Task.js";

const findById = async (id) => {
  return await Task.findById(id)
    .populate("assignedTo", "username email role team")
    .populate("createdBy", "username email role")
    .populate("team", "name");
};

const create = async (taskData, session = null) => {
  const task = new Task(taskData);
  return await task.save({ session });
};

const update = async (id, updateData, session = null) => {
  return await Task.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true, session }
  );
};

const deleteById = async (id, session = null) => {
  return await Task.findByIdAndDelete(id, { session });
};

const findAndCount = async (filterQuery, sortOption, skip, limit) => {
  const tasks = await Task.find(filterQuery)
    .populate("assignedTo", "username email")
    .populate("createdBy", "username email")
    .populate("team", "name")
    .sort(sortOption)
    .skip(skip)
    .limit(limit);

  const total = await Task.countDocuments(filterQuery);

  return { tasks, total };
};

const count = async (filterQuery) => {
  return await Task.countDocuments(filterQuery);
};

const aggregate = async (pipeline) => {
  return await Task.aggregate(pipeline);
};

export default {
  findById,
  create,
  update,
  delete: deleteById, // Safe mapping inside default object wrapper
  findAndCount,
  count,
  aggregate,
};
