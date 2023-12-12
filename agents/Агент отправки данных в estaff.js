////Инициализация справочников
function initDictionaries(){
	gradesDictionary = XQuery("sql: select * from cc_un_grades");
	reasonContractDictionary = XQuery("sql: select * from cc_un_reason_contracts");
	validityPeriodDictionary = XQuery("sql: select * from cc_un_validity_periods");
	typeOfWorkDictionary = XQuery("sql: select * from cc_un_type_of_works");
}
function getFullnameById(id){
	fullname = ""
	if (id != undefined && id != ""){
		col = ArrayOptFirstElem(XQuery("for $elem in collaborators where $elem/id = "+OptInt(id)+" return $elem"));
		if (col != undefined)
			fullname = col.fullname
	}
	return String(fullname);
}

function findById(array, code){
	if (code != ''){
		dictionaryRecord = ArrayOptFind(array,"id == "+code);
		if (dictionaryRecord!= undefined){
			return String(dictionaryRecord.code);
		}else{
			return undefined;
		}

	}else{
		return undefined;
	}
}


function prepareDataToSend(obj,api,eid,object_id,vacancy_name, person_name){



	vacancyRes = api.GetRequestParam('vacancy');

	 vacancyRes = {
				vacancy:{ 'opt_eid' : eid,
						'vacancy_name' : vacancy_name,
						'name' :vacancy_name,
						'state_id':'vacancy_opened',
						'csd':[{'cs_un_vacancy_cs_id':getValue(requestDoc.TopElem,"cs_id")},
						{'cs_un_candidate_fullname': person_name},
						{'cs_un_candidate_birth_date': getWorkflowValue(obj,"birth_date")},
						{'cs_un_candidate_mobile_phone': getWorkflowValue(obj,"mobile_phone")},
						{'cs_un_reg_procedure':getWorkflowValue(obj,"reg_procedure")},
						{'cs_un_vacancy_cs_position_name':getWorkflowValue(obj,"position_name")},
						{'cs_un_vacancy_cs_code_department_2':getWorkflowValue(obj,"code_department_2")},
						{'cs_un_vacancy_cs_job_class':getWorkflowValue(obj,"job_class")},
						{'cs_un_vacancy_cs_job_class_range':getWorkflowValue(obj,"job_class_range")},
						{'cs_un_range':getWorkflowValue(obj,"range")},
						{'cs_un_vacancy_cs_position_number':getWorkflowValue(obj,"position_number")},
						{'cs_un_vacancy_cs_code':getWorkflowValue(obj,"appoint_code")},
						{'cs_un_start_date':StrDate(Date(getWorkflowValue(obj,"start_date")),false)},
						{'cs_un_type_of_work':findById(typeOfWorkDictionary,getWorkflowValue(obj,"type_of_work"))},
						{'cs_un_validity_period':findById(validityPeriodDictionary,getWorkflowValue(obj,"validity_period"))},
						{'cs_vacancy_cs_job_end_date':StrDate(Date(getWorkflowValue(obj,"job_end_date")),false)},
						{'cs_vacancy_cs_reason_contract':findById(reasonContractDictionary,getWorkflowValue(obj,"reason_contract"))},
						{'cs_un_vacancy_cs_reason_contract_comm':getWorkflowValue(obj,"reason_contract_comm")},
						{'cs_un_vacancy_cs_grade':findById(gradesDictionary,getWorkflowValue(obj,"grade"))},
						{'cs_un_vacancy_cs_tariff_rate':getWorkflowValue(obj,"tariff_rate")},
						{'cs_un_installed_tarif':getWorkflowValue(obj,"installed_tarif")},
						{'cs_un_brigada':getWorkflowValue(obj,"brigada")},
						{'cs_un_site':getWorkflowValue(obj,"site")},
						{'cs_un_vacancy_cs_percent_r':getWorkflowValue(obj,"percent_r")},
						{'cs_un_vacancy_cs_percent_far_north':getWorkflowValue(obj,"percent_far_north")},
						{'cs_un_vacancy_cs_work_schedule':getWorkflowValue(obj,"work_schedule")},
						{'cs_un_vacancy_cs_work_schedule_privileges':getWorkflowValue(obj,"work_schedule_privileges")},
						{'cs_un_vacancy_cs_countryside':getWorkflowValue(obj,"countryside")},
						{'cs_un_vacancy_cs_pension_benefits':getWorkflowValue(obj,"pension_benefits")},
						{'cs_un_vacancy_cs_conditions':getWorkflowValue(obj,"conditions")},
						{'cs_un_vacancy_cs_conditions2':getWorkflowValue(obj,"conditions2")},
						{'cs_un_vacancy_cs_conditions1':getWorkflowValue(obj,"conditions1")},
						{'cs_un_vacancy_cs_pay_increased':getWorkflowValue(obj,"pay_increased")},
						{'cs_un_vacancy_cs_leave_additional':getWorkflowValue(obj,"leave_additional")},
						{'cs_un_vacancy_cs_reduced_working_time':getWorkflowValue(obj,"reduced_working_time")},
						{'cs_un_vacancy_cs_medical_check':getWorkflowValue(obj,"medical_check")},
						{'cs_un_tipe_destanation ':getWorkflowValue(obj,"current_type")},
						{'cs_un_necess_education':getWorkflowValue(obj,"necess_education")},
						{'cs_un_program_education':getWorkflowValue(obj,"program_education")},
						{'cs_un_trial_period':getWorkflowValue(obj,"trial_period")},
						{'cs_un_vacancy_cs_recruiter_name':getFullnameById(getWorkflowValue(obj,"recruiter_id"))},
						{'cs_un_vacancy_cs_vp_of_staffing_name':getFullnameById(getWorkflowValue(obj,"vp_of_staffing_id"))},
						{'cs_un_other_working_conditions':getWorkflowValue(obj,"other_working_conditions")},
						{'cs_un_comment':getWorkflowValue(obj,"un_comment")}]
				}}

	return vacancyRes;
}

function getValue(obj, name){
	return String(obj.custom_elems.ObtainChildByKey(name).value);
}
function getWorkflowValue(obj, name){
	return String(obj.workflow_fields.ObtainChildByKey(name).value);
}


var printFromId = 7156169162582948973;
gradesDictionary = undefined;
reasonContractDictionary = undefined;
validityPeriodDictionary = undefined;
typeOfWorkDictionary = undefined;

EnableLog ( "un_set_estaffdata_log", true );
LogEvent ( 'un_set_estaffdata_log', '======================================================================='); 
LogEvent ( 'un_set_estaffdata_log', 'Агент отправки данных в E-Staff начал работу'); 
var requestsToSend = XQuery("for $elem in requests where request_type_id = 7156134652193438761 and workflow_state = 'ready_to_send' return $elem");
var requestCount = ArrayCount(requestsToSend);

LogEvent ( 'un_set_estaffdata_log', "Найдено заявок для отправки в E-Staff-  "+requestCount); 

if (requestCount>0){
initDictionaries();
	var api = OpenNewDoc('x-local://source/api_estaff.xml').TopElem;
	var object_id = null;
	var eid = null;
	var person_name = "";
	
	api.CreateSOAPRequest('AddVacancy');
	LogEvent ( 'un_set_estaffdata_log', "инициирована библиотека API "); 
	for(request in requestsToSend){
		try{
			LogEvent ( 'un_set_estaffdata_log', 'Обрабатывается заявка ' +request.id + '\n----------' ); 
			requestDoc = OpenDoc(UrlFromDocID(OptInt(request.id)));
	                person_name = getWorkflowValue(requestDoc.TopElem,"fullname");
			eid = getValue(requestDoc.TopElem,"eid");
			object_id = getValue(requestDoc.TopElem,"cs_id");
			vacancy_name =  getValue(requestDoc.TopElem,"vacancy_name");

			if (eid == undefined || eid == ""){
				LogEvent ( 'un_set_estaffdata_log', 'В заявке отстутствует идентификатор заявки в E-staff, пропускаем"' ); 
				continue;
			}

			if (vacancy_name == undefined || vacancy_name == ""){
				LogEvent ( 'un_set_estaffdata_log', 'В заявке отстутствует идентификатор заявки в E-staff, пропускаем' ); 
				continue
			}


			vacancy = prepareDataToSend(requestDoc.TopElem,api,eid,object_id,vacancy_name,person_name);
			LogEvent ( 'un_set_estaffdata_log', 'Подготовленны данные для отправки в E-staff' ); 

			vacancy = api.SetRequestParam(vacancy);

			if(!api.SendRequest()){
				LogEvent ( 'un_set_estaffdata_log', 'E-Staff API function GetXQuery return error.\n' + api.GetResponse().error_message + '\n----------' ); 
			}else{
				LogEvent ( 'un_set_estaffdata_log', 'Передача данных в E-Staff выполнена' ); 

			}
		LogEvent ( 'un_set_estaffdata_log', 'Начинается формирование файла для передачи в e-staff'); 
			var printForm = tools.process_print_form( printFromId, request.id ) 
		LogEvent ( 'un_set_estaffdata_log', 'файл для передачи сформирован'); 
			api.CreateSOAPRequest('AddAttachment');

				var attachment = api.GetRequestParam('attachment');
				attachment = {
					attachment: {
						object_type: 'vacancy',
						object_id : 'fakedata',
						object_eid: eid,
						object_code: 'fakedata',
						file: {
					type: 'application/binary',
					file_name: requestDoc.TopElem.code +"_"+person_name+'.pdf',
					type_id:'',
					data : Base64Encode(printForm)
					}
				}
					};

					request = api.SetRequestParam(attachment);
					LogEvent ( 'un_set_estaffdata_log', 'Подготовленн файл для отправки в E-staff' ); 
					if(!api.SendRequest()){
						LogEvent ( 'un_set_estaffdata_log', 'E-Staff API function AddAttachment return error.\n' + api.GetResponse().error_message + '\n----------' ); 
					}else{
						LogEvent ( 'un_set_estaffdata_log', 'Передача файла в вакансию E-Staff выполнена' ); 

					}

				LogEvent ( 'un_set_estaffdata_log', 'Выставляем статус sent' );
			 

				requestDoc.TopElem.workflow_state='sent';
				requestDoc.Save();

				LogEvent ( 'un_set_estaffdata_log', 'Обработка заявки завершена'); 

		}catch(err){
			LogEvent ( 'un_set_estaffdata_log', 'Произошла неисвестная ошибка' +err); 
		}
	}
}
LogEvent ( 'un_set_estaffdata_log', 'Агент отправки данных в E-Staff завершил работу'); 
LogEvent ( 'un_set_estaffdata_log', '======================================================================='); 
EnableLog ( "un_set_estaffdata_log", true );