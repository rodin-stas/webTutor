EnableLogExt('update_learning_task_from_education_plan', 'life-time=day');
LogEvent('update_learning_task_from_education_plan', 'Агент START');

//разберемся с переменными. OBJECTS_ID_STR - содержит параметры предыдущего агента
cnt = 0; 
educationPlans = []
my_arr = OBJECTS_ID_STR.split(';');
my_arr_cnt = ArrayCount(my_arr);
//уберем последний пустой элемент
my_arr.splice(ArrayCount(my_arr)-1,1);

//отделим мух от котлет
_selected_compound_program_id = my_arr[0];
_selected_learning_task_id = my_arr[1];
my_arr.splice(0,2); //В my_arr остались только id групп

LogEvent('update_learning_task_from_education_plan', '_selected_compound_program_id - ' + _selected_compound_program_id);
LogEvent('update_learning_task_from_education_plan', '_selected_learning_task_id - ' + _selected_learning_task_id);
LogEvent('update_learning_task_from_education_plan', 'Группы - ' + my_arr.join(","));

educationPlans = ArraySelectAll(XQuery('for $elem in education_plans where group_id IN ('+ my_arr.join(",") + ')  and compound_program_id = ' + XQueryLiteral(_selected_compound_program_id) + ' return $elem/Fields("id")'));

LogEvent('update_learning_task_from_education_plan', 'Всего планов на обработку ' + ArrayCount(educationPlans));

for(educationPlan in educationPlans) {	
	LogEvent('update_learning_task_from_education_plan', 'Обрабатываем план с id = ' + educationPlan.id);
	educationPlanDoc = tools.open_doc(OptInt(educationPlan.id));
	educationPlanDocTe = educationPlanDoc.TopElem;

	learning_task = educationPlanDocTe.programs.GetOptChildByKey(OptInt(_selected_learning_task_id), 'object_id')

	if(learning_task == undefined) {
		LogEvent('update_learning_task_from_education_plan', 'В плане нет задачи с id = ' +_selected_learning_task_id);
		continue;
	}
		
	if(learning_task.state_id > 1) {
		LogEvent('update_learning_task_from_education_plan', 'Задача в этом плане завршена(статус > 1)= ' +_selected_learning_task_id);
		continue;
	} 
	
	if(learning_task.result_object_id.HasValue) {
		learningTaskResultDoc = tools.open_doc(OptInt(learning_task.result_object_id));
		learningTaskResultDoc.TopElem.status_id = 'success';
		learningTaskResultDoc.TopElem.finish_date = CurDate;
		learningTaskResultDoc.Save();	
		tools.call_code_library_method( 'libEducation', 'update_education_plan', [ educationPlan.id, null, educationPlanDocTe.person_id ] );	
		LogEvent('update_learning_task_from_education_plan', "Завершили задачу");
	} else {
		LogEvent('update_learning_task_from_education_plan', "Нет назначенного задания");
	}

	
}


LogEvent('update_learning_task_from_education_plan', 'Агент FINISH');