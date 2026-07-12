const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created, paginated } = require('../utils/ApiResponse');
const paginate = require('../utils/paginate');
const { buildSearchFilter } = require('../utils/searchFilter');
const generateId = require('../utils/generateId');
const logAudit = require('../utils/auditLog');
const { StaffReport } = require('../models');
const { ROLES, REPORT_STATUS, AUDIT_ACTIONS } = require('../constants');

const REPORT_POPULATE = { path: 'submittedBy', select: 'name email department role' };

const enrichReport = (report) => {
  const r = typeof report.toJSON === 'function' ? report.toJSON() : report;
  const submitter = r.submittedBy && typeof r.submittedBy === 'object' ? r.submittedBy : null;
  return {
    ...r,
    submittedBy: submitter?._id ?? r.submittedBy,
    submittedByName: submitter?.name ?? 'Unknown',
  };
};

// @desc    List reports (own reports for staff, all reports for admin)
// @route   GET /api/v1/staff-reports
// @access  Private (admin, staff)
const getReports = asyncHandler(async (req, res) => {
  const { search = '', status = 'all', department = 'all', type = 'all', from, to, page, pageSize } = req.query;

  const filter = { ...buildSearchFilter(search, ['title', 'description', '_id']) };
  if (status !== 'all') filter.status = status;
  if (department !== 'all') filter.department = department;
  if (type !== 'all') filter.type = type;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(`${to}T23:59:59.999Z`);
  }

  // Staff can only ever see their own reports — admins see everything.
  if (req.user.role === ROLES.STAFF) {
    filter.submittedBy = req.user._id;
  }

  const result = await paginate(StaffReport, filter, {
    page,
    pageSize,
    sort: '-createdAt',
    populate: REPORT_POPULATE,
  });

  paginated(res, { ...result, items: result.items.map(enrichReport) }, 'Reports fetched successfully.');
});

// @desc    Get a single report by ID
// @route   GET /api/v1/staff-reports/:id
// @access  Private (admin, staff-own)
const getReportById = asyncHandler(async (req, res) => {
  const report = await StaffReport.findById(req.params.id).populate(REPORT_POPULATE);
  if (!report) throw ApiError.notFound('Report not found.');

  if (req.user.role === ROLES.STAFF && report.submittedBy?._id !== req.user._id) {
    throw ApiError.forbidden('You can only view your own reports.');
  }

  ok(res, enrichReport(report), 'Report fetched successfully.');
});

// @desc    Submit a new report
// @route   POST /api/v1/staff-reports
// @access  Private (staff)
const createReport = asyncHandler(async (req, res) => {
  const { title, type, description } = req.body;

  const _id = await generateId('RPT', 'RPT-', 5001);
  const report = await StaffReport.create({
    _id,
    title,
    type,
    description,
    submittedBy: req.user._id,
    department: req.user.department,
    status: REPORT_STATUS.PENDING,
  });

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    action: AUDIT_ACTIONS.CREATE,
    entity: 'StaffReport',
    entityId: report._id,
    details: { title, type },
    req,
  });

  const populated = await StaffReport.findById(report._id).populate(REPORT_POPULATE);
  created(res, enrichReport(populated), 'Report submitted successfully.');
});

// @desc    Update a report's content — only its own author, only while Pending
// @route   PATCH /api/v1/staff-reports/:id
// @access  Private (staff-own)
const updateReport = asyncHandler(async (req, res) => {
  const report = await StaffReport.findById(req.params.id);
  if (!report) throw ApiError.notFound('Report not found.');

  if (report.submittedBy !== req.user._id) {
    throw ApiError.forbidden('You can only edit your own reports.');
  }
  if (report.status !== REPORT_STATUS.PENDING) {
    throw ApiError.badRequest('Only reports with Pending status can be edited.');
  }

  const { title, type, description } = req.body;
  if (title !== undefined) report.title = title;
  if (type !== undefined) report.type = type;
  if (description !== undefined) report.description = description;
  await report.save();

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    action: AUDIT_ACTIONS.UPDATE,
    entity: 'StaffReport',
    entityId: report._id,
    details: { title, type },
    req,
  });

  const populated = await StaffReport.findById(report._id).populate(REPORT_POPULATE);
  ok(res, enrichReport(populated), 'Report updated successfully.');
});

// @desc    Update a report's status and/or admin remarks
// @route   PATCH /api/v1/staff-reports/:id/status
// @access  Private (admin)
const updateReportStatus = asyncHandler(async (req, res) => {
  const report = await StaffReport.findById(req.params.id);
  if (!report) throw ApiError.notFound('Report not found.');

  const { status, adminRemarks } = req.body;
  if (status !== undefined) report.status = status;
  if (adminRemarks !== undefined) report.adminRemarks = adminRemarks;
  await report.save();

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    action: AUDIT_ACTIONS.STATUS_CHANGE,
    entity: 'StaffReport',
    entityId: report._id,
    details: { status, adminRemarks },
    req,
  });

  const populated = await StaffReport.findById(report._id).populate(REPORT_POPULATE);
  ok(res, enrichReport(populated), 'Report updated successfully.');
});

// @desc    Delete a report — admins may delete any report, staff only their
//          own while it is still Pending
// @route   DELETE /api/v1/staff-reports/:id
// @access  Private (admin, staff-own-pending)
const deleteReport = asyncHandler(async (req, res) => {
  const report = await StaffReport.findById(req.params.id);
  if (!report) throw ApiError.notFound('Report not found.');

  if (req.user.role === ROLES.STAFF) {
    if (report.submittedBy !== req.user._id) {
      throw ApiError.forbidden('You can only delete your own reports.');
    }
    if (report.status !== REPORT_STATUS.PENDING) {
      throw ApiError.badRequest('Only reports with Pending status can be deleted.');
    }
  }

  await report.deleteOne();

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    action: AUDIT_ACTIONS.DELETE,
    entity: 'StaffReport',
    entityId: report._id,
    req,
  });

  ok(res, { id: report._id }, 'Report deleted successfully.');
});

module.exports = {
  getReports,
  getReportById,
  createReport,
  updateReport,
  updateReportStatus,
  deleteReport,
};
