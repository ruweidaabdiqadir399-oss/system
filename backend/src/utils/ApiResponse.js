// Thin helper to keep success response shapes consistent across the API.
class ApiResponse {
  constructor(res, statusCode = 200) {
    this.res = res;
    this.statusCode = statusCode;
  }

  send(data = null, message = 'Success') {
    return this.res.status(this.statusCode).json({
      success: true,
      message,
      data,
    });
  }

  sendPaginated({ items, page, pageSize, total, totalPages }, message = 'Success') {
    return this.res.status(this.statusCode).json({
      success: true,
      message,
      data: items,
      meta: { page, pageSize, total, totalPages },
    });
  }
}

const ok = (res, data, message = 'Success', statusCode = 200) =>
  new ApiResponse(res, statusCode).send(data, message);

const created = (res, data, message = 'Created successfully') =>
  new ApiResponse(res, 201).send(data, message);

const paginated = (res, result, message = 'Success') =>
  new ApiResponse(res, 200).sendPaginated(result, message);

module.exports = { ApiResponse, ok, created, paginated };
