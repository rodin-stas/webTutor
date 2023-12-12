////Инициализация справочников
function initDictionaries(){
    gradesDictionary = XQuery("sql: select * from cc_un_grades");
    reasonContractDictionary = XQuery("sql: select * from cc_un_reason_contracts");
    validityPeriodDictionary = XQuery("sql: select * from cc_un_validity_periods");
    }
    
    function findByCode(array, code){
        if (code != ''){
            dictionaryRecord = ArrayOptFind(array,"This.code == '"+code+"'");
            if (dictionaryRecord!= undefined){
                return dictionaryRecord.id;
            }else{
                return "";
            }
    
        }else{
            return "";
        }
    }
    function prepareArray(api){
            candidates = api.GetResponse().documents;
        canArray = Array();
        for (can in candidates){
            oCan = new Object();
            canArray.push(oCan);
            for (field in can.fields){
                try{
                    if (field.OptChild('value') != undefined)
                        oCan[field.name.Value] = field.value.Value;
                    else
                        oCan[field.name.Value] = "";
                }
                catch(err)
                {
                    oCan[field.name.Value] = "";
                }
            }
        }
        return canArray;
    
    }
    function setValue(name,value){
        requestDocTE.custom_elems.ObtainChildByKey(name).value = value;
    }
    function setWorkflowValue(name,value){
        requestDocTE.workflow_fields.ObtainChildByKey(name).value = value;
    }
    function createRequest(candidate,person_id){
    
        oldRequest = OpenDoc(UrlFromDocID(OptInt(candidate.eid)))
        
        requestTypeTE = OpenDoc(UrlFromDocID(OptInt(Param.requestTypeID))).TopElem
        requestDoc = OpenNewDoc('x-local://wtv/wtv_request.xmd');
        requestDocTE = requestDoc.TopElem;
        requestDocTE.object_id = OptInt(candidate.eid); 
        requestDocTE.person_id = person_id; 
        tools.common_filling( 'request_type', requestDocTE, Param.requestTypeID, requestTypeTE );
        //tools.common_filling( 'collaborator', requestDocTE, person_id );
        tools.object_filling( requestDocTE.object_type,requestDocTE, OptInt(candidate.eid), oldRequest.TopElem )
        requestDocTE.request_type_id=Param.requestTypeID;
        setValue("vacancy_name",candidate.vacancy_name);
        setValue("eid",candidate.eid);
        setValue("cs_id",candidate.cs_id);
        setWorkflowValue("fullname",candidate.fullname);
        setWorkflowValue("birth_date",candidate.birth_date);
        setWorkflowValue("mobile_phone",candidate.mobile_phone);
        setWorkflowValue("position_name",candidate.position_name);
        setWorkflowValue("code_department_2",candidate.code_department_2);
        setWorkflowValue("job_class",candidate.job_class);
        setWorkflowValue("job_class_range",candidate.job_class_range);
        setWorkflowValue("position_number",candidate.position_number);
        setWorkflowValue("appoint_code",candidate.appoint_code);
        setWorkflowValue("job_end_date",candidate.job_end_date);
        setWorkflowValue("reason_contract",findByCode(reasonContractDictionary,candidate.reason_contract));
        setWorkflowValue("reason_contract_comm",candidate.reason_contract_comm);
        setWorkflowValue("grade",findByCode(gradesDictionary,candidate.grade));
        setWorkflowValue("tariff_rate",candidate.tariff_rate);
        setWorkflowValue("percent_r",candidate.percent_r);
        setWorkflowValue("validity_period",findByCode(validityPeriodDictionary,candidate.validity_period));
        setWorkflowValue("work_schedule",candidate.work_schedule);
        setWorkflowValue("work_schedule_privileges",candidate.work_schedule_privileges);
        setWorkflowValue("percent_far_north",candidate.percent_far_north);
        setWorkflowValue("countryside",candidate.countryside);
        setWorkflowValue("pension_benefits",candidate.pension_benefits);
        setWorkflowValue("conditions",candidate.conditions);
        setWorkflowValue("conditions2",candidate.conditions2);
        setWorkflowValue("conditions1",candidate.conditions1);
        setWorkflowValue("pay_increased",candidate.pay_increased);
        setWorkflowValue("leave_additional",candidate.leave_additional);
        setWorkflowValue("medical_check",candidate.medical_check);
        setWorkflowValue("reduced_working_time",candidate.reduced_working_time);
        setWorkflowValue("recruiter_id",oldRequest.TopElem.workflow_fields.ObtainChildByKey('recruiter').value);
        setWorkflowValue("vp_of_staffing_id",oldRequest.TopElem.workflow_fields.ObtainChildByKey('hrbp').value);
        setWorkflowValue("head",oldRequest.TopElem.workflow_fields.ObtainChildByKey('boss_id').value);
        setWorkflowValue("cnb",oldRequest.TopElem.workflow_fields.ObtainChildByKey('CandB').value);
    
        requestDoc.BindToDb();
        requestDoc.Save();
    
        tools.create_notification("un_created", requestDoc.DocID);
    }
    
    function prepareCandidatesRequest(api){
    
    var request = api.GetRequestParam('request');
    
    request = {
        request: {
            xquery: 'for $elem in candidates where $elem/state_id = "event_type_formation_of_ec" return $elem',
            fields: { field: [ 
                    {value: 'id'},
                    {value: 'fullname'},
                    {value: 'birth_date'},
                    {value: 'mobile_phone'},
                    {name: 'vacancy_id', value: 'main_vacancy_id'},
                    {name: 'vacancy_name', value: 'main_vacancy_id.ForeignElem.name'},
                    {name: 'eid', value: 'main_vacancy_id.ForeignElem.eid'},
                    {name: 'cs_id', value: 'main_vacancy_id.ForeignElem.cs_id'},
                    {name: 'position_name', value: 'main_vacancy_id.ForeignElem.cs_position_name'},
                    {name: 'code_department_2', value: 'main_vacancy_id.ForeignElem.cs_code_department_2'},
                    {name: 'job_class', value: 'main_vacancy_id.ForeignElem.cs_job_class'},
                    {name: 'job_class_range', value: 'main_vacancy_id.ForeignElem.cs_job_class_range'},
                    {name: 'position_number', value: 'main_vacancy_id.ForeignElem.cs_position_number'},
                    {name: 'appoint_code', value: 'main_vacancy_id.ForeignElem.cs_code'},
                    {name: 'job_end_date', value: 'main_vacancy_id.ForeignElem.cs_job_end_date'},
                    {name: 'reason_contract', value: 'main_vacancy_id.ForeignElem.cs_reason_contract'},
                    {name: 'validity_period', value: 'main_vacancy_id.ForeignElem.cs_term_contract'},
                    {name: 'reason_contract_comm', value: 'main_vacancy_id.ForeignElem.cs_reason_contract_comm'},
                    {name: 'grade', value: 'main_vacancy_id.ForeignElem.cs_grade'},
                    {name: 'tariff_rate', value: 'main_vacancy_id.ForeignElem.cs_tariff_rate'},
                    {name: 'percent_r', value: 'main_vacancy_id.ForeignElem.cs_percent_r'},
                    {name: 'work_schedule', value: 'main_vacancy_id.ForeignElem.cs_work_schedule'},
                    {name: 'percent_far_north', value: 'main_vacancy_id.ForeignElem.cs_percent_far_north'},
                    {name: 'work_schedule_privileges', value: 'main_vacancy_id.ForeignElem.cs_work_schedule_privileges'},
                    {name: 'countryside', value: 'main_vacancy_id.ForeignElem.cs_countryside'},
                    {name: 'pension_benefits', value: 'main_vacancy_id.ForeignElem.cs_pension_benefits'},
                    {name: 'conditions', value: 'main_vacancy_id.ForeignElem.cs_conditions'},
                    {name: 'conditions2', value: 'main_vacancy_id.ForeignElem.cs_conditions2'},
                    {name: 'conditions1', value: 'main_vacancy_id.ForeignElem.cs_conditions1'},
                    {name: 'pay_increased', value: 'main_vacancy_id.ForeignElem.cs_pay_increased'},
                    {name: 'leave_additional', value: 'main_vacancy_id.ForeignElem.cs_leave_additional'},
                    {name: 'reduced_working_time', value: 'main_vacancy_id.ForeignElem.cs_reduced_working_time'},
                    {name: 'medical_check', value: 'main_vacancy_id.ForeignElem.cs_medical_check'}
                ]}
        }
    };
    return request;
    }
    function prepareCandidatesEventRequest(api,candidateID, vacancyID){
    var request = api.GetRequestParam('request');
    
    request = {
        request: {
            xquery: "for $elem in events where $elem/type_id = 'event_type_formation_of_ec' and $elem/candidate_id = "+candidateID+" and $elem/vacancy_id = "+vacancyID+" order by $elem/creation_date descending return $elem",
            fields: { field: [ 
                    {value: 'id'},
                    {name: 'user_login', doc_value: 'doc_info.creation.user_login'},
                    {name: 'user_id', doc_value: 'doc_info.creation.user_id'}
                ]}
        }
    };
    return request;
    }
    
    
    gradesDictionary = undefined;
    reasonContractDictionary = undefined;
    validityPeriodDictionary = undefined;
    
    
    EnableLog ( "un_get_estaffdata_log", true );
    var api = OpenNewDoc('x-local://source/api_estaff.xml').TopElem;
    
    
    LogEvent ( 'un_get_estaffdata_log', "инициирована библиотека API "); 
    api.CreateSOAPRequest('GetXQuery');
    
              
    LogEvent ( 'un_get_estaffdata_log', "инициирована библиотека API" ); 
    request = api.SetRequestParam(prepareCandidatesRequest(api));
    if(!api.SendRequest())
        LogEvent ( 'un_get_estaffdata_log', 'E-Staff API function GetXQuery return error.\n' + api.GetResponse().error_message + '\n----------' ); 
      
    
    //Преобразование сложной xml структуры в обьекты для дальнейшей работы
    
    candidates = prepareArray(api);
    candidatesCount = ArrayCount(candidates)
    
    if (candidatesCount > 0){
        initDictionaries();
        keys = ArrayExtractKeys(candidates,'eid').join(',');
    
        /// тут после получения провести проверку , есть ли заявка на кандидата, если нет - тогда делаем запрос на получение данных заявки.
        requestsList = XQuery("sql:   
            DECLARE	@subdiv_ids AS TABLE(
            id BIGINT
            );
            INSERT INTO @subdiv_ids
            SELECT DISTINCT
            dbo.CustomFieldToBihint(value)
            FROM
            string_split('"+keys+"', ',');
            select 
            s.id 'vacancy_id', 
            r.id 'request_id'
            from @subdiv_ids s
            left join requests r on r.object_id = s.id and r.request_type_id = "+Param.requestTypeID+" and (r.status_id = 'active' or (r.status_id = 'ignore' and r.workflow_state != 'recreate'))");
    
        for (can in candidates){
            try {
                event = undefined;
                user = undefined;
                initiatorID = undefined;
                requestExt = undefined;
                if (can.vacancy_id == ''){
                    LogEvent ( 'un_get_estaffdata_log', "У кандидата "+can.fullname+" не найден внешний иеднтификатор вакансии eid. Обработка заявки пропускается  "); 
                    continue;
                }
                
                if (can.eid == ''){
                    LogEvent ( 'un_get_estaffdata_log', "Для кандидата "+can.fullname+"  в вакансии отсутствует внешний идентификатор - "); 
                    continue;
                }
                requestExt = ArrayOptFind(requestsList,'vacancy_id == '+String(OptInt(can.eid)))
                if (requestExt.request_id != undefined && requestExt.request_id != null){
                    LogEvent ( 'un_get_estaffdata_log', "Активная заявка для кандидата "+can.fullname+" уже существует - "+requestExt.request_id); 
                }else{
                    request = api.SetRequestParam(prepareCandidatesEventRequest(api,can.id, can.vacancy_id ));
                    if(!api.SendRequest()){
                        LogEvent ( 'un_get_estaffdata_log', 'E-Staff API function GetXQuery return error.\n' + api.GetResponse().error_message + '\n----------' ); 
                        
                    }else{
                        LogEvent ( 'un_get_estaffdata_log', "Заявка для кандидата "+can.fullname+"не найдена. Создаем новую заявку для вакансии "+requestExt.vacancy_id); 
                        event = ArrayOptFirstElem(prepareArray(api));
                        if (event != undefined){
                            if (event.user_id != ''){
                                user = ArrayOptFirstElem(XQuery("sql:SELECT id  FROM collaborators_ext where dbo.CustomFieldToBigint(cust_Eid) = "+event.user_id))
                                if (user != undefined){
                                    initiatorID = user.id;
                                }else{
                                    LogEvent ( 'un_get_estaffdata_log', "Не найден пользователь с cust_eid = "+event.user_id+ "в collaborators_ext. Уведомление будет направлено администратору" ); 
                                }
                            }else{
                                LogEvent ( 'un_get_estaffdata_log', "user_id в карточке события "+event.id+" не найден, уведомление будет направлено администратору"); 
                            }
                        }else{
                            LogEvent ( 'un_get_estaffdata_log', "событие изменение статуса не найдено для кандидата  "+can.fullname+" и вакансии " + can.vacancy_id); 
                        }
    
                        
                        LogEvent ( 'un_get_estaffdata_log', "candidate_info "+tools.object_to_text(can,"json")); 
                        if (initiatorID == undefined)
                            initiatorID = Param.adminUser
                        createRequest(can,initiatorID);
                    }
                }
            }catch(err){
                    LogEvent ( 'un_get_estaffdata_log', "произошла неожиданная ошибка"+err); 
            }
        }
    
    }else{
        LogEvent ( 'un_get_estaffdata_log', "Кандидатов со статусом не найдено"); 
    }
    
    LogEvent ( 'un_get_estaffdata_log', 'Агент Завершил работу'); 
    LogEvent ( 'un_get_estaffdata_log', '========================================================================================='); 
    EnableLog ( "un_get_estaffdata_log", false );