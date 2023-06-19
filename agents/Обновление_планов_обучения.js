var education_plans = ArraySelectAll(XQuery('for $i in education_plans where $i/state_id < 2 return $i/Fields("id")'));

for (education_plan in education_plans) {
    plan_doc = tools.open_doc(education_plan.id);

    tools.call_code_library_method('libEducation', 'update_education_plan_date', [education_plan.id, plan_doc]);
    tools.call_code_library_method('libEducation', 'update_education_plan', [education_plan.id, plan_doc, plan_doc.TopElem.person_id, false]);
}
