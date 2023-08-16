


var log =  {
    global: "nlmk_log",
    level: 4,
    types: ["ERROR", "WARNING", "UNKNOWN", "INFO"]
};

function checkLogLevel(type) {
    if (StrCharCount(type) == 0) {
      write("Не передан тип логирования для проверки", "WARNING", "checkLogLevel");
      return false;
    }
  
    const availableLogTypes = ArrayRange(log.types, 0, level);
  
    return ArrayOptFind(availableLogTypes, "This == " + CodeLiteral(type));
}

function write(text, type, method, libname, code) {
    if (StrCharCount(text) == 0) {
      write("Не передан текст для записи в журнал", "WARNING", "log");
      return false;
    }
  
    type = StrUpperCase(type);
  
    const logString = `[${type}] [${libname}] : [${method}] ${text}`;
  
    if (checkLogLevel(type)) {
      EnableLog(code);
      LogEvent(code, logString);
      return true;
    }
  
    return false;
}

function info(text, method, libname, code) {
    return write(text, "INFO", method, libname, code);
}

function error(text, method, libname, code) {
  return write(text, "ERROR", method, libname, code);
}

function warning(text, method, libname, code) {
  return write(text, "WARNING", method, libname, code);
}



var logName = "TEst2";
var recordLogs =true;


try {
    logName = "TestLog"
    logLevel = 4;


    info("Test")
    error("error")
    warning("warning")

} catch(err) {
alert(err)
}