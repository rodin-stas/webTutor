// коды кастомных полей берём из переменных Агента

if ((Param.result_type_variants == 'only_good') && ((Param.good_event_result_type == '') || (Param.date_of_protocol_of_event_good_result_custom_field_code == '') || (Param.number_of_protocol_of_event_good_result_custom_field_code == '')))
{
	alert('Выбрано Тип результата будет только Сдано, но не заданы коды всех Переменных Агента: good_event_result_type, date_of_protocol_of_event_good_result_custom_field_code, number_of_protocol_of_event_good_result_custom_field_code.\nВыполнение Агента остановлено.');
	Cancel();
}

if ((Param.result_type_variants == 'good_and_bad') && ((Param.good_event_result_type == '') || (Param.date_of_protocol_of_event_good_result_custom_field_code == '') || (Param.number_of_protocol_of_event_good_result_custom_field_code == '') || (Param.bad_event_result_type == '') || (Param.date_of_protocol_of_event_bad_result_custom_field_code == '') || (Param.number_of_protocol_of_event_bad_result_custom_field_code == '')))
{
	alert('Выбрано Тип результата может быть Сдано и Не сдано, но не заданы коды всех Переменных Агента: good_event_result_type, date_of_protocol_of_event_good_result_custom_field_code, number_of_protocol_of_event_good_result_custom_field_code, bad_event_result_type, date_of_protocol_of_event_bad_result_custom_field_code, number_of_protocol_of_event_bad_result_custom_field_code.\nВыполнение Агента остановлено.');
	Cancel();
}

if ((Param.result_type_variants == 'good_and_bad_and_course')
 && ((Param.good_event_result_type == '') 
 || (Param.date_of_protocol_of_event_good_result_custom_field_code == '') 
 || (Param.number_of_protocol_of_event_good_result_custom_field_code == '') 
 || (Param.bad_event_result_type == '') 
 || (Param.date_of_protocol_of_event_bad_result_custom_field_code == '') 
 || (Param.number_of_protocol_of_event_bad_result_custom_field_code == '')
 || (Param.course_event_result_type == '')
 || (Param.date_of_protocol_of_event_course_result_custom_field_code == '') 
 || (Param.number_of_protocol_of_event_course_result_custom_field_code == '')
 ))
{
	alert('Выбрано Тип результата может быть Сдано, Не сдано и Пройдено курсовое обучение, но не заданы коды всех Переменных Агента: good_event_result_type, date_of_protocol_of_event_good_result_custom_field_code, number_of_protocol_of_event_good_result_custom_field_code, bad_event_result_type, date_of_protocol_of_event_bad_result_custom_field_code, number_of_protocol_of_event_bad_result_custom_field_code, course_event_result_type, date_of_protocol_of_event_course_result_custom_field_code, number_of_protocol_of_event_course_result_custom_field_code \nВыполнение Агента остановлено.');
	Cancel();
}
// Получим переменные из Переменных Агента
_good_event_result_type_id = OptInt(Param.good_event_result_type);
_date_of_protocol_of_event_good_result_custom_field_code = Param.date_of_protocol_of_event_good_result_custom_field_code;
_number_of_protocol_of_event_good_result_custom_field_code = Param.number_of_protocol_of_event_good_result_custom_field_code;
_bad_event_result_type_id = OptInt(Param.bad_event_result_type);
_date_of_protocol_of_event_bad_result_custom_field_code = Param.date_of_protocol_of_event_bad_result_custom_field_code;
_number_of_protocol_of_event_bad_result_custom_field_code = Param.number_of_protocol_of_event_bad_result_custom_field_code;

_course_event_result_type_id = OptInt(Param.course_event_result_type);
_date_of_protocol_of_event_course_result_custom_field_code = Param.date_of_protocol_of_event_course_result_custom_field_code;
_number_of_protocol_of_event_course_result_custom_field_code = Param.number_of_protocol_of_event_course_result_custom_field_code;

// зададим переменную - удалять ли файл с сервера
_delete_file_from_server = 'No'; // изначально она No

/**
 * @description: открытие файла excel и получение данных с первого листа
 * @return: (Array) - двумерный массив данных с первого листа excel
*/
sExcelFileUrl = undefined;
function getDataFiles()
	{
		try
			{
				// если агент выполняется на клиенте, то запросим файл
				sExcelFileUrl = Screen.AskFileOpen( '', 'Выберите файл Excel' );
			}
		catch(err)
			{
				// если агент выполняется на сервере, то берём путь к файлу из переменной
				if (StrCharCount(Param.SERVER_FILE_URL) == 0)
				{
					alert( 'ОШИБКА: не задан пусть к файлу на сервере в Переменной SERVER_FILE_URL.\nВыполнение Агента остановлено.');
					Cancel();
				}
				sExcelFileUrl = Trim(Param.SERVER_FILE_URL);
				_delete_file_from_server = 'Yes'; // меняем переменную удаления файла с сервера на Yes
			}

		try
			{
				docFile = OpenDoc( sExcelFileUrl, 'format=excel' );
				oSheet = ArrayFirstElem( docFile.TopElem );
			}
		catch(err)
			{
				alert( 'ОШИБКА: невозможно получить доступ к файлу ' + sExcelFileUrl + '\nСкорее всего, файл открыт.\nЗакройте файл и повторите попытку.');
				Cancel();
			}

		return oSheet;
	}

/// Получаем массив данных из файла и преобразуем в полноценный массив объектов
aData = getDataFiles();
aEntries = new Array();

for ( i = 1; i < ArrayCount( aData ); i++ )
	{
		aEntries.push({
			'event_id': String( aData[i][0] ),
			'person_tub_number': String( aData[i][1] ),
			'event_result_type': String( aData[i][2] ),
			'number_of_protocol': String( aData[i][3] ),
			'date_of_protocol': String( aData[i][4] )
		})
	}
aData = [];

// функция выделяет значения атрибута, указанного в аргументе
ArrayEvent_ids = ArrayExtract( aEntries, "event_id" );
ArrayPerson_tub_numbers = ArrayExtract( aEntries, "person_tub_number" );
ArrayEvent_result_types = ArrayExtract( aEntries, "event_result_type" );
ArrayNumber_of_protocols = ArrayExtract( aEntries, "number_of_protocol" );
ArrayDate_of_protocols = ArrayExtract( aEntries, "date_of_protocol" );

sCreatedCategoryIDs = ''; // переменная, коллекционирующая созданные категории (id), пока не используем, это задел на будущее, вдруг потребуется проверка, была ли категория создана ренее или в рамках этого агента

sLog = '' // накапливаемое сообщение
sItog = '' // итоговое сообщение

for (i = 0; i < ArrayCount(ArrayEvent_ids); i++)
{
	if (StrCharCount(ArrayEvent_ids[i]) != 0)
	{
		// отберём мероприятия по ID
		_ArrayEvents = ArrayDirect(XQuery("for $elem in events where $elem/id = " + OptInt(ArrayEvent_ids[i]) + " return $elem"));
		if (ArrayOptFirstElem(_ArrayEvents) != undefined)
		{
			if (StrCharCount(ArrayPerson_tub_numbers[i]) != 0)
			{
				// табельный номер сотрудника - в системе это login
				_ArrayPersons = ArrayDirect(XQuery("for $elem in collaborators where $elem/login = '" + Trim(ArrayPerson_tub_numbers[i]) + "' return $elem"));
				if (ArrayOptFirstElem(_ArrayPersons) != undefined)
				{
					if (ArrayCount(_ArrayPersons) == 1) // если найдено более двух сотрудников
					{
						// проверим Тип результата мероприятия
						if (StrCharCount(ArrayEvent_result_types[i]) != 0)
						{
							// Тип результата мероприятия
							switch(StrLowerCase(Trim(ArrayEvent_result_types[i]))) {
								case 'сдано' :
									_event_result_type_id = _good_event_result_type_id;
									_date_of_protocol_of_event_result_custom_field_code = _date_of_protocol_of_event_good_result_custom_field_code;
									_number_of_protocol_of_event_result_custom_field_code = _number_of_protocol_of_event_good_result_custom_field_code;
									break;
								case 'не сдано' :
									_event_result_type_id = _bad_event_result_type_id;
									_date_of_protocol_of_event_result_custom_field_code = _date_of_protocol_of_event_bad_result_custom_field_code;
									_number_of_protocol_of_event_result_custom_field_code = _number_of_protocol_of_event_bad_result_custom_field_code;
									break;
								case 'пройдено курсовое обучение' :
									_event_result_type_id = _course_event_result_type_id;
									_date_of_protocol_of_event_result_custom_field_code = _date_of_protocol_of_event_course_result_custom_field_code;
									_number_of_protocol_of_event_result_custom_field_code = _number_of_protocol_of_event_course_result_custom_field_code;
									break;
								default:
									sLog = sLog + ' Указан неправильный тип Возможные варианты(Сдано, Не сдано, Пройдено курсовое обучение). Строка пропущена';
							}
							
							// Номер протокола
							if (StrCharCount(ArrayNumber_of_protocols[i]) != 0)
							{
								// Дата протокола
								if (StrCharCount(ArrayDate_of_protocols[i]) != 0)
								{
									// отберём результаты мероприятия, чтобы этот результат отредактировать
									_ArrayEventResults = ArrayDirect(XQuery("for $elem in event_results where $elem/event_id = " + _ArrayEvents[0].id + " and $elem/person_id = " + _ArrayPersons[0].id + " return $elem"));
									if (ArrayOptFirstElem(_ArrayEventResults) != undefined)
									{
										for (_eventResult in _ArrayEventResults)
										{
											_doc_eventResult = OpenDoc(UrlFromDocID(_eventResult.id));
											_participate = _doc_eventResult.TopElem.not_participate;
											_assist = _doc_eventResult.TopElem.is_assist

											if(_participate || (!_participate && !_assist) ) {
												sLog = sLog + 'Сотрудник оказался от участия или нет признаков участия и подтверждения';
												alert("Сотрудник оказался от участия или нет признаков участия и подтверждения")
												continue;
											}

											number_of_changes_in_eventResult = 0; // признак - были ли изменения в результате данного мероприятия для данного сотрудника
											if (_doc_eventResult.TopElem.event_result_type_id != _event_result_type_id) // если Тип результата не такой, какой требуется - перезаписываем
												{
													_doc_eventResult.TopElem.event_result_type_id = _event_result_type_id;
													number_of_changes_in_eventResult++; // признак внесения изменений
												}
											if (Param.overwrite_or_skip_existing == 'overwrite_existing') // если в параметре указано перезаписывать Дату и номер протокола в результатах мероприятия
											{
												if ((_doc_eventResult.TopElem.custom_elems.GetOptChildByKey(_date_of_protocol_of_event_result_custom_field_code, 'name') == undefined) || (DateNewTime(Date(_doc_eventResult.TopElem.custom_elems.GetOptChildByKey(_date_of_protocol_of_event_result_custom_field_code, 'name').value)) != DateNewTime(Date(ArrayDate_of_protocols[i])))) // если Дата протокола не такая, как требуется - перезаписываем
												{
													_doc_eventResult.TopElem.custom_elems.ObtainChildByKey(_date_of_protocol_of_event_result_custom_field_code, 'name').value = Date(ArrayDate_of_protocols[i]); // Дата протокола из мероприятия прописывается в результат мероприятия
													number_of_changes_in_eventResult++; // признак внесения изменений
												}
												if ((_doc_eventResult.TopElem.custom_elems.GetOptChildByKey(_number_of_protocol_of_event_result_custom_field_code, 'name') == undefined) || (_doc_eventResult.TopElem.custom_elems.GetOptChildByKey(_number_of_protocol_of_event_result_custom_field_code, 'name').value != Trim(ArrayNumber_of_protocols[i]))) // если Номер протокола не такой, как требуется - перезаписываем
												{
													_doc_eventResult.TopElem.custom_elems.ObtainChildByKey(_number_of_protocol_of_event_result_custom_field_code, 'name').value = Trim(ArrayNumber_of_protocols[i]); // Номер протокола из мероприятия прописывается в результат мероприятия
													number_of_changes_in_eventResult++; // признак внесения изменений
												}
											}
											else // если указано пропускать существующие значения
											{
												if ((_doc_eventResult.TopElem.custom_elems.GetOptChildByKey(_date_of_protocol_of_event_result_custom_field_code, 'name') == undefined) || (_doc_eventResult.TopElem.custom_elems.GetOptChildByKey(_date_of_protocol_of_event_result_custom_field_code, 'name').value == '')) // если Дата протокола отсутствует - перезаписываем
												{
													_doc_eventResult.TopElem.custom_elems.ObtainChildByKey(_date_of_protocol_of_event_result_custom_field_code, 'name').value = Date(ArrayDate_of_protocols[i]); // Дата протокола из мероприятия прописывается в результат мероприятия
													number_of_changes_in_eventResult++; // признак внесения изменений
												}
												if ((_doc_eventResult.TopElem.custom_elems.GetOptChildByKey(_number_of_protocol_of_event_result_custom_field_code, 'name') == undefined) || (_doc_eventResult.TopElem.custom_elems.GetOptChildByKey(_number_of_protocol_of_event_result_custom_field_code, 'name').value == '')) // если Номер протокола отсутствует - перезаписываем
												{
													_doc_eventResult.TopElem.custom_elems.ObtainChildByKey(_number_of_protocol_of_event_result_custom_field_code, 'name').value = Trim(ArrayNumber_of_protocols[i]); // Номер протокола из мероприятия прописывается в результат мероприятия
													number_of_changes_in_eventResult++; // признак внесения изменений
												}
											}
											if (number_of_changes_in_eventResult > 0) // если изменения были
												_doc_eventResult.Save(); // Сохраняемся
										}
									}
									else sLog = sLog + ' не найден результат мероприятия по ID ' + OptInt(ArrayEvent_ids[i]) + ' для сотрудника с Табельным номером ' + Trim(ArrayPerson_tub_numbers[i]) + '. Строка пропущена';
								}
								else sLog = sLog + ' не указан Дата протокола. Строка пропущена';
							}
							else sLog = sLog + ' не указан Номер протокола. Строка пропущена';
						}
						else sLog = sLog + ' не указан Результат мероприятия. Строка пропущена';
					}
					else sLog = sLog + ' найдено более одного сотрудника с Табельным номером ' + Trim(ArrayPerson_tub_numbers[i]) + '. Строка пропущена';
				}
				else sLog = sLog + ' не найден сотрудник с Табельным номером ' + Trim(ArrayPerson_tub_numbers[i]) + '. Строка пропущена';
			}
			else sLog = sLog + ' не задан Табельный номер. Строка пропущена';
		}
		else sLog = sLog + ' не найдено мероприятие по ID ' + OptInt(ArrayEvent_ids[i]) + '. Строка пропущена';
	}
	else sLog = sLog + ' не задан ID мероприятия. Строка пропущена';
		
	iLineNumber = i + 1; // номер строки таблицы
	if (sLog != '')
		{
			sItog = sItog + 'Строка ' + iLineNumber + ': ' + sLog + '\n';
			sLog = '' // обнулим накапливаемое сообщение для следующей строки
		}
	if (sItog == '')
	{
		sItog = 'Всё прошло успешно';
		if (_delete_file_from_server == 'Yes') // если документ открывался с сервера
			DeleteDoc(sExcelFileUrl, true); // удаление документа после обработки в случае отсуствия ошибок в ходе выполнения
	}
}
alert(sItog);