function getParam(_arrFormFields, _sName)
{
	result = "";
	try
	{
		_tmpFld = ArrayOptFind(_arrFormFields, "This.name=='" + _sName + "'");
		result = _tmpFld != undefined ? String(_tmpFld.value) : PARAMETERS.GetOptProperty(_sName);
	}
	catch (_err)
	{
		result = "";
		return result;
	}
	return result;
}

function getObjectIDs(_arrFormFields, _sName)
{
	sObjectIDs = "";
	if (getParam(_arrFormFields, _sName) == undefined || getParam(_arrFormFields, _sName) == "")
	{
		try
		{
			sObjectIDs = SELECTED_OBJECT_IDS + "";
		}
		catch (_err)
		{
			sObjectIDs = "";
		}
		if (sObjectIDs == "")
		{
			try
			{
				sObjectIDs = OBJECT_ID + "";
			}
			catch (_err)
			{
				sObjectIDs = "";
			}
		}
		if (sObjectIDs == "")
		{
			try
			{
				sObjectIDs = curObjectID + "";
			}
			catch (_err)
			{
				sObjectIDs = "";
			}
		}
	}
	else
		sObjectIDs = getParam(_arrFormFields, _sName) + "";
	return sObjectIDs;
}

function isLastStep(_arrFormFields)
{
	result = true;
	if (checkFields(_arrFormFields))
		result = false;
	if (StrContains(type_send, "admin") || tools_web.is_true(getParam(_arrFormFields, "text_notification")))
		result = false;
	return result;
}

function checkFields(_arrFormFields)
{
	if (getParam(_arrFormFields, "learning_length") == "admin")
		return true;
	if (getParam(_arrFormFields, "start_learning_date") != "month" && getParam(_arrFormFields, "start_learning_date") != "monday" && getParam(_arrFormFields, "start_learning_date") != "today")
		return true;
	if (tools_web.is_true(getParam(_arrFormFields, "use_comments")))
		return true;
	if (getParam(_arrFormFields, "mind_employee_status") == "admin")
		return true;
	if (StrContains(getParam(_arrFormFields, "assign_manager"), "admin"))
		return true;
	return false;
}

function getFormMessage(_sMessage)
{
	var oForm;
	oForm = {
		command: "alert",
		msg: _sMessage,
		confirm_result: {
			command: "reload_page"
		}
	}

	return oForm;
}

function getFormSelectObject(_arrFormFields)
{
	var oForm;
	
	oForm =
	{
		command: "display_form",
		title: "Назначить трек обучения",
		message: "Выберите модульную программу",
		form_fields:
			[
				{
					name: "step",
					type: "hidden",
					value: "1"
				},
				{
					name: "objectIDs",
					type: "foreign_elem",
					catalog: "compound_program",
					value: "",
					multiple: false,
					mandatory: true,
					title: "Выберите модульную программу"
				}
			],
		buttons:
			[
				{ name: "cancel", label: ms_tools.get_const('c_cancel'), type: "cancel", css_class: "btn-submit-custom" },
				{ name: "submit", label: "Далее", type: "submit", css_class: "btn-cancel-custom" }
			],
		no_buttons: false
	};
	
	return oForm;

}

function getFormSelectCollaborator(_arrFormFields)
{
	var _sObjectIDs = getObjectIDs(_arrFormFields, "objectIDs");
	var oForm;
	sButtonName = "Далее";
	if (isLastStep(_arrFormFields))
		sButtonName = "Выполнить";

	var subordinatesIDs = tools.get_direct_sub_person_ids(curUserID);
	if (ArrayCount(subordinatesIDs) > 0)
	{
		oForm =
		{
			command: "display_form",
			title: "Назначить трек обучения",
			message: "Выберите сотрудников",
			form_fields:
				[
					{
						name: "step",
						type: "hidden",
						value: "2"
					},
					{
						name: "objectIDs",
						type: "hidden",
						value: _sObjectIDs
					},
					{
						name: "learnIDs",
						label: ms_tools.get_const('c_collaborators'),
						type: "foreign_elem",
						query_qual: " $elem/is_dismiss = 0 and $elem/is_candidate = 0 and $elem/is_outstaff = 0 and MatchSome($elem/id, (" + ArrayMerge(subordinatesIDs, "This", ",") + "))",
						catalog: "collaborator",
						multiple: true,
						mandatory: true,
						value: "",
						title: "Выберите сотрудников"
					},
				],
			buttons:
				[
					{ name: "cancel", label: ms_tools.get_const('c_cancel'), type: "cancel", css_class: "btn-submit-custom" },
					{ name: "submit", label: sButtonName, type: "submit", css_class: "btn-cancel-custom" }
				],
			no_buttons: false
		};
		return oForm;
	}
	else
		return getFormMessage("У вас нет подчиненных сотрудников!");


}

function getFormSelectGroupCollaborator(_arrFormFields)
{
	var _sObjectIDs = getObjectIDs(_arrFormFields, "objectIDs");
	var oForm;
	sButtonName = "Далее";
	if (isLastStep(_arrFormFields))
		sButtonName = "Выполнить";

	oForm =
	{
		command: "display_form",
		title: "Назначить трек обучения",
		message: "Выберите группу обучения",
		form_fields:
			[
				{
					name: "step",
					type: "hidden",
					value: "2"
				},
				{
					name: "objectIDs",
					type: "hidden",
					value: _sObjectIDs
				},
				{
					name: "learnIDs",
					label: ms_tools.get_const('c_group'),
					type: "foreign_elem",
					query_qual: " $elem/is_educ = true() ",
					catalog: "group",
					multiple: false,
					mandatory: true,
					value: "",
					title: "Выберите группу обучения"
				},
			],
		buttons:
			[
				{ name: "cancel", label: ms_tools.get_const('c_cancel'), type: "cancel", css_class: "btn-submit-custom" },
				{ name: "submit", label: sButtonName, type: "submit", css_class: "btn-cancel-custom" }
			],
		no_buttons: false
	};
	return oForm;
}

function getFormSelectParam(_arrFormFields)
{
	var _sObjectIDs = getObjectIDs(_arrFormFields, "objectIDs");
	var iCount = 0;
	sButtonName = "Далее";
	if (isLastStep(_arrFormFields))
		sButtonName = "Выполнить";
	var oForm;
	oForm =
	{
		command: "display_form",
		title: "Назначить трек обучения",
		message: "Укажите параметры назначения",
		form_fields:
			[
				{
					name: "step",
					type: "hidden",
					value: "3"
				},
				{
					name: "objectIDs",
					type: "hidden",
					value: _sObjectIDs
				},
				{
					name: "learnIDs",
					type: "hidden",
					value: getParam(_arrFormFields, "learnIDs") + ""
				},
			],
		buttons:
			[
				{ name: "cancel", label: ms_tools.get_const('c_cancel'), type: "cancel", css_class: "btn-submit-custom" },
				{ name: "submit", label: sButtonName, type: "submit", css_class: "btn-cancel-custom" }
			],
		no_buttons: false
	};
	if (getParam(_arrFormFields, "start_learning_date") != "month" && getParam(_arrFormFields, "start_learning_date") != "monday" && getParam(_arrFormFields, "start_learning_date") != "today")
	{
		oForm.form_fields.push({
			name: "start_learning_date",
			label: "Дата начала обучения",
			type: "date",
			value: getParam(_arrFormFields, "start_learning_date"),
			validation: "date",
			column: 1
		});
		iCount += 70;
	}
	if (StrContains(getParam(_arrFormFields, "assign_manager"), "admin"))
	{
		_catalog = "collaborator";
		_filter = "";
		if (getParam(_arrFormFields, "assign_manager") == "admin_teacher")
		{
			_catalog = "lector";
			_docCompoundProgram = tools.open_doc(OptInt(getParam(_arrFormFields, "objectIDs") + "", 0));
			if (_docCompoundProgram != undefined)
			{
				if (ArrayCount(_docCompoundProgram.TopElem.lectors) > 0)
					_filter = " MatchSome($elem/id, (" + ArrayMerge(_docCompoundProgram.TopElem.lectors, "This.lector_id", ",") + "))";
			}
		}

		oForm.form_fields.push({
			name: "managerID",
			label: "Выберите ответственного",
			type: "foreign_elem",
			catalog: _catalog,
			query_qual: _filter,
			multiple: false,
			value: "",
			title: "Выберите сотрудников",
			column: 1
		});
		iCount += 70;
	}
	if (tools_web.is_true(getParam(_arrFormFields, "use_comments")))
	{
		oForm.form_fields.push({
			name: "comment",
			label: "Комментарий при назначении",
			type: "textarea",
			richtext: true,
			value: "",
			mandatory: false,
			column: 1
		});
		iCount += 70;
	}
	if (getParam(_arrFormFields, "mind_employee_status") == "admin" || getParam(_arrFormFields, "mind_employee_status") == "blacklisted")
	{
		if (getParam(_arrFormFields, "mind_employee_status") == "admin")
			oForm.form_fields.push({
				name: "mind_employee_status",
				label: "Учет текущего состояния сотрудника",
				entries: [{ name: "Не назначать только уволенным", value: "omit_dismissed" },
				{ name: "Назначать всем по списку", value: "everyone" },
				{ name: "Не назначать с указанным состоянием", value: "blacklisted" }],
				type: "radio",
				value: "omit_dismissed",
				mandatory: true,
				column: 1
			});

		_entries = [];
		_blacklistStatuses = getParam(_arrFormFields, "blacklist_statuses") + "";
		if (_blacklistStatuses != "")
		{
			_arrBlacklistStatuses = _blacklistStatuses.split(";");
			_entries = ArrayExtract(lists.person_states, "({'name': This.name.Value, 'value': This.id.Value})");
			_entries = ArrayIntersect(_entries, _arrBlacklistStatuses, "This.value", "This");
		}
		if (ArrayCount(_entries) > 0)
			oForm.form_fields.push({
				name: "blacklist_statuses",
				label: "Список состояний сотрудников",
				type: "list",
				entries: _entries,
				value: "",
				column: 2
			});
		iCount += 70;
	}
	oForm.height = 300 + iCount;
	return oForm;
}

function getFormSelectParamSend(_arrFormFields)
{
	var _sObjectIDs = getObjectIDs(_arrFormFields, "objectIDs");

	var _entries = [{ name: "Сотрудникам", value: "collaborators" },
	{ name: "Руководителю", value: "manager" },
	{ name: "Ответственному", value: "tutors" }];

	var oForm;

	oForm =
	{
		command: "display_form",
		height: 500,
		title: "Назначить трек обучения",
		message: "Параметры рассылки",
		form_fields:
			[
				{
					name: "step",
					type: "hidden",
					value: "4"
				},
				{
					name: "learnIDs",
					type: "hidden",
					value: getParam(_arrFormFields, "learnIDs") + ""
				},
				{
					name: "start_learning_date",
					type: "hidden",
					value: getParam(_arrFormFields, "start_learning_date") + ""
				},
				{
					name: "managerID",
					type: "hidden",
					value: getParam(_arrFormFields, "managerID") + ""
				},
				{
					name: "comment",
					type: "hidden",
					value: getParam(_arrFormFields, "comment") + ""
				},
				{
					name: "mind_employee_status",
					type: "hidden",
					value: getParam(_arrFormFields, "mind_employee_status") + ""
				},
				{
					name: "objectIDs",
					type: "hidden",
					value: _sObjectIDs
				},
			],
		buttons:
			[
				{ name: "cancel", label: ms_tools.get_const('c_cancel'), type: "cancel", css_class: "btn-submit-custom" },
				{ name: "submit", label: "Выполнить", type: "submit", css_class: "btn-cancel-custom" }
			],
		no_buttons: false
	};
	if (tools_web.is_true(getParam(_arrFormFields, "type_send.admin")))
	{
		oForm.form_fields.push({
			name: "type_send_form",
			label: "Тип рассылки",
			type: "list",
			entries: _entries,
			value: "",
			mandatory: true,
			validation: "nonempty",
			column: 1
		});
	}
	if (tools_web.is_true(getParam(_arrFormFields, "text_notification")))
	{
		oForm.form_fields.push({
			name: "text_notification",
			type: "text",
			value: "",
			label: "Дополнительный текст в конце уведомления",
			mandatory: false
		});
	}
	return oForm;
}

function updatePlanEducation(_iEducationPlanID, _iCollaboratorID)
{
	try
	{
		docEducationPlan = tools.open_doc(OptInt(_iEducationPlanID, 0));
		if (docEducationPlan == undefined)
			return;
		teEducationPlan = docEducationPlan.TopElem;

		checkEducation = true;
		docGroup = tools.open_doc(OptInt(docEducationPlan.TopElem.object_id.Value, 0));
		if (docGroup != undefined)
		{
			teGroup = docGroup.TopElem;
			arrCol = [];
			if (OptInt(_iCollaboratorID) != undefined)
			{
				arrCol.push(OptInt(_iCollaboratorID, 0));
			}
			else
			{
				arrCol = XQuery("for $elem in group_collaborators where $elem/group_id=" + XQueryLiteral(docEducationPlan.TopElem.object_id.Value) + " return $elem/Fields('collaborator_id')");
			}
			for (itemCollaborator in arrCol)
			{
				curCol = ArrayOptFindByKey(teGroup.collaborators, itemCollaborator.collaborator_id, 'collaborator_id');
				if (curCol != undefined)
				{
					_arrDesc = [];
					try
					{
						_arrDesc = tools.read_object(curCol.desc);
						if (!IsArray(_arrDesc)) _arrDesc = [];
					}
					catch (err)
					{
						_arrDesc = [];
					}
					_oDesc = ArrayOptFindByKey(_arrDesc, docEducationPlan.TopElem.id.Value, 'education_plan_id');
					if (_oDesc != undefined)
					{
						if (_oDesc.status != 'cancel' || _oDesc.status != 'lock')
						{
							checkEducation = false;
						}
					}
				}
				if (checkEducation)
				{
					_res = tools.call_code_library_method('libEducation', 'update_education_plan', [teEducationPlan.id.Value, docEducationPlan, itemCollaborator.collaborator_id.Value, true]);
					bResultSend = tools.create_notification("education_plan_user", itemCollaborator.collaborator_id.Value, "", teEducationPlan.id.Value);
					if (_res.error == 0 && _res.HasProperty("doc_education_plan"))
					{
						update_events_by_model(teEducationPlan.id.Value, _res.doc_education_plan, temCollaborator.collaborator_id.Value, true);
					}
				}
			}
		}
	}
	catch (err)
	{

	}
}

function update_events_by_model(iObjId, docPlan, iPersonID, bSave)
{
	bNeedSave = false;
	for( _program in docPlan.TopElem.programs )
	{
		if( _program.result_object_id.HasValue && _program.result_type == "event" && OptInt(_program.custom_elems.ObtainChildByKey("model_event_id").value,0) > 0 && !tools_web.is_true(_program.custom_elems.ObtainChildByKey("model_passed").value) )
		{
			_model = tools.opem_doc(OptInt(_program.custom_elems.ObtainChildByKey("model_event_id").value,0));
			_event = tools.opem_doc(_program.result_object_id);
			if (_model!=undefined && _event!=undefined)
			{
				_event.TopElem.type_id = _model.TopElem.type_id;
				_event.TopElem.event_type_id = _model.TopElem.event_type_id;
				_event.TopElem.is_room = _model.TopElem.is_room;
				_event.TopElem.place_id = _model.TopElem.place_id;
				_event.TopElem.place = _model.TopElem.place;
				_event.TopElem.vclass_host = _model.TopElem.vclass_host;
				_event.TopElem.use_camera_capture = _model.TopElem.use_camera_capture;
				_event.TopElem.login_with_camera_only = _model.TopElem.login_with_camera_only;
				_event.TopElem.capture_rate = _model.TopElem.capture_rate;
				_event.TopElem.webinar_system_id = _model.TopElem.webinar_system_id;
				_event.TopElem.use_vclass = _model.TopElem.use_vclass;
				_event.TopElem.vclass_setting_id = _model.TopElem.vclass_setting_id;
				_event.TopElem.comment = _model.TopElem.comment;
				_event.TopElem.desc = _model.TopElem.desc;
				_event.TopElem.files.AssignElem(_model.TopElem.files);
				_event.Save();
				_program.custom_elems.ObtainChildByKey("model_passed").value = 'true';
				bNeedSave = true;
			}
		}
	}
	if (bNeedSave && bSave)
	{
		docPlan.Save();
	}
}

function recalculate_chats(iGroupID, iCompoundProgramID, curInstanceID, _type_chat)
{
	docCompoundProgram = tools.open_doc(iCompoundProgramID)
	if (docCompoundProgram == undefined)
	{
		return;
	}

	
		var lectorStrReq = "for $elem in lectors where $elem/type='collaborator' and MatchSome($elem/id, (" + ArrayMerge(docCompoundProgram.TopElem.lectors, "XQueryLiteral(This.lector_id.Value)", ",") + ")) return $elem/Fields('person_id')";
		var arrCatPersonBase = ArrayExtract(XQuery(lectorStrReq), "This.person_id");
		var oRes, arrCatPerson, sFullName, hasStrReq, docConversation;
		var arrGrpPerson = [];
		var groupReq = "for $elem in group_collaborators where $elem/group_id=" + iGroupID + " return $elem/Fields('collaborator_id')";
		var xqGroupReq = ArrayExtract(XQuery(groupReq),"This.collaborator_id");
		for (itemFM in xqGroupReq)
		{
			arrCatPerson = [];
			oRes = null;
			iPersonID = OptInt(itemFM);
			oItemColl = ArrayOptFirstElem( XQuery("for $elem in collaborators where $elem/id=" + iPersonID + " return $elem/Fields('fullname')") );
			if (oItemColl == undefined)
				continue;
			arrCatPerson.push(iPersonID);
			arrGrpPerson.push(iPersonID);
			arrCatPerson = ArrayUnion(arrCatPersonBase, arrCatPerson);
			
			sFullName = oItemColl.fullname;

			if (StrContains(_type_chat, 'private'))
			{
				hasStrReq = "for $elem in chats " +
					" where contains($elem/collaborators, '" + StrInt(iPersonID) + "') " +
					" and some $cn in conversations satisfies ( $elem/conversation_id = $cn/id and $cn/format_id = 'chat'" +
					" and $cn/app_instance_id = '0x" + StrHexInt(curInstanceID, 16) + "' ) " +
					" return $elem";

				xqChat = ArrayOptFirstElem(XQuery(hasStrReq));

				if (xqChat == undefined)
				{
					oRes = CallServerMethod(
						'tools',
						'call_code_library_method',
						[
							'libChat',
							'change_participants_conversation',
							[null, null, 'change', null, (arrCatPerson), null, null, null, null, sFullName + ". " + docCompoundProgram.TopElem.name.Value]
						]
					);
				}

				if (oRes != null && oRes.error != 1)
				{
					docConversation = tools.open_doc(oRes.doc_conversation.conversation.id);
					docConversation.TopElem.doc_info.creation.app_instance_id = "0x" + StrHexInt(curInstanceID, 16);
					docConversation.Save();
				}
				else if (oRes != null)
				{
				//	alert("Error in chat_lib: " + oRes.message);
				}
			}
		}
	
	if (StrContains(_type_chat, 'all'))
	{
		hasStrReq = "for $elem in chats " +
		" where contains($elem/collaborators, '" + StrInt(iPersonID) + "') " +
		" and some $cn in conversations satisfies ( $elem/conversation_id = $cn/id and $cn/format_id = 'group'" +
		" and $cn/app_instance_id = '0x" + StrHexInt(curInstanceID, 16) + "' ) " +
		" return $elem";

		xqChat = ArrayOptFirstElem(XQuery(hasStrReq));
		
		if (xqChat == undefined)
		{
			arrCatPerson = ArrayUnion(arrCatPersonBase, arrGrpPerson);
			oRes = CallServerMethod(
				'tools',
				'call_code_library_method',
				[
					'libChat',
					'change_participants_conversation',
					[null, null, 'change', null, (arrCatPerson), null, null, null, null, "Чат группы. " + docCompoundProgram.TopElem.name.Value]
				]
			);
			
			if (oRes != null && oRes.error != 1)
			{
				docConversation = tools.open_doc(oRes.doc_conversation.conversation.id);
				docConversation.TopElem.format_id = "group";
				docConversation.TopElem.doc_info.creation.app_instance_id = "0x" + StrHexInt(curInstanceID, 16);
				docConversation.Save();
			}
		}
	}
	
	
}

function ProcessChatsByEducationPlan(docObject, _type_chat)
{
	var teObject = docObject.TopElem;

	if (teObject.type.Value == "group" && teObject.compound_program_id.HasValue)
	{
		recalculate_chats(teObject.object_id.Value, teObject.compound_program_id.Value, OptInt(teObject.doc_info.creation.app_instance_id.Value), _type_chat);
	}
}

///MAIN
ERROR = "";
MESSAGE = "";
RESULT = {};

var oResult = new Object();

try
{
	arrFormFields = ParseJson(PARAMETERS.GetOptProperty("form_fields", []));
}
catch (_err)
{
	arrFormFields = [];
}

startLearningDate = getParam(arrFormFields, "start_learning_date");
useComments = getParam(arrFormFields, "use_comments");
mindEmployeeStatus = getParam(arrFormFields, "mind_employee_status");
blacklistStatuses = getParam(arrFormFields, "blacklist_statuses");
assignManager = getParam(arrFormFields, "assign_manager");
//typeSend = getParam(arrFormFields, "type_send");
textNotification = getParam(arrFormFields, "text_notification");
checkReassignment = getParam(arrFormFields, "check_reassignment");
expireTimeOfCompleted = getParam(arrFormFields, "expire_time_of_completed");
typePlan = getParam(arrFormFields, "type_plan");

//обработка bool переменных тип уведомлений
type_send_param = [];
type_send_admin = getParam(arrFormFields, "type_send.admin") ? type_send_param.push('admin') : '';
type_send_collaborators = getParam(arrFormFields, "type_send.collaborators") ? type_send_param.push('collaborators') : '';
type_send_manager = getParam(arrFormFields, "type_send.manager") ? type_send_param.push('manager') : '';
type_send_tutors = getParam(arrFormFields, "type_send.tutors") ? type_send_param.push('tutors') : '';

if (tools_web.is_true(getParam(arrFormFields, "type_send.admin")))
	type_send = getParam(arrFormFields, "type_send_form");
else	
	type_send = ArrayMerge(type_send_param, 'This', ';');

//обработка bool переменных с чатами
chats_param = [];
create_chats_all = getParam(arrFormFields, "create_chats.all") ? chats_param.push('all') : '';
create_chats_private = getParam(arrFormFields, "create_chats.private") ? chats_param.push('private') : '';
create_chats = ArrayMerge(chats_param, 'This', ';')

sStep = "";
oStep = ArrayOptFind(arrFormFields, "This.name == 'step'");
if (oStep != undefined)
	sStep = oStep.value;

if (ArrayOptFirstElem(arrFormFields) == undefined)
{
	sObjectIDs = getObjectIDs(arrFormFields, "objectIDs");
	
	if (sObjectIDs == "")
		oResult = getFormSelectObject(arrFormFields);
	else
		sStep = "1";
}

if (sStep != "")
{
	if (ERROR != "")
	{
		oResult = getFormMessage(ERROR);
	}
	else
	{
		if (sStep == "1")
		{
			if (typePlan == 'yourself')
			{
				sStep = "2";
					oStep = ArrayOptFind(arrFormFields, "This.name == 'step'");
					if (oStep != undefined)
						oStep.value = "2";
					
			}
			else if (typePlan == 'collaborator')
			{
				oResult = getFormSelectCollaborator(arrFormFields);
			}
			else
				oResult = getFormSelectGroupCollaborator(arrFormFields);

		}
		if (sStep == "2")
		{
			if (checkFields(arrFormFields))
				oResult = getFormSelectParam(arrFormFields);
			else
			{
				sStep = "3";
				oStep = ArrayOptFind(arrFormFields, "This.name == 'step'");
				if (oStep != undefined)
					oStep.value = "3";
			}
		}
		if (sStep == "3")
		{
			if (StrContains(type_send_admin, "admin") || tools_web.is_true(textNotification))
				oResult = getFormSelectParamSend(arrFormFields);
			else
			{
				sStep = "4";
				oStep = ArrayOptFind(arrFormFields, "This.name == 'step'");
				if (oStep != undefined)
					oStep.value = "4";
			}
		}
		if (sStep == "4")
		{
			iCounter = 0;
			sObjectIDs = getObjectIDs(arrFormFields, "objectIDs"); //id comp programm
			teCompoundProgram = undefined;
			arrObjects = [];

			if (typePlan == 'yourself')
			{
				sCollIDs = curUserID;

				if (sCollIDs != "" || sCollIDs != "undefined")
				{
					sCollIDs = StrReplace(sCollIDs, ";", ",");
					arrObjects = ArraySelectAll(tools.xquery("for $elem in collaborators where MatchSome($elem/id, (" + sCollIDs + ")) return $elem/Fields('id', 'email', 'is_dismiss', 'current_state')"));
				}

			}
			else if (typePlan == 'collaborator')
			{
				sCollIDs = getParam(arrFormFields, "learnIDs");

				if (sCollIDs != "" || sCollIDs != "undefined")
				{
					sCollIDs = StrReplace(sCollIDs, ";", ",");
					arrObjects = ArraySelectAll(tools.xquery("for $elem in collaborators where MatchSome($elem/id, (" + sCollIDs + ")) return $elem/Fields('id', 'email', 'is_dismiss', 'current_state')"));
				}
				else
					ERROR = "Не указаны сотрудники";
			}
			else
			{
				sGroupIDs = getParam(arrFormFields, "learnIDs");
				
				if (sGroupIDs != "" || sGroupIDs != "undefined")
				{
					sGroupIDs = StrReplace(sGroupIDs, ";", ",");
					arrObjects = ArraySelectAll(tools.xquery("for $elem in groups where MatchSome($elem/id, (" + sGroupIDs + ")) return $elem"));
				}
				else
					ERROR = "Не указаны группы";
			}
				
			if (typePlan == 'yourself')
			{
				iCompoundProgramID = curObjectID;
			}
			else
				iCompoundProgramID = getParam(arrFormFields, "objectIDs");
				
			if (iCompoundProgramID != "")
			{
				docCompoundProgram = tools.open_doc(OptInt(iCompoundProgramID, 0));
				if (docCompoundProgram != undefined)
					teCompoundProgram = docCompoundProgram.TopElem;
				else
					ERROR = "Модульная программа не найдена";
			}
			else
				ERROR = "Не указана модульная программа";


			if (ERROR == "")
			{
				if (typePlan == 'yourself' || typePlan == 'collaborator')
				{
					if (ArrayCount(arrObjects) > 0)
					{
						sText = getParam(arrFormFields, "text_notification");
						if (sText == undefined || sText == "undefined")
							sText = "";
	
						dStartLearningDate = DateNewTime(Date());
						try
						{
							dStartLearningDate = Date(startLearningDate);
						}
						catch (_err)
						{
							if (startLearningDate == "month")
							{
								if (Month(dStartLearningDate) != 12)
									dStartLearningDate = "01." + (Month(dStartLearningDate) + 1) + "." + Year(dStartLearningDate);
								else
									dStartLearningDate = "01.01." + (Year(dStartLearningDate) + 1);
							}
							if (startLearningDate == "monday")
							{
								dStartLearningDate = DateOffset(dStartLearningDate, 86400);
								while (WeekDay(dStartLearningDate) != 1)
									dStartLearningDate = DateOffset(dStartLearningDate, 86400);
							}
                            if (startLearningDate == "today")
							{
								dStartLearningDate = DateNewTime(Date());
							}
						}
	
						for (oObject in arrObjects)
						{
							if (mindEmployeeStatus == "omit_dismissed" || mindEmployeeStatus == "blacklisted")
							{
								if (tools_web.is_true(oObject.is_dismiss) && mindEmployeeStatus == "omit_dismissed")
									continue;
	
								if (blacklistStatuses != "" && mindEmployeeStatus == "blacklisted")
								{
									bCheck = false;
									arrBlacklistStatuses = String(blacklistStatuses).split(";");
									arrBlacklistStatuses = ArrayIntersect(lists.person_states, arrBlacklistStatuses, "This.id", "This");
									for (sBlacklistStatuses in arrBlacklistStatuses)
									{
										if (sBlacklistStatuses.name == oObject.current_state)
										{
											bCheck = true;
											break;
										}
									}
									if (bCheck)
										continue;
								}
							}
							_comment = "";
							if (tools_web.is_true(useComments))
								_comment = getParam(arrFormFields, "comment");
	
							_filter = "";
							if (checkReassignment == "predefined_days")
								if (OptInt(expireTimeOfCompleted) != undefined)
								{
									dDateLast = DateOffset(DateNewTime(Date()), OptInt(expireTimeOfCompleted, 0) * (-86400));
									_filter = " and $elem/finish_date > " + XQueryLiteral(dDateLast);
								}
							_xarrCompoundProgram = tools.xquery("for $elem in education_plans where $elem/person_id = " + oObject.id + _filter + " and $elem/compound_program_id = " + iCompoundProgramID + " and MatchSome($elem/state_id, ('0', '1')) return $elem/Fields('id', 'name')");
							_xarrCompoundProgramGroup = tools.xquery("for $elem in education_plans, $gc in group_collaborators where $elem/object_id = $gc/group_id and $elem/type = 'group' and $elem/compound_program_id = " + iCompoundProgramID + " and $gc/collaborator_id = " + oObject.id + _filter + " and MatchSome($elem/state_id, ('0', '1')) return $elem")
	
							if (ArrayOptFirstElem(_xarrCompoundProgram) == undefined && ArrayOptFirstElem(_xarrCompoundProgramGroup) == undefined )
							{
								try
								{
									docCollaborator = tools.open_doc(OptInt(oObject.id, 0));
									if (docCollaborator != undefined)
									{
										docEducationPlan = OpenNewDoc('x-local://wtv/wtv_education_plan.xmd');
										docEducationPlan.TopElem.AssignElem(teCompoundProgram);
										docEducationPlan.TopElem.code = '';
										docEducationPlan.TopElem.comment = _comment;
										docEducationPlan.TopElem.compound_program_id = OptInt(teCompoundProgram.id);
	
										_managerID = getParam(arrFormFields, "managerID");
										if (assignManager == "tutors")
										{
											bossMainID = ArrayOptFirstElem(tools.xquery("for $elem in boss_types where $elem/code = 'main' return $elem/Fields('id')")).id;
											arrObjectFuncID = [];
											arrObjectFuncID.push(oObject.id);
											_arrGroupID = tools.xquery("for $elem in group_collaborators where $elem/collaborator_id = " + oObject.id + " return $elem/Fields('group_id')");
											if (_arrGroupID != undefined)
												for (groupID in _arrGroupID)
													arrObjectFuncID.push(groupID.group_id);
											arrObjectFuncID.push(docCollaborator.TopElem.position_id);
											arrObjectFuncID.push(docCollaborator.TopElem.position_parent_id);
											_orgID = ArrayOptFirstElem(tools.xquery("for $elem in subdivisions where $elem/id = " + docCollaborator.TopElem.position_parent_id + " return $elem/Fields('org_id')"));
											arrObjectFuncID.push(_orgID == undefined ? 0 : _orgID.org_id);
	
											for (iObjectFuncID in arrObjectFuncID)
											{
												oFuncManager = ArrayOptFirstElem(tools.xquery("for $elem in func_managers where $elem/object_id = " + OptInt(iObjectFuncID, 0) + " and $elem/boss_type_id != " + OptInt(bossMainID, 0) + " return $elem/Fields('person_id')"));
												if (oFuncManager != undefined)
												{
													_managerID = oFuncManager.person_id;
													break;
												}
											}
										}
										if (assignManager == "teacher")
										{
											oFuncManager = ArrayOptFirstElem(teCompoundProgram.lectors);
											if (oFuncManager != undefined)
											{
												_managerID = ArrayOptFirstElem(tools.xquery("for $elem in lectors where $elem/id = " + oFuncManager.lector_id + "  return $elem/Fields('person_id')"));
												if (_managerID != undefined)
													_managerID = _managerID.person_id;
											}
											else
												_managerID = undefined;
										}
										if (assignManager == "admin_teacher")
										{
											_managerID = ArrayOptFirstElem(tools.xquery("for $elem in lectors where $elem/id = " + OptInt(_managerID, 0) + "  return $elem/Fields('person_id')"));
											if (_managerID != undefined)
												_managerID = _managerID.person_id;
										}
	
										if (OptInt(_managerID) != undefined)
											docEducationPlan.TopElem.tutor_id = OptInt(_managerID, 0);
	
										docEducationPlan.TopElem.person_id = oObject.id;
										tools.common_filling('collaborator', docEducationPlan.TopElem, oObject.id);
										docEducationPlan.TopElem.create_date = Date();
										docEducationPlan.TopElem.plan_date = OptDate(dStartLearningDate);
										docEducationPlan.BindToDb(DefaultDb);
										docEducationPlan.Save();
										
										tools.call_code_library_method( 'libEducation', 'update_education_plan_date', [ docEducationPlan.DocID, docEducationPlan ] );
										tools.call_code_library_method( 'libEducation', 'update_education_plan', [ docEducationPlan.DocID, docEducationPlan, docEducationPlan.TopElem.person_id, true ] );
										_first = false;
										
										arrNotification = type_send.split(';');
	
										if (ArrayOptFind(arrNotification, 'This=='+"'collaborators'") != undefined)
											bResultSend = tools.create_notification("education_plan_user", OptInt(oObject.id, 0), sText, OptInt(docEducationPlan.DocID, 0));
										
										if (ArrayOptFind(arrNotification, 'This=='+"'manager'") != undefined)
										{
											arrDirectBoss = tools.get_uni_user_bosses(oObject.id);
											if (ArrayCount(arrDirectBoss) > 0)
											{
												bResultSend = tools.create_notification("education_plan_manager", OptInt(ArrayOptFirstElem(arrDirectBoss).id, 0), sText, OptInt(docEducationPlan.DocID, 0)); 
											}
										}
	
										if (ArrayOptFind(arrNotification, 'This=='+"'tutors'") != undefined)
										{
											if (docEducationPlan.TopElem.tutor_id != '')
											{
												bResultSend = tools.create_notification("education_plan_manager", OptInt(docEducationPlan.TopElem.tutor_id, 0), sText, OptInt(docEducationPlan.DocID, 0)); 
											}
										}
	
									}
									iCounter++;
								}
								catch (de)
								{
									ERROR = de;
								}
							}
							else
							{
								if (ArrayCount(_xarrCompoundProgram) > 0)
								{
									planName = ArrayOptFirstElem(_xarrCompoundProgram).name;
								}
								else if (ArrayCount(_xarrCompoundProgramGroup) > 0)
								{
									planName = ArrayOptFirstElem(_xarrCompoundProgramGroup).name;
								}
								else
									planName = "";
	
								if (typePlan == 'yourself')
								{
									ERROR = "У вас уже есть активный План обучения " + '"' + planName + '"';
								}
								else
								{
									if (ArrayCount(arrObjects) == 1)
									{
										ERROR = "У пользователя уже есть активный План обучения " + '"' + planName + '"';
									}
									else if ((ArrayCount(arrObjects) > 1))
									{
										ERROR = "Создано " + iCounter + "  планов обучения";
									}
									
								}
								
							}
								
						}
					}
					else
						ERROR = "Сотрудники не найдены";
				}
				else
				{
					if (ArrayCount(arrObjects) > 0)
					{
						oSelectedGroup = ArrayOptFirstElem(arrObjects);
						arrGroupCollaborators = tools.xquery("for $elem in group_collaborators where $elem/group_id = " + oSelectedGroup.id + " return $elem");

						sText = getParam(arrFormFields, "text_notification");
						if (sText == undefined || sText == "undefined")
							sText = "";

						dStartLearningDate = DateNewTime(Date());
						try
						{
							dStartLearningDate = Date(startLearningDate);
						}
						catch (_err)
						{
							if (startLearningDate == "month")
							{
								if (Month(dStartLearningDate) != 12)
									dStartLearningDate = "01." + (Month(dStartLearningDate) + 1) + "." + Year(dStartLearningDate);
								else
									dStartLearningDate = "01.01." + (Year(dStartLearningDate) + 1);
							}
							if (startLearningDate == "monday")
							{
								dStartLearningDate = DateOffset(dStartLearningDate, 86400);
								while (WeekDay(dStartLearningDate) != 1)
									dStartLearningDate = DateOffset(dStartLearningDate, 86400);
							}
                            if (startLearningDate == "today")
							{
								dStartLearningDate = DateNewTime(Date());
							}
						}

						_comment = "";
						if (tools_web.is_true(useComments))
							_comment = getParam(arrFormFields, "comment");

						_xarrCompoundProgramGroup = tools.xquery("for $elem in education_plans where $elem/type = 'group' and $elem/compound_program_id = " + iCompoundProgramID + " and $elem/object_id = " + oSelectedGroup.id + " and MatchSome($elem/state_id, ('0', '1')) return $elem")
						if (ArrayOptFirstElem(_xarrCompoundProgramGroup) == undefined )
						{
							try
							{
								docEducationPlan = OpenNewDoc('x-local://wtv/wtv_education_plan.xmd');
								docEducationPlan.TopElem.AssignElem(teCompoundProgram);
								docEducationPlan.TopElem.code = '';
								docEducationPlan.TopElem.comment = _comment;
								docEducationPlan.TopElem.compound_program_id = OptInt(teCompoundProgram.id);

								_managerID = getParam(arrFormFields, "managerID");
								
								if (assignManager == "tutors")
								{
									oFuncManager = ArrayOptFirstElem(tools.xquery("for $elem in func_managers where $elem/object_id = " + oSelectedGroup.id + " return $elem/Fields('person_id')"));
									
									if (oFuncManager != undefined)
										{
											_managerID = oFuncManager.person_id;
										}
								}
								if (assignManager == "teacher")
								{
									oFuncManager = ArrayOptFirstElem(teCompoundProgram.lectors);
									if (oFuncManager != undefined)
									{
										_managerID = ArrayOptFirstElem(tools.xquery("for $elem in lectors where $elem/id = " + oFuncManager.lector_id + "  return $elem/Fields('person_id')"));
										if (_managerID != undefined)
											_managerID = _managerID.person_id;
									}
									else
										_managerID = undefined;
								}
								
								if (assignManager == "admin_teacher")
								{
									_managerID = ArrayOptFirstElem(tools.xquery("for $elem in lectors where $elem/id = " + OptInt(_managerID, 0) + "  return $elem/Fields('person_id')"));
									if (_managerID != undefined)
										_managerID = _managerID.person_id;
								} 

								if (OptInt(_managerID) != undefined)
									docEducationPlan.TopElem.tutor_id = OptInt(_managerID, 0);

								docEducationPlan.TopElem.type = 'group';
								docEducationPlan.TopElem.object_id = oSelectedGroup.id;
								docEducationPlan.TopElem.object_name = oSelectedGroup.name;
								docEducationPlan.TopElem.create_date = Date();
								docEducationPlan.TopElem.plan_date = OptDate(dStartLearningDate);
								docEducationPlan.BindToDb(DefaultDb);
								docEducationPlan.Save();
								updatePlanEducation(docEducationPlan.TopElem.id);

								if (create_chats != '' && create_chats != undefined)
								{
									ProcessChatsByEducationPlan(docEducationPlan, create_chats)
								}
								

							}
							catch (de)
							{
								ERROR = de;
							}
						}
						else
						{
							updatePlanEducation(ArrayOptFirstElem(_xarrCompoundProgramGroup).id);
							
							if (create_chats != '' && create_chats != undefined)
							{
								docEducationPlan = OpenDoc(UrlFromDocID(ArrayOptFirstElem(_xarrCompoundProgramGroup).id))
								ProcessChatsByEducationPlan(docEducationPlan, create_chats)
							}
						}
						
					}
				}
				
			}
			if (typePlan == 'yourself')
			{
				MESSAGE = ERROR != "" ? ERROR : "Вам назначен План обучения " + '"' + docEducationPlan.TopElem.name + '"';
			}
			else if (typePlan == 'collaborator')
				MESSAGE = "Создано " + iCounter + "  планов обучения";
			else
				MESSAGE = 'Для группы "' + oSelectedGroup.name + '" сформирован План обучения';
			
			if (ERROR != "")
				oResult = getFormMessage(ERROR);
			else
			{
				oResult = getFormMessage(MESSAGE);
			}
				
		}
	}
}

RESULT = oResult;