// Standard helpers for consistent JSON responses.

function success(res, data = {}, message = "OK", status = 200) {
  return res.status(status).json({ success: true, message, data });
}

function created(res, data = {}, message = "Created") {
  return success(res, data, message, 201);
}

function fail(res, message = "Error", status = 400, errors = undefined) {
  return res.status(status).json({ success: false, message, errors });
}

class ApiError extends Error {
  constructor(message, status = 400, errors = undefined) {
    super(message);
    this.status = status;
    this.errors = errors;
    this.isApiError = true;
  }
}

module.exports = { success, created, fail, ApiError };
