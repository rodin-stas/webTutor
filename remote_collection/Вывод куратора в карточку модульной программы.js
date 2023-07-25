RESULT= [];
elem = ArrayOptFirstElem(XQuery('for $elem in compound_programs where $elem/id = ' + curObject.id + ' return $elem'));
if(elem != undefined) {
	elemDoc=tools.open_doc(elem.id).TopElem
	comment_cur = elemDoc.comment;
	
	if( elemDoc.comment != undefined && elemDoc.comment.HasValue){
	
		RESULT.push({"id": elem.id, "comment": comment_cur});
	
	}
}

