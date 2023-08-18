
function Log(logName, message, type, recordLogs) {

    if ( DataType(logName) == "string" && Trim(logName) != "" ) {
        EnableLog ( logName, true )
    } else {
        return undefined;
    }

	if (recordLogs) {
		LogEvent(logName , type != undefined ? "["+StrLowerCase(type)+"] "+message : message);
	} else if (type != undefined && StrLowerCase(type) == "warning") {
        EnableLog ( logName, true );
        LogEvent(logName , type != undefined ? "["+StrLowerCase(type)+"] "+message : message);
    }
}



var logName = "update_education_plans"
var recordLogs = false;


Log("TEST", "")

Log(logName, "TEST", "WARNING", true)