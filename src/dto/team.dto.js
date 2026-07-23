import { userDTO, userListDTO } from "./user.dto.js";

export const teamDTO = (team) => {
  if (!team) return null;
  return {
    id: team._id || team.id,
    name: team.name,
    manager: team.manager && team.manager._id ? userDTO(team.manager) : team.manager,
    members:
      Array.isArray(team.members) && team.members.length > 0 && team.members[0]._id
        ? userListDTO(team.members)
        : team.members || [],
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
  };
};

export const teamListDTO = (teams) => {
  if (!Array.isArray(teams)) return [];
  return teams.map(teamDTO);
};
