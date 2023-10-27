<%
	function initRegExp(actionName){
		var objRegExp = new ActiveXObject('VBScript.RegExp');
		objRegExp.Global = true;
		objRegExp.IgnoreCase = false;
		objRegExp.MultiLine = true;
		objRegExp.Pattern = "\\b\\s{1,}_{0,1}" + actionName + "\\b";
		return objRegExp;
	}

	function getMatch(input, actionName) {
		var objRegExp = initRegExp(actionName);
		var matches = objRegExp.Execute(input);
		if (matches.Count > 0) {
			return matches.item(0).Value;
		}
		return null;
	}

	function changeSourceCode(matchString, inputStr) {
		var body = StrRangePos(inputStr, 2, inputStr.length - 2);
		var readyFunc = body + 'return' + matchString + '( queryObjects );';

		return readyFunc;
	}

	Request.AddRespHeader( "Access-Control-Allow-Origin", "http://localhost:8080" ); 
	Request.AddRespHeader( "Access-Control-Allow-Credentials", "true" ); 
	Request.AddRespHeader( "Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,PATCH,OPTIONS" );
	Request.AddRespHeader( "Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers" );
        
	var query = Request.Query;
	var reqSourceCode = ArrayOptFirstElem(XQuery("sql: \n\
		select \n\
			ct.data.value('(custom_web_template/html)[1]','varchar(max)') source_code, \n\
			ct.data.value('(custom_web_template/url)[1]','varchar(500)') [url] \n\
		from \n\
			custom_web_template ct \n\
		where \n\
			ct.id=" + query.server_id));
	if (reqSourceCode != undefined) {
		var sourceCode = '';
		if (reqSourceCode.source_code != '') {
			sourceCode = String(reqSourceCode.source_code);
		} else if (reqSourceCode.url != '') {
			var path = FilePathToUrl(AppDirectoryPath() + '\\wt\\web\\') + String(reqSourceCode.url);
			sourceCode = LoadUrlData(path);
		}

		if (sourceCode != ''){
			var actionName = String(StrLowerCase(Request.Method) + '_' + query.action_name);
			var queryObjects = { Body: Request.Body, Form: Request.Form, Header: Request.Header, Request: Request, Response: Response, Query: Request.Query, DocID: query.server_id  };
			for (obj in query) {
				queryObjects.AddProperty(obj, query[obj]);
			}

			var matchString = getMatch(sourceCode, actionName);
			if (matchString != null) {
				if (matchString.charAt(1) == '_') {
					Response.Write(tools.object_to_text({ type: 'error', message: 'Функция недоступна' }, 'json'));
				} else {
					var newSourceCode = changeSourceCode(matchString, sourceCode);
					try {
						var result = eval(newSourceCode, queryObjects);
					} catch (e) {
						Response.Write(tools.object_to_text({ type: 'error', message: 'Не удалось вызвать функцию. Ошибка:' + e }, 'json'));
					}
					if (result != null && result != undefined)
						Response.Write(result);
				}
			} else {
				Response.Write(tools.object_to_text({ type: 'error', message: 'Функция не найдена' }, 'json'));
			}
		}
	}
%>