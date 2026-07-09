/**
 * Builds a MongoDB `$or` filter that performs a case-insensitive substring
 * match across the given fields, mirroring the frontend mock API's
 * `matchesSearch()` helper.
 */
const buildSearchFilter = (search, fields = []) => {
  if (!search || !String(search).trim() || !fields.length) return {};
  const regex = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  return { $or: fields.map((field) => ({ [field]: regex })) };
};

module.exports = { buildSearchFilter };
