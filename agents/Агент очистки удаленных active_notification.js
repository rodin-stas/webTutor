/**
 * 7299087790546763691
 * Агент очистки удаленных active_notification
 *
 * https://jira.nlmk.com/browse/WEBSOFT-1516
 */

var debug = Param.GetOptProperty("debug", 0) == "1";
var logName = "nlmk_system_delete_active_notifications_agent";

var _TIMEOUT_SECONDS = Int(Param.GetProperty("timeout_seconds"));
var _ITERATION_COUNT = Int(Param.GetProperty("iteration_count"));
var _COUNT = 0;

if (debug) {
    EnableLog(logName);
}

function log(message) {
    LogEvent(logName, message);
}

/**
 * Возвращает количество уведомлений для удаления
 * @returns {number}
 */
function getActiveNotificationCount() {
    var sQuery = "sql:
SELECT count(*) cnt
FROM [(spxml_objects)] so
LEFT JOIN active_notifications ans ON ans.id = so.id
WHERE so.form = 'active_notification'
	AND ans.id IS NULL
    ";
    var resp = ArrayOptFirstElem(XQuery(sQuery));
    return Int(resp.cnt);
}

/**
 * Производит итерацию удаления уведомлений. Если в итерации уведомления не удалялись, то возвращает true.
 * @returns {boolean}
 */
function clearDeletedActiveNotifications() {
    var sQuery =
        "sql:
DELETE TOP (" +
        Int(_ITERATION_COUNT) +
        ") [(spxml_objects)]
OUTPUT deleted.id
FROM [(spxml_objects)] so
LEFT JOIN active_notifications ans ON ans.id = so.id
WHERE so.form = 'active_notification'
	AND ans.id IS NULL
    ";
    var resp = ArraySelectAll(XQuery(sQuery));
    if (ArrayOptFirstElem(resp) == undefined) {
        return true;
    }
    _COUNT += ArrayCount(resp);
    return false;
}

function main() {
    log("Агент начал работу");

    if (debug) {
        var allCount = getActiveNotificationCount();
        log("Всего объектов для удаления: " + allCount);
        if (allCount > 0) {
            var iterationsCount = allCount / _ITERATION_COUNT;
            log("Потенциальное количество итераций: " + Int(iterationsCount));
        }
    }

    var startDate = Date();
    log(
        "Примерное время завершения: " +
            StrDate(DateOffset(startDate, _TIMEOUT_SECONDS), { ShowTime: true, ShowSeconds: true })
    );

    var funcRes;
    var i = 0;
    while (DateDiff(Date(), startDate) < _TIMEOUT_SECONDS) {
        i++;
        if (i % 10 == 0) {
            log("Итерация " + i);
        }

        funcRes = clearDeletedActiveNotifications();
        if (funcRes) {
            break;
        }
        Sleep(1000);
    }

    log("Удалено объектов: " + _COUNT);
    log("Агент завершен");
}

main();
