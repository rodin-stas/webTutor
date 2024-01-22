eventCat = ArrayOptFirstElem(XQuery("for $elem in events where id = " + iEventId + " return $elem"))

if (eventCat.send_type != "never" && eventCat.status_id != "close") {

	person = ArrayOptFirstElem(XQuery("for $elem in collaborators where id =" + iUserId + " return $elem"))
	if (person.is_dismiss == false) {
		if (person.email != "" && person.email != undefined) {
			personLng = tools.call_code_library_method("nlmk_localization", "getCurLng", [iUserId, null]);
			tools.call_code_library_method("nlmk", "create_notification", [String("23_notstd" + "_" + personLng), iUserId, docEventResult.TopElem.event_name, iEventId, null]);
		} else {
			manager = ArrayOptFirstElem(XQuery("for $elem in func_managers where object_id = " + iUserId + " and boss_type_id=6148914691236517290 return $elem"));

			if (manager != undefined) {
				managerLng = tools.call_code_library_method("nlmk_localization", "getCurLng", [manager.person_id, null]);
				tools.call_code_library_method("nlmk", "create_notification", [String("23_manager" + "_" + personLng), manager.person_id, docEventResult.TopElem.person_fullname, iEventId, null]);
			}
		}
	}
}

// eventCat = ArrayOptFirstElem(XQuery("for $elem in events where id = "+iEventId +" return $elem"))

// if (eventCat.send_type != "never" && eventCat.status_id != "close"){

// 	person = ArrayOptFirstElem(XQuery("for $elem in collaborators where id ="+iUserId +" return $elem"))
// 	if (person.is_dismiss == false){
// 		if (person.email != "" && person.email != undefined){
// 			tools.call_code_library_method("nlmk", "create_notification", [ '23_notstd', iUserId, docEventResult.TopElem.event_name, iEventId, null]);
// 		}else{
// 			manager = ArrayOptFirstElem(XQuery("for $elem in func_managers where object_id = "+iUserId+" and boss_type_id=6148914691236517290 return $elem"));
// 			if (manager != undefined){
// 				tools.call_code_library_method("nlmk", "create_notification", [ '23_manager', manager.person_id, docEventResult.TopElem.person_fullname, iEventId, null]);
// 			}
// 		}
// 	}
// }