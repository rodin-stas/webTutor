function getDataFiles(file_url) {
    var loadData = [];
    var sExcelFileUrl = undefined;

    if (!LdsIsServer) {
        sExcelFileUrl = Screen.AskFileOpen('', 'Выберите файл Excel');
    } else {
        sExcelFileUrl = FilePathToUrl(file_url);
    }

    try {
        var oExcelFile = OpenDoc(sExcelFileUrl, 'format=excel');
        loadData = oExcelFile.TopElem[0];
    } catch (err) {
        alert('ОШИБКА: невозможно получить доступ к файлу ' + sExcelFileUrl + '\nСкорее всего, файл открыт.\nЗакройте файл и повторите попытку.');
    }

    return loadData;
}

function getNullPersonCode(_personCode) {
    while (StrCharCount(_personCode) < 8) {
        _personCode = '0' + _personCode
    }
    return _personCode;
}

function Log(log_file_name, message) {
    if (record_logs) {
        LogEvent(log_file_name, message);
    }
}

function main() {
    var successfulCount = 0;
    var failCount = 0;
    var aEntries = []
    var file_url = Param.file_url;
    var log_name = Trim(Param.log_name) != '' ? Param.log_name : "okpdtp_code";
    var record_logs = Param.record_logs;



    if (record_logs) {
        EnableLog(log_name, true)
    }

    Log(log_name, "Агент начал работу")

    var aData = getDataFiles(file_url);

    for (j = 1; j < ArrayCount(aData); j++) {
        aEntries.push({
            'tab': String(aData[j][0]),
            'code': String(aData[j][1]),
        })
    }

    aData = [];
    var uploadCount = ArrayCount(aEntries);
    var progressPartSize = (Real(uploadCount) / Real(10)) < 1 ? 10 : Math.ceil(Real(uploadCount) / Real(10));

    Log(log_name, "Всего данных на обработку: " + ArrayCount(aEntries));

    for (i = 0; i < ArrayCount(aEntries); i++) {
        try {
            curPerson = ArrayOptFirstElem(XQuery("for $elem in collaborators where $elem/login =" + XQueryLiteral(getNullPersonCode(aEntries[i].tab)) + "  return $elem"))
            if (curPerson != undefined) {
                personDoc = tools.open_doc(curPerson.id)
                personDoc.TopElem.custom_elems.ObtainChildByKey('okpdtp_code').value.Value = aEntries[i].code
                personDoc.Save();
                successfulCount++;
                Log(log_name, 'Обработано  ' + curPerson.id)
            }
        } catch (err) {
            failCount++;
            // alert(err)
            Log(log_name, 'ERROR: ' + err);
        }
        // if (i % progressPartSize === 0 && i !== 0) {
        //     Log(log_name, 'Обработано  ' + ((i / progressPartSize) * 10) + '% (' + (successfulCount / uploadCount) + ')')
        // }
    }

    Log(log_name, 'Обработано  ' + successfulCount);
    // Log(log_name, 'Успешно: ' + successfulCount);
    // Log(log_name, 'С ошибками: ' + failCount);
}





main();