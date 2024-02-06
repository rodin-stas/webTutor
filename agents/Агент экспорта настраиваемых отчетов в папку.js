/**
 * 7283782138229714963
 * Агент экспорта настраиваемых отчетов в папку
 */

var reportsParams = tools.read_object(Param.reports_params);
var debug = Param.GetOptProperty("debug", 0) == "1";

var regExp = tools_web.reg_exp_init();

if (debug) {
    EnableLog("nlmk_export_reports_to_folder_agent");
}

function log(msg) {
    LogEvent("nlmk_export_reports_to_folder_agent", msg);
}

/**
 * Очищает условия настраиваемого отчета
 * @param {TopElem} reportTopElem TopElem отчета
 */
function disableCriterions(reportTopElem) {
    var criterion;
    for (criterion in reportTopElem.criterions) {
        criterion.value.Clear();
    }
}

/**
 * Удаляет файлы сформированных отчетов с указанным именем
 * @param {string} fileName имя файла
 * @param {string} path директория
 */
function deleteReportFiles(fileName, path) {
    regExp.Pattern = UrlAppendPath(FilePathToUrl(path), fileName) + " \\d{2}.\\d{2}.\\d{4}.xlsx";
    for (item in ReadDirectory(FilePathToUrl(path))) {
        if (regExp.Execute(item).Count > 0) {
            try {
                DeleteDoc(item);
                log("Удален файл " + item);
            } catch (e) {
                log("Не удалось удалить файл " + item + ": " + e);
            }
        }
    }
}

/**
 * Экспортирует отчет
 * @param {object} report параметры
 * @param { "true" | "false" | null } enable включен
 * @param { number } report ИД настраиваемого отчета
 * @param { string } file_name имя целевого файла
 * @param { string } path путь целевого файла
 * @param { "true" | "false" | null } use_params использовать условия отчета
 */
function buildReport(report) {
    if (!tools_web.is_true(report.GetOptProperty("enable"))) {
        return false;
    }

    log("=======");
    log("Формирование отчета '" + report.file_name + "'");

    if (!PathIsDirectory(report.path) || !IsDirectory(report.path)) {
        log("Указанной директории не существует: " + report.path);
        log("Отчет '" + report.file_name + "' не сформирован");
        return false;
    }

    if (tools_web.is_true(report.GetOptProperty("delete_old_files"))) {
        log("Удаляем старые файлы по отчету");
        deleteReportFiles(report.file_name, report.path);
    }

    var startDate = Date();
    var reportDoc = tools.open_doc(report.report);
    reportDoc.TopElem.initiator_person_id = 7283782138229714963;

    if (!tools_web.is_true(report.GetOptProperty("use_params"))) {
        // очищаем условия отчета
        log("Очищаем условия отчета");
        disableCriterions(reportDoc.TopElem);
    }

    // формируем путь для экспортируемого файла
    var sResourceUrl = UrlAppendPath(
        FilePathToUrl(report.path),
        report.file_name + " " + StrDate(Date(), false, false) + ".xlsx"
    );

    // формируем данные для отчета
    log("Формируем данные для отчета");
    tools.build_report_remote(
        Int(report.report),
        reportDoc.TopElem,
        null,
        local_settings.ui_lng_id.ForeignElem.short_id
    );

    // экспортируем данные отчета в Excel
    log("Экспортируем данные отчета в Excel");
    var sHTMLReport = tools_report.custom_report_html_export(
        reportDoc.TopElem.id,
        reportDoc.TopElem,
        reportDoc.TopElem.initiator_person_id,
        "xls"
    );

    log("Сохраняем файл Excel");
    var oXLS_X = tools.dotnet_host.Object.GetAssembly("Websoft.Office.Excel.dll").CreateClassObject(
        "Websoft.Office.Excel.Document"
    );
    oXLS_X.CreateWorkBook();
    oXLS_X.LoadHtmlString(sHTMLReport, "");
    oXLS_X.SaveAs(UrlToFilePath(sResourceUrl), true);

    log("Файл сохранен: " + UrlToFilePath(sResourceUrl));
    log("Отчет сформирован. Время выполнения: " + DateDiff(Date(), startDate) + " сек.");

    // удаляем кешированные данные для отчета
    DeleteDoc(
        "x-local://trash/temp/custom_reports/" +
            StrHexInt(Int(report.report)) +
            StrHexInt(Int(reportDoc.TopElem.initiator_person_id)) +
            ".xml"
    );

    return true;
}

function main() {
    log("Агент запущен");
    var report;
    for (report in reportsParams) {
        try {
            buildReport(report);
        } catch (e) {
            log(e);
        }
    }
    log("Агент завершен");
}

try {
    main();
} catch (e) {
    log(e);
}
