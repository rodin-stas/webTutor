common_curator = 7114183258990446616;

function sendNotification(person_id,need_cancel,remaining, doc_sec_id, type_notification, lng_notification){
	
	
	if ( type_notification == "ТУ" ) {
	
		if (need_cancel) {
			tools.call_code_library_method("nlmk", "create_notification", [String("plan_created_with_cancel" + "_" + lng_notification), person_id, remaining, doc_sec_id]);
		} else {
			tools.call_code_library_method("nlmk", "create_notification", [String("TU_userplan_assign" + "_" + lng_notification), person_id, remaining, doc_sec_id]);
		}
	} else if (type_notification == "КУ") {
	
		if (need_cancel) {
			tools.call_code_library_method("nlmk", "create_notification", [String("plan_created_with_cancel" + "_" + lng_notification), person_id, remaining, doc_sec_id]);
		} else {
			tools.call_code_library_method("nlmk", "create_notification", [String("plan_created" + "_" + lng_notification), person_id, remaining, doc_sec_id]) ;
		}
	}
}

try {
    var cmpd_program_info = ArrayOptFirstElem(XQuery("sql: \n\
        declare @cpsID bigint = "+SqlLiteral(teEducationPlan.compound_program_id)+"; \n\
        SELECT \n\
            cps.id,\n\
			cps.name,\n\
            cpext.with_cancel,\n\
            cps.duration,\n\
            cpext.curator,\n\
            cpext.notif_type as 'notific_type' \n\
        FROM compound_programs cps \n\
        inner join compound_programs_ext cpext on cpext.id = cps.id \n\
        inner join compound_program cp on cp.id = cps.id \n\
        where \n\
			cps.id = @cpsID \n\
    "));

	if ( cmpd_program_info != undefined ) {
		if ( OptInt(cmpd_program_info.curator,0) != 0 ){
			curator = tools.open_doc(OptInt(cmpd_program_info.curator)).TopElem
		} else {
			curator = tools.open_doc(OptInt(common_curator)).TopElem
		}
		var pass_date = OptDate(teEducationPlan.custom_elems.ObtainChildByKey("pass_date").value,"")
		var end_date = Date();
		if (OptInt(cmpd_program_info.duration) != undefined) {
			if (cmpd_program_info.notific_type == "КУ"){
				end_date = DateOffset(Date(), cmpd_program_info.duration * 24 * 60 * 60);
			} else {
				if (pass_date != ""){
					end_date = pass_date
				} else {
					end_date = DateOffset(Date(), cmpd_program_info.duration * 24 * 60 * 60);
				}
			}
		}
	
		var collabTE = tools.open_doc(OptInt(teEducationPlan.person_id)).TopElem;
		var curLng = tools.call_code_library_method("nlmk_localization", "getCurLng", [teEducationPlan.person_id, collabTE]);

		if(DateNewTime(end_date) == DateNewTime(Date())) {
			end_date = curLng == 'ru' ? "бессрочно" : "indefinitely";
		} else {
			end_date = StrDate(end_date,false);
		}
	
		info = {
			"ep_id": String(iEducationPlanID),
			"person": collabTE.fullname,
			"prog_name" : String(cmpd_program_info.name),
			"end_date" : end_date,
			"curator" : (curLng == 'ru' ? curator.fullname + " " + curator.email : String(tools.call_code_library_method("nlmk_localization", "latinTranslation", [curator.fullname])) + " " + curator.email)
		};
		
		if (cmpd_program_info.notific_type != "" && !collabTE.is_dismiss) {
			
			if (collabTE.email != ''  && collabTE.email != undefined) {
				sendNotification(
					teEducationPlan.person_id, 
					cmpd_program_info.with_cancel,
					tools.object_to_text(info,"json"),
					teEducationPlan.compound_program_id,
					cmpd_program_info.notific_type,
					curLng
				)
			} else  {
				MAIN_BOSS_TYPE_ID = ArrayOptFirstElem(XQuery("for $elem in boss_types where $elem/code = 'main' return $elem", {id: null})).id;
				func_ID = ArrayOptFirstElem(XQuery("for $fm in func_managers where $fm/object_id = "+teEducationPlan.person_id+" and boss_type_id = "+MAIN_BOSS_TYPE_ID+" return $fm")).person_id;	
				func_lng = tools.call_code_library_method("nlmk_localization", "getCurLng", [func_ID, null]);
				info.curator = (func_lng == 'ru' ? curator.fullname + " " + curator.email : String(tools.call_code_library_method("nlmk_localization", "latinTranslation", [curator.fullname])) + " " + curator.email);

				if (cmpd_program_info.notific_type == "ТУ") {
					tools.call_code_library_method("nlmk", "create_notification", [String("TU_bossplan_assign" + "_" + func_lng), Int(func_ID),tools.object_to_text(info,"json"),iEducationPlanID]);
				} else {
					tools.call_code_library_method("nlmk", "++create_notification", [String("CU_bossplan_assign" + "_" + func_lng), Int(func_ID),tools.object_to_text(info,"json"),iEducationPlanID]);
				}
			}
		}
	} else {
		alert("Что-не так с cmpd_program_info, вернулся undefined; Системное событие с ID = 6630657398820127065")
	}


} catch(err) {
	alert("Возникла непредвиденная ошибка при выполнении системного события Создание плана обучения. ID плана - " + iEducationPlanID + ". Описание ошибки: " + err);
}