if ( tools_web.check_collection_access( curUser, OptInt( iCurUserID, curUserID ), SCOPE_WVARS.GetOptProperty( "sPersonAccessType" ) ) )
{

	function count_free_seats(_ev_doc, _max_person_num){
				_res = undefined;
				
				_ev_not_cancel_results = [];
				_ev_results = XQuery("for $er in event_results where $er/event_id="+_ev_doc.id+" return $er");
				_ev_not_cancel_results = ArraySelect(_ev_results, "This.not_participate == false ");
				
				_res = ArrayOptFirstElem(_ev_results) != undefined ? OptInt(_max_person_num) < OptInt( ArrayCount(_ev_not_cancel_results)) ? 0 : OptInt(_max_person_num) - OptInt( ArrayCount(_ev_not_cancel_results)) : _max_person_num
				
				return _res
	}
			
	function add_button(_fin_array, _code_action, _action_name, _method_name, _event_doc, _event_id, _request_id){
		
		_request_id = OptInt(_request_id) == undefined ? '0' : OptInt(_request_id);
		_event_te = null;
		
		if(_event_doc != undefined){
			_event_te = _event_doc.TopElem;
		}else if(OptInt(_event_id) != undefined){
			_event_te = tools.open_doc(_event_id);
		}else{
			return _event_te
		}
		
		if(ArrayOptFind(_fin_array, "This.action_id == '" + _code_action + "'") == undefined){
			//alert(_method_name)
			_new_obj = {};
			_new_obj.id = Random( 0, 99999999 );
			_new_obj.name = _action_name; 
			_new_obj.action_type = "remote_action";
			_new_obj.action_id = _code_action; 
			_new_obj.method = _method_name; 
			_new_obj.request_type_id = _event_te.default_request_type_id;
			_new_obj.object_id = _event_te.id;
			_new_obj.request_id = _request_id;
			_fin_array.push(_new_obj);
		}
		
		return _fin_array
	}
	
	function date_without_time (_date_param)
	{
		_res_date = OptDate(ParseDate(_date_param, false, false));
		_res_date_with_zero = OptDate(Year(_date_param) + '.' + Month(_date_param) + '.' + Day(_date_param));
		_res_date = _res_date != undefined ? _res_date : _res_date_with_zero;
		return _res_date;
	}

	function check_results(_thisEventDoc, _cur_user_id) {
		waitDays = 0;
	
		if( _thisEventDoc.TopElem.event_type_id.HasValue) {
			alert("Есть event_type_id")
			waitDays = OptInt(tools.open_doc(_thisEventDoc.TopElem.education_method_id).TopElem.custom_elems.ObtainChildByKey("days_count_request").value.Value, 0)
		}
	
		alert("waitDays = " +waitDays)
		
		_events_all = ArraySelectAll(XQuery('for $elem in events where $elem/education_method_id=' + _thisEventDoc.TopElem.education_method_id + ' return $elem')); // Все мероприятия 
	
		alert("Всего мероприятий " + ArrayCount(_events_all))
	
		_events_close = ArraySelect(_events_all, "This.status_id == 'close'") // Завершенные мероприятия
		alert("Завершенных " + ArrayCount(_events_close))
		_events_no_close = ArraySelect(_events_all, "This.status_id != 'close'")
		alert("В процессе " + ArrayCount(_events_no_close)) // Активные мероприятия
	
		//запись в активном мероприятии 
		_event_results_no_close = ArraySelectAll(XQuery('for $elem in event_results where MatchSome($elem/event_id, (\"' + ArrayMerge(_events_no_close, "This.id", "\",\"") + '\")) and $elem/person_id=' + _cur_user_id + ' and $elem/is_assist = true() return $elem'));
		alert("Есть запись в активном мероприятии " + ArrayCount(_event_results_no_close))
		if (ArrayCount(_event_results_no_close) > 0) {
			alert("Есть запись в активном мероприятии");
			return false;
		}
	
		//запись в завершенном мероприятии 
		_event_results_close = ArraySelectAll(XQuery('for $elem in event_results where MatchSome($elem/event_id, (\"' + ArrayMerge(_events_close, "This.id", "\",\"") + '\")) and $elem/person_id=' + _cur_user_id + ' and $elem/is_assist = true() return $elem'));
		alert("Есть запись в завершенном мероприятии " + ArrayCount(_event_results_close))
	
		if (ArrayCount(_event_results_close) > 0) {
			alert("Есть запись в завершенном мероприятии");
			maxEndDate = ArrayOptMax(ArrayExtract(ArraySelect(_events_all, "ArrayOptFindByKey(_event_results_close,This.id, 'event_id') != undefined"), 'This.finish_date'), 'This');
	
			alert("maxEndDate = " +maxEndDate);
			alert("maxEndDate = " +DateNewTime(maxEndDate))

			alert("Day Diff = "+DateDiff(OptDate(DateOffset(DateNewTime(maxEndDate), waitDays * 86400 )), Date()))

			alert(Date()) 
			alert(DateOffset(DateNewTime(maxEndDate), waitDays * 86400 ))
			alert(Date() >= DateOffset(DateNewTime(maxEndDate), waitDays * 86400 )) 
			alert(Date() < DateOffset(DateNewTime(maxEndDate), waitDays * 86400))
	
			if(Date() < DateOffset(DateNewTime(maxEndDate), waitDays * 86400)) {
				alert("IN IFF")
				return false
			}
		}
	
		return true;
	}
	
	RESULT = tools.call_code_library_method( "libEducation", "GetEventActions", [ OptInt( iEventID, curObjectID ), OptInt( iCurUserID, curUserID )] ).array;
	if(SORT.FIELD != null && SORT.FIELD != undefined && SORT.FIELD != "" )
		RESULT = ArraySort(RESULT, SORT.FIELD, ((SORT.DIRECTION == "DESC") ? "-" : "+"));

	// MPROS //
	
	RESULT = ArraySelect(RESULT, 'This.method != "is_confirm" && This.method != "not_participate" ');//This.method != "create_request" && 
	
	// Получаем необходимые элементы ID мероприятия, ID сотрудника, карточку мероприятия
	
	_event_id = OptInt( iEventID, curObjectID )
	_cur_user_id = OptInt( iCurUserID, curUserID );
	_thisEventDoc = tools.open_doc(_event_id);
	// _curEventTypeDoc = ArrayOptFirstElem(XQuery("for $elem in request_types where $elem/id="+_thisEventDoc.TopElem.default_request_type_id+" return $elem")) != undefined ? tools.open_doc(ArrayOptFirstElem(XQuery("for $elem in request_types where $elem/id="+_thisEventDoc.TopElem.default_request_type_id+" return $elem")).id) : undefined;
	
	// Поиск документооборота для выведения действий
	
	//_source_workflow_id = OptInt(_thisEventDoc.TopElem.education_method_id) != undefined ? _thisEventDoc.TopElem.education_method_id.OptForeignElem.workflow_id : tools.open_doc(_thisEventDoc.TopElem.default_request_type_id) != undefined ? tools.open_doc(_thisEventDoc.TopElem.default_request_type_id).TopElem.workflow_id : undefined;
	_source_workflow_id = tools.open_doc(_thisEventDoc.TopElem.default_request_type_id) != undefined ? tools.open_doc(_thisEventDoc.TopElem.default_request_type_id).TopElem.workflow_id : undefined;
	if(_source_workflow_id != undefined && _thisEventDoc.TopElem.status_id != 'close' && OptDate(_thisEventDoc.TopElem.date_request_rejection_over) >= Date()){
		_curWorkflowDoc = tools.open_doc(_source_workflow_id);
		if(_curWorkflowDoc != undefined){
		
			_cancel_action = ArrayOptFind(_curWorkflowDoc.TopElem.actions, 'This.code == "revoke_request" ');
			_cur_col_req = ArrayOptFirstElem(XQuery('for $elem in requests where $elem/person_id='+_cur_user_id+' and $elem/object_id='+_event_id+' and ($elem/status_id="close" or $elem/status_id="active") return $elem'));
			
			if(_cur_col_req != undefined){
				if(_cancel_action != undefined && _cur_user_id == _cur_col_req.person_id && !_cur_col_req.is_group){
					add_button(RESULT, '_nlmk_remote_cancel_req_from_event', String(_cancel_action.name), String(_cancel_action.code), _thisEventDoc, '', _cur_col_req.id);//tools.workflow_action_process(_curColReqDoc, 'revoke_request', _curWorkflowDoc.DocID, _curWorkflowDoc);
				}
			}
		}
	}
	
	//1. Проверка, что сотрудник не подал заявку на другие мероприятия внутри учебной программы мероприятия на странице
	
	
	// Мероприятия одной учебной программы
	_events_by_the_same_educ_method = ArraySelectAll(XQuery('for $elem in events where $elem/education_method_id='+ _thisEventDoc.TopElem.education_method_id +' return $elem/Fields("id")'));
	
	_col_requests_by_same_events = ArraySelectAll(XQuery('for $elem in requests where MatchSome($elem/object_id, (\"' + ArrayMerge(_events_by_the_same_educ_method, "This.id", "\",\"")+'\")) and $elem/person_id='+_cur_user_id+' and $elem/status_id != "ignore" and $elem/status_id != "close" return $elem'));
	
	_event_results_by_same_educ_method = ArrayOptFirstElem(XQuery('for $elem in event_results where MatchSome($elem/event_id, (\"' + ArrayMerge(_events_by_the_same_educ_method, "This.id", "\",\"") + '\")) and $elem/person_id='+_cur_user_id+' and $elem/is_assist = true() return $elem')) != undefined;	
	
	
	//Текущий пользователь - руководитель
	_xq_fm = ArrayOptFirstElem(XQuery("for $f in func_managers where $f/person_id="+curUserID+" return $f"));
	_cur_user_is_boss = _xq_fm != undefined;

	// Проверяем есть ли кнопка в текущем наборе кнопок
	_has_create_req_button = ArrayOptFind(RESULT, 'This.method == "create_request"') != undefined;
	// alert(_has_create_req_button + " / 45")
	if(_has_create_req_button || (OptInt(count_free_seats(curObject, OptInt(curObject.max_person_num))) != undefined && OptInt(count_free_seats(curObject, OptInt(curObject.max_person_num))) > 0 && ( curObject.is_open && (curObject.status_id == 'active' || curObject.status_id == 'plan') ) ) ){
		//_cur_event_date = date_without_time(_thisEventDoc.TopElem.start_date);
        _cur_date = Date();
		RESULT = ArraySelect(RESULT, 'This.method != "create_request"');
		//alert('_event_results_by_same_educ_method: ' + String(_event_results_by_same_educ_method));
		//alert(ArrayCount(_col_requests_by_same_events));
		_req_is_can_be_group = tools.open_doc(_thisEventDoc.TopElem.default_request_type_id).TopElem.is_can_be_group;

		alert("Проверка кнопки!")
		alert("_has_create_req_button == " + _has_create_req_button)
		alert("_event_results_by_same_educ_method == " + _event_results_by_same_educ_method)
		alert("_cur_user_is_boss == " + _cur_user_is_boss)
		alert("_req_is_can_be_group == " + _req_is_can_be_group)

		if (OptDate(_thisEventDoc.TopElem.date_request_begin) <= _cur_date && OptDate(_thisEventDoc.TopElem.date_request_over) >= _cur_date){			
			alert("В условии по добавлению кнопки, даты подходят!")
			alert("ArrayCount(_col_requests_by_same_events)" +ArrayCount(_col_requests_by_same_events))


			alert("check_results вернула = "+ check_results(_thisEventDoc, _cur_user_id))
			alert("_col_requests_by_same_events == "+ ArrayCount(_col_requests_by_same_events))
			if((_cur_user_is_boss && _req_is_can_be_group) || (tools_web.is_true(check_results(_thisEventDoc, _cur_user_id)) && ArrayCount(_col_requests_by_same_events) == 0)) {
				add_button(RESULT, "_nlmk_remote_event", "Подать заявку", "create_request", _thisEventDoc);
			}

		
            // switch(ArrayCount(_col_requests_by_same_events)){
			// 	case 0:
			// 		add_button(RESULT, "_nlmk_remote_event", "Подать заявку", "create_request", _thisEventDoc)
			// 	break
			// 	default:
			// 		if(_cur_user_is_boss && _req_is_can_be_group)
			// 			add_button(RESULT, "_nlmk_remote_event", "Подать заявку", "create_request", _thisEventDoc)
			// 	break	
			// }
		}
	}	
}