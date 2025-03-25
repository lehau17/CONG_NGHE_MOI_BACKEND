class Pagable {
    limit
    page
    offset
    validateData() {
        if (!this.limit || this.limit <= 0)
            this.limit = 50
        if (!this.page || this.page <= 0)
            this.page = 1
        if (!this.offset || this.offset <= 0)
            this.offset = 0
    }
}

export default Pagable
