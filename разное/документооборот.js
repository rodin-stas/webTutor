try
{
	iPersonId = ( curObject.person_id.HasValue ) ? OptInt( curObject.person_id.Value ) : undefined;
	personDoc = OpenDoc( UrlFromDocID( iPersonId ) ).TopElem;
}
catch ( err )
{
	alert(err);
}

if (iPersonId != undefined)
{
		MAIN_BOSS_TYPE_ID = ArrayOptFirstElem(XQuery("for $elem in boss_types where $elem/code = 'main' return $elem", {id: null})).id;
	fldFuncManager = ArrayOptFirstElem(XQuery("for $elem in func_managers where $elem/object_id = " + iPersonId + " and $elem/boss_type_id = "+XQueryLiteral(MAIN_BOSS_TYPE_ID)+" and $elem/catalog='collaborator' return $elem"));
	
	if (fldFuncManager != undefined)
	{
		if ( curObject.is_group && ArrayOptFind(curObject.persons, "This.person_id == " + curObject.person_id) != undefined || !curObject.is_group)
			tools.call_code_library_method("nlmk", "create_notification", ["BP005", fldFuncManager.person_id, "", curObject.Doc.DocID, null, curObject]);
	}
	
	//Закрытие заявки на Доп. группу
	tools.call_code_library_method("nlmk_requests", "changeStatusRequest", [iPersonId, '7130249429708716750', 'active', 'close'])
	
}	

function new_time_zone_date (_cur_date, _time_zone_from, _obj_id_tz_to){
	_new_date = '';
	if(OptDate(_cur_date) == undefined)
		return undefined
	
	if(OptDate(tools_web.get_timezone_date(_cur_date, _time_zone_from, tools_web.get_timezone(_obj_id_tz_to) ) ) != undefined){
		_new_date = StrDate( OptDate(tools_web.get_timezone_date(_cur_date, _time_zone_from, tools_web.get_timezone(_obj_id_tz_to) ) ) , true, false) 
	}else{
		return undefined
	}
	
	return _new_date
}




//перевод заявки на этап "Подтверждение руководителем"
_source.TopElem.workflow_state = "сonfirmation_supervisor";

//проставление информционных полей
try
{
	_event_doc = tools.open_doc(curObject.object_id);
	
	_event_time_zone = OptInt(_event_doc.TopElem.place_id) != undefined ? OptInt(_event_doc.TopElem.place_id.OptForeignElem.timezone_id) != undefined ? _event_doc.TopElem.place_id.OptForeignElem.timezone_id : "" : "";
	
	_source.TopElem.workflow_fields.ObtainChildByKey('education_method_name').value = curObject.object_name;
	_source.TopElem.workflow_fields.ObtainChildByKey('date_beg').value = OptDate(new_time_zone_date(curObject.object_id.OptForeignElem.start_date, _event_time_zone, _source.TopElem.person_id)) != undefined ?  new_time_zone_date(curObject.object_id.OptForeignElem.start_date, _event_time_zone, _source.TopElem.person_id) : StrDate(curObject.object_id.OptForeignElem.start_date, true, false);
	_source.TopElem.workflow_fields.ObtainChildByKey('date_end').value = OptDate(new_time_zone_date(curObject.object_id.OptForeignElem.finish_date, _event_time_zone, _source.TopElem.person_id)) != undefined ?  new_time_zone_date(curObject.object_id.OptForeignElem.finish_date, _event_time_zone, _source.TopElem.person_id) : StrDate(curObject.object_id.OptForeignElem.finish_date, true, false);
	
	
	if(curObject.object_id.OptForeignElem.place_id.OptForeignElem != undefined)
		_source.TopElem.workflow_fields.ObtainChildByKey('place').value = curObject.object_id.OptForeignElem.place_id.OptForeignElem.name;
	else
		_source.TopElem.workflow_fields.ObtainChildByKey('place').value = _event_doc.TopElem.place;
	
	_tutors_text = '<br>';
	for(elem in _event_doc.TopElem.lectors)
	{
		_tutors_text += '- ' + elem.lector_id.OptForeignElem.lector_fullname + '<br>'
	}
	_source.TopElem.workflow_fields.ObtainChildByKey('tutors').value = _tutors_text;
	/* _education_type = '';
	switch(curObject.object_id.OptForeignElem.type_id)
	{
		case 'compound_program':
			_education_type = 'Модульная программа';
			break;
		
		case 'education_method':
			_education_type = 'Учебная программа';
			break;
			
		default:
			_education_type = 'Не получилось выяснить образовательное решение';
	} */
	
	_source.TopElem.workflow_fields.ObtainChildByKey('education_type').value = lists.event_forms.GetOptChildByKey(_event_doc.TopElem.event_form, 'id') != undefined ? lists.event_forms.GetOptChildByKey(_event_doc.TopElem.event_form, 'id').name : ""; //tools.open_doc(curObject.event_type_id) != undefined ? tools.open_doc(curObject.event_type_id).TopElem.name : "";;
	//sushkin 0512
	
	if(ArrayOptFirstElem(_event_doc.TopElem.phases) != undefined){
		_phase_str = "";
		_phase_count = 1;
		for(_phase in _event_doc.TopElem.phases){
			_phase.start_date = OptDate(new_time_zone_date(_phase.start_date, _event_time_zone, _source.TopElem.person_id)) != undefined ? new_time_zone_date(_phase.start_date, _event_time_zone, _source.TopElem.person_id) : _phase.start_date;
			_phase.finish_date = OptDate(new_time_zone_date(_phase.finish_date, _event_time_zone, _source.TopElem.person_id)) != undefined ? new_time_zone_date(_phase.finish_date, _event_time_zone, _source.TopElem.person_id) : _phase.finish_date;
			//_time_konk = "<br>" + StrDate(_phase.start_date, true, false) + " - " + StrDate(_phase.finish_date, true, false) + "<br>";
			_take_minutes = Minute(_phase.start_date) == 0 ? "00" : Minute(_phase.start_date) < 10 ? "0" + Minute(_phase.start_date) : Minute(_phase.start_date);
			_time_konk = "<br>" + StrDate(_phase.start_date, false, false) + " c " + Hour(_phase.start_date) + ":" + _take_minutes + " по " + Hour(_phase.finish_date) + ":" + _take_minutes +  "<br>";
			_phase_str += Trim(String(_phase_str)) == "" ? "День " + _phase_count  + "" + _time_konk : "<br>" + " День " + _phase_count  + "" + _time_konk;
			_phase_count++
		}
		_source.TopElem.workflow_fields.ObtainChildByKey('event_stage').value += _phase_str;
	}
}
catch(err)
{
	alert(err);
}
