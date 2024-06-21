function main() {

    try {
        var debug = true;
        var logName = 'new_short_profession_name'
        var compoundPrograms = ArraySelectAll(XQuery("sql: \n\
        SELECT\n\
            [d0].[id],\n\
            [d0].[data].value('(compound_program/custom_elems/custom_elem[name=''profession_name'']/value)[1]', 'varchar(max)') AS [short_profession_name]\n\
        FROM\n\
            [compound_program] AS [d0]\n\
            INNER JOIN [compound_programs] AS [t0] ON [t0].[id] = [d0].[id]\n\
        WHERE \n\
            [d0].[data].value('(compound_program/custom_elems/custom_elem[name=''profession_name'']/value)[1]', 'varchar(max)')  IS NOT NULL\n\
        "));

        tools.call_code_library_method("nlmk", "log", [logName, "Всего модульных на обработку обработку: " + ArrayCount(compoundPrograms), "INFO", debug]);

        var new_professions = ArraySelectAll(XQuery("sql: select * from cc_professions"));

        tools.call_code_library_method("nlmk", "log", [logName, "Получили новый справочник значений cc_professions: " + ArrayCount(new_professions), "INFO", debug]);

        for (compoundProgram in compoundPrograms) {
            tools.call_code_library_method("nlmk", "log", [logName, "Обрабатываем план с id: " + compoundProgram.id, "INFO", debug]);
            tools.call_code_library_method("nlmk", "log", [logName, "Поле short_profession_name: " + compoundProgram.short_profession_name, "INFO", debug]);

            searchValueInNew = ArrayOptFind(new_professions, "This.name == '" + compoundProgram.short_profession_name+ "'");

            if (searchValueInNew != undefined) {
                tools.call_code_library_method("nlmk", "log", [logName, "Нашли значение поля  в новом каталоге, запишем его: " + searchValueInNew.id, "INFO", debug]);

                compoundProgramDoc = tools.open_doc(compoundProgram.id);
                compoundProgramDoc.TopElem.custom_elems.ObtainChildByKey("profession_name").value = searchValueInNew.id;
                compoundProgramDoc.Save();
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
