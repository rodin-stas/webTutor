if(LdsIsClient) {
	alert('Выберете модульную программу, по которой созданы планы обучения.');
	
	dlgDoc = OpenDoc( 'x-local://wtv/ms_dlg_object_select.xml' );
	dlgDoc.TopElem.catalog_name = 'compound_program';
	Screen.ModalDlg( dlgDoc );

	_selected_compound_program_id = dlgDoc.TopElem.object_id;

	if(_selected_compound_program_id != "" && _selected_compound_program_id != undefined) {
		alert('Выберете задание, которое необходимо завершить в планах обучения.');

		dlgDoc = OpenDoc( 'x-local://wtv/ms_dlg_object_select.xml' );
		dlgDoc.TopElem.catalog_name = 'learning_task';
		Screen.ModalDlg( dlgDoc );

		_selected_learning_task_id = dlgDoc.TopElem.object_id;
	}
	
} else {
	Cancel();
}

t = _selected_compound_program_id + ';' + _selected_learning_task_id+ ';';

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

alert('Проверьте планы обучения!');

for(_arr_objects in arr_objects){
	if(_arr_objects!= undefined && _arr_objects != '') {
		t+=_arr_objects
		t+=';';
	}
}

CallServerMethod('tools', 'start_agent', [7244838637305159647, '', t]);