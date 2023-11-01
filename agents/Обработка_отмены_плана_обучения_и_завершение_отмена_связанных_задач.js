function cancelEvent(id, person_id) {
    var eventResult = ArrayOptFirstElem(XQuery("sql: \n\
        select \n\
            ers.id \n\
        from \n\
            event_results ers \n\
            inner join events es on es.id = ers.event_id and education_method_id = "+ id + " \n\
        where \n\
            es.status_id = 'plan' \n\
            or es.status_id = 'active' \n\
            and ers.person_id = "+ person_id + " \n\
    "));
    if (eventResult != undefined) {
        resDoc = tools.open_doc(eventResult.id);
        resDoc.TopElem.is_assist = 0;
        resDoc.Save();
        Log("plan_canceling_log", "Убрано участие в незавершенном мероприятии для учебной программы  " + id);
    }
}

function cancelCourse(task, person_id, education_plan_id) {
    activeCourse = ArrayOptFirstElem(XQuery("for $elem in active_learnings where $elem/course_id = " + XQueryLiteral(task.object_id) + " and $elem/person_id = " + XQueryLiteral(person_id) + " and $elem/education_plan_id = " + XQueryLiteral(education_plan_id) + " return $elem"));
    if (activeCourse != undefined) {
        DeleteDoc(UrlFromDocID(activeCourse.id))
        task.result_object_id = null;
        task.active_learning_id = null;
        task.state_id = 0;
        Log("plan_canceling_log", "Курс завершен");
    }
}

function cancelTest(task, person_id, education_plan_id) {
    var activeTest = ArrayOptFirstElem(XQuery("for $elem in active_test_learnings where $elem/assessment_id = " + XQueryLiteral(task.object_id) + " and $elem/person_id = " + XQueryLiteral(person_id) + " and $elem/education_plan_id = " + XQueryLiteral(education_plan_id) + " return $elem"));
    if (activeTest != undefined) {
        Log("plan_canceling_log", "Найден активный тест для плана  " + activeTest.id);
        task.result_object_id = null;
        task.active_learning_id = null;
        task.state_id = 0;
        DeleteDoc(UrlFromDocID(activeTest.id))
        Log("plan_canceling_log", "Тест завершен");
    }
}

function Log(log_file_name, message) {
    if (recordLogs) {
        LogEvent(log_file_name, message);
    }
}

try {
    var recordLogs = Param.recordLogs == '1';

    if (recordLogs) {
        EnableLog("plan_canceling_log", true)
    }

    var eduPlan = tools.open_doc(OBJECTS_ID_STR);
    if (eduPlan != undefined) {
        var eduplanTE = eduPlan.TopElem;
    }

    var findCollab = tools.open_doc(eduplanTE.person_id);
    if (findCollab != undefined) {
        var collabTE = findCollab.TopElem;
    }

    // После открытий надо проверить на undefined
    if (eduPlan != undefined && collabTE != undefined) {
        Log("plan_canceling_log", "Начинается обработка плана " + eduplanTE.id);

        var planInfo = ArrayOptFirstElem(XQuery("sql:select \n\
        cps.name, \n\
        cpext.curator, \n\
        R.p.query('custom_elems/custom_elem/name[text() = ''f_n5g8'']/../value/text()').value('.', 'varchar(max)') as 'notific_type' \n\
        from education_plans ep \n\
        inner join compound_programs cps on ep.compound_program_id = cps.id \n\
        inner join compound_programs_ext cpext on cpext.id = cps.id \n\
        inner join compound_program cp on cp.id = cps.id \n\
        cross apply cp.data.nodes('compound_program') as R(p) \n\
        where ep.id = "+ OBJECTS_ID_STR));


        var curator = tools.open_doc(planInfo.curator);
        if (curator == undefined) {
            curator = tools.open_doc(Param.curator)
            if (curator != undefined) {
                curator = curator.TopElem;
            } else {
                Log("plan_canceling_log", "отсутствует куратоор в параметрах агента");
            }
        }

        if (curator != undefined) {
            var info = tools.object_to_text({
                "prog_name": String(planInfo.name),
                "curator": curator.fullname + " " + curator.email,
                "person": collabTE.fullname
            }, "json");

            if (collabTE.email != '' && !collabTE.is_dismiss) {
                if (planInfo.notific_type == "КУ") {
                    tools.call_code_library_method("nlmk", "create_notification", ["plan_canceling", OBJECTS_ID_STR, info]);
                } else {
                    if (planInfo.notific_type == "ТУ") {
                        tools.call_code_library_method("nlmk", "create_notification", ["plan_canceling_TU", OBJECTS_ID_STR, info]);
                    }
                }
            }

            MAIN_BOSS_TYPE_ID = ArrayOptFirstElem(XQuery("for $elem in boss_types where $elem/code = 'main' return $elem", { id: null })).id;
            var func_ID = ArrayOptFirstElem(XQuery("for $fm in func_managers where $fm/object_id = " + XQueryLiteral(eduplanTE.person_id) + " and $fm/boss_type_id = " + XQueryLiteral(MAIN_BOSS_TYPE_ID) + " return $fm"));

            if (func_ID != undefined) {
                if (!collabTE.is_dismiss) {
                    if (planInfo.notific_type == "КУ" && collabTE.email == '') {
                        tools.call_code_library_method("nlmk", "create_notification", ['Boss_plan_canceling', func_ID.person_id, info, eduplanTE.person_id]);
                    } else {
                        if (planInfo.notific_type == "ТУ") {
                            tools.call_code_library_method("nlmk", "create_notification", ['Boss_plan_canceling_TU', func_ID.person_id, info, eduplanTE.person_id]);
                        }
                    }
                }
            }
        }

        for (task in eduplanTE.programs) {
            try {
                if (task.state_id == 0 || task.state_id == 1) {
                    switch (task.type) {
                        case "education_method":
                            cancelEvent(task.object_id, eduplanTE.person_id);
                            break;
                        case "course":
                            Log("plan_canceling_log", "task.result_object_id.HasValue == " + task.result_object_id.HasValue);
                            if (task.result_type == 'active_learning' && task.result_object_id.HasValue) {
                                Log("plan_canceling_log", "Нужно удалять активный курс");
                                cancelCourse(task, eduplanTE.person_id, eduplanTE.id);
                            } else {
                                Log("plan_canceling_log", "НЕ Нужно удалять");
                            }

                            break;
                        case "assessment":
                            if (task.result_type == 'active_test_learning' && task.result_object_id.HasValue) {
                                Log("plan_canceling_log", "Нужно удалять активный тест");
                                cancelTest(task, eduplanTE.person_id, eduplanTE.id);
                            } else {
                                Log("plan_canceling_log", "НЕ Нужно удалять");
                            }
                            
                            break;
                    }
                }
            } catch (err) {
                Log("plan_canceling_log", "Неожиданная ошибка " + err);
            }
        }

        eduPlan.Save();
        Log("plan_canceling_log", "Завершена обработка плана " + eduplanTE.id);
        Log("plan_canceling_log", "________________________________");
        if (recordLogs) {
            EnableLog("plan_canceling_log", false)
        }
    }

} catch (err) {

}
