
function create_education_plans(group_id, persons) {
    groupDocTE = OpenDoc( UrlFromDocID( OptInt(group_id) ) ).TopElem;

	if (groupDocTE.custom_elems.ChildByKeyExists('educationProgramsID')) {
        educationProgramsIDs = String(groupDocTE.custom_elems.GetChildByKey('educationProgramsID').value).split(";");

		for (_educationProgramID in educationProgramsIDs) {

            if(OptInt(_educationProgramID) == undefined) {
                continue;
            }

            compoundProgramDocTE = OpenDoc( UrlFromDocID( OptInt(_educationProgramID) ) ).TopElem;
            _max_days_pr = ArrayMax(ArraySelect(compoundProgramDocTE.programs,'!This.parent_progpam_id.HasValue'),'OptInt(This.delay_days,0)+OptInt(This.days,0)');
		    _max_days = OptInt(_max_days_pr.delay_days,0)+OptInt(_max_days_pr.days,0);

            for ( person in persons ) {
                try
                {
                    if( ArrayOptFirstElem(XQuery('for $elem in education_plans where $elem/person_id =' + XQueryLiteral(person.collaborator_id) + ' and $elem/compound_program_id = ' + XQueryLiteral(_educationProgramID) + ' and $elem/group_id = ' + XQueryLiteral(group_id) + ' return $elem/Fields(\'id\')')) != undefined ) {
                        continue;
                    }

                    personDoc = OpenDoc(UrlFromDocID(person.collaborator_id)).TopElem;
                    docEducationPlan = OpenNewDoc( 'x-local://wtv/wtv_education_plan.xmd' );
                    docEducationPlan.TopElem.AssignElem( compoundProgramDocTE );
                    docEducationPlan.TopElem.code = '';
                    docEducationPlan.TopElem.comment = '';
                    docEducationPlan.TopElem.group_id = group_id;
                    docEducationPlan.TopElem.compound_program_id = compoundProgramDocTE.id;
                    docEducationPlan.TopElem.person_id = person.collaborator_id;
                    tools.common_filling( 'collaborator', docEducationPlan.TopElem, person.collaborator_id, personDoc );
                    docEducationPlan.TopElem.create_date = Date();
                    docEducationPlan.TopElem.plan_date = Date();
                    docEducationPlan.TopElem.finish_date = tools.AdjustDate(Date(),_max_days);
                    docEducationPlan.BindToDb(DefaultDb);
                    docEducationPlan.Save();
                    docEducationPlan.TopElem.last_state_id = docEducationPlan.TopElem.state_id;
                    tools.call_code_library_method( 'libEducation', 'update_education_plan_date', [ docEducationPlan.DocID, docEducationPlan ] );
                    CallServerMethod( 'tools', 'call_code_library_method', [ 'libEducation', 'update_education_plan', [ docEducationPlan.DocID, null, person.collaborator_id, true ] ] );
                    //_first = false;
                }
                catch ( err )
                {
                    alert("Err ==" + err)
                }
            }
        }
    }	
}

try {
    var group_id = OptInt(Param.group_id);

    if(group_id == undefined) {
        alert("Не заполнены параметры агента, агент остановлен");
        Cancel();
    }

    var GroupDocTE = OpenDoc(UrlFromDocID(group_id)).TopElem;

    var collaborators = ArraySelectAll(XQuery('for $elem in group_collaborators where $elem/group_id='+ XQueryLiteral(group_id)+' return $elem/Fields(\'collaborator_id\')') )
    alert(ArrayCount(collaborators))

    if(ArrayCount(collaborators) > 0) {
        create_education_plans(group_id, collaborators)
    }

} catch(err) {
    alert("Err ==" + err)
}
