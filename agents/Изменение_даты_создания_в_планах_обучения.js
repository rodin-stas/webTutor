var group = OptInt(Param.group);
var compound_program = OptInt(Param.compound_program);
var new_date = OptDate(Param.new_date);
var end_date = OptDate(Param.new_date)
var count = 0;

var program_info = ArrayOptFirstElem(XQuery("sql: \n\
	select \n\
		cps.id,\n\
		cps.name,\n\
		cpext.with_cancel,\n\
		cps.duration,\n\
		cpext.curator\n\
	from compound_programs cps\n\
	inner join compound_programs_ext cpext on cpext.id = cps.id \n\
	where cps.id = " + compound_program
));

var education_plans = ArraySelectAll(XQuery("for $i in education_plans where $i/group_id = " + group + " and $i/compound_program_id = " + compound_program + " return $i"));

alert("Всего планов на обработку: " + ArrayCount(education_plans))

for (plan in education_plans) {
	try {

		planDoc = tools.open_doc(plan.id);

		planDoc.TopElem.create_date = new_date;
		planDoc.TopElem.plan_date = new_date;
		planDoc.TopElem.last_activity_date = new_date;
		planDoc.TopElem.doc_info.creation.date = new_date;

		if (OptInt(program_info.duration) != undefined) {
			end_date = DateOffset(new_date, program_info.duration * 24 * 60 * 60);
		}

		planDoc.TopElem.finish_date = end_date;

		for (program in planDoc.TopElem.programs) {
			program.create_date = new_date;
			program.plan_date = new_date;

			if (program.days.HasValue) {
				program.finish_date = DateOffset(new_date, program.days * 24 * 60 * 60)
			}
		}
		planDoc.Save();
		tools.call_code_library_method('libEducation', 'update_education_plan_date', [plan.id, planDoc]);

	} catch (err) {
		alert(err)
	}
}