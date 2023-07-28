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

iEduMethodID = OptInt( iEduMethodID, OptInt(sEduMethodID) )

var iCurObjectID = OptInt(curObjectID);
if(iCurObjectID != undefined && tools_web.is_true(bUseObjectIDAsEduMethodID))
{
	iEduMethodID = iCurObjectID;
}

oRes = tools.call_code_library_method( "nlmk_libEducation", "GetEducationMethodCompoundProgramsNLMK", [ iEduMethodID, OptInt(sRoleID, OptInt(iRoleID)), SafeEval(bAllowSelfAssignment), curUserID, oCollectionParams ] );

ERROR = oRes.error;
MESSAGE = tools.get_code_library_error_message( oRes, Env );
RESULT = oRes.array;
PAGING = oRes.paging;
DATA = oRes.data;