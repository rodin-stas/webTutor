AGENT_CODE = "NLMK_0010";
AGENT_ID = 7242293177916276430;
alert("Старт агента " + AGENT_ID);

var findActivePlans = XQuery("for $elem in education_plans where $elem/state_id < 2 and  $elem/id = '7242292044961950874'  return $elem");
alert(ArrayCount(findActivePlans))

for (el in findActivePlans) {
    planCard = tools.open_doc(el.id);
    findEduMethods = ArraySelect(planCard.TopElem.programs, "This.type == 'education_method' && This.state_id < 2 ");

    for (prog in findEduMethods) {
        findResult = ArrayOptFirstElem(XQuery("sql: \n\
            declare @education_method_id bigint = "+SqlLiteral(prog.object_id)+"; \n\
            declare @person_id bigint = "+SqlLiteral(planCard.TopElem.person_id)+"; \n\
            SELECT \n\
                ev_res.id, \n\
                ev_res.event_id \n\
            FROM \n\
                event_results as ev_res \n\
                INNER JOIN ( \n\
                    SELECT \n\
                        eve.id \n\
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
            // Проставим соструднику education_plan_id в массив collaborators
            docEvent = OpenDoc( UrlFromDocID( findResult.event_id ) );
            findCol = ArrayOptFind(docEvent.TopElem.collaborators, "This.collaborator_id == " + planCard.TopElem.person_id);
            if (findCol != undefined) {
                findCol.education_plan_id = el.id;
            }
            docEvent.Save(); 
		    planCard.Save();

            tools.call_code_library_method( 'libEducation', 'update_education_plan', [ el.id, planCard, planCard.TopElem.person_id, false ] );
        }
    }
}

alert("Финиш агента" + AGENT_ID)