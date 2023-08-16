function addColumn(name, value){
	// Создается настраиваемого отчета .
	column = columns.AddChild();
	// Заголовок столбца 
	column.flag_formula = true;
	column.column_title = name;
	// Значения данных - данные
	column.column_value = value;
	column.column_width = 200;
	column.column_width_unit = "px";
	// Тип данных столбца настраиваемого отчета - строка
	column.datatype = "string";
}

function addTaskColumn(count, type){
	if (type == 'education_method') {
		addColumn(count+"-й этап мод. программы","ListElem.name"+count)
		addColumn("Тип "+count+"-го этапа мод. программы","ListElem.type"+count)
		addColumn("Статус","ListElem.state"+count)
		addColumn("Присутствовал","ListElem.event_is_assist"+count)
		addColumn("Дата начала мероприятия","ListElem.event_start_date"+count)
	} else {
		addColumn(count+"-й этап мод. программы","ListElem.name"+count)
		addColumn("Тип "+count+"-го этапа мод. программы","ListElem.type"+count)
		addColumn("Статус","ListElem.state"+count)
	}

}

function processModProgramCriterions(){
	comProgStr = "";
	isFirst = true;
	for (i=0;i<5;i++){
		comProgCriterion = criterions[i];
		if (comProgCriterion!=undefined){
			value = OptInt(comProgCriterion.value,0);
			if (value != 0){
				if (isFirst){
					isFirst = false;
				}else{
					comProgStr+= ",";
				}
				comProgStr+=value;
			}
		}
	}
	if (isFirst)
		return "and 1=0";
	else return "and cps.id in ("+comProgStr+")";
}

function processDateCriterions(){
	fromDate = OptDate(criterions[5].value);
	toDate = criterions[6].value;
	if (fromDate != undefined && toDate != undefined)
		return "and eps.create_date between convert(datetime, '"+fromDate+"',104) and convert(datetime, '"+toDate+"',104) "
	return ""
}

function processCollaboratorCriterions(){
		colID = OptInt(criterions[7].value,0);
		if (colID !=0)
			return " and cs.id = "+colID+" ";
		return "";
}

function processCollaboratorOrg(){
	orgID = OptInt(criterions[8].value);
	if (orgID != undefined)
		return " and cs.org_id = "+orgID+" ";
	return "";
}


aRes = [];
progFilter = processModProgramCriterions();
dateFilter = processDateCriterions();
colFilter = processCollaboratorCriterions();
orgFilter = processCollaboratorOrg();

try {
	arr = XQuery("sql:  \n\
	DECLARE @boss_main_id BIGINT = (SELECT id FROM boss_types where code = 'main'); \n\
	select DISTINCT \n\
		eps.id 'eps_id', \n\
		eps.person_fullname, \n\
    	eps.person_id, \n\
		cs.org_name, \n\
		cs.position_name, \n\
		cs.login, \n\
		eps.person_id, \n\
		cps.name, \n\
		cps.code, \n\
		cps.id 'cps_id', \n\
		eps.create_date, \n\
		cpext.with_cancel, \n\
		DATEADD(DAY,cps.duration,eps.create_date) 'end_date', \n\
		datediff(day,GETDATE(),DATEADD(DAY,cps.duration,eps.create_date)) 'remaining', \n\
		g.name 'group_name', \n\
		R.p.query('custom_elem/name[text() = ''f_codeczeh'']/../value/text()').value('.', 'varchar(248)') as 'code_czeh', \n\
		R.p.query('custom_elem/name[text() = ''f_nameczeh'']/../value/text()').value('.', 'varchar(596)') as 'name_czeh', \n\
		R.p.query('custom_elem/name[text() = ''f_funcroute'']/../value/text()').value('.', 'varchar(248)') as 'func_route', \n\
		eps.finish_date,\n\
		cs2.email 'boss_email',\n\
		cs2.fullname 'boss_fullname', \n\
		eps.last_activity_date \n\
	from \n\
		education_plans eps \n\
		inner join collaborators cs on cs.id = eps.person_id "+colFilter+"  \n\
		inner join compound_programs cps on cps.id = eps.compound_program_id " +progFilter+ " \n\
		inner join compound_programs_ext cpext on cps.id = cpext.id \n\
		inner join collaborator c on c.id = cs.id  \n\
		outer apply c.data.nodes('collaborator/custom_elems') as R(p) \n\
		left join groups g on g.id = eps.group_id \n\
		left join func_managers fm on fm.object_id = eps.person_id and fm.boss_type_id = @boss_main_id\n\
		left join collaborators cs2 on cs2.id = fm.person_id \n\
	WHERE \n\
        cs.is_dismiss = 0"+dateFilter+" "+orgFilter
	);
	
	addColumn("Название должности","ListElem.position_name")
	addColumn("Табельный номер","ListElem.tab_number")
	addColumn("Почта руководителя","ListElem.boss_email")
	addColumn("ФИО руководителя","ListElem.boss_fullname")
	addColumn("Площадка","ListElem.org_name")
	addColumn("Код цеха","ListElem.code_czeh")
	addColumn("Цех","ListElem.name_czeh")
	addColumn("Функциональное направление","ListElem.func_route")
	addColumn("Наименование мод.программы","ListElem.name")
	addColumn("Код мод.программы","ListElem.code")
	addColumn("Дата назначения Программы сотруднику","ListElem.create_date")
	addColumn("Плановый срок прохождения мод. программы","ListElem.end_date")
	addColumn("Дата последней активности","ListElem.last_activity_date")
	addColumn("Осталось дней на прохождение","ListElem.remaining")
	addColumn("Формат уведомления (с отменой / без)","ListElem.with_cancel")
	addColumn("Статус Плана обучения","ListElem.plan_state")
	addColumn("Наименование группы","ListElem.group_name")
	addColumn("Количество неявок на мероприятия","ListElem.count")
	addColumn("Даты неявок на мероприятия","ListElem.dates")
	
	columns_count =0;
	for (plan in arr){
	
		tasks_count = 0;
		r = new Object();
		r.SetProperty("PrimaryKey",plan.eps_id);
		r.SetProperty("person_fullname",plan.person_fullname);
		r.SetProperty("position_name",plan.position_name);
		r.SetProperty("tab_number",plan.login);
		r.SetProperty("boss_email",plan.boss_email);
		r.SetProperty("boss_fullname",plan.boss_fullname);
		r.SetProperty("org_name",plan.org_name);
		r.SetProperty("code_czeh",plan.code_czeh);
		r.SetProperty("name_czeh",plan.name_czeh);
		r.SetProperty("func_route",plan.func_route);
		r.SetProperty("name",plan.name);
		r.SetProperty("code",plan.code);
		r.SetProperty("create_date",plan.create_date);
		r.SetProperty("end_date",plan.end_date);
		r.SetProperty("last_activity_date",plan.last_activity_date);
		r.SetProperty("remaining",plan.remaining);
		r.SetProperty("with_cancel", (plan.with_cancel == true ? "Да" : "Нет"));
	
		modProgramDoc = OpenDoc(UrlFromDocID(OptInt(plan.eps_id))).TopElem;
		r.SetProperty("plan_state",common.education_learning_states.GetChildByKey( OptInt( modProgramDoc.state_id ) ).name);
		r.SetProperty("group_name",plan.group_name);
		r.SetProperty("count",modProgramDoc.custom_elems.ObtainChildByKey('skipped_count').value);
		r.SetProperty("dates",modProgramDoc.custom_elems.ObtainChildByKey('skipped_dates').value);
		for (task in modProgramDoc.programs){
			tasks_count++;
			
			r.SetProperty("name"+tasks_count,task.name);

			if(task.type == 'folder') {
				r.SetProperty("type"+tasks_count, "Этап")
			} else {
				r.SetProperty("type"+tasks_count,common.exchange_object_types.GetOptChildByKey( task.type ).title);
			}

			
            if(task.type == 'education_method') {
				eventResult = ArrayOptFirstElem(XQuery("sql: \n\
					select  \n\
						[t2].[event_start_date], \n\
						[t2].[is_assist] \n\
					FROM \n\
						[education_methods] AS [t0] \n\
						INNER JOIN [events] AS [t1] ON [t1].[education_method_id] = [t0].[id] \n\
						INNER JOIN [event_results] AS [t2] ON [t2].[event_id] = [t1].[id] \n\
					WHERE	 \n\
						[t0].[id] = "+SqlLiteral(task.object_id)+" \n\
						AND [t2].[person_id] = "+SqlLiteral(plan.person_id)+" \n\
						AND [t2].[is_assist] = 1  \n\
					"))

                r.SetProperty("event_is_assist"+tasks_count, eventResult != undefined ? '+' : '');
				r.SetProperty("event_start_date"+tasks_count, eventResult != undefined ? eventResult.event_start_date : '');
            }

			r.SetProperty("state"+tasks_count,common.learning_states.GetOptChildByKey( Int( task.state_id ) ).name);
			
			if (columns_count < tasks_count){
				columns_count++;
				addTaskColumn(columns_count, task.type );
			}
		}
		aRes.push(r);
	}
	return aRes;
} catch(err) {
	alert("err = " + err)
}