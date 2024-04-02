/**
 * Ищет заявку по типу и сотруднику и меняет статус заявки
 * @param {string} person_id id сотрудника
 * @param {string} request_type_id, id типа заявки
 * @param {string} cur_status_id текущий статус заявки
 * @param {string} new_status_id новый статус заявки
 * @returns {boolean}
 */
function changeStatusRequest(person_id, request_type_id, cur_status_id, new_status_id) {
    var curRequest = ArrayOptFirstElem(XQuery("for $elem in requests where $elem/request_type_id = " + XQueryLiteral(request_type_id) + " and $elem/person_id = " + XQueryLiteral(person_id) + "  and $elem/status_id = " + XQueryLiteral(cur_status_id) + " return $elem/Fields('id')"));

    if (curRequest === undefined) {
        return false;
    }

    var curRequestDoc = tools.open_doc(curRequest.id);

    if (curRequestDoc === undefined) {
        return false;
    }

    curRequestDoc.TopElem.status_id = new_status_id; 

    curRequestDoc.Save();

    return true;
}