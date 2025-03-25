class BaseResponse {
    constructor(data = null, status = 200, mes = "OK") {
        this.data = data;
        this.status = status;
        this.message = mes;
        this.isSuccess = status >= 200 && status < 300;
    }

    response(res) {
        res.status(this.status).json(this);
    }
}

export class SuccessResponse extends BaseResponse {
    constructor(data, mes = "Success") {
        super(data, 200, mes);
    }
}

export class CreatedResponse extends BaseResponse {
    constructor(data, mes = "Created") {
        super(data, 201, mes);
    }
}
