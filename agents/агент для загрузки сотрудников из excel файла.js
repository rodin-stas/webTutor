/**
 * @description: открытие файла excel и получение данных с первого листа
 * @return: (Array) - двумерный массив данных с первого листа excel
*/
function getDataFiles(file_url) {
    var loadData = [];
    var sExcelFileUrl = undefined;

    if (!LdsIsServer) {
        sExcelFileUrl = Screen.AskFileOpen('', 'Выберите файл Excel');
    } else {
        sExcelFileUrl = FilePathToUrl(file_url);
    }

    try {
        var oExcelFile = OpenDoc(sExcelFileUrl, 'format=excel');
        loadData = oExcelFile.TopElem[0];
    } catch (err) {
        log('ОШИБКА: невозможно получить доступ к файлу ' + sExcelFileUrl + '\nСкорее всего, файл открыт.\nЗакройте файл и повторите попытку.');
    }

    return loadData;
}

function createCollaborator(data) {

    collaboratorDoc = tools.new_doc_by_name('collaborator', false);
    collaboratorDocTE = collaboratorDoc.TopElem;

    collaboratorDocTE.code = "external_" + data.code;
    collaboratorDocTE.login = "external_" + data.login;
    collaboratorDocTE.email = data.email;
    collaboratorDocTE.password = data.password;
    collaboratorDocTE.org_id = data.org_id;
    collaboratorDocTE.lng_id = (data.lng_id == 'english' ? 'english' : null);
    collaboratorDocTE.is_dismiss = (tools_web.is_true(data.is_dismiss) ? 1 : 0);
    collaboratorDocTE.access.web_banned = (tools_web.is_true(data.is_dismiss) ? 1 : 0);
    collaboratorDocTE.change_password = 1;

    names = data.fullname.split(" ");

    if (ArrayCount(names) > 0) {
        collaboratorDocTE.lastname = names[0]
    }

    if (ArrayCount(names) > 1) {
        collaboratorDocTE.firstname = names[1]
    }

    if (ArrayCount(names) > 2) {
        collaboratorDocTE.middlename = names[2]
    }

    collaboratorDoc.BindToDb();
    collaboratorDoc.Save()

    return collaboratorDoc.DocID
}

function updateCollaborator(personID, data) {

    collaboratorDoc = tools.open_doc(personID);
    collaboratorDocTE = collaboratorDoc.TopElem;

    collaboratorDocTE.code = "external_" + data.code;
    collaboratorDocTE.login = "external_" + data.login;
    collaboratorDocTE.email = data.email;
    collaboratorDocTE.password = data.password;
    collaboratorDocTE.org_id = data.org_id;
    collaboratorDocTE.lng_id = (data.lng_id == 'english' ? 'english' : null);
    collaboratorDocTE.is_dismiss = (tools_web.is_true(data.is_dismiss) ? 1 : 0);
    collaboratorDocTE.access.web_banned = (tools_web.is_true(data.is_dismiss) ? 1 : 0);
    collaboratorDocTE.change_password = 1;

    names = data.fullname.split(" ");

    if (ArrayCount(names) > 0) {
        collaboratorDocTE.lastname = names[0]
    }

    if (ArrayCount(names) > 1) {
        collaboratorDocTE.firstname = names[1]
    }

    if (ArrayCount(names) > 2) {
        collaboratorDocTE.middlename = names[2]
    }

    collaboratorDoc.Save()

    return collaboratorDoc.DocID
}

function sendNotification(person_id, lng, password) {
    if (lng == "english") {
        tools.call_code_library_method("nlmk", "create_notification", ["user_creation_en", person_id, tools.object_to_text({'pwd': password},'json')])
    } else { 
        tools.call_code_library_method("nlmk", "create_notification", ["user_creation_ru", person_id, tools.object_to_text({'pwd': password},'json')])
    }
}

function log(message) {
    LogEvent(file_log_name, message);
}

function main() {
    try {
        var file_url = Param.file_url;
        var delete_file_from_server = tools_web.is_true(Param.delete_file_from_server);
        var record_logs = tools_web.is_true(Param.record_logs);
        var create_notification = tools_web.is_true(Param.create_notification);
        var file_log_name = (tools_library.string_is_null_or_empty(Param.file_log_name) ? 'create_collaborators_from_excel' : Param.file_log_name);
        var update_persons = tools_web.is_true(Param.update_persons)
        var aEntries = [];

        if (record_logs) {
            EnableLog(file_log_name);
        }

        log("Агент начал работу");
        log("Режим работы агента: " + (update_persons ? "Обновление сотрудников" : "Создание новых сотрудников"));
        log("Отправлять уведомления сотрудникам: " + (create_notification ? "Да" : "Нет"));
        log("Удалим файл, после выполнения агента: " + (delete_file_from_server ? "Да" : "Нет"));

        var aData = getDataFiles(file_url);

        if (ArrayCount(aData) == 0) {
            log("Нет данных для обработки, агент завершил работу")
            return;
        }

        for (i = 1; i < ArrayCount(aData); i++) {
            aEntries.push({
                'code': String(aData[i][0]),
                'login': String(aData[i][1]),
                'fullname': String(aData[i][2]),
                'email': String(aData[i][3]),
                'org_id': String(aData[i][4]),
                'password': String(aData[i][5]),
                'lng_id': String(aData[i][6]),
                'is_dismiss': String(aData[i][7])
            })
        }
        aData = [];

        log("Всего записей на обработку: " + ArrayCount(aEntries));

        for (person in aEntries) {

            if (update_persons) {
                curPerson = ArrayOptFirstElem(XQuery("for $elem in collaborators where $elem/code =" + XQueryLiteral('external_' + person.code) + " or $elem/login =" + XQueryLiteral('external_' + person.login) + "  return $elem"));

                if (curPerson != undefined) {
                    log("Обновляем пользователя с id: " + curPerson.id);
                    updateCollaborator(curPerson.id, person)
                }

            } else {
                if (ArrayCount(XQuery("for $elem in collaborators where $elem/code =" + XQueryLiteral('external_' + person.code) + " or $elem/login =" + XQueryLiteral('external_' + person.login) + "  return $elem")) > 0) {
                    log("Пользователь с таким кодом уже есть в системе: " + person.code + " или логином " + person.login)
                    continue;
                }

                personId = createCollaborator(person)

                log("Создан документ с id: " + personId);

                if (create_notification && OptInt(personId) != undefined) {
                    log("Отправка уведомления");
                    sendNotification(personId, person.lng_id, person.password)
                }
            }


        }

        if (delete_file_from_server && LdsIsServer) {
            log("Удалили excel файл с сервера");
            DeleteDoc(FilePathToUrl(file_url), true);
        }

        log("Агент завершил работу")
    } catch (err) {
        log(err)
    }
}

main();
