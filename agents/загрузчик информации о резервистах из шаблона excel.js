function Log(log_file_name, message) {
	if (recordLogs) {
		LogEvent(log_file_name, message);
	}
}

function getNullPersonCode(_personCode) {
	while (StrCharCount(_personCode) < 8) {
		_personCode = '0' + _personCode
	}
	return _personCode;
}

function getFileURl(sExcelFileUrl) {
	try {
		// если агент выполняется на клиенте, то запросим файл
		sExcelFileUrl = Screen.AskFileOpen('', 'Выберите файл Excel');
	} catch (err) {
		// если агент выполняется на сервере, то берём путь к файлу из переменной
		if (StrCharCount(Param.SERVER_FILE_URL) == 0) {
			Log(logName, "ОШИБКА: не задан пусть к файлу на сервере в Переменной SERVER_FILE_URL.\nВыполнение Агента остановлено.")
			alert('ОШИБКА: не задан пусть к файлу на сервере в Переменной SERVER_FILE_URL.\nВыполнение Агента остановлено.');
			Cancel();
		}
		deleteFileFromServer = true;
		sExcelFileUrl = Trim(Param.SERVER_FILE_URL);
	}
	return sExcelFileUrl;
};

function getData(fileUrl) {
	try {
		docFile = OpenDoc(fileUrl, 'format=excel');
		oSheet = ArrayFirstElem(docFile.TopElem);
	}
	catch (err) {
		Log(logName, "ОШИБКА: невозможно получить доступ к файлу ' + sExcelFileUrl + '\nСкорее всего, файл открыт.\nЗакройте файл и повторите попытку.")
		alert('ОШИБКА: невозможно получить доступ к файлу ' + sExcelFileUrl + '\nСкорее всего, файл открыт.\nЗакройте файл и повторите попытку.');
		Cancel();
	}

	aEntries = [];
	for (i = 2; i < ArrayCount(oSheet); i++) {
		if (oSheet[i][0] == "" || oSheet[i][0] == undefined || OptInt(oSheet[i][0]) == undefined) {
			continue
		}

		aEntries.push({
			'person_code': getNullPersonCode(oSheet[i][0]),
			'start_date': Trim(oSheet[i][1]),
			'finish_date': Trim(oSheet[i][2]),
			'status': Trim(oSheet[i][19]),
			'end_status': Trim(oSheet[i][20]),
			'position_code': Trim(oSheet[i][11])
		})
	}
	return aEntries;
}

function fillPersonnelReserveCard(cardTe, data, personData, states) {

	start_date = OptDate(data.start_date);
	finish_date = OptDate(data.finish_date);
	state = Trim(data.status);
	cardTe.person_id = personData.id;
	tools.common_filling("collaborator", cardTe, personData.id);

	if (start_date != undefined) {
		cardTe.start_date = start_date;
		cardTe.status = 'candidate'
	}


	if (finish_date != undefined && (state == states[0] || state == states[1])) {
		cardTe.include_reserve_date = finish_date;
		cardTe.status = 'in_reserve'
	}

	if (finish_date != undefined && state == states[2]) {
		cardTe.finish_date = finish_date;
		cardTe.status = 'left_reserve'
	}

	if (Trim(data.end_status) != '') {
		cardTe.custom_elems.ObtainChildByKey('f_1t2t').value.Value = data.end_status;
	}

	return cardTe;
}

function createCareerReserveCard(docPersonnelReserveId, personId, positionId, is_finished, startDate, finishDate) {
	Log(logName, "create-start")
	Log(logName, "docPersonnelReserveId == "+ docPersonnelReserveId)
	Log(logName, "personId =="+ personId)
	Log(logName, "positionId == "+ positionId)
	Log(logName, "is_finished =="+is_finished)
	Log(logName, "startDate == "+ startDate)
	Log(logName, "finishDate ==" + finishDate)
	Log(logName, "OptDate(startDate) == ") +OptDate(startDate)
	Log(logName, "OptDate(finishDate) == ") +OptDate(finishDate)
	docCareerReserve = OpenNewDoc('x-local://wtv/wtv_career_reserve.xmd');
	docCareerReserveTE = docCareerReserve.TopElem;
	docCareerReserveTE.personnel_reserve_id = docPersonnelReserveId;
	docCareerReserveTE.person_id = personId;
	tools.common_filling("collaborator", docCareerReserveTE, personId);
	docCareerReserveTE.position_type = 'position';
	docCareerReserveTE.position_id = positionId;
	docCareerReserve.TopElem.start_date = OptDate(startDate);
	docCareerReserve.TopElem.finish_date = tools_web.is_true(is_finished) ? OptDate(finishDate) : null;
	docCareerReserveTE.status = tools_web.is_true(is_finished) ? 'passed' : null;

	docCareerReserve.BindToDb(DefaultDb);
	docCareerReserve.Save();

	Log(logName, "finish")
	return docCareerReserve.DocID;
}

function updateCareerReserveCard(careerReserveId, is_finished, startDate, finishDate) {
	docCareerReserve = tools.open_doc(careerReserveId);
	docCareerReserve.TopElem.start_date = OptDate(startDate);
	docCareerReserve.TopElem.finish_date = tools_web.is_true(is_finished) ? OptDate(finishDate) : null;
	docCareerReserve.TopElem.status = tools_web.is_true(is_finished) ? 'passed' : null;

	docCareerReserve.Save();

	return docCareerReserve.DocID;
}

try {
	var sExcelFileUrl = undefined;
	var deleteFileFromServer = false;
	var logName = Trim(Param.logs_name) != '' ? Param.logs_name : "career_reserve_import_excel";
	var recordLogs = Param.record_logs;

	if (recordLogs) {
		EnableLog(logName, true)
	}

	states = [
		'состоит в резерве',
		'назначен на целевую должность',
		'исключен из резерва'
	];
	newDoc = false;
	fileUrl = getFileURl(sExcelFileUrl);
	data = getData(fileUrl);

	Log(logName, "Агент начал работу");
	if (ArrayCount(data) == 0) {
		Log(logName, "Нет данных на обработку");
		Cancel();
	}

	Log(logName, "Всего данных на обработку " + ArrayCount(data));

	for (info in data) {
		personData = ArrayOptFirstElem(XQuery("for $i in collaborators where $i/login = " + XQueryLiteral(info.person_code) + " return $i"));

		if(personData == undefined) {
			Log(logName, "Не можем найти пользователя по коду: " + info.person_code + " Возможно поле логин пустое, так как он уволен");
			continue;
		}
		
		personnelReserveData = ArrayOptFirstElem(XQuery("for $i in personnel_reserves where $i/person_id = " + XQueryLiteral(personData.id) + " return $i"));
		positionData = ArrayOptFirstElem(XQuery("for $i in positions where $i/code = " + XQueryLiteral(info.position_code) + " return $i"))

		if (personData == undefined) {
			Log(logName, "Нет пользователя с кодом " + info.person_code);
			continue;
		}

		Log(logName, "Обработка сотрудника с логином : " + info.person_code);
		if (info.start_date == '' && info.finish_date == '') {
			Log(logName, "Для пользователя с кодом " + info.person_code + " не указана ни одни из дат");
			continue;
		}

		if (personnelReserveData == undefined) {
			Log(logName, "Создаем");

			docPersonnelReserve = OpenNewDoc('x-local://wtv/wtv_personnel_reserve.xmd');
			newDoc = true;

		} else {
			Log(logName, "Перезаписываем")

			docPersonnelReserve = tools.open_doc(personnelReserveData.id);
		}

		docTePersonnelReserve = docPersonnelReserve.TopElem;

		fillPersonnelReserveCard(docPersonnelReserve.TopElem, info, personData, states);

		if (tools_web.is_true(newDoc)) {
			docPersonnelReserve.BindToDb(DefaultDb);
		}

		if (positionData != undefined) {
			careerReserveData = ArrayOptFirstElem(XQuery("for $i in career_reserves where $i/personnel_reserve_id = " + XQueryLiteral(docPersonnelReserve.DocID) + " and $i/position_id = " + XQueryLiteral(positionData.id) + " return $i"));
			if (careerReserveData != undefined) {
				Log(logName, "Для пользователя с кодом " + info.person_code + " уже есть карточка развития карьеры для должности " + positionData.name + ". Карточка будет обновлена")
				updateCareerReserveCard(careerReserveData.id, info.status == states[1], info.start_date, info.finish_date);
			} else {
				createCareerReserveCard(docPersonnelReserve.DocID, personData.id, positionData.id, info.status == states[1], info.start_date, info.finish_date);
			}
		} else {
			Log(logName, "Нет должности с кодом " + info.position_code);
			docPersonnelReserve.TopElem.comment = "Нет должности с кодом: " + info.position_code
		}

		docPersonnelReserve.Save();

	}

	if (tools_web.is_true(deleteFileFromServer)) {
		Log(logName, "Удалям файл");
		DeleteDoc(fileUrl, true);
	}
	Log(logName, "Агент завершил работу");
} catch (err) {
	Log(logName, "Ошибка: " + err);
}