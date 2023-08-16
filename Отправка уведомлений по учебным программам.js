function createNotification(type, personID, educationPlanId, info ) {

    personDocTE = tools.open_doc(personID).TopElem;
    personEmail = personDocTE.email;

    if(StrCharCount(personEmail) > 0) {
        alert("Есть почта у сотрудника")

        if (type == "КУ") {
            tools.create_notification('KU_education_method_assign', personID, info, educationPlanId);
        } 

        if (type== "ТУ") {
            tools.create_notification('TU_education_method_assign', personID, info, educationPlanId);
        }

    } else {
        alert("Нет почты у сотрудника")

        MAIN_BOSS_TYPE_ID = ArrayOptFirstElem(XQuery("for $elem in boss_types where $elem/code = 'main' return $elem/Fields('id')", {id: null})).id;
        alert("MAIN_BOSS_TYPE_ID =="+MAIN_BOSS_TYPE_ID)
        funcID = ArrayOptFirstElem(XQuery("for $fm in func_managers where $fm/object_id = " + XQueryLiteral(personID) + " and $fm/boss_type_id = "+XQueryLiteral(MAIN_BOSS_TYPE_ID)+" return $fm"));
    
        alert("funcID.person_id == "+funcID.person_id)
        if (funcID!= undefined) {
            if (type == "КУ") {
                alert("КУ")
                tools.create_notification('KU_education_method_assign_boss', funcID.person_id, info, educationPlanId);
                
            } 
    
            if (type== "ТУ") {
                alert("ТУ")
                tools.create_notification('TU_education_method_assign_boss', funcID.person_id, info, educationPlanId);
            }
            
        }
    }
}
    
try {
    alert("Тест отправки уведомлений")

    params = OBJECTS_ID_STR.split(';');
    alert(ArrayCount(params))
    educationPlanId = params[0];
    params.splice(0,1);

    alert(ArrayCount(params))
    alert("educationPlanId == "+ educationPlanId);
    alert("programs == "+ tools.object_to_text(params, 'json'))

    if(OptInt(educationPlanId) == undefined) {
        alert("Передан не корректный educationPlanId");
        Cancel();
    }

    educationPlanDocTE = tools.open_doc(educationPlanId).TopElem;
    compoundProgramIdDocTE = tools.open_doc(educationPlanDocTE.compound_program_id).TopElem;
    notificationType = compoundProgramIdDocTE.custom_elems.ObtainChildByKey('f_n5g8').value;
    personID = educationPlanDocTE.person_id;


    alert("notificationType == "+ notificationType);

    if(notificationType == "КУ" || notificationType == "ТУ") {
        for(i = 0; i < ArrayCount(params); i++) {
            edu_name = educationPlanDocTE.programs.GetOptChildByKey(OptInt(params[i]), 'id').name.Value;
            finish_date = educationPlanDocTE.programs.GetOptChildByKey(OptInt(params[i]), 'id').finish_date.Value;
            required = compoundProgramIdDocTE.custom_elems.ObtainChildByKey("canceling_notif").value.Value;
            curatorID = compoundProgramIdDocTE.custom_elems.ObtainChildByKey('curator').value.Value;
            curatorName = '';
            email = '';

            if(OptInt(curatorID) != undefined) {
                curatorDocTE = tools.open_doc(curatorID).TopElem;
                curatorName = curatorDocTE.fullname;
                email = curatorDocTE.email;
            }

            alert("edu_name == "+edu_name)
            alert("required == "+required)

            info = {
                ep_id: educationPlanId,
                edu_name: String(edu_name),
                end_date: DateNewTime(finish_date),
                curator: String(curatorName),
                email: String(email),
                person: String(educationPlanDocTE.person_fullname),
                end_date_plan: DateNewTime(educationPlanDocTE.finish_date),
                required: String(required)
            }

            alert(tools.object_to_text(info, 'json'))
            alert(params[i])
             createNotification(notificationType, personID, educationPlanId, tools.object_to_text(info, 'json'))
        }
    }

} catch (err) {
    alert(err)
}
