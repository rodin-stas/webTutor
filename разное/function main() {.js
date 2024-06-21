function main() {

    try {
        var debug = true;
        var logName = 'new_project'
        var eventResults = ArraySelectAll(XQuery("sql: \n\
        SELECT\n\
        	[d0].[id],\n\
            [d0].[data].value('(event_result/custom_elems/custom_elem[name=''project'']/value)[1]', 'varchar(max)') AS [old_project]\n\
        FROM\n\
        	[event_result] AS [d0]\n\
        	INNER JOIN [event_results] AS [t0] ON [t0].[id] = [d0].[id]\n\
        WHERE \n\
        	[t0].[event_result_type_id] = '7173951143740769760'\n\
        	AND [d0].[data].value('(event_result/custom_elems/custom_elem[name=''project'']/value)[1]', 'varchar(max)')  IS NOT NULL\n\
    "));

        tools.call_code_library_method("nlmk", "log", [logName, "Всего результатов мероприятий нп обработку: " + ArrayCount(eventResults), "INFO", debug]);

        var new_projects = ArraySelectAll(XQuery("sql: select * from cc_projects"));

        tools.call_code_library_method("nlmk", "log", [logName, "Получили новый справочник значений projects: " + ArrayCount(new_projects), "INFO", debug]);

        for (eventResult in eventResults) {
            tools.call_code_library_method("nlmk", "log", [logName, "Обрабатываем план с id: " + eventResult.id, "INFO", debug]);
            tools.call_code_library_method("nlmk", "log", [logName, "Поле project: " + eventResult.old_project, "INFO", debug]);

            searchValueInNewProjects = ArrayOptFind(new_projects, "This.name == '" + eventResult.old_project+ "'");

            if (searchValueInNewProjects != undefined) {
                tools.call_code_library_method("nlmk", "log", [logName, "Нашли значение поля project в новом каталоге, запишем его: " + searchValueInNewProjects.id, "INFO", debug]);

                eventResultDoc = tools.open_doc(eventResult.id);
                eventResultDoc.TopElem.custom_elems.ObtainChildByKey("project_new").value = searchValueInNewProjects.id;
                eventResultDoc.Save();
            } else {
                tools.call_code_library_method("nlmk", "log", [logName, "В новом каталоге нет такого значения, пропускаем ", "INFO", debug]);
            }
        }

        tools.call_code_library_method("nlmk", "log", [logName, "Агент завершил работу!", "INFO", debug]);

    } catch (err) {
        alert("Ошибка при перезаписи поля project: "+ err)
    }
}

main()
