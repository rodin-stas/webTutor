/**
 * code: NLMK-import-good-event-result-from-excel
 * Задача:
 * [2024.02.01] https://jira.nlmk.com/browse/WEBSOFT-1890
 * Необходимо доработать агент по проставлению типа результата мероприятия ид 7169307162279505258.
 * Внести корректировки для проставления типа результата мероприятия "Сдано" | "Не сдано" | "Пройдено курсовое обучение"
 *   При проставлении данного результата поля дата протокола и номер протокола должны быть необязательными
 */
var goodEventResultTypeId = OptInt(Param.GetOptProperty("good_event_result_type"));
var DateProtocolEventGoodResultCode = Param.GetOptProperty("date_of_protocol_of_event_good_result_custom_field_code");
var numberProtocolEventGoodResultCode = Param.GetOptProperty("number_of_protocol_of_event_good_result_custom_field_code");
var badEventResultTypeId = OptInt(Param.GetOptProperty("bad_event_result_type"));
var dateProtocolEventBadResultCode = Param.GetOptProperty("date_of_protocol_of_event_bad_result_custom_field_code");
var numberProtocolEventBadResultCode = Param.GetOptProperty("number_of_protocol_of_event_bad_result_custom_field_code");
var courseEventResultTypeId = OptInt(Param.GetOptProperty("course_event_result_type"));
var dateProtocolEventCourseResultCode = Param.GetOptProperty("date_of_protocol_of_event_course_result_custom_field_code");
var numberProtocolEventCourseResultCode = Param.GetOptProperty("number_of_protocol_of_event_course_result_custom_field_code");
/** Перезаписывать Дату, номер протокола, оценку за итоговое тестирование в результатах мероприятия? */
var overwriteResultTypes = Trim(Param.GetOptProperty("overwrite_or_skip_existing")) == "overwrite_existing";
var resultTypeVariants = String(Param.GetOptProperty("result_type_variants", ""));
var excelFileUrl = undefined;
var logString = "";
var debugMode = true;

function checkResultTypeEvent(resultType) {
    return resultType == "сдано" || resultType == "не сдано" || resultType == "пройдено курсовое обучение";
}

/**
 * Добавление нулей
 * @param {string} val - значение 
 * @returns {string}
 */
function addZeros(val) {
    var result = val;
    while (StrCharCount(result ) < 8) {
        result = "0" + result;
    }

    return result;
}

/**
 * @description: открытие файла excel и получение данных с первого листа
 * @return: (Array) - двумерный массив данных с первого листа excel
*/
function getDataFiles() {
    try {
        if (LdsIsClient) {
            excelFileUrl = Screen.AskFileOpen("", 'Выберите файл Excel');
        } else {
            excelFileUrl = Trim(Param.GetOptProperty("SERVER_FILE_URL", ""));
            if (excelFileUrl.length == 0) {
                throw "ОШИБКА: не задан пусть к файлу на сервере в Переменной SERVER_FILE_URL.\nВыполнение Агента остановлено.";
            }
        }
    } catch (err) {
        throw "getDataFiles: " + err;
    }

    try {
        var docFile = OpenDoc(excelFileUrl, 'format=excel');
        var oSheet = ArrayFirstElem(docFile.TopElem); //???
        var excelData = [];
        var eventId = void 0;
        var tabNumber = void 0;
        var eventResultType = void 0;
        var protocolNumber = void 0;
        var protocolDate = void 0;
        for (var i = 1; i < ArrayCount(oSheet); i++) {
            try {
                eventId = Int(Trim(oSheet[i][0]));
            } catch (e) {
                logString += 'Строка ' + (i + 1) + ' пропущена - ID мероприятия указан не верно\n';

                continue;
            }

            tabNumber = Trim(oSheet[i][1]);
            if (tabNumber == "") {
                logString += 'Строка ' + (i + 1) + ' пропущена - не задан Табельный номер\n';

                continue;
            }
            tabNumber = addZeros(tabNumber);

            eventResultType = StrLowerCase(Trim(oSheet[i][2]));
            if (!checkResultTypeEvent(eventResultType)) {
                logString += "Строка " + (i + 1) + " пропущена - неправильно заполнен Результат мероприятия. " +
                    "Возможные варианты: Сдано, Не сдано, Пройдено курсовое обучение\n";
                
                continue;
            }

            protocolNumber = Trim(oSheet[i][3]);
            protocolDate = OptDate(Trim(oSheet[i][4]));
            if (protocolDate == undefined && Trim(oSheet[i][4]) != "") {
                logString += 'Строка ' + (i + 1) + ' пропущена - неправильно заполнена Дата протокола\n';

                continue;
            }

            excelData.push({
                event_id: eventId,
                person_tab_number: tabNumber,
                event_result_type: eventResultType,
                number_of_protocol: protocolNumber,
                date_of_protocol: protocolDate,
                f_estimate: Trim(oSheet[i][5]),
            });
        }

        return excelData;
    } catch (err) {
        throw "ОШИБКА: невозможно получить доступ к файлу " + excelFileUrl +
            "\nСкорее всего, файл открыт.\nЗакройте файл и повторите попытку.";
    }
}
function getResultTypeId(eventResultType) {
    switch (eventResultType) {
        case 'сдано': {
            return goodEventResultTypeId;
        }
        case 'не сдано': {
            return badEventResultTypeId;
        }
        case 'пройдено курсовое обучение': {
            return courseEventResultTypeId;
        }
    }
}

function getEventResultProtocolDateCustomCode(eventResultType) {
    switch (eventResultType) {
        case 'сдано': {
            return DateProtocolEventGoodResultCode;
        }
        case 'не сдано': {
            return dateProtocolEventBadResultCode;
        }
        case 'пройдено курсовое обучение': {
            return dateProtocolEventCourseResultCode;
        }
    }
}

function getEventResultProtocolNumberCustomCode(eventResultType) {
    switch (eventResultType) {
        case 'сдано': {
            return numberProtocolEventGoodResultCode;
        }
        case 'не сдано': {
            return numberProtocolEventBadResultCode;
        }
        case 'пройдено курсовое обучение': {
            return numberProtocolEventCourseResultCode;
        }
    }
}

function main() {
    if (goodEventResultTypeId == undefined || DateProtocolEventGoodResultCode == "" || numberProtocolEventGoodResultCode == "") {
        throw "Не заданы коды Переменных Агента: " +
            "good_event_result_type, date_of_protocol_of_event_good_result_custom_field_code, " +
            "number_of_protocol_of_event_good_result_custom_field_code.\nВыполнение Агента остановлено.";
    }

    if ((resultTypeVariants == "good_and_bad" || resultTypeVariants == 'good_and_bad_and_course') &&
        (badEventResultTypeId == undefined || dateProtocolEventBadResultCode == "" || numberProtocolEventBadResultCode == "")) {
        throw "Не заданы коды Переменных Агента: " +
            "bad_event_result_type, date_of_protocol_of_event_bad_result_custom_field_code, " +
            "number_of_protocol_of_event_bad_result_custom_field_code.\nВыполнение Агента остановлено.";
    }

    if (resultTypeVariants == 'good_and_bad_and_course' &&
        (courseEventResultTypeId == undefined || dateProtocolEventCourseResultCode == "" || numberProtocolEventCourseResultCode == "")) {
        throw "Не заданы коды Переменных Агента: " +
            "course_event_result_type, date_of_protocol_of_event_course_result_custom_field_code, " +
            "number_of_protocol_of_event_course_result_custom_field_code.\nВыполнение Агента остановлено.";
    }

    // Получаем массив данных из файла и преобразуем в полноценный массив объектов
    var excelData = getDataFiles();
    if (excelData.length == 0) {
        throw "Переданный файл не содержит корректных данных для обработки";
    }

    var foundPersons;
    var curPersonId;
    var eventResultTypeId;
    var codeProtocolDate;
    var codeProtocolNumber;
    var eventResult;
    var eventResultDoc;
    var eventResultTE = undefined;
    var changedData;
    var oldEventId = undefined;
    var eventFound = true;
    for (var i = 0; i < excelData.length; i++) {
        if (oldEventId != excelData[i].event_id) {
            oldEventId == excelData[i].event_id;
            eventFound = ArrayOptFirstElem(tools.xquery("for $elem in events where $elem/id = " + excelData[i].event_id + " return $elem")) != undefined;
            if (!eventFound) {
                logString += 'Не найдено мероприятие по ID ' + excelData[i].event_id + '. Строки с этим мероприятием пропущены\n';

                continue;
            }
        }
        if (!eventFound) {
            continue;
        }

        // если в системе не может быть нескольких сотрудников с двумя логинами, то проверку на сотрудника и результат мероприятия можно объединить
        // табельный номер сотрудника - в системе это login
        foundPersons = ArraySelectAll(tools.xquery("sql: \
            DECLARE @eventId BIGINT = " + Trim(excelData[i].event_id) + "; \
            \
            SELECT cs.id \
            FROM collaborators cs \
            INNER JOIN collaborator c ON c.id = cs.id \
            CROSS APPLY c.data.nodes('collaborator/custom_elems') custom_elems(xml) \
            INNER JOIN event_results ers ON ers.event_id = @eventId AND ers.person_id = cs.id \
            WHERE \
                cs.login = '" + excelData[i].person_tab_number + "' \
                OR custom_elems.xml.value('(custom_elem[name=''service_number'']/value)[1]', 'NVARCHAR(50)') = '" + excelData[i].person_tab_number + "'"
            )
        );
        
        if (ArrayOptFirstElem(foundPersons) == undefined) {
            logString += 'Не найден сотрудник с Табельным номером ' + XQueryLiteral(excelData[i].person_tab_number);
            
            continue;
        }

        // если найдено более двух сотрудников
        if (ArrayCount(foundPersons) > 1) {
            logString += 'Найдено несколько сотрудников с Табельным номером ' + XQueryLiteral(excelData[i].person_tab_number);

            continue;
        }

        curPersonId = foundPersons[0].id;
        eventResultTypeId = getResultTypeId(excelData[i].event_result_type);
        codeProtocolDate = getEventResultProtocolDateCustomCode(excelData[i].event_result_type);
        codeProtocolNumber = getEventResultProtocolNumberCustomCode(excelData[i].event_result_type);
        // отберём результаты мероприятия, чтобы этот результат отредактировать
        eventResult = ArrayOptFirstElem(XQuery("for $elem in event_results where $elem/event_id = " + excelData[i].event_id + " and $elem/person_id = " + curPersonId + " return $elem"));
        if (eventResult == undefined) {
            logString += 'Не найден результат мероприятия по ID ' + excelData[i].event_id + ' для сотрудника с Табельным номером ' + XQueryLiteral(excelData[i].person_tab_number);
        }

        eventResultDoc = tools.open_doc(eventResult.id.Value);
        eventResultTE = eventResultDoc.TopElem;
        if (eventResultTE.not_participate.Value || (!eventResultTE.not_participate.Value && !eventResultTE.is_assist.Value)) {
            logString += "мероприятия по ID " + excelData[i].event_id + " для сотрудника с Табельным номером " + XQueryLiteral(excelData[i].person_tab_number) +
                " Сотрудник отказался от участия или нет признаков участия и подтверждения";
            
            continue;
        }
        changedData = false; // были ли изменения в результате мероприятия для данного сотрудника
        // если Тип результата не такой, какой требуется - перезаписываем
        if (eventResultTE.event_result_type_id.Value != eventResultTypeId) {
            eventResultTE.event_result_type_id.Value = eventResultTypeId;
            changedData = true;
        }

        if (overwriteResultTypes) {
            // если Дата протокола или Номер протокола или "Оценка за итоговое тестирование" не совпадают - перезаписываем
            if (
                eventResultTE.custom_elems.ObtainChildByKey(codeProtocolDate).value.Value != excelData[i].date_of_protocol ||
                eventResultTE.custom_elems.ObtainChildByKey(codeProtocolNumber).value.Value != excelData[i].number_of_protocol ||
                eventResultTE.custom_elems.ObtainChildByKey("f_estimate").value.Value != excelData[i].f_estimate
            ) {
                changedData = true;
            }

            eventResultTE.custom_elems.ObtainChildByKey(codeProtocolDate).value.Value = StrXmlDate(OptDate(excelData[i].date_of_protocol, ""));
            eventResultTE.custom_elems.ObtainChildByKey(codeProtocolNumber).value.Value = excelData[i].number_of_protocol;
            eventResultTE.custom_elems.ObtainChildByKey("f_estimate").value.Value = excelData[i].f_estimate;
        } else { // если указано пропускать существующие значения
            if (eventResultTE.custom_elems.ObtainChildByKey(codeProtocolDate).value.Value == "") {
                eventResultTE.custom_elems.ObtainChildByKey(codeProtocolDate).value.Value = StrXmlDate(OptDate(excelData[i].date_of_protocol, ""));
                changedData = true;
            }

            if (eventResultTE.custom_elems.ObtainChildByKey(codeProtocolNumber).value.Value == "") {
                eventResultTE.custom_elems.ObtainChildByKey(codeProtocolNumber).value.Value = excelData[i].number_of_protocol;
                changedData = true;
            }
        }

        if (changedData) {
            eventResultDoc.Save();
        }
    }
}
try {

    main();
} catch (e) {
    logString += "err: " + e + "\n";
}

if (logString == "") {
    logString = 'Всё прошло успешно\n';
    if (LdsIsServer) {
        DeleteDoc(excelFileUrl, true); // удаление документа после обработки в случае отсуствия ошибок в ходе выполнения
    }
}
if (debugMode) {
	alert("agent NLMK-import-good-event-result-from-excel\n" + logString);
}