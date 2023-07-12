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
function addTaskColumn(count){
	addColumn(count+"-й этап мод. программы","ListElem.name"+count)
	addColumn("Тип "+count+"-го этапа мод. программы","ListElem.type"+count)
	addColumn("Статус","ListElem.state"+count)
}

function processModProgrammCriterions(){
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
		return "where eps.create_date between convert(datetime, '"+fromDate+"',104) and convert(datetime, '"+toDate+"',104) "
	return ""
}

function processCollaboratorCriterions(){
		colID = OptInt(criterions[7].value,0);
		if (colID !=0)
			return " and cs.id = "+colID+" ";
		return "";
}
aRes = [];
progFilter = processModProgrammCriterions();
dateFilter = processDateCriterions();
colFilter = processCollaboratorCriterions();

arr = XQuery("sql:  \n\
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
		R.p.query('custom_elem/name[text() = ''f_funcroute'']/../value/text()').value('.', 'varchar(248)') as 'func_route' \n\
	from \n\
		education_plans eps \n\
		inner join collaborators cs on cs.id = eps.person_id "+colFilter+"\n\
		inner join compound_programs cps on cps.id = eps.compound_program_id " +progFilter+ " \n\
		inner join compound_programs_ext cpext on cps.id = cpext.id \n\
		inner join collaborator c on c.id = cs.id  \n\
		cross apply c.data.nodes('collaborator/custom_elems') as R(p) \n\
		left join groups g on g.id = eps.group_id "+dateFilter
	);


addColumn("Название должности","ListElem.position_name")
addColumn("Табельный номер","ListElem.tab_number")
addColumn("Площадка","ListElem.org_name")
addColumn("Код цеха","ListElem.code_czeh")
addColumn("Цех","ListElem.name_czeh")
addColumn("Функциональное направление","ListElem.func_route")
addColumn("Наименование мод.программы","ListElem.name")
addColumn("Код мод.программы","ListElem.code")
addColumn("Дата назначения Программы сотруднику","ListElem.create_date")
addColumn("Плановый срок прохождения мод. программы","ListElem.end_date")
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
    r.SetProperty("org_name",plan.org_name);
	r.SetProperty("code_czeh",plan.code_czeh);
	r.SetProperty("name_czeh",plan.name_czeh);
	r.SetProperty("func_route",plan.func_route);
	r.SetProperty("name",plan.name);
	r.SetProperty("code",plan.code);
	r.SetProperty("create_date",plan.create_date);
	r.SetProperty("end_date",plan.end_date);
	r.SetProperty("remaining",plan.remaining);
	r.SetProperty("with_cancel", (plan.with_cancel == true ? "Да" : "Нет"));

	modProgrammDoc = OpenDoc(UrlFromDocID(OptInt(plan.eps_id))).TopElem;
	r.SetProperty("plan_state",common.education_learning_states.GetChildByKey( Int( modProgrammDoc.state_id ) ).name);
	r.SetProperty("group_name",plan.group_name);
	r.SetProperty("count",modProgrammDoc.custom_elems.ObtainChildByKey('skipped_count').value);
	r.SetProperty("dates",modProgrammDoc.custom_elems.ObtainChildByKey('skipped_dates').value);
	for (task in modProgrammDoc.programs){
		tasks_count++;
		
		r.SetProperty("name"+tasks_count,task.name);
		r.SetProperty("type"+tasks_count,common.exchange_object_types.GetChildByKey( task.type ).title);
		r.SetProperty("state"+tasks_count,common.learning_states.GetChildByKey( Int( task.state_id ) ).name);
		
		if (columns_count < tasks_count){
			columns_count++;
			addTaskColumn(columns_count);
		}
	}
	aRes.push(r);
}
return aRes;