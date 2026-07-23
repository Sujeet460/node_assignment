export const userDTO = (user) => {
  if (!user) return null;
  return {
    id: user._id || user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    team: user.team
      ? user.team._id
        ? { id: user.team._id, name: user.team.name }
        : user.team.toString()
      : null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

export const userListDTO = (users) => {
  if (!Array.isArray(users)) return [];
  return users.map(userDTO);
};
