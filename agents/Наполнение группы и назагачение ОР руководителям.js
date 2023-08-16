var group_id = OptInt(Param.group_id);
var step = OptInt(Param.step);
var create_education_programs = Param.create_education_programs; 

function get_bosses(start_date) {

    var sql = XQuery("sql: \n\
    DECLARE @StartDate DATE = "+ SqlLiteral(start_date) +"; \n\
    WITH [bosses] AS (\n\
    SELECT \n\
        [t0].[id],\n\
        [t0].[fullname],\n\
        [t0].[position_id],\n\
        IIF([d0].data.value('count(//collaborator/change_logs/change_log/id)','bigint') > 1,  [d0].data.value('(/collaborator/change_logs/change_log[last() - 1]/position_id)[1]', 'bigint'), NUll) AS [previous_position_id],\n\
        IIF([d0].data.value('count(//collaborator/change_logs/change_log/id)','bigint') > 1,  (SELECT [t1].data.value('(/position/custom_elems/custom_elem[name=''cust_taxonomyLevel'']/value)[1]', 'int') FROM [position] AS [t1]  WHERE [t1].[id] = [d0].data.value('(/collaborator/change_logs/change_log[last() - 1]/position_id)[1]', 'bigint')), NUll) AS [previous_position_level],\n\
        [d0].data.value('count(//collaborator/change_logs/change_log/id)','bigint') AS [count_changes]\n\
    FROM    \n\
        [collaborator] as [d0]\n\
        INNER JOIN [collaborators] AS [t0] ON [t0].[id] = [d0].[id]\n\
    WHERE \n\
        [d0].data.value('(/collaborator/custom_elems/custom_elem[name=''f_lvlupr'']/value)[1]', 'int') >=2\n\
        AND [d0].data.value('(/collaborator/custom_elems/custom_elem[name=''f_lvlupr'']/value)[1]', 'int') <=7\n\
        AND [t0].[is_dismiss] != 1\n\
        AND CONVERT(DATE, [d0].data.value('(/collaborator/custom_elems/custom_elem[name=''f_oa7c'']/value)[1]', 'VARCHAR(124)'), 103) = @StartDate\n\
    )\n\
    SELECT \n\
        *\n\
    FROM\n\
        [bosses] AS [t0]\n\
        \n\
    WHERE\n\
        [t0].[count_changes] = 1 \n\
        OR [t0].[previous_position_level] > 7 "
);

return ArraySelectAll(sql)
}

function add_bosses_in_group(group_id, bossesIds) {
    groupDoc = OpenDoc( UrlFromDocID( OptInt(group_id) ) );

    for(bossesId in bossesIds) {
        groupDoc.TopElem.collaborators.ObtainChildByKey( bossesId );

    }
    groupDoc.Save();
}

function create_education_plans(group_id, bosses) {
    groupDocTE = OpenDoc( UrlFromDocID( group_id ) ).TopElem;

	if (groupDocTE.custom_elems.ChildByKeyExists('educationProgramsID')) {
        educationProgramsIDs = String(groupDocTE.custom_elems.GetChildByKey('educationProgramsID').value).split(";");

		for (_educationProgramID in educationProgramsIDs) {

            if(OptInt(_educationProgramID) == undefined) {
                continue;
            }

            compoundProgramDocTE = OpenDoc( UrlFromDocID( OptInt(_educationProgramID) ) ).TopElem;
            _max_days_pr = ArrayMax(ArraySelect(compoundProgramDocTE.programs,'!This.parent_progpam_id.HasValue'),'OptInt(This.delay_days,0)+OptInt(This.days,0)');
		    _max_days = OptInt(_max_days_pr.delay_days,0)+OptInt(_max_days_pr.days,0);

            for ( boss in bosses ) {
                try
                {
                    if( ArrayOptFirstElem(XQuery('for $elem in education_plans where $elem/person_id =' + XQueryLiteral(boss) + ' and $elem/compound_program_id = ' + XQueryLiteral(_educationProgramID) + ' and $elem/group_id = ' + XQueryLiteral(group_id) + ' return $elem/Fields(\'id\')')) != undefined ) {
                        continue;
                    }
                        
                    personDoc = OpenDoc( UrlFromDocID( OptInt(boss) ) ).TopElem;
                    docEducationPlan = OpenNewDoc( 'x-local://wtv/wtv_education_plan.xmd' );
                    docEducationPlan.TopElem.AssignElem( compoundProgramDocTE );
                    docEducationPlan.TopElem.code = '';
                    docEducationPlan.TopElem.comment = '';
                    docEducationPlan.TopElem.group_id = group_id;
                    docEducationPlan.TopElem.compound_program_id = compoundProgramDocTE.id;
                    docEducationPlan.TopElem.person_id = boss;
                    tools.common_filling( 'collaborator', docEducationPlan.TopElem, boss, personDoc );
                    docEducationPlan.TopElem.create_date = Date();
                    docEducationPlan.TopElem.plan_date = Date();
                    docEducationPlan.TopElem.finish_date = tools.AdjustDate(Date(),_max_days);
                    docEducationPlan.BindToDb(DefaultDb);
                    docEducationPlan.Save();
                    docEducationPlan.TopElem.last_state_id = docEducationPlan.TopElem.state_id;
                    tools.call_code_library_method( 'libEducation', 'update_education_plan_date', [ docEducationPlan.DocID, docEducationPlan ] );
                    CallServerMethod( 'tools', 'call_code_library_method', [ 'libEducation', 'update_education_plan', [ docEducationPlan.DocID, null, boss, true ] ] );
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
    if(group_id == undefined || step == undefined) {
        alert("Не заполнены параметры агента, агент остановлен");
        Cancel();
    }

    var start_date =  OptDate(DateOffset(Date(), step * 86400 * (-1) ));
    var bosses = get_bosses(start_date);
    var bossesIds = ArrayExtractKeys(bosses, 'id');

    if(ArrayCount(bosses) > 0) {
        add_bosses_in_group(group_id, bossesIds)

        if(create_education_programs == '1' || create_education_programs  == "true" || create_education_programs  == true) {
            create_education_plans(group_id, bossesIds);
        }
    }

} catch(err) {
    alert("Err ==" + err)
}
