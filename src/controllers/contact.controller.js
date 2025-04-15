import { getGroupedContacts } from "../services/contact.service.js"
import { SuccessResponse } from "../utils/response.js"

export const getContact = async (req, res, next) => {
    new SuccessResponse(await getGroupedContacts(req.user.user_id, req.query.orderBy), "Danh bạ").response(res)
}
