
function createLog(logName, recordLogs) {
    if(logName == '' || logName == undefined) {
        logName = "nlmk_log"
    }
    if (recordLogs) {
        EnableLog ( logName, true )
    }
}
function Log(recordLogs, logName , message, type) {
    if(logName == ''|| logName == undefined) {
        logName = "nlmk_log"
    }
	if (recordLogs) {
		LogEvent(logName , type != undefined ? "["+StrLowerCase(type)+"] "+message : message);
	} else if (type != undefined && StrLowerCase(type) == "warning") {
        createLog(logName, true);
        LogEvent(logName , type != undefined ? "["+StrLowerCase(type)+"] "+message : message);
    }
}



var logName = "update_education_plans"
var recordLogs = false;




createLog(logName,recordLogs) ;

Log(recordLogs, logName, "TEST", "Info")

Log(recordLogs, logName, "TEST", "WARNING")