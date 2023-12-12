// function updatePersonAccess(personId, str, hex, date) {

//     ArrayDirect(XQuery("sql: \n\
//     DECLARE @personId bigint = "+ SqlLiteral(personId) + ";\n\
//     DECLARE @state varchar(max) ="+ SqlLiteral(str) + ";\n\
//     DECLARE @hex varchar(max) ="+ SqlLiteral(hex) + ";\n\
//     DECLARE @date DATE = "+ SqlLiteral(date) + "; \n\
//     IF NOT EXISTS (\n\
//         SELECT\n\
//             [id]\n\
//         FROM\n\
//             [access_or]\n\
//         WHERE\n\
//             [id] = @personId\n\
//     )\n\
//     BEGIN\n\
//         INSERT INTO [access_or] (\n\
//             [id],\n\
//             [object_ids],\n\
//             [hex],\n\
//             [update_date]\n\
//         ) VALUES (\n\
//             @personId,\n\
//             @state,\n\
//             @hex,\n\
//             @date\n\
//         )\n\
//     END\n\
//     ELSE\n\
//     BEGIN\n\
//         UPDATE [access_or]\n\
//         SET\n\
//             [object_ids] = @state,\n\
//             [hex] = @hex,\n\
//             [update_date] = @date\n\
//         WHERE\n\
//             [id] = @personId\n\
//     END\n\
//     "));

//     return true;
// }

function updatePersonAccess(str) {
    ArrayDirect(XQuery("sql:  \n\
        BEGIN \n\
            INSERT INTO [access_or] ( \n\
                [id], \n\
                [object_ids], \n\
                [hex],\n\
                [update_date]\n\
            ) VALUES \n\
           "+ str + "\n\
        END \n\
    "))

    return true;
}

function deleteAccess(arrIds) {
    ArrayDirect(XQuery("sql: \n\
    DECLARE @ids TABLE (id bigint);\n\
    INSERT INTO @ids VALUES\n\
    "+ ArrayMerge(arrIds, '"(" + This + ")"', ",") + ";\n\
        DELETE \n\
        FROM \n\
            [access_or] \n\
        WHERE \n\
            [id] IN (SELECT [id] FROM @ids) \n\
    "));

}

function getStrParams(params) {
    str = "";
    for (param in params) {
        if (StrCharCount(str) == 0) {
            str = str + "(" + param.id + ",'" + param.access + "','" + param.hex + "','" + Date() + "')"

        } else {
            str = str + "," + "(" + param.id + ",'" + param.access + "','" + param.hex + "','" + Date() + "')"
        }
    }

    return str;
}


function Log(log_file_name, message) {
    if (recordLogs) {
        LogEvent(log_file_name, message);
    }
}

try {
    var logName = Trim(Param.logs_name) != '' ? Param.logs_name : "nlmk_or";
    var recordLogs = Param.record_logs;
    var curPersons = ArraySelectAll(XQuery("sql:  \n\
        SELECT \n\
        	[t0].[id],\n\
        	[t1].[hex]\n\
        FROM \n\
        	[collaborators] AS [t0]\n\
        	LEFT JOIN [access_or] AS [t1] ON [t1].[id] = [t0].[id]\n\
        WHERE \n\
        	[t0].[is_dismiss] != 1\n\
    "));
    var curCourses = ArraySelectAll(XQuery("for $elem in courses where $elem/status != 'archive' and doc-contains($elem/id, '', '[access_all = false~bool]') return $elem/Fields('id')"));
    var curCompoundPrograms = ArraySelectAll(XQuery("for $elem in compound_programs where doc-contains($elem/id, '', '[access_all = false~bool]') return $elem/Fields('id')"));
    var allObj = ArrayUnion(curCourses, curCompoundPrograms);

    if (recordLogs) {
		EnableLog(logName, true)
	}

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

        arr = ArraySort(orIds, 'This', '+')
        newHex = Md5Hex(arr.join(','));
        if (tools_library.string_is_null_or_empty(person.hex) || person.hex != newHex) {

            // updatePersonAccess(person.id, arr.join(','), newHex, Date())
            _accessData.push({
                'id': person.id,
                'access': arr.join(','),
                'hex': newHex
            })
        }


    }

    var curDismiss = ArraySelectAll(XQuery("sql:  \n\
        SELECT \n\
            [t0].[id]\n\
        FROM\n\
            [access_or] AS [t0]\n\
            INNER JOIN [collaborators] AS [t1] ON [t1].[id] = [t0].[id]\n\
        WHERE\n\
            [t1].[is_dismiss] = 1\n\
    "));

    Log(logName, "Удалим уволенных сотрудников, всего их:" + ArrayCount(curDismiss));
    Log(logName, "Удалим всех, у кого поменялись права:" + ArrayCount(_accessData));

    var deleteArr = ArrayUnion(ArrayExtractKeys(curDismiss, 'id'), ArrayExtractKeys(_accessData, 'id'));
    Log(logName, "Всего на удаление:" + ArrayCount(deleteArr));

    deleteAccess(deleteArr);

    var elemCount = 1000;
    var pages = (ArrayCount(_accessData) / elemCount) + 1

    // trunCateTable();

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