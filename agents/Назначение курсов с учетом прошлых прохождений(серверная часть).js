//разберемся с переменными. OBJECTS_ID_STR - содержит параметры предыдущего агента
cnt = 0; 
// str = "7120193383810781664;7224123696697131795"
my_arr = OBJECTS_ID_STR.split(';');
alert(ArrayCount(my_arr))

//отделим мух от котлет
_selected_course_id = OptInt(my_arr[0]);
my_arr.splice(0,1); //В my_arr остались только id групп


rereadDate = undefined;

courseDoc = OpenDoc(UrlFromDocID(_selected_course_id));
courseTE = courseDoc.TopElem;

if (courseTE.custom_elems.ChildByKeyExists("reread") && courseTE.custom_elems.ObtainChildByKey("reread").value == 'true') {

	rereadDate = OptDate(DateOffset(Date(), 1000000 * 86400 * (-1)))
	if (courseTE.custom_elems.ChildByKeyExists("reread_days") && OptInt(courseTE.custom_elems.ObtainChildByKey("reread_days").value) != undefined) {

		rereadDate = OptDate(DateOffset(Date(), OptInt(courseTE.custom_elems.ObtainChildByKey("reread_days").value, 0) * 86400 * (-1)))
	}

}

for(person in my_arr) {	

	if(rereadDate != undefined) {
		activate_course = tools.activate_course_to_person( OptInt(person),  OptInt(_selected_course_id), null, null, null,null, null, rereadDate);
	} else{
		activate_course = tools.activate_course_to_person( OptInt(person),  OptInt(_selected_course_id), null, null, null);
	}
	
}