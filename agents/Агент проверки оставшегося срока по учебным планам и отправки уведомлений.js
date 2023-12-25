function sendNotification(person_id, need_cancel, remaining, type_notification) {
	if (type_notification == "ТУ") {
		if (need_cancel) {
			tools.call_code_library_method("nlmk", "create_notification", ["plan_remaining_duration_with_cancel_TU", person_id, remaining]);  //ТУ
		} else {
			tools.call_code_library_method("nlmk", "create_notification", ["plan_remaining_duration_TU", person_id, remaining]);  //ТУ
		}
	} else if (type_notification == "КУ") {
		if (need_cancel) {
			tools.call_code_library_method("nlmk", "create_notification", ["plan_remaining_duration_with_cancel", person_id, remaining]); //КУ
		} else {
			tools.call_code_library_method("nlmk", "create_notification", ["plan_remaining_duration", person_id, remaining]);//КУ
		}
	}
}

function sendNotificationEndRemainig(person_id, remaining, type_notification) {
	if (type_notification == "ТУ") {
		tools.call_code_library_method("nlmk", "create_notification", ["plan_remaining_0_TU", person_id, remaining]); //ТУ
	} else if (type_notification == "КУ") {
		tools.call_code_library_method("nlmk", "create_notification", ["plan_remaining_0", person_id, remaining]); //КУ
	}
}

function updateNotificationRemind(planId, date) {
	var educationPlanDoc = tools.open_doc(OptInt(planId));
	var notificationRemind = educationPlanDoc.TopElem.custom_elems.ObtainChildByKey('notification_remind').value;

	if(StrCharCount(notificationRemind) == 0) {
		notificationRemind = String(date);
	} else {
		notificationRemind = notificationRemind + ',' + String(date)
	}
	educationPlanDoc.TopElem.custom_elems.ObtainChildByKey('notification_remind').value.Value = notificationRemind
	educationPlanDoc.Save()
}


EnableLog("plan_durations_log", true)
LogEvent("plan_durations_log", "Начало агента");
var needUpdateNotificationRemind = false;


//var iEducationPlanID = tools.open_doc(OptInt(plan.id)).TopElem;
var active_plans = XQuery("sql:
		with prepared_plans as (
		select
			eps.id,
			eps.person_id,
			eps.person_fullname,
			eps.compound_program_id,
			eps.create_date,
			eps.finish_date,
			eps.plan_date,
			(select top 1 first_assigment from me_approvals mas where mas.collaborator_id = eps.person_id and mas.compound_program_id = eps.compound_program_id order by start_date desc) as first_assigment,
			ep.data.value('(/education_plan/custom_elems/custom_elem[name=''pass_date'']/value)[1]','datetime') as pass_date
		from education_plans eps
		inner join education_plan ep on ep.id = eps.id and ( eps.state_id = 0 or eps.state_id = 1)
	)
	select
		* from (
			select
				(select top 1 is_canceled from cc_un_set_activity_logs clog where clog.compound_program_id = cps.id and clog.collaborator_id = ep.person_id) 'is_canceled',
				ep.id 'plan_id',
				ep.person_id,
				ep.person_fullname,
				ep.compound_program_id,
				ep.first_assigment,
				ep.finish_date,
				cps.name,
				cpext.counts,
				cpext.with_cancel,
				cpext.curator,
				case 
					when ep.first_assigment is null then 
						case
							when notif_type = 'КУ'
								then DATEADD(DAY,cps.duration,ep.create_date)
							when notif_type = 'ТУ'
								then case when ep.pass_date is null 
										then  DATEADD(DAY,cps.duration,ep.create_date)
										else  ep.pass_date
									 end
						end
					else case 
							when first_assigment = 1 
								then ep.finish_date
							else DATEADD(DAY,cps.duration,ep.plan_date)
						end
				end 'end_date',
				case when ep.first_assigment is null then 
					case 
					when notif_type = 'КУ'
						then datediff(day,GETDATE(),DATEADD(DAY,cps.duration,ep.create_date)) 
					when notif_type = 'ТУ'
						then case when ep.pass_date is null
								then  datediff(day,GETDATE(),DATEADD(DAY,cps.duration,ep.create_date))
								else  datediff(day,GETDATE(),ep.pass_date)
							 end
					end
				else case 
							when first_assigment = 1 
								then case when datediff(day,GETDATE(), ep.finish_date) >= 0
										then datediff(day,GETDATE(), ep.finish_date)
										else iif ((datediff(day,GETDATE(), ep.finish_date)) % 14 = 0,0,-1)
									 end
							else  case when datediff(day,GETDATE(),DATEADD(DAY,cps.duration,ep.plan_date)) >= 0
										then datediff(day,GETDATE(),DATEADD(DAY,cps.duration,ep.plan_date))
										else iif (datediff(day,GETDATE(),DATEADD(DAY,cps.duration,ep.plan_date)) % 14 = 0,0,-1)
									 end
						end
				end 'remaining',
				cpext.notif_type as 'notific_type'
			from 
				prepared_plans ep
				inner join compound_programs cps on ep.compound_program_id = cps.id
				inner join compound_programs_ext cpext on cpext.id = cps.id
				inner join compound_program cp on cp.id = cps.id
			) as res
	where  res.is_canceled <> 1 AND
		exists (select 1  from string_split(res.counts, ',') s where s.value = res.remaining ) or res.remaining = 0 
	
")

LogEvent("plan_durations_log", "Всего планов" + ArrayCount(active_plans));

for (plan in active_plans) {
	collabTE = tools.open_doc(OptInt(plan.person_id)).TopElem;
    if ( collabTE.is_dismiss ) {
        continue;
    }
	LogEvent("plan_durations_log", "Пошли по планам");
	try {
		LogEvent("plan_durations_log", "Обрабатывается план обучения " + plan.plan_id);
		if ( OptInt(plan.curator, 0 ) != 0) {
			curator = OpenDoc(UrlFromDocID(OptInt(plan.curator))).TopElem
		} else {
			curator = OpenDoc(UrlFromDocID(OptInt(Param.curator))).TopElem
		}
        planRemaining = OptInt(plan.remaining, 0) > 0 ? true : false;
		info = {
			"remaining": String(plan.remaining),
			"prog_name": String(plan.name),
			"end_date": StrDate(Date(plan.end_date), false),
			"curator": curator.fullname + " " + curator.email,
			"person": collabTE.fullname,
			"edplan": String(plan.plan_id)
		};
        info_data = tools.object_to_text(info, "json");

        if ( collabTE.email != '') {
			if (is_required == undefined){
				if ( plan.notific_type != "" ) {
					if ( planRemaining ) {
						sendNotification(plan.plan_id, plan.with_cancel, info_data, plan.notific_type);
					} else if (plan.with_cancel){
						sendNotificationEndRemainig(plan.plan_id, info_data, plan.notific_type);
					} else {
						if (plan.notific_type == "ТУ"){
							sendNotificationEndRemainig(plan.plan_id, info_data, plan.notific_type);
						}
						// if (plan.notific_type == "КУ"){
						// 	sendNotificationEndRemainig(plan.plan_id, info_data, plan.notific_type);
						// }
					}
				}
			} else {
				if ( planRemaining ) {
					sendNotification(plan.plan_id, plan.with_cancel, info_data, "ТУ");
				} else if (plan.with_cancel){
					sendNotificationEndRemainig(plan.plan_id, info_data, "ТУ");
				} else {
					sendNotificationEndRemainig(person_id, remaining, "ТУ")
				}
			}
        }

		MAIN_BOSS_TYPE_ID = ArrayOptFirstElem(XQuery("for $elem in boss_types where $elem/code = 'main' return $elem", {id: null})).id;
		func_ID = ArrayOptFirstElem(XQuery("for $fm in func_managers where $fm/object_id = " + XQueryLiteral(plan.person_id) + " and boss_type_id = "+XQueryLiteral(MAIN_BOSS_TYPE_ID)+" return $fm"));
		if (func_ID != undefined) {
			func_ID = OptInt(func_ID.person_id, null);
		} else {
            continue;
        }
		if (is_required == undefined){
			if (planRemaining) {
				if ( plan.notific_type == "ТУ" && collabTE.email == '' ) {
					tools.call_code_library_method("nlmk", "create_notification", ['Boss_plan_remaining_duration_TU', func_ID, info_data, plan.person_id]);
					// +
					needUpdateNotificationRemind = true;
				} 
				if ( plan.notific_type == "КУ"  && collabTE.email == '' ) {
					if (plan.with_cancel) {
						tools.call_code_library_method("nlmk", "create_notification", ['Boss_plan_remaining_duration_with_cancel', func_ID, info_data, plan.person_id]);
						// +
						needUpdateNotificationRemind = true;
					} else {
						tools.call_code_library_method("nlmk", "create_notification", ['Boss_plan_remaining_duration', func_ID, info_data, plan.person_id]);
						// +
						needUpdateNotificationRemind = true;

					}
				}
			} else {
				if ( plan.notific_type == "КУ"  && collabTE.email == '' ) {
					if (plan.with_cancel){
					tools.call_code_library_method("nlmk", "create_notification", ['Boss_plan_remaining_0', func_ID, info_data, plan.person_id]);
				}
			}
				if ( plan.notific_type == "ТУ" ) {
					tools.call_code_library_method("nlmk", "create_notification", ['Boss_plan_remaining_0_TU', func_ID, info_data, plan.person_id]);
				}
			}
		} else {
			if (planRemaining) {
					tools.call_code_library_method("nlmk", "create_notification", ['Boss_plan_remaining_duration_TU', func_ID, info_data, plan.person_id]);
			} else {
					tools.call_code_library_method("nlmk", "create_notification", ['Boss_plan_remaining_0_TU', func_ID, info_data, plan.person_id]);
			} 
		}
		if(needUpdateNotificationRemind) {
			LogEvent("plan_durations_log", "Записали дату отправки в notification_remind");
			updateNotificationRemind(plan.plan_id, Date())
		}
		LogEvent("plan_durations_log", "Обработка плана обучения обучения завершена " + plan.plan_id);
		LogEvent("plan_durations_log", "________________________________________________________________");
	} catch (err) {
		LogEvent("plan_durations_log", "Возникла непредвиденая ошибка " + err);

	}
}
LogEvent("plan_durations_log", "Агент завершает работу");
EnableLog("plan_durations_log", false)