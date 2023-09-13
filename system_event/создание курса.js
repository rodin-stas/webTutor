function doSomething(person_id, person_doc, learning_doc) {
    if (person_doc.is_dismiss) {
        DeleteDoc(UrlFromDocID(learning_doc.Doc.DocID));
        return;
    }



    if (OptInt(educationPlanID) != undefined) {
        var educationPlanDocTE = tools.open_doc(educationPlanID).TopElem;
        var compoundProgramIdDocTE = tools.open_doc(educationPlanDocTE.compound_program_id).TopElem;
        
        method = ArrayOptFirstElem(ArraySelect(compoundProgramIdDocTE.programs, "This.object_id == " + courseID));
        ce = ArrayOptFind(ArraySelectAll(method.custom_elems), 'This.name == "notif_need_cancel"')
        cancelNotification = (ce != undefined ? ce.value : false);
        
        if (tools_web.is_true(cancelNotification)) {
            return;
        }
    }

    var sendNotify = person_doc.lng_id == "english" ? "Course_collab_en" : "Course_collab";
    var sendbossNotify = person_doc.lng_id == "english" ? "Course_boss_en" : "Course_boss";
    if (person_doc.email != "") {
        tools.call_code_library_method("nlmk", "create_notification", [sendNotify, person_id, '', learning_doc.Doc.DocID]);
    } else {
        var MAIN_BOSS_TYPE_ID = ArrayOptFirstElem(XQuery("for $elem in boss_types where $elem/code = 'main' return $elem", { id: null })).id;
        var findBoss = ArrayOptFirstElem(XQuery("for $fm in func_managers where \n\
            $fm/object_id = "+ XQueryLiteral(person_id) + " \n\
	    and $fm/boss_type_id = "+ XQueryLiteral(MAIN_BOSS_TYPE_ID) + " \n\
            return $fm"));
        if (findBoss != undefined) {
            tools.call_code_library_method("nlmk", "create_notification", [sendbossNotify, findBoss.person_id, '', learning_doc.Doc.DocID]);
        }
    }
}

try {
    doSomething(personID, personDoc, learningDoc)
} catch (err) {
    alert("err : " + err)
}

