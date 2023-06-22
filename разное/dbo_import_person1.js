function _get_collaborator(id) {

	var docCollaborator, iID = OptInt(code);

	if (iID != undefined) {

		docCollaborator = ArrayOptFirstElem(tools.xquery("for $elem in collaborators where $elem/id = " +

			iID + " return $elem/id,$elem/__data"));

		if (docCollaborator != undefined) {

			iID = docCollaborator.PrimaryKey.Value;

			docCollaborator = OpenDoc(UrlFromDocID(iID));

		}

		else

			iID = undefined;

	}

	if (iID == undefined) {

		docCollaborator = ArrayOptFirstElem(tools.xquery("for $elem in collaborators where $elem/code = " +

			XQueryLiteral(code) + " return $elem/id,$elem/__data"));

		if (docCollaborator != undefined) {

			iID = docCollaborator.PrimaryKey.Value;

			docCollaborator = OpenDoc(UrlFromDocID(iID));

		}

		else {

			docCollaborator = undefined;

		}

	}

	return docCollaborator;

}

function Get_info1(code) {

	if (tools_library.string_is_null_or_empty(code))

		throw "Empty code";


	return "WORK";
}

function Get_test1(code) {

	if (tools_library.string_is_null_or_empty(code))

		throw "Empty code";


	return "WORK2";
}