var result = [];

var skipDates = false;
var filterString= "";
var filterType = "";
var addOr = false;

if (OptInt(_CRITERIONS[0].value, null) != null){
	filterString+= " AND event_id = "+ Int(_CRITERIONS[0].value) + " ";
	skipDates = true;
}

if (OptInt(_CRITERIONS[1].value, null) != null){
	filterString+= " AND cps_id = "+ Int(_CRITERIONS[1].value);
	skipDates = true;
}

if (OptInt(_CRITERIONS[2].value, null) != null){
	filterString+= " AND edu_id = "+ Int(_CRITERIONS[2].value);
	skipDates = true;
}
if ( {PARAM4} != ''){
               var params = {PARAM4};
               params=params.split(',');
               var codes = '';
               for (param in params){
               codes+='\''+Trim(param)+'\', ';
               };
               codes = codes.slice(0,codes.length - 2) ;
               filterString+= " AND code in("+codes+")";
			   	skipDates = true;
}

if (!skipDates){
	if (OptDate({PARAM5}, null) != null){

		filterString+= " AND finish_date >= convert(datetime, '"+StrDate({PARAM5},false)+"',104)";
	}

	if (OptDate({PARAM6}, null) != null){

		filterString+= " AND finish_date <= convert(datetime, '"+StrDate({PARAM6},false)+"',104)";
	}
}
if (tools_web.is_true({PARAM7})){
	if (addOr)
		filterType += " OR "
	else {
		filterType += "AND ("
		addOr = true;
	}
	filterType+= " record_type = 'plan'";
}
if (tools_web.is_true({PARAM8})){
	if (addOr)
		filterType += " OR "
	else {
		filterType += "AND ("
		addOr = true;
	}
	filterType+= " record_type = 'course'";
}
if (tools_web.is_true({PARAM9})){
	if (addOr)
		filterType += " OR "
	else {
		filterType += "AND ("
		addOr = true;
	}
	filterType+= " record_type = 'event_result'";
}

if (filterType!="")
	filterType += ")";

var query = "sql: select
f_funcroute,
f_nameczeh,
f_codeczeh,
org_name,
region_name,
cluster_name,
code,
login,
fullname,
email,
Convert(NVARCHAR, birth_date,104)  'birth_date',
f_categ,
position_name,
f_lvlupr,
Convert(NVARCHAR, start_date,104)  'start_date',
Convert(NVARCHAR, finish_date,104)  'finish_date',
comment,
f_dateprotocol,
duration_fact,
duration_days_fact,
duration,
IIF (check_skipped = '+','+',null) 'check_skipped',
place,
event_name,
event_form,
event_region_name,
place_name,
edu_code,
edu_name,
edu_group,
l_login,
l_fullname,
cs_dismiss_date,
operator,
Convert(NVARCHAR, modification_date,104) 'modification_date',
IIF (record_type = 'event_result',event_code,null) 'event_code',
position_parent_name,
prog_name,
or_catalog,
education_org_name,
target_count,
res_count,
m_fullanme,
m_email,
event_type,
learnin_minute,
in_reserve,
reserve_position_name,
reserve_position_level,
cust_grade,
record_type
from sap_report
where  (notif_type = 'КУ' or  notif_type = 'KU')";

if(filterString != "")
	query+=filterString

if(filterType !="")
	query+=filterType;

//alert(query)
result = tools.xquery(query )
//alert("ArrayCount(result ) = " + ArrayCount(result ))
return result;