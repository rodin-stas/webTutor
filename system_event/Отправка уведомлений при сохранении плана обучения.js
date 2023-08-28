function Log(log_file_name, recordLogs, message) {
	if (recordLogs) {
		LogEvent(log_file_name, message);
	}
}

function createNotification(type, personID, educationPlanId, info ) {

    personDocTE = tools.open_doc(personID).TopElem;
    personEmail = personDocTE.email;

    if(StrCharCount(personEmail) > 0) {

        if (type == "КУ") {
            tools.create_notification('KU_education_method_assign', personID, info, educationPlanId);
        } 

        if (type== "ТУ") {
            tools.create_notification('TU_education_method_assign', personID, info, educationPlanId);
        }

    } else {
        MAIN_BOSS_TYPE_ID = ArrayOptFirstElem(XQuery("for $elem in boss_types where $elem/code = 'main' return $elem/Fields('id')", {id: null})).id;
        funcID = ArrayOptFirstElem(XQuery("for $fm in func_managers where $fm/object_id = " + XQueryLiteral(personID) + " and $fm/boss_type_id = "+XQueryLiteral(MAIN_BOSS_TYPE_ID)+" return $fm"));
    
        if (funcID!= undefined) {
            if (type == "КУ") {
                tools.create_notification('KU_education_method_assign_boss', funcID.person_id, info, educationPlanId);
            } 
    
            if (type== "ТУ") {
                tools.create_notification('TU_education_method_assign_boss', funcID.person_id, info, educationPlanId);
            }
            
        }
    }
}

function get_program( educationMethods, program_id )
{
    var catProgram = ArrayOptFind( educationMethods, "This.id == "+program_id );

    return catProgram;
}

function needCreateNotification( catProgram, allEducationMethods, personID ) {
   
    if( catProgram.plan_date.HasValue ) {
    
        if( catProgram.plan_date > Date() ) {
            Log(logName, recordLogs, "Планируемая дата > текущей");
            return false
        }
    } else {
        dStartPlanDate = teEducationPlan.plan_date.HasValue ? teEducationPlan.plan_date : teEducationPlan.create_date;
        if( catProgram.delay_days.HasValue && dStartPlanDate.HasValue && DateOffset( dStartPlanDate.Value, catProgram.delay_days*86400 ) > Date() ) {
            Log(logName, recordLogs, "Планируемая дата не указана, взяли планируемую дата всего плана либо дату создания плана > текущей");
            return false
        }
            
    }
    
    Log(logName, recordLogs,"Кол-во этапов от которых зависит этот == "+catProgram.completed_parent_programs.ChildNum)
    Log(logName, recordLogs, "Кол-во непройденых этапов "+ArrayCount(ArraySelect(catProgram.completed_parent_programs, "get_program( allEducationMethods, This.program_id.Value ).state_id < 2" )))
    if( catProgram.completed_parent_programs.ChildNum > 0 && ArrayOptFind(catProgram.completed_parent_programs, "get_program( allEducationMethods, This.program_id.Value ).state_id < 2" ) != undefined ) {
        Log(logName, recordLogs, "Есть незавершенные зависимые этапы");
        return false
    }


    findResult = ArrayOptFirstElem(XQuery("sql: \n\
    declare @education_method_id bigint = "+SqlLiteral(catProgram.object_id)+"; \n\
    declare @person_id bigint = "+SqlLiteral(personID)+"; \n\
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
        ) as ev ON ev.id = ev_res.event_id \n\
    WHERE \n\
        ev_res.person_id = @person_id \n\
        and ev_res.is_assist = 1 \n\
    "));

    findRequest = ArrayOptFirstElem(XQuery("sql: \n\
    declare @education_method_id bigint = "+SqlLiteral(catProgram.object_id)+"; \n\
    declare @person_id bigint = "+SqlLiteral(personID)+"; \n\
    SELECT \n\
        req.id \n\
    FROM \n\
        requests as req  \n\
        INNER JOIN (  \n\
            SELECT  \n\
                eve.* \n\
            FROM  \n\
                events as eve  \n\
            WHERE  \n\
                eve.education_method_id = @education_method_id  \n\
        ) as ev ON ev.id = req.object_id \n\
	WHERE  \n\
	    req.status_id = 'active' \n\
	    and req.type = 'event' \n\
	    and req.person_id = @person_id \n\
    "));

    if ( findResult != undefined ) {
        Log(logName, recordLogs, "есть запись на мероприятие");
        return false
    }

    if ( findRequest != undefined ) {
        Log(logName, recordLogs, "есть активная заявка на мероприятие");
        return false
    }

    return true 
}

try {

    var logName = "update_education_plans";
    var recordLogs = true;

    

    if (recordLogs) {
        EnableLog ( logName, true )
    }

    Log(logName, recordLogs, "Отправка уведомлений по учебным программам при СОЗДАНИИ!")
    Log(logName, recordLogs, "Учебный план с id = " +iEducationPlanID);

    var educationMethods = ArraySelect(teEducationPlan.programs, "This.type == 'education_method' && This.state_id == 0 && This.custom_elems.ObtainChildByKey('notification').value.Value != 'true'");
    var allEducationMethods = ArraySelectAll(teEducationPlan.programs);
    var compoundProgramIdDocTE = tools.open_doc(teEducationPlan.compound_program_id).TopElem;
    var notificationType = compoundProgramIdDocTE.custom_elems.ObtainChildByKey('f_n5g8').value;
    var personID = teEducationPlan.person_id;
    var required = compoundProgramIdDocTE.custom_elems.ObtainChildByKey("canceling_notif").value.Value;
    var curatorID = compoundProgramIdDocTE.custom_elems.ObtainChildByKey('curator').value.Value;

    Log(logName, recordLogs, "Всего учебных программ на проверку:  " +ArrayCount(educationMethods));
   
    for(educationMethod in educationMethods) {

        Log(logName, recordLogs, "Учебная программа: " +educationMethod.name);

        needCreate = needCreateNotification(educationMethod, allEducationMethods, personID);

        Log(logName, recordLogs, "Нужно ли отправлять уведомление:  " + (needCreate == true ? 'да' : 'нет'));

        if(needCreate && (notificationType == "КУ" || notificationType == "ТУ")) {

            educationMethod.custom_elems.ObtainChildByKey('notification').value.Value  = true;

            edu_name = educationMethod.name.Value;
            finish_date = educationMethod .finish_date.Value;
            curatorName = '';
            email = '';
            if(OptInt(curatorID) != undefined) {
                curatorDocTE = tools.open_doc(curatorID).TopElem;
                curatorName = curatorDocTE.fullname;
                email = curatorDocTE.email;
            }
            info = {
                ep_id: iEducationPlanID,
                edu_name: String(edu_name),
                end_date: StrDate(finish_date, false),
                curator: String(curatorName),
                email: String(email),
                person: String(teEducationPlan.person_fullname),
                end_date_plan: StrDate(teEducationPlan.finish_date, false),
                required: String(required)
            }
            createNotification(notificationType, personID, iEducationPlanID, tools.object_to_text(info, 'json'));
        }
    }

} catch (err) {
    Log(logName, recordLogs, "ERROR: " + err);

}