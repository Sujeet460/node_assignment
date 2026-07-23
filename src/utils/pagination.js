export const getPaginationOptions = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 10)); // enforce max limit of 100 to prevent DOS
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const formatPaginationResponse = (totalItems, page, limit) => {
  const totalPages = Math.ceil(totalItems / limit);
  return {
    total: totalItems,
    page,
    limit,
    pages: totalPages,
  };
};
