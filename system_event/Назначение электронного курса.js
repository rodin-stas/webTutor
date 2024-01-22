function findBoss(person_id) {
	var MAIN_BOSS_TYPE_ID = ArrayOptFirstElem(XQuery("for $elem in boss_types where $elem/code = 'main' return $elem", { id: null })).id;
	return ArrayOptFirstElem(XQuery("for $fm in func_managers where \n\
		$fm/object_id = "+ XQueryLiteral(person_id) + " \n\
	and $fm/boss_type_id = "+ XQueryLiteral(MAIN_BOSS_TYPE_ID) + " \n\
		return $fm"));
}

function doSomething(person_id, person_doc, learning_doc) {
    if (person_doc.is_dismiss) {
        DeleteDoc(UrlFromDocID(learning_doc.Doc.DocID));
        return;
    }

    if (OptInt(educationPlanID) != undefined) {
		info = ArrayOptFirstElem(XQuery("sql:with splan as (
			select
				id,
				person_fullname,
				compound_program_id,
				name
			from education_plans
			where id = " + educationPlanID + "
		), programms as (
			select
				s.id,
				s.person_fullname,
				s.compound_program_id,
				s.name,
				xml_nodes.xml_data.value('(days)[1]','INT') as days,
				xml_nodes.xml_data.value('(object_id)[1]','BIGINT') as object_id,
				xml_nodes.xml_data.value('(custom_elems/custom_elem[name=''notif_need_cancel'']/value)[1]','bit') as need_cancel,
				xml_nodes.xml_data.value('(id)[1]','BIGINT') AS [pr_id],
				xml_nodes.xml_data.value('(parent_progpam_id)[1]','BIGINT') AS [parent_id],
				xml_nodes.xml_data.value('(name)[1]','VARCHAR(MAX)') AS [pr_name]
			from splan s
			inner join education_plan ep on s.id = ep.id
			CROSS APPLY data.nodes('/education_plan/programs/program') as xml_nodes(xml_data)
		)
		select
		p.id,
		p.days,
		p.need_cancel,
		p.person_fullname,
		IIF(p.parent_id IS NULL, p.name, (SELECT pr_name FROM programms WHERE pr_id = p.parent_id)) AS module_name,
        IIF(p.object_id IS NULL, NULL, (SELECT name FROM courses WHERE id = p.object_id)) AS course_name,
		cpext.curator,
		cpext.notif_type,
		cpext.with_cancel,
		cps.name,
		cs.fullname,
		cs.email
		from programms p
		inner join compound_programs cps on cps.id = p.compound_program_id
		inner join compound_programs_ext cpext on cpext.id = p.compound_program_id
		left join collaborators cs on cs.id = cpext.curator
		where object_id = " + courseID))
		

		if (tools_web.is_true(info.need_cancel)) {
			return;
		}
		
		notif = "nlmk_plan_course_assigned";
		
		if (personDoc.email != ""){
			notif += ( info.notif_type == "ТУ" ) ? "_tu" : "_ku";
			notif += ( person_doc.lng_id == "english" ) ? "_en" : "";

            if(person_doc.lng_id  == "english") {
				info.fullname = tools.call_code_library_method("nlmk_localization", "latinTranslation", [info.fullname])
			}

			tools.call_code_library_method("nlmk", "create_notification", [notif,person_id,tools.object_to_text(info,"json"),learningDoc.Doc.DocID]);
		} else {
            curBoss = findBoss(person_id) 
			if (curBoss != undefined){
                curBossDoc = tools.open_doc(curBoss.person_id).TopElem;
				notif += ( info.notif_type == "ТУ" ) ? "_tu_manager" : "_ku_manager";
				notif += ( curBossDoc.lng_id == "english" ) ? "_en" : "";

                if(curBossDoc.lng_id  == "english") {
                    info.fullname = tools.call_code_library_method("nlmk_localization", "latinTranslation", [info.fullname])
                }

				tools.call_code_library_method("nlmk", "create_notification", [notif,curBoss.person_id,tools.object_to_text(info,"json"),learningDoc.Doc.DocID]);
			}
		}
		
    } else {

		var sendNotify = person_doc.lng_id == "english" ? "Course_collab_en" : "Course_collab";
		
		if (person_doc.email != "") {
			tools.call_code_library_method("nlmk", "create_notification", [sendNotify, person_id, '', learning_doc.Doc.DocID]);
		} else {
            curBoss = findBoss(person_id)
			if (curBoss != undefined){
                curBossDoc = tools.open_doc(curBoss.person_id).TopElem;
                var sendbossNotify = curBossDoc.lng_id == "english" ? "Course_boss_en" : "Course_boss";
				tools.call_code_library_method("nlmk", "create_notification", [sendbossNotify, curBoss.person_id, '', learning_doc.Doc.DocID]);
			}
		}
	}
}

try {
    doSomething(personID, personDoc, learningDoc)
} catch (err) {
    alert("err : " + err)
}