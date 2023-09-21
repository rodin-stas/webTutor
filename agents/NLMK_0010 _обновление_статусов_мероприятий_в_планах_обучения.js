AGENT_CODE = "NLMK_0010";
AGENT_ID = 7186985957630565317;
alert("Старт агента " + AGENT_ID);

var findActivePlans = XQuery("for $elem in education_plans where $elem/state_id < 2 return $elem");
for (el in findActivePlans) {
    planCard = tools.open_doc(el.id);
    findEduMethods = ArraySelect(planCard.TopElem.programs, "This.type == 'education_method' && This.state_id < 2 ");
    for (prog in findEduMethods) {
        findResult = ArrayOptFirstElem(XQuery("sql: \n\
            declare @education_method_id bigint = "+prog.object_id+"; \n\
            declare @person_id bigint = "+planCard.TopElem.person_id+"; \n\
            SELECT \n\
                ev_res.id, \n\
                ev_res.event_id \n\
            FROM \n\
                event_results as ev_res \n\
                INNER JOIN ( \n\
                    SELECT \n\
                        eve.* \n\
                    FROM \n\
                        events as eve \n\
                    WHERE \n\
                        eve.education_method_id = @education_method_id \n\
                        and eve.status_id = 'close' \n\
                ) as ev ON ev.id = ev_res.event_id \n\
            WHERE \n\
                ev_res.person_id = @person_id \n\
                and ev_res.is_assist = 1 \n\
        "));
        if ( findResult != undefined ) {
            prog.state_id = 4;
            prog.result_type = "event";
            prog.result_object_id = findResult.event_id;
            // Простави моструднику education_plan_id в массив collaborators
            docEvent = OpenDoc( UrlFromDocID( findResult.event_id ) );
            findCol = ArrayOptFind(docEvent.TopElem.collaborators, "This.collaborator_id == " + planCard.TopElem.person_id);
            if (findCol != undefined) {
                findCol.education_plan_id = el.id;
            }
            docEvent.Save(); 
            programCount = ArrayCount(planCard.TopElem.programs);
            for (i = 0; i < programCount; i++ ) {
                if (planCard.TopElem.programs[i].id == prog.id && i != programCount-1 ) {
                    nextProgID = planCard.TopElem.programs[i+1].id;
                    nextProg = ArrayOptFind(planCard.TopElem.programs, "This.id == " + nextProgID);
                    if (nextProg != undefined && nextProg.type == "course") {
                        activateCourse = tools.activate_course_to_person ( planCard.TopElem.person_id, nextProg.object_id, null, null, el.id );
                        if ( OptInt( activateCourse, 0) == 0) {
                            activeCourseID = activateCourse.DocID;
                        } else {
                            docLearn = OpenDoc( UrlFromDocID( activateCourse ) );
                            docLearn.TopElem.education_plan_id = el.id;
                            docLearn.Save();
                            activeCourseID = activateCourse;
                        }
                        nextProg.state_id = 1;
                        nextProg.result_type = "active_learning";
                        nextProg.result_object_id = activeCourseID;
                        nextProg.active_learning_id = activeCourseID;
                    }         
                }
            }
		    planCard.Save();
        }
    }
}

alert("Финиш агента" + AGENT_ID)