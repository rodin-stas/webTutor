// обновлен 01.02ю2024 в рамках задачи WEBSOFT-1866
AGENT_CODE = "WEBSOFT-1561";
AGENT_ID = 7186985957630565317;
alert("Старт агента " + AGENT_ID);

var findResults = ArraySelectAll(XQuery("sql: \n\
    SELECT TOP 1\n\
        [t1].[id] AS [plan_id],\n\
        [t1].[person_id],\n\
        [t2].[is_dismiss],\n\
        [x0].[data].value('(./id)[1]', 'bigint') AS [id_program],\n\
        [x0].[data].value('(./type)[1]', 'varchar(30)') AS [type_program],\n\
        [x0].[data].value('(./state_id)[1]', 'int') AS [state_id_program],\n\
        [x0].[data].value('(./object_id)[1]', 'bigint') AS [education_method_id],\n\
        [x1].[id] AS [event_id],\n\
        [x1].[finish_date],\n\
        DATEDIFF(day, [x1].[finish_date], GETDATE()) AS [days]\n\
    FROM\n\
        [education_plans] AS [t1]\n\
        INNER JOIN [education_plan] AS [d1] ON [d1].[id] = [t1].[id]\n\
        INNER JOIN [collaborators] AS [t2] ON [t2].[id] = [t1].[person_id]\n\
        CROSS APPLY [d1].[data].nodes('education_plan/programs/program') AS [x0](data)\n\
        CROSS APPLY (\n\
            SELECT\n\
                [t4].[id],\n\
                [t4].[finish_date]\n\
            FROM\n\
                [events] AS [t4]\n\
            WHERE\n\
                [t4].[education_method_id] = [x0].[data].value('(./object_id)[1]', 'bigint')\n\
                AND [t4].[status_id] = 'close'\n\
                AND DATEDIFF(day, [t4].[finish_date], GETDATE()) <= 180\n\
        ) AS [x1]\n\
        INNER JOIN [event_results] AS [t3] ON [t3].[event_id] = [x1].[id]\n\
    WHERE\n\
        [t1].[state_id] < 2\n\
        AND [t2].[is_dismiss] = 0\n\
        AND [x0].[data].value('(./type)[1]', 'varchar(30)') = 'education_method'\n\
        AND [x0].[data].value('(./state_id)[1]', 'int') < 2\n\
        AND [t3].[is_assist] = 1\n\
        AND [t3].[person_id] = [t2].[id]\n\
"));

alert("Всего данных на обработку: " + ArrayCount(findResults))

for (el in findResults) {
    try {
        planCard = tools.open_doc(el.plan_id);
        findEduMethod = ArrayOptFind(planCard.TopElem.programs, "This.id == " + el.id_program)

        if(findEduMethod != undefined) {
            findEduMethod.state_id = 4;
            findEduMethod.result_type = "event";
            findEduMethod.result_object_id = el.event_id;
            planCard.Save();
        }
    
        // Проставим сотруднику education_plan_id в массив collaborators
        docEvent = OpenDoc(UrlFromDocID(el.event_id));
        findCol = ArrayOptFind(docEvent.TopElem.collaborators, "This.collaborator_id == " + el.person_id);

        if (findCol != undefined) {
            findCol.education_plan_id = el.plan_id;
        }

        docEvent.Save();

        tools.call_code_library_method('libEducation', 'update_education_plan', [el.plan_id, planCard, el.person_id, false]);

    } catch (err) {
        alert("Ошибка в агенте " + AGENT_ID + " текст ошибки: " + err)
    }
}

alert("Финиш агента" + AGENT_ID)