if(LdsIsClient) {
	alert('Выберете курс, который хотите назначить');
	
	dlgDoc = OpenDoc( 'x-local://wtv/ms_dlg_object_select.xml' );
	dlgDoc.TopElem.catalog_name = 'course';
	Screen.ModalDlg( dlgDoc );

	_selected_course_id = dlgDoc.TopElem.object_id;
	
} else {
	Cancel();
}

t = _selected_course_id + ';';

arr_objects = [];

if(OBJECTS_ID_STR!="" && OBJECTS_ID_STR!=undefined) {
	arr_objects = OBJECTS_ID_STR.split(';')
} else if (OBJECT_ID!="" && OBJECT_ID!=undefined) {
	arr_objects.push(OBJECT_ID);
}


if(OBJECTS_ID_STR=="" || OBJECTS_ID_STR==undefined){
	alert('Что-то пошло не так!\nАгент запускается правой кнопкой мыши над Сотрудник(ом/ами)');
	Cancel();
}

alert('Курс назначен!');

for(_arr_objects in arr_objects){
	if(_arr_objects!= undefined && _arr_objects != '') {
		t+=_arr_objects
		t+=';';
	}
}

alert(t)

CallServerMethod('tools', 'start_agent', [7254929074501348224, '', t]);