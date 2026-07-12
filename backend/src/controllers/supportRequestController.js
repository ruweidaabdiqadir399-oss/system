const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created, paginated } = require('../utils/ApiResponse');
const paginate = require('../utils/paginate');
const { buildSearchFilter } = require('../utils/searchFilter');
const generateId = require('../utils/generateId');
const logAudit = require('../utils/auditLog');
const { SupportRequest } = require('../models');
const { ROLES, SUPPORT_STATUS, SUPPORT_DEPARTMENT, AUDIT_ACTIONS } = require('../constants');

const isSupportStaff = (user) => user.role === ROLES.STAFF && user.department === SUPPORT_DEPARTMENT;

const REQUEST_POPULATE = [
  { path: 'customer', select: 'name email' },
  { path: 'assignedStaff', select: 'name email' },
  { path: 'handledBy', select: 'name email' },
  { path: 'resolvedBy', select: 'name email' },
];

const enrichRequest = (doc) => {
  const r = typeof doc.toJSON === 'function' ? doc.toJSON() : doc;
  const customer = r.customer && typeof r.customer === 'object' ? r.customer : null;
  const assignedStaff = r.assignedStaff && typeof r.assignedStaff === 'object' ? r.assignedStaff : null;
  const handledBy = r.handledBy && typeof r.handledBy === 'object' ? r.handledBy : null;
  const resolvedBy = r.resolvedBy && typeof r.resolvedBy === 'object' ? r.resolvedBy : null;
  return {
    ...r,
    customer: customer?._id ?? r.customer,
    customerName: customer?.name ?? 'Unknown',
    customerEmail: customer?.email ?? '',
    assignedStaff: assignedStaff?._id ?? r.assignedStaff,
    assignedStaffName: assignedStaff?.name ?? null,
    handledBy: handledBy?._id ?? r.handledBy,
    handledByName: handledBy?.name ?? null,
    resolvedBy: resolvedBy?._id ?? r.resolvedBy,
    resolvedByName: resolvedBy?.name ?? null,
  };
};

// @desc    List support requests (own requests for customers, all requests
//          for Customer Service staff and admins)
// @route   GET /api/v1/support-requests
// @access  Private (admin, Customer Service staff, customer)
const getSupportRequests = asyncHandler(async (req, res) => {
  const { search = '', status = 'all', category = 'all', page, pageSize } = req.query;

  const filter = { ...buildSearchFilter(search, ['subject', 'message', '_id']) };
  if (status !== 'all') filter.status = status;
  if (category !== 'all') filter.category = category;

  if (req.user.role === ROLES.CUSTOMER) {
    filter.customer = req.user._id;
  } else if (req.user.role === ROLES.STAFF && !isSupportStaff(req.user)) {
    throw ApiError.forbidden('Only Customer Service staff can view support requests.');
  }

  const result = await paginate(SupportRequest, filter, {
    page,
    pageSize,
    sort: '-createdAt',
    populate: REQUEST_POPULATE,
  });

  paginated(res, { ...result, items: result.items.map(enrichRequest) }, 'Support requests fetched successfully.');
});

// @desc    Get a single support request by ID
// @route   GET /api/v1/support-requests/:id
// @access  Private (admin, Customer Service staff, customer-own)
const getSupportRequestById = asyncHandler(async (req, res) => {
  const request = await SupportRequest.findById(req.params.id).populate(REQUEST_POPULATE);
  if (!request) throw ApiError.notFound('Support request not found.');

  if (req.user.role === ROLES.CUSTOMER && request.customer?._id !== req.user._id) {
    throw ApiError.forbidden('You can only view your own support requests.');
  }
  if (req.user.role === ROLES.STAFF && !isSupportStaff(req.user)) {
    throw ApiError.forbidden('Only Customer Service staff can view support requests.');
  }

  ok(res, enrichRequest(request), 'Support request fetched successfully.');
});

// @desc    Submit a new support request
// @route   POST /api/v1/support-requests
// @access  Private (customer)
const createSupportRequest = asyncHandler(async (req, res) => {
  const { subject, category, message } = req.body;

  const _id = await generateId('SUP', 'SUP-', 7001);
  const request = await SupportRequest.create({
    _id,
    subject,
    category,
    message,
    customer: req.user._id,
    status: SUPPORT_STATUS.OPEN,
  });

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    action: AUDIT_ACTIONS.CREATE,
    entity: 'SupportRequest',
    entityId: request._id,
    details: { subject, category },
    req,
  });

  const populated = await SupportRequest.findById(request._id).populate(REQUEST_POPULATE);
  created(res, enrichRequest(populated), 'Support request submitted successfully.');
});

// @desc    Reply to and/or update the status of a support request. The
//          first Customer Service staff member to act on a request becomes
//          its assigned staff; every Customer Service staff action updates
//          handledBy/responseDate so admins can see who last worked it.
// @route   PATCH /api/v1/support-requests/:id
// @access  Private (admin, Customer Service staff)
const updateSupportRequest = asyncHandler(async (req, res) => {
  const request = await SupportRequest.findById(req.params.id);
  if (!request) throw ApiError.notFound('Support request not found.');

  const { reply, status } = req.body;
  if (reply !== undefined) request.reply = reply;
  if (status !== undefined) request.status = status;

  if (isSupportStaff(req.user)) {
    if (!request.assignedStaff) request.assignedStaff = req.user._id;
    request.handledBy = req.user._id;
    request.responseDate = new Date();
  }
  if (status === SUPPORT_STATUS.RESOLVED) {
    request.resolvedBy = req.user._id;
  }

  await request.save();

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    action: AUDIT_ACTIONS.UPDATE,
    entity: 'SupportRequest',
    entityId: request._id,
    details: { reply, status },
    req,
  });

  const populated = await SupportRequest.findById(request._id).populate(REQUEST_POPULATE);
  ok(res, enrichRequest(populated), 'Support request updated successfully.');
});

// @desc    Delete a support request
// @route   DELETE /api/v1/support-requests/:id
// @access  Private (admin)
const deleteSupportRequest = asyncHandler(async (req, res) => {
  const request = await SupportRequest.findById(req.params.id);
  if (!request) throw ApiError.notFound('Support request not found.');

  await request.deleteOne();

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    action: AUDIT_ACTIONS.DELETE,
    entity: 'SupportRequest',
    entityId: request._id,
    req,
  });

  ok(res, { id: request._id }, 'Support request deleted successfully.');
});

module.exports = {
  getSupportRequests,
  getSupportRequestById,
  createSupportRequest,
  updateSupportRequest,
  deleteSupportRequest,
};
