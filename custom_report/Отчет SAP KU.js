var result = [];

var skipDates = false;
var filterString = "";
var filterType = "";
var addOr = false;

// alert("Тест отчета")
// alert("_CRITERIONS[0] = "+ _CRITERIONS[0].value)
// alert("_CRITERIONS[1] = "+ _CRITERIONS[1].value)
// alert("_CRITERIONS[2] = "+ _CRITERIONS[2].value)
// alert("_CRITERIONS[3] = "+ _CRITERIONS[3].value)
// alert("_CRITERIONS[4] = "+ _CRITERIONS[4].value)
// alert("_CRITERIONS[5] = "+ _CRITERIONS[5].value)
// alert("_CRITERIONS[6] = "+ _CRITERIONS[6].value)
// alert("_CRITERIONS[7] = "+ _CRITERIONS[7].value)
// alert("_CRITERIONS[8] = "+ _CRITERIONS[8].value)


if (OptInt(_CRITERIONS[0].value, null) != null) {
	filterString += " AND [t1].event_id = " + SqlLiteral(_CRITERIONS[0].value) + " ";
	//skipDates = true;
}

if (OptInt(_CRITERIONS[1].value, null) != null) {
	filterString += " AND [t1].cps_id = " + SqlLiteral(_CRITERIONS[1].value);
	//skipDates = true;
}

if (OptInt(_CRITERIONS[2].value, null) != null) {
	filterString += " AND [t1].edu_id = " + SqlLiteral(_CRITERIONS[2].value);
	//skipDates = true;
}

if (_CRITERIONS[3].value != '') {
	var params = {PARAM3};
	params=params.split(',');
	var codes = '';
	for (param in params){
	codes+='\''+Trim(param)+'\', ';
	};
	codes = codes.slice(0,codes.length - 2) ;
	filterString+= " AND [t1].code in("+codes+")";
		skipDates = true;
}

if (!skipDates) {
	if (OptDate(_CRITERIONS[4].value, null) != null) {
		filterString += " AND [t1].start_date >= convert(datetime, '" + _CRITERIONS[4].value + "',104)";
	}

	if (OptDate(_CRITERIONS[5].value, null) != null) {
		filterString += " AND [t1].finish_date <= convert(datetime, '" + _CRITERIONS[5].value + "',104)";
	}
}

if (tools_web.is_true(_CRITERIONS[6].value)) {
	if (addOr)
		filterType += " OR "
	else {
		filterType += "AND ("
		addOr = true;
	}
	filterType += " [t1].record_type = 'course'";
}
if (tools_web.is_true(_CRITERIONS[7].value)) {
	if (addOr)
		filterType += " OR "
	else {
		filterType += "AND ("
		addOr = true;
	}
	filterType += " [t1].record_type = 'event_result'";
}

if (filterType != "")
	filterType += ")";

if (OptInt(_CRITERIONS[8].value, null) != null) {
	filterString += " AND [t1].[person_id] = " + SqlLiteral(_CRITERIONS[8].value);
}

var query = "sql: select
	[t1].f_funcroute,
	[t1].f_nameczeh,
	[t1].f_codeczeh,
	[t1].org_name,
	[t1].region_name,
	[t1].cluster_name,
	[t1].code,
	[t1].login,
	[t1].fullname,
	[t1].email,
	Convert(NVARCHAR, [t1].birth_date, 104)  'birth_date',
	[t1].f_categ,
	[t1].position_name,
	[t1].f_lvlupr,
	Convert(NVARCHAR, [t1].start_date, 104)  'start_date',
	Convert(NVARCHAR, [t1].finish_date, 104)  'finish_date',
	[t1].comment,
	[t1].f_dateprotocol,
	[t1].duration_fact,
	[t1].duration_days_fact,
	[t1].duration,
	IIF([t1].check_skipped = '+', '+', null) 'check_skipped',
	[t1].place,
	[t1].event_name,
	[t1].event_form,
	[t1].event_region_name,
	[t1].place_name,
	[t1].edu_code,
	[t1].edu_name,
	[t1].edu_group,
	[t1].l_login,
	[t1].l_fullname,
	[t1].cs_dismiss_date,
	[t1].operator,
	Convert(NVARCHAR, [t1].modification_date, 104) 'modification_date',
	IIF([t1].record_type = 'event_result', [t1].event_code, null) 'event_code',
	[t1].position_parent_name,
	[t1].prog_name,
	[t1].or_catalog,
	[t1].education_org_name,
	[t1].target_count,
	[t1].res_count,
	[t1].m_fullanme,
	[t1].m_email,
	[t1].event_type,
	[t1].learnin_minute,
	[t1].in_reserve,
	[t1].reserve_position_name,
	[t1].reserve_position_level,
	[t1].cust_grade,
	[t1].record_type
	from sap_report[t1]
WHERE([t1].notif_type = 'КУ' or [t1].notif_type = 'KU' or [t1].notif_type = 'CU') ";

if (filterString != "")
	query += filterString

if (filterType != "")
	query += filterType;

alert(query)
result = tools.xquery(query)
//alert("ArrayCount(result ) = " + ArrayCount(result ))
return result;