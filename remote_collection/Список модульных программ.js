var oCollectionParams =
{
	paging: PAGING,
	sort: SORT,
	distincts: [],
	filters: []
}

try
{
	_DISTINCTS;
	if (_DISTINCTS == undefined || _DISTINCTS == null || _DISTINCTS == '')
		throw 'no filter';
	oCollectionParams.distincts = tools_web.parse_multiple_parameter(_DISTINCTS);
}catch(e){}

try
{
	_FILTERS;
	if (_FILTERS == undefined || _FILTERS == null || _FILTERS == '')
		throw 'no filter';

	oCollectionParams.filters = tools_web.parse_multiple_parameter(_FILTERS);
}catch(e){}

if( bAllowSelfAssignment == "true" || bAllowSelfAssignment == "false" )
{
	bAllowSelfAssignment = tools_web.is_true( bAllowSelfAssignment );
}
else
{
	bAllowSelfAssignment = null;
}

sXQueryQual = SCOPE_WVARS.GetOptProperty("FILTER", "");

if ( Return_data == null || Return_data == undefined)
{
	arrReturnData = [];
}
else
{
	arrReturnData = tools_web.parse_multiple_parameter( Return_data );
}

oRes = tools.call_code_library_method( "nlmk_libEducation", "get_compound_programs", [ OptInt( sObjectID ), tools_web.parse_multiple_parameter( iRoleID ), bAllowSelfAssignment, false, curUserID, oCollectionParams, sXQueryQual, sAccessType, sApplication, arrReturnData, SCOPE_WVARS.GetOptProperty( "APPLICATION") ] );

ERROR = oRes.error;
MESSAGE = tools.get_code_library_error_message( oRes, Env );
RESULT = oRes.array;
PAGING = oRes.paging;
DATA = oRes.data;