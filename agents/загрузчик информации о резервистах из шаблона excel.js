function getFileURl() {
	try {
		// если агент выполняется на клиенте, то запросим файл
		sExcelFileUrl = Screen.AskFileOpen('', 'Выберите файл Excel');
	} catch (err) {
		// если агент выполняется на сервере, то берём путь к файлу из переменной
		if (StrCharCount(Param.SERVER_FILE_URL) == 0) {
			alert('ОШИБКА: не задан пусть к файлу на сервере в Переменной SERVER_FILE_URL.\nВыполнение Агента остановлено.');
			Cancel();
		}
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
		alert('ОШИБКА: невозможно получить доступ к файлу ' + sExcelFileUrl + '\nСкорее всего, файл открыт.\nЗакройте файл и повторите попытку.');
		Cancel();
	}

	aEntries = [];
	for (i = 1; i < ArrayCount(oSheet); i++) {
		aEntries.push({
			'person_code': String(oSheet[i][0]),
			'start_date': String(oSheet[i][1]),
			'include_reserve_date': String(oSheet[i][2]),
			'finish_date': String(oSheet[i][3]),
			'position_code': String(oSheet[i][4])
		})
	}
	return aEntries;
}

function fillPersonnelReserveCard(cardTe, data, personData) {
	start_date = OptDate(data.start_date);
	include_reserve_date = OptDate(data.include_reserve_date);
	finish_date = OptDate(data.finish_date);

	cardTe.person_id = personData.id;
	tools.common_filling("collaborator", cardTe, personData.id);

	if (start_date != undefined) {
		cardTe.start_date = start_date;
		cardTe.status = 'candidate'
	}

	if (include_reserve_date != undefined) {
		cardTe.include_reserve_date = include_reserve_date;
		cardTe.status = 'in_reserve'
	}

	if (finish_date != undefined) {
		cardTe.finish_date = finish_date;
		cardTe.status = 'left_reserve'
	}

	return cardTe;
}

function createCareerReserveCard(docPersonnelReserveId, personId, positionId) {
	docCareerReserve = OpenNewDoc('x-local://wtv/wtv_career_reserve.xmd');
	docCareerReserveTE = docCareerReserve.TopElem;
	docCareerReserveTE.personnel_reserve_id = docPersonnelReserveId;
	docCareerReserveTE.person_id = personId;
	tools.common_filling("collaborator", docCareerReserveTE, personId);
	docCareerReserveTE.position_type = 'position';
	docCareerReserveTE.position_id = positionId;

	docCareerReserve.BindToDb(DefaultDb);
	docCareerReserve.Save();


	alert(docCareerReserve.DocID)
	return docCareerReserve.DocID;
}


try {
	newDoc = false;
	fileUrl = getFileURl();
	data = getData(fileUrl);

	if (ArrayCount(data) == 0) {
		alert('Нет данных на обработку');
		Cancel();
	}

	for (info in data) {
		personData = ArrayOptFirstElem(XQuery("for $i in collaborators where $i/code = " + XQueryLiteral(info.person_code) + " return $i"));
		personnelReserveData = ArrayOptFirstElem(XQuery("for $i in personnel_reserves where $i/person_id = " + XQueryLiteral(personData.id) + " return $i"));
		positionData = ArrayOptFirstElem(XQuery("for $i in positions where $i/code = " + XQueryLiteral(info.position_code) + " return $i"))

		if (personData == undefined) {
			alert("Нет пользователя с кодом " + info.person_code);
			continue;
		}

		if (Trim(info.start_date) == '' && Trim(info.include_reserve_date) == '' && Trim(info.finish_date) == '') {
			alert("Для пользователя с кодом " + info.person_code + " не указана ни одни из дат");
			continue;
		}

		if (Trim(info.position_code) == '' || positionData == undefined) {
			alert("Для пользователя с кодом " + info.person_code + " не указана должность или должность с кодом " + info.position_code + " не существует");
			continue;
		}

		if (personnelReserveData == undefined) {

			alert('Создаем')

			docPersonnelReserve = OpenNewDoc('x-local://wtv/wtv_personnel_reserve.xmd');
			newDoc = true;

		} else {
			alert('Перезаписываем')

			docPersonnelReserve = tools.open_doc(personnelReserveData.id);
		}

		docTePersonnelReserve = docPersonnelReserve.TopElem;

		fillPersonnelReserveCard(docPersonnelReserve.TopElem, info, personData);

		if (tools_web.is_true(newDoc)) {
			docPersonnelReserve.BindToDb(DefaultDb);
		}

		docPersonnelReserve.Save();

		careerReserveData = ArrayOptFirstElem(XQuery("for $i in career_reserves where $i/personnel_reserve_id = " + XQueryLiteral(docPersonnelReserve.DocID) + " and $i/position_id = " + XQueryLiteral(positionData.id) + " return $i"));

		if (careerReserveData != undefined) {
			alert("Для пользователя с кодом " + info.person_code + " уже есть карточка развития карьеры для должности" + positionData.name + ". Карточка развития карьеры не будет создана");
			continue;
		}

		createCareerReserveCard(docPersonnelReserve.DocID, personData.id, positionData.id);


	}

} catch (err) {
	alert(err);
}