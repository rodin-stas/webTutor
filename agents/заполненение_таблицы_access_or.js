function updatePersonAccess(str) {
    ArrayDirect(XQuery("sql:  \n\
        BEGIN \n\
            INSERT INTO [access_or] ( \n\
                [id], \n\
                [object_ids] \n\
            ) VALUES \n\
           "+ str + "\n\
        END \n\
    "))

    return true;
}

function trunCateTable() {
    ArrayDirect(XQuery("sql:  \n\
    TRUNCATE TABLE [access_or] \n\
    "
    ))
}

function Log(log_file_name, message) {
    if (recordLogs) {
        LogEvent(log_file_name, message);
    }
}

function getStrParams(params) {
    str = "";
    for (param in params) {
        if (StrCharCount(str) == 0) {
            str = str + "(" + param.id + ",'" + param.access + "')"

        } else {
            str = str + "," + "(" + param.id + ",'" + param.access + "')"
        }
    }

    return str;
}

try {
    var logName = Trim(Param.logs_name) != '' ? Param.logs_name : "nlmk_or";
    var recordLogs = Param.record_logs;
    var curPersons = ArraySelectAll(XQuery("for $elem in collaborators where $elem/is_dismiss != 1 return $elem/Fields('id')"));
    var curCourses = ArraySelectAll(XQuery("for $elem in courses where $elem/status != 'archive' and doc-contains($elem/id, '', '[access_all = false~bool]') return $elem/Fields('id')"));
    var curCompoundPrograms = ArraySelectAll(XQuery("for $elem in compound_programs where doc-contains($elem/id, '', '[access_all = false~bool]') return $elem/Fields('id')"));
    var allObj = ArrayUnion(curCourses, curCompoundPrograms);

    Log(logName, "Агент начал работу");
    Log(logName, "Всего людей на обработку: " + ArrayCount(curPersons));
    Log(logName, "Всего курсов на обработку: " + ArrayCount(curCourses));
    Log(logName, "Всего модульных программ на обработку: " + ArrayCount(curCompoundPrograms));
    Log(logName, "Всего объектов на обработку: " + ArrayCount(allObj));

    _temp = []
    for (obj in allObj) {
        _temp.push(tools.open_doc(obj.id).TopElem);
    }

    _accessData = []
    for (person in curPersons) {
        orIds = [];
        personDoc = tools.open_doc(person.id).TopElem
        for (obj in _temp) {

            if (!tools_web.check_access(obj, person.id, personDoc)) orIds.push(String(obj.id));

        }

        _accessData.push({
            'id': person.id,
            'access': orIds.join(',')
        })
    }

    var elemCount = 1000;
    var pages = (ArrayCount(_accessData) / elemCount) + 1

    trunCateTable();

    for (i = 1; i <= pages; i++) {

        startPos = i == 1 ? 0 : (elemCount * (i - 1));
        elems = ArrayRange(_accessData, startPos, elemCount);

        if (ArrayCount(elems) > 0) {
            Log(logName, "Обрабатываем записи с -" + startPos + " по - " + ((startPos + elemCount) - 1));
            param = getStrParams(elems);
            updatePersonAccess(param);
        }
    }

    Log(logName, "Агент завершил работу");
    _temp = [];
    orIds = [];
    _accessData = [];

} catch (err) {
    Log(logName, "Ошибка в агенте 7305001383569613183: " + err);
    alert("Ошибка в агенте 7305001383569613183: " + err);
}