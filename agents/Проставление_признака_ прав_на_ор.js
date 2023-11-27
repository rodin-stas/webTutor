function setAccess(obgArr) {
    count = 0;
    for (obg in obgArr) {
        obgDoc = tools.open_doc(obg.id);
        obgDocTE = obgDoc.TopElem;

        accessLevel = OptInt(obgDocTE.access.access_level);
        accessRoles = ArraySelectAll(obgDocTE.access.access_roles);
        accessGroups = ArraySelectAll(obgDocTE.access.access_groups)
        accessOrgId = obgDocTE.access.access_org_id;
        conditions = ArraySelectAll(obgDocTE.access.conditions)
        curAccess = tools_web.is_true(accessLevel == 0 && ArrayCount(accessRoles) == 0 && ArrayCount(accessGroups) == 0 && ArrayCount(conditions) == 0 && IsEmptyValue(accessOrgId));
        obgDocTE.custom_elems.ObtainChildByKey("access_all").value = curAccess;

        obgDoc.Save()

        if (!curAccess) {
            count++;
        }
    }

    return count;
}

function Log(log_file_name, message) {
	if (recordLogs) {
		LogEvent(log_file_name, message);
	}
}

try {
    var logName = Trim(Param.logs_name) != '' ? Param.logs_name : "nlmk_or";
    var recordLogs = Param.record_logs;
    var curCourses = ArraySelectAll(XQuery("for $elem in courses where $elem/status != 'archive' return $elem/Fields('id')"));
    var curCompoundPrograms = ArraySelectAll(XQuery("for $elem in compound_programs return $elem/Fields('id')"));
    var allObj = ArrayUnion(curCourses, curCompoundPrograms);

    if (recordLogs) {
        EnableLog(logName, true);
    }

    Log(logName, "Агент начал работу");
    Log(logName, "Всего курсов на обработку: " + ArrayCount(curCourses));
    Log(logName, "Всего модульных программ на обработку: " + ArrayCount(curCompoundPrograms));
    Log(logName, "Всего объектов на обработку: " + ArrayCount(allObj));
    Log(logName, "Всего объектов c ограничением прав: " + setAccess(allObj));

} catch (err) {
    alert("Ошибка в агенте 7304962020303468215: " + err);
}