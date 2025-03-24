class BaseError extends Error {
  constructor(message, status, dataError=null) {
    super(message);
        this.status = status;
        this.isSuccess = false
        this.dataError = dataError
    }
}

export class BadRequestError extends BaseError {
  constructor(message, dataError=null) {
    super(message, 400, dataError);
  }
}

export class UnauthorizedError extends BaseError {
  constructor(message, dataError=null) {
    super(message, 401, dataError);
  }
}

export class ForbiddenError extends BaseError {
  constructor(message, dataError = null) {
    super(message, 403, dataError);
  }
}

export class NotFoundError extends BaseError {
  constructor(message, dataError = null) {
    super(message, 404, dataError);
  }
}

export class InternalServerError extends BaseError {
  constructor(message, dataError = null) {
    super(message, 500, dataError);
  }
}


