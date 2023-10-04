var Text = "";
// var result_object_id = '7286096562896514985'
var result_object_id = OBJECTS_ID_STR
var teLearning_task_result = tools.open_doc(result_object_id).TopElem;
var education_plan_id = teLearning_task_result.education_plan_id;

if (OptInt(education_plan_id) != undefined) {

    try { compound_program_id = teLearning_task_result.education_plan_id.ForeignElem.id.Value } catch (error) { compound_program_id = null };

    if (compound_program_id != null) {

        education_plan_doc = tools.open_doc(education_plan_id).TopElem
        program = ArrayOptFirstElem(ArraySelect(education_plan_doc.programs, "This.result_object_id == " + result_object_id));

        if (program != undefined) {

            compound_program_doc = tools.open_doc(education_plan_doc.compound_program_id).TopElem;
            method = ArrayOptFirstElem(ArraySelect(compound_program_doc.programs, "This.id == " + program.id));

            ce = ArrayOptFind(ArraySelectAll(method.custom_elems), 'This.name == "notif_need_cancel"')
            cancelNotification = (ce != undefined ? ce.value : false);

            if (tools_web.is_true(cancelNotification)) {
                Cancel();
            }
        }
    }
}

if (teLearning_task_result.status_id == 'assign' && DateDiff(Date(), teLearning_task_result.doc_info.creation.date) >= 0 && DateDiff(Date(), teLearning_task_result.doc_info.creation.date) <= 50) {

    var teCollaborator = OpenDoc(UrlFromDocID(teLearning_task_result.person_id)).TopElem;
    var teEducationPlan = OpenDoc(UrlFromDocID(teLearning_task_result.education_plan_id)).TopElem;
    var needProgram = ArrayOptFirstElem(ArraySelect(teEducationPlan.programs, "This.object_id == teLearning_task_result.learning_task_id"))

    if (needProgram != undefined && program.days.HasValue) {
        Text = StrDate(DateOffset(teLearning_task_result.doc_info.creation.date, 86400 * needProgram.days), false, false);
    }

    tools.create_notification("learning_task_result_create", OptInt(teCollaborator.id), Text, OptInt(teLearning_task_result.id), teCollaborator, teLearning_task_result);
}
