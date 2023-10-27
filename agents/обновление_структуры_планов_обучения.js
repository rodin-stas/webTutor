function Log(log_file_name, message) {
	if (recordLogs) {
		LogEvent(log_file_name, message);
	}
}

var logName = "update_education_plans";
var recordLogs = Param.record_logs;
var count = 0;

if (recordLogs) {
    EnableLog ( logName, true )
}

Log(logName, "Агент начал работу");
Log(logName, "Param.compound_program = " + OptInt(Param.compound_program) );

var educationPlans = ArraySelectAll(XQuery('for $elem in education_plans where $elem/state_id < 2 and $elem/compound_program_id = ' + XQueryLiteral( OptInt(Param.compound_program) ) + ' return $elem/Fields("id")'));

Log(logName, "Всего планов на обработку: " + ArrayCount(educationPlans));

if(ArrayCount(educationPlans) > 0) {
    try {
        for(educationPlan in educationPlans) {
            educationPlanDoc = tools.open_doc(OptInt(educationPlan.id));
            educationPlanTE = educationPlanDoc.TopElem;

            tools.call_code_library_method( 'nlmk_education_plans', 'updateStructureEducationPlan', [ educationPlanTE, Param.compound_program ] );
            tools.call_code_library_method( 'nlmk_education_plans', 'rereadProgram', [ educationPlanTE.programs, educationPlanTE.person_id, educationPlanTE.id ] );
            tools.call_code_library_method( 'libEducation', 'update_education_plan_date', [ educationPlanTE.id, educationPlanDoc ] );
            tools.call_code_library_method( 'libEducation', 'update_education_plan', [ educationPlanTE.id, educationPlanDoc, educationPlanTE.person_id, false ] );
            count++

            Log(logName, "Обработали план с id: " + educationPlan.id);
            educationPlanDoc.Save();
         }
alert("qqqq")
    } catch (err) {
        Log(logName, "Ошибка! при обработке плана с id:" + educationPlan.id);
        Log(logName, "Текст ошибки: " + err);
        alert("err == "+ err)
    }
     
    }
    ArrayCount(ArraySelect(teEducationPlan.programs, "This.type == 'education_method' && This.state_id == 0 && DateNewTime(This.plan_date) == DateNewTime(Date())  && This.custom_elems.ObtainChildByKey('notification').value.Value != 'true'")) >=1

Log(logName, "Планов обработано: " + count);
Log(logName, "Агент завершил работу ");