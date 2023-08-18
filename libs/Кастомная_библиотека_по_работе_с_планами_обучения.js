/**
 * @function rereadProgram
 * @memberof NLMK.Developers
 * @description Перезаписывает пройденные курсы в плане обучения
 * @author Rodin_Stas
 * @param  programs  все этапы из плана обучения
 * @param personId id человека
 * @param planId id плана обучения
 * @returns {void}
 */
function rereadProgram(programs, personId, planId) {
    for (program in programs) {
        rereadDate = null;
        rereadLearning = undefined;

        if (program.type == "course") {
            courseDoc = OpenDoc(UrlFromDocID(program.object_id));
            courseTE = courseDoc.TopElem;

            if (courseTE.custom_elems.ChildByKeyExists("reread") && courseTE.custom_elems.ObtainChildByKey("reread").value == 'true') {

                rereadDate = DateOffset(Date(), 1000000 * 86400 * (-1))
                if (courseTE.custom_elems.ChildByKeyExists("reread_days") && OptInt(courseTE.custom_elems.ObtainChildByKey("reread_days").value) != undefined) {

                    rereadDate = DateOffset(Date(), OptInt(courseTE.custom_elems.ObtainChildByKey("reread_days").value, 0) * 86400 * (-1))
                }

            }

            if (rereadDate != null) {
                rereadLearning = ArrayOptFirstElem(XQuery("for $elem in learnings where $elem/course_id = " + XQueryLiteral(program.object_id) + " and  $elem/person_id = " + XQueryLiteral(personId) + " and $elem/last_usage_date >= date('" + rereadDate + "')order by $elem/last_usage_date  return $elem"));


                if (rereadLearning != undefined) {
                    program.result_type = 'learning';
                    program.result_object_id = rereadLearning.id;
                    program.state_id = 4;
                    program.start_type = "manual";
                    program.readiness_percent = rereadLearning.score;

                    learningDoc = OpenDoc(UrlFromDocID(rereadLearning.id))
                    learningDoc.TopElem.education_plan_id = planId;
                    learningDoc.Save();
                }
            }
        }
    }
}

/**
 * @function updateStructureEducationPlan
 * @memberof LMK.Developers
 * @description Обновляет структуру плана обучения по модульной программе
 * @author Rodin_Stas
 * @param educationPlanTE карточка плана обучения
 * @param compoundProgramID id модульной программы
 * @returns {void}
 */
function updateStructureEducationPlan(educationPlanTE, compoundProgramID) {
    var teCompoundProgram = tools.open_doc(OptInt(compoundProgramID)).TopElem;
    var oldProgramsAll = ArraySelectAll(educationPlanTE.programs.Clone());
    var newProgramsAll = ArraySelectAll(teCompoundProgram.programs.Clone());

    educationPlanTE.programs.Clear();
    educationPlanTE.programs.AssignElem(teCompoundProgram.programs);

    for (newProgram in educationPlanTE.programs) {
        oldProgram = ArrayOptFirstElem(ArraySelectByKey(oldProgramsAll, newProgram.id, 'id'));

        if (oldProgram != undefined) {
            _program = ArrayOptFirstElem(ArraySelectByKey(newProgramsAll, newProgram.id, 'id'))
            newProgram.AssignExtraElem(oldProgram);

            if (_program.days == "" || _program.days == null || _program.days == undefined) {
                newProgram.days = null;
            }

            if (_program.delay_days == "" || _program.delay_days == null || _program.delay_days == undefined) {
                newProgram.delay_days = null;
            }

            if (ArrayCount(ArraySelectAll(_program.completed_parent_programs)) == 0) {
                alert("ЧИСТИМ!!!!!!")
                newProgram.completed_parent_programs.Clear();
            }
        }
    }

    educationPlanTE.compound_program_id = teCompoundProgram.id.Value;
}