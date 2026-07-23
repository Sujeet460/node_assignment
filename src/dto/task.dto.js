import { userDTO } from "./user.dto.js";

export const taskDTO = (task) => {
  if (!task) return null;
  return {
    id: task._id || task.id,
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    priority: task.priority,
    status: task.status,
    assignedTo: task.assignedTo && task.assignedTo._id ? userDTO(task.assignedTo) : task.assignedTo,
    createdBy: task.createdBy && task.createdBy._id ? userDTO(task.createdBy) : task.createdBy,
    team: task.team && task.team._id ? { id: task.team._id, name: task.team.name } : task.team,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
};

export const taskListDTO = (tasks) => {
  if (!Array.isArray(tasks)) return [];
  return tasks.map(taskDTO);
};
