
/**
 * 7352885112221807821
 * Агент отправляет уведомления сотрудникам, у кого есть активная заявка на Доп. группу. Рассчитан на запуск раз в сутки.
 */

var logName = Trim(Param.logs_name) != '' ? Param.logs_name : "notification_requests";
var recordLogs = tools_web.is_true(recordLogs = Param.record_logs);
var requestTypeId = Param.request_type_id;


function getRequests(requestTypeId) {
    var result = ArraySelectAll(XQuery("sql:  \n\
        DECLARE @request_type_id AS BIGINT = "+ SqlLiteral(requestTypeId) + ";\n\
        WITH [cur_events] AS (\n\
            SELECT\n\
                DISTINCT [t1].[id]\n\
            FROM\n\
                [event] AS [d0]\n\
                INNER JOIN [events] AS [t0] ON [t0].[id] = [d0].[id]\n\
                INNER JOIN [education_methods] AS [t1] ON [t1].[id] = [t0].[education_method_id]\n\
                INNER JOIN [education_method] AS [d1] ON [d1].[id] = [t1].[id]\n\
            WHERE\n\
                DATEDIFF(minute, [d0].[created], GetDate()) >= 0\n\
                AND DATEDIFF(minute, [d0].[created], GetDate()) <= 1440\n\
                AND [t1].[state_id] = 'active'\n\
                AND (\n\
                    [t0].[status_id] = 'plan'\n\
                    OR [t0].[status_id] = 'active'\n\
                )\n\
                AND [d1].[data].value(\n\
                    '(education_method/custom_elems/custom_elem[name=''send_req_notification'']/value)[1]',\n\
                    'BIT'\n\
                ) = 1\n\
        )\n\
        SELECT\n\
            [t0].[id] AS [education_method_id],\n\
            [t1].[id] AS [request_id],\n\
            [t1].[person_id]\n\
        FROM\n\
            [cur_events] AS [t0]\n\
            INNER JOIN [requests] AS [t1] ON [t1].[object_id] = [t0].[id]\n\
        WHERE\n\
            [t1].[request_type_id] = @request_type_id\n\
            AND [t1].[status_id] = 'active'"
    ));

    return result;
}

function log(message) {
    if (recordLogs) {
        LogEvent(logName, message);
    }
}

function main() {
    try {
        if (recordLogs) {
            EnableLog(logName, true)
        }

        log("Агент начал работу")

        var cur_requests = getRequests(requestTypeId);

        log("Всего заявок на обработку: " + ArrayCount(cur_requests));

        for (req in cur_requests) {
            log("Отправили уведомление по заявке с id " + req.request_id + " сотруднику с id " + req.person_id);
            // tools.call_code_library_method("nlmk", "create_notification", ['тут code шаблона', req.person_id, DATA])
        }

        log("Агент завершил работу")
    } catch (err) {
        log("Ошибка в агенте с id 7352885112221807821 " + err);
        alert("Ошибка в агенте с id 7352885112221807821 " + err);
    }
}

main();