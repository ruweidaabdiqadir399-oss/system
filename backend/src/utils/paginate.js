const { DEFAULT_PAGE_SIZE } = require('../constants');

/**
 * Runs a paginated find against a Mongoose model.
 * Returns the same `{ items, page, pageSize, total, totalPages }` shape the
 * frontend mock API already expects.
 */
const paginate = async (model, filter = {}, { page = 1, pageSize = DEFAULT_PAGE_SIZE, sort = '-createdAt', populate = null } = {}) => {
  const currentPage = Math.max(Number(page) || 1, 1);
  const limit = Math.max(Number(pageSize) || DEFAULT_PAGE_SIZE, 1);
  const skip = (currentPage - 1) * limit;

  let query = model.find(filter).sort(sort).skip(skip).limit(limit);
  if (populate) query = query.populate(populate);

  const [items, total] = await Promise.all([query.exec(), model.countDocuments(filter)]);
  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return {
    items,
    page: Math.min(currentPage, totalPages),
    pageSize: limit,
    total,
    totalPages,
  };
};

module.exports = paginate;
