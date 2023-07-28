/**
 * @namespace Websoft.WT.NLMK.Event
*/

function get_object_link( sObjectName, iObjectID )
{
	/*catExt = common.exchange_object_types.GetOptChildByKey( sObjectName );
	if( catExt != undefined && catExt.web_template.HasValue )
	{
		return catExt.web_template + "&object_id=" + iObjectID;
	}*/
	return tools_web.get_mode_clean_url( null, iObjectID );
}

function get_object_image_url( catElem )
{
	switch( catElem.Name )
	{
		case "collaborator" :
			return tools_web.get_object_source_url( 'person', catElem.id );
		default:
		{
			if( catElem.ChildExists( "resource_id" ) && catElem.resource_id.HasValue )
			{
				return tools_web.get_object_source_url( 'resource', catElem.resource_id ); 
			}
		}
			
	}

	return "/images/" + catElem.Name + ".png";
}

function get_compound_programs( arrObjectsID, arrRolesID, bAllowSelfAssignment, bLiteData, iPersonID, oCollectionParams, sXQueryQual, sAccessType, sApplication, arrReturnData, iCurApplicationID )
{
	oRes = tools.get_code_library_result_object();
	oRes.array = [];
	var oPaging = oCollectionParams.GetOptProperty("paging");
	oRes.paging = oPaging;

	conds = new Array();
	try
	{
		if( OptInt( arrObjectsID ) != undefined )
		{
			iObjectID = OptInt( arrObjectsID );
			arrObjectsID = new Array();
			arrObjectsID.push( iObjectID );
		}
		else
		{
			if( !IsArray( arrObjectsID ) )
			{
				throw "";
			}
		}
	}
	catch( ex )
	{
		arrObjectsID = new Array();
	}
	
	try
	{
		if( OptInt( arrRolesID ) != undefined )
		{
			iRoleID = OptInt( arrRolesID );
			arrRolesID = new Array();
			arrRolesID.push( iRoleID );
		}
		else
		{
			if( !IsArray( arrRolesID ) )
			{
				throw "";
			}
		}
	}
	catch( ex )
	{
		arrRolesID = new Array();
	}
	
	try
	{
		bLiteData = bLiteData != false;
	}
	catch( ex )
	{
		bLiteData = true;
	}
	
	try
	{
		if( bAllowSelfAssignment != true && bAllowSelfAssignment != false )
		{
			throw "error";
		}
	}
	catch( ex )
	{
		bAllowSelfAssignment = null;
	}
	try
	{
		iPersonID = Int( iPersonID );
	}
	catch( ex )
	{
		iPersonID = null;
	}
	
	if ( sXQueryQual == null || sXQueryQual == undefined)
		sXQueryQual = "";

	if ( sXQueryQual != "" )
	{
		conds.push( sXQueryQual );
	}

	if ( sAccessType == null || sAccessType == undefined)
	{
		sAccessType = "auto";
	}

	if ( sAccessType != "auto" && sAccessType != "admin" && sAccessType != "manager" && sAccessType != "hr" && sAccessType != "expert" && sAccessType != "observer" )
	{
		sAccessType = "auto";
	}
	
	if ( sApplication == null || sApplication == undefined)
	{
		sApplication = "";
	}

	iApplicationID = OptInt(sApplication);
	if(iApplicationID != undefined)
	{
		sApplication = ArrayOptFirstElem(tool.xquery("for $elem in applications where $elem/id = " + iApplicationID + " return $elem/Fields('code')"), {code: ""}).code;
	}
		
	if(sApplication != "")
	{
		var iApplLevel = tools.call_code_library_method( "libApplication", "GetPersonApplicationAccessLevel", [ iPersonID, sApplication ] );
		
		if(iApplLevel >= 10 && (sAccessType == "auto" || sAccessType == "admin"))
		{
			sAccessType = "admin"; //Администратор приложения
		}
		else if(iApplLevel >= 7 && (sAccessType == "auto" || sAccessType == "manager"))
		{
			sAccessType = "manager"; //Администратор процесса
		}
		else if(iApplLevel >= 5 && (sAccessType == "auto" || sAccessType == "hr"))
		{
			sAccessType = "hr"; //Администратор HR
		}
		else if(iApplLevel >= 3 && (sAccessType == "auto" || sAccessType == "expert"))
		{
			sAccessType = "expert"; //Эксперт
		}
		else if(iApplLevel >= 1 && (sAccessType == "auto" || sAccessType == "observer"))
		{
			sAccessType = "observer"; //Наблюдатель
		}
		else
		{
			sAccessType = "reject";
		}
	}

	arrEduPlansPersonsCond = [];
	arrEduPlansGroupsCond = [];
	var arrBossType = [];
	switch(sAccessType)
	{
		case "hr":
			manager_type_id_app = 0;
	//для показателей по сотрудникам
			if (ArrayOptFirstElem(arrBossType) == undefined)
			{
				var teApplication = tools_app.get_cur_application(OptInt(iCurApplicationID));
				if (teApplication != null)
				{
					if ( teApplication.wvars.GetOptChildByKey( 'manager_type_id' ) != undefined )
					{
						manager_type_id = (OptInt( teApplication.wvars.GetOptChildByKey( 'manager_type_id' ).value, 0 ));
						manager_type_id_app = manager_type_id;
						if (manager_type_id > 0)
							arrBossType.push(manager_type_id);
					}
				}
			}
			if(ArrayOptFirstElem(arrBossType) == undefined)
			{
				arrBossType = ArrayExtract(tools.xquery("for $elem in boss_types where $elem/code = 'education_manager' return $elem"), 'id.Value');
			}
			arrSubordinateIDs = tools.call_code_library_method( "libMain", "get_subordinate_records", [ iPersonID, ['func'], true, '', null, '', true, true, true, true, arrBossType, true ] );
			arrEduPlansPersonsCond.push( "MatchSome( $elem/person_id, ( " + ArrayMerge( arrSubordinateIDs, "This", "," ) + " ) )" );

	//для показателей по группам
			xarrGroups = XQuery("for $elem in func_managers where $elem/catalog = 'group' and $elem/person_id = " + iPersonID + " and $elem/boss_type_id = " + manager_type_id_app + " return $elem/Fields('object_id')");
			arrEduPlansGroupsCond.push( "MatchSome( $elem/object_id, ( " + ArrayMerge( xarrGroups, "This.object_id.Value", "," ) + " ) )" );
			break;

		case "expert":
			oExpert = ArrayOptFirstElem(tools.xquery("for $elem in experts where $elem/type = 'collaborator' and $elem/person_id = " + iPersonID + " return $elem/Fields('id')"));
			arrRoles= [];
			if (oExpert != undefined)
			{
				arrRoles = tools.xquery("for $elem in roles where $elem/catalog_name = 'compound_program' and contains($elem/experts," + OptInt(oExpert.id, 0) + ") return $elem/Fields('id')");
				if ( ArrayOptFirstElem( arrRoles )!= undefined )
				{
					conds.push( "MatchSome( $elem/role_id, ( " + ArrayMerge( arrRoles, "This.id.Value", "," ) + " ) )" );
				}
				else
				{
					return oRes;
				}
			}
			else
			{
				return oRes;
			}
			
			break;
		case "observer":
	//для показателей по сотрудникам			
			arrSubordinateIDs = tools.call_code_library_method( "libMain", "get_subordinate_records", [ iPersonID, ['func'], true, '', null, '', true, true, true, true, [], true ] );
			arrEduPlansPersonsCond.push( "MatchSome( $elem/person_id, ( " + ArrayMerge( arrSubordinateIDs, "This", "," ) + " ) )" );

	//для показателей по группам			
			xarrFMGroups = tools.xquery( "for $elem in func_managers where $elem/catalog = 'group' and $elem/person_id = " + iPersonID + "  return $elem/Fields('object_id')" );
			arrEduPlansGroupsCond.push( "MatchSome( $elem/object_id, ( " + ArrayMerge( xarrFMGroups, "This.object_id.Value", "," ) + " ) )" );
			break;
		case "reject":
			return oRes;
	
	}

	if( ArrayOptFirstElem( arrObjectsID ) != undefined )
	{
		conds.push( "MatchSome( $elem/objects_id, ( " + ArrayMerge( arrObjectsID, "This", "," ) + " ) )" );
	}
	if( ArrayOptFirstElem( arrRolesID ) != undefined )
	{
		conds.push( "MatchSome( $elem/role_id, ( " + ArrayMerge( arrRolesID, "This", "," ) + " ) )" );
	}
	if( bAllowSelfAssignment != null )
	{
		conds.push( "$elem/allow_self_assignment = " + XQueryLiteral( bAllowSelfAssignment ) );
	}

	//фильтрация
	var arrFilters = oCollectionParams.GetOptProperty( "filters", [] );

	if ( arrFilters != undefined && arrFilters != null && IsArray(arrFilters) )
	{
		for ( oFilter in arrFilters )
		{
			if ( oFilter.type == 'search' )
			{
				if ( oFilter.value != '' )
				{
					conds.push("doc-contains( $elem/id, '" + DefaultDb + "'," + XQueryLiteral( oFilter.value ) + " )");
				}
			}
		}
	}	

	sFields = "/Fields('id', 'name', 'resource_id')";
	if( !bLiteData )
	{
		sFields = "/Fields('id', 'name', 'resource_id', 'min_person_num', 'lectors_id', 'allow_self_assignment', 'duration', 'role_id')";
	}
	var sCPReq = "for $elem in compound_programs " + ( ArrayOptFirstElem( conds ) != undefined ? ( " where " + ArrayMerge( conds, "This", " and " ) ) : "" ) + " return $elem" + sFields;
	
	xarrCompoundPrograms = tools.xquery( sCPReq );

	if ( arrReturnData == null || arrReturnData == undefined)
	{
		arrReturnData = [];
	}
	bFolder_program_count = false; //Число этапов
	bProgram_count = false; //Число активностей
	bTrained_person_count = false; //Число обученных сотрудников
	bTrained_group_count = false; //Число обученных групп
	if ( ArrayOptFirstElem( arrReturnData ) != undefined )
		{
			for ( itemReturnData in arrReturnData )
			{
				switch ( itemReturnData )
				{
					case "folder_program_count": //Число этапов
						bFolder_program_count = true;
						break;
					case "program_count": //Число активностей
						bProgram_count = true;
						break;
					case "trained_person_count": //Число обученных сотрудников
						bTrained_person_count = true;
						break;
					case "trained_group_count": //Число обученных групп
						bTrained_group_count = true;
						break;
				}
			}
		}

	if ( bFolder_program_count || bProgram_count )
	{
		xarrCompProgEduMeths = tools.xquery( "for $elem in compound_program_education_methods where MatchSome( $elem/compound_program_id, ( " + ArrayMerge( xarrCompoundPrograms, "This.id.Value", "," ) + " ) ) return $elem/Fields('compound_program_id','object_type')" );
	}

	if ( bTrained_person_count )
		xarrEduPlansPersons = tools.xquery( "for $elem in education_plans where $elem/type = 'collaborator' and $elem/state_id = 4 " + ( ArrayOptFirstElem( arrEduPlansPersonsCond ) != undefined ? ( " and " + ArrayMerge( arrEduPlansPersonsCond, "This", " and " ) ) : "" ) + " return $elem/Fields('compound_program_id')" );
		
	if ( bTrained_group_count )
		xarrEduPlansGroups = tools.xquery( "for $elem in education_plans where $elem/type = 'group' and $elem/state_id = 4 " + ( ArrayOptFirstElem( arrEduPlansGroupsCond ) != undefined ? ( " and " + ArrayMerge( arrEduPlansGroupsCond, "This", " and " ) ) : "" ) + " return $elem/Fields('compound_program_id')" );
		

	if( bLiteData )
	{
		for( _elem in xarrCompoundPrograms )
		{
			_elemDoc = tools.open_doc(OptInt(_elem.id.Value)).TopElem;
			_access_groups = ArraySelectAll(_elemDoc.access.access_groups);
			_access = false;

			for(_group in _access_groups) {
				_check_group = XQuery("for $elem in group_collaborators where $elem/collaborator_id = "+ iPersonID +" and $elem/group_id = "+ _group.group_id +" return $elem")

				if(ArrayOptFirstElem(_check_group) != undefined) {
					_access = true;
					continue;
				}
			}

			if(ArrayCount(_access_groups) == 0 || _access == true) {
				obj = new Object();
				obj.id = _elem.id.Value;
				obj.name = _elem.name.Value;
				obj.link = get_object_link( "compound_program", _elem.id );
				obj.image_url = get_object_image_url( _elem );
	
				oRes.array.push( obj );
			} 
		}
	}
	else
	{
		function get_role_name( _role_id )
		{
			catRole = ArrayOptFindBySortedKey( arrRoles, _role_id, "id" );
			return ( catRole != undefined ? catRole.name.Value : "" );
		}
		arrRoles = new Array();
		for( _elem in xarrCompoundPrograms )
		{
			if( _elem.role_id.HasValue )
			{
				arrRoles = ArrayUnion( arrRoles, _elem.role_id );
			}
		}
		if( ArrayOptFirstElem( arrRoles ) != undefined )
		{
			arrRoles = ArrayDirect( tools.xquery( "for $elem_qc in roles where MatchSome( $elem_qc/id, ( " + ArrayMerge( arrRoles, "This", "," ) + " ) ) order by $elem_qc/id return $elem_qc/Fields( 'id', 'name' )" ) );
		}
		arrLectors = Array();
		for( _elem in xarrCompoundPrograms )
		{
			if( ArrayOptFirstElem( _elem.lectors_id ) != undefined )
			{
				arrLectors = ArrayUnion( arrLectors, _elem.lectors_id );
			}
		}
		xarrLectors = new Array();
		if( ArrayOptFirstElem( arrLectors ) != undefined )
		{
			xarrLectors = ArrayDirect( tools.xquery( "for $elem in lectors where MatchSome( $elem/id, ( " + ArrayMerge( arrLectors, "This", "," ) + " ) ) order by $elem/id return $elem/Fields( 'id', 'lector_fullname' )" ) )
		}
		xarrEducationPlan = new Array();
		if( iPersonID != null )
		{
			var education_plan_conds = new Array();
			xarrPersonGroups = tools.xquery( "for $elem in group_collaborators where $elem/collaborator_id = " + iPersonID + " return $elem/Fields( 'group_id' )" );
			if( ArrayOptFirstElem( xarrPersonGroups ) != undefined )
			{
				education_plan_conds.push( "( $elem/type = 'group' and MatchSome( $elem/object_id, ( " + ArrayMerge( xarrPersonGroups, "This.group_id", "," ) + " ) ) )" );
			}
			education_plan_conds.push( "$elem/person_id = " + iPersonID );
			
			xarrEducationPlan = ArrayDirect( tools.xquery( "for $elem in education_plans where $elem/compound_program_id != null() and ( " + ArrayMerge( education_plan_conds, "This", " or " ) + " ) order by $elem/compound_program_id return $elem/Fields('id', 'state_id','compound_program_id')" ) );
		}
		for( _elem in xarrCompoundPrograms )
		{

			_elemDoc = tools.open_doc(OptInt(_elem.id.Value)).TopElem;
			_access_groups = ArraySelectAll(_elemDoc.access.access_groups);
			_access = false;

			for(_group in _access_groups) {
				_check_group = XQuery("for $elem in group_collaborators where $elem/collaborator_id = "+ iPersonID +" and $elem/group_id = "+ _group.group_id +" return $elem")

				if(ArrayOptFirstElem(_check_group) != undefined) {
					_access = true;
					continue;
				}
			}

			if(ArrayCount(_access_groups) == 0 || _access == true) {
				obj = new Object();
				obj.id = _elem.id.Value;
				obj.name = _elem.name.Value;
				obj.min_person_num = _elem.min_person_num.Value;
				obj.duration = _elem.duration.Value;
				obj.allow_self_assignment = ( _elem.allow_self_assignment ? "да" : "нет" );
				arrLectorNames = new Array();
				for( _lector in _elem.lectors_id )
				{
					catLector = ArrayOptFindBySortedKey( xarrLectors, _lector, "id" );
					if( catLector != undefined )
					{
						arrLectorNames.push( catLector.lector_fullname.Value );
					}
				}
				obj.lectors_name = ArrayMerge( arrLectorNames, "This", ", " );
				obj.link = get_object_link( "compound_program", _elem.id );
				obj.image_url = get_object_image_url( _elem );
				obj.roles_name = ArrayMerge( _elem.role_id, "get_role_name( This )", ", " );
				obj.education_plan_state_name = "";
				obj.education_plan_state_id = "";
				catEducationPlan = ArrayOptFindBySortedKey( xarrEducationPlan, _elem.id, "compound_program_id" );
				if( catEducationPlan != undefined )
				{
					obj.education_plan_state_name = ( catEducationPlan.state_id.HasValue ? catEducationPlan.state_id.ForeignElem.name.Value : "" );
					obj.education_plan_state_id = catEducationPlan.state_id.Value;
				}
				
				if ( bFolder_program_count )
					obj.folder_program_count = ArrayCount( ArraySelect( xarrCompProgEduMeths, "This.compound_program_id.Value == _elem.id.Value && This.object_type.Value == 'folder'" ) ); //Число этапов – количество разделов модульной программы с типом Этап
				else
					obj.folder_program_count = null;
	
				if ( bProgram_count )
					obj.program_count = ArrayCount( ArraySelect( xarrCompProgEduMeths, "This.compound_program_id.Value == _elem.id.Value && This.object_type.Value != 'folder'" ) ); //Число активностей – количество разделов модульной программы с любым типом, кроме Этап
				else
					obj.program_count = null;
	
				if ( bTrained_person_count )
					obj.trained_person_count = ArrayCount( ArraySelect( xarrEduPlansPersons, "This.compound_program_id.Value == _elem.id.Value" ) ); //Число обученных сотрудников – число планов обучения с типом Сотрудник, привязанных к данной программе и имеющих статус Пройден
				else
					obj.trained_person_count = null;
					
				if ( bTrained_group_count )
					obj.trained_group_count = ArrayCount( ArraySelect( xarrEduPlansGroups, "This.compound_program_id.Value == _elem.id.Value" ) ); //Число обученных групп – число планов обучения с типом Группа, привязанных к данной программе и имеющих статус Пройден
				else
					obj.trained_group_count = null;
	
				oRes.array.push( obj );
			}

			
		}
	}

	if(ObjectType(oCollectionParams.sort) == 'JsObject' && oCollectionParams.sort.FIELD != null && oCollectionParams.sort.FIELD != undefined && oCollectionParams.sort.FIELD != "" )
	{
		var sFieldName = oCollectionParams.sort.FIELD;
		oRes.array = ArraySort(oRes.array, sFieldName, ((oCollectionParams.sort.DIRECTION == "DESC") ? "-" : "+"));
	}

	if(ObjectType(oPaging) == 'JsObject' && oPaging.SIZE != null)
	{
		oPaging.MANUAL = true;
		oPaging.TOTAL = ArrayCount(oRes.array);
		oRes.paging = oPaging;
		oRes.array = ArrayRange(oRes.array, ( OptInt(oPaging.START_INDEX, 0) > 0 ? oPaging.START_INDEX : OptInt(oPaging.INDEX, 0) * oPaging.SIZE ), oPaging.SIZE);
	}

	return oRes;
}

/**
 * @function GetEducationMethodCompoundProgramsNLMK
 * @memberof Websoft.WT.NLMK.Event
 * @description получения списка модульных программ по учебной программе
 * @author Rodin_Stas
 * @param {bigint} iEducationMethodID - ID учебной программы
 * @param {bigint} iRoleID - ID категории с модульными программами
 * @param {bool} bAllowSelfAssignment - Отбор по признаку возможности самоназначения
 * @param {bigint} iPersonID - ID сотрудника по которому строится список
 * @param {oCollectionParam} oCollectionParams - Параметры выборки.
 * @param {string} sXQueryQual строка для XQuery-фильтра
 * @param {string} sAccessType - Тип доступа: "admin"/"manager"/"hr"/"expert"/"observer"/"auto"
 * @param {string} sApplication - код приложения, по которому определяется доступ
 * @param {string[]} arrReturnData - массив полей для вывода: "folder_program_count"(Число этапов),"program_count"(Число активностей), "trained_person_count"(Число обученных сотрудников), "trained_group_count"(Число обученных групп)
 * @param {bigint} iCurApplicationID - ID текущего приложения
 * @returns {WTCompoundProgramEduMethodResult}
*/
function GetEducationMethodCompoundProgramsNLMK( iEducationMethodID, iRoleID, bAllowSelfAssignment, iPersonID, oCollectionParams, sXQueryQual, sAccessType, sApplication, arrReturnData, iCurApplicationID )
{
	return get_compound_programs( iEducationMethodID, iRoleID, bAllowSelfAssignment, true, iPersonID, oCollectionParams, sXQueryQual, sAccessType, sApplication, arrReturnData, iCurApplicationID );
}