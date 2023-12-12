/**
 * 7301324931915466857
 * Агент очистки spxml_blobs от trash/temp записей
 *
 * https://jira.nlmk.com/browse/WEBSOFT-1516
 */

var debug = Param.GetOptProperty("debug", 0) == "1";
var logName = "nlmk_system_delete_trash_blobs_agent";

var _TIMEOUT_SECONDS = Int(Param.GetProperty("timeout_seconds"));
var _ITERATION_COUNT = Int(Param.GetProperty("iteration_count"));
var _COUNT = 0;
var _TOTAL_SIZE = 0;

if (debug) {
    EnableLog(logName);
}

function log(message) {
    LogEvent(logName, message);
}

/**
 * Возвращает количество записей для удаления
 * @returns {number}
 */
function getTrashBlobsCount() {
    var sQuery = "sql:
SELECT count(*) cnt
FROM [(spxml_blobs)]
WHERE url LIKE 'x-local://trash/temp/%'
    AND created < DATEADD(day, -60, GETDATE())
    ";
    var resp = ArrayOptFirstElem(XQuery(sQuery));
    return Int(resp.cnt);
}

/**
 * Производит итерацию удаления записей. Если в итерации записи не удалялись, то возвращает true.
 * @returns {boolean}
 */
function clearTrashBlobs() {
    var sQuery =
        "sql:
SELECT TOP " +
        Int(_ITERATION_COUNT) +
        " 
    url, 
    DATALENGTH (data) ln
FROM [(spxml_blobs)]
WHERE url LIKE 'x-local://trash/temp/%'
    AND created < DATEADD(day, -60, GETDATE())
    ";
    var resp = ArraySelectAll(XQuery(sQuery));
    if (ArrayOptFirstElem(resp) == undefined) {
        return true;
    }
    var item;
    for (item in resp) {
        log("Удаление " + item.url + " (" + tools.beautify_file_size(item.ln) + ")");
        DeleteDoc(item.url, true);
        _TOTAL_SIZE += RValue(item.ln);
    }
    _COUNT += ArrayCount(resp);
    return false;
}

function main() {
    log("Агент начал работу");

    if (debug) {
        var allCount = getTrashBlobsCount();
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

        funcRes = clearTrashBlobs();
        if (funcRes) {
            break;
        }
        Sleep(1000);
    }

    log("Удалено объектов: " + _COUNT);
    log("Освобождено: " + tools.beautify_file_size(_TOTAL_SIZE));
    log("Агент завершен");
}

main();
