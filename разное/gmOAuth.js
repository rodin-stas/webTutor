function authenificate(Request, AuthLogin, AuthPassword){
	
	gmLogin = '';
	gmLoginCounter = 0;
	gmLoginMode = '';
	gmSessionCurUserId =  0;
	gmUserLoginedFrom = '';
	gmRequestedUrl = '';
	gmAutoLoginMode = '';
	gmError = '';
	gmErrorUrl = '';
	
	settings = getSettings();
	
	Session = Request.Session;
	
	logDbg("Request.Url - " + Request.Url);
	
	if (Session.GetOptProperty("gmLogin", '') != '' && StrContains(Request.Url, 'wss://')) {
		return Session.gmLogin;
	}
	
	var hasQuery = Request.Url.indexOf("?") != -1;
	
	if (hasQuery && (Request.Query.GetOptProperty("login_error","") != ""))
	{

		logDbg("Request has login_error");
		
		clearGMSession(Session);
		
		return "";
	}
	
	gmError = String(Session.GetOptProperty("gmError",""));	
	
	if (gmError != '')
	{
		logDbg("gmError - " + gmError);
		
		switch (gmError)
		{
			//внутренн€€ ошибка при проверке логина/парол€
			case 'form error1':
				
				gmErrorUrl = "?login_error=3";
				
				break;
			
			//неверный логин/пароль
			case 'form error2':
				
				gmErrorUrl = "?login_error=2";
				
				break;
				
			//ошибка при работе с Ћќ√»Ќом
			case 'login error1':
				
				gmErrorUrl = "?login_error=0";
				
				break;
				
			//в Ћќ√»Ќе нет инофрмации UCSPersonId
			case 'login error2':
				
				gmErrorUrl = "?login_error=1";
				
				
				//Request.Redirect(settings.UserLogoutUrl + "?ReturnUrl=" + UrlEncode(getNotAuthetificatedUri(Request)+  gmErrorUrl) + "&clientId=" + settings.ClientId);
                //Request.Redirect(settings.UserLogoutUrl);
                //return '';
				
				break;
				
			case 'login error3':
				
				gmErrorUrl = "?login_error=2";
				
			break;
		}

        Session.SetProperty("gmError","");
		
		//Request.Redirect(getNotAuthetificatedUri(Request) + gmErrorUrl);
        Request.Redirect('/default' + gmErrorUrl);
        return '';
	}

    if (!isNullOrEmpty(AuthLogin) && !isNullOrEmpty(AuthPassword)) {
        Session.gmLogin = findCollaboratorByLoginAndPassword(AuthLogin, AuthPassword);
        return Session.gmLogin;
    }

    target_url = Request.Session.GetOptProperty('target_url')
    if (target_url != undefined && Session.GetOptProperty("gmLogin", '') != '') {
        Request.Session.SetProperty('target_url', undefined);
        Request.Redirect(target_url);
    }
	
	try
	{
		gmLogin = String(Session.GetOptProperty("gmLogin",""));
		gmSessionCurUserId =  OptInt(Session.GetOptProperty("cur_user_id",0),0);
		logDbg("gmSessionCurUserId:" + gmSessionCurUserId + " gmLogin:" + gmLogin);
	}
	catch(err)
	{
		logError(err);
		return "";
	}	
	
	if ( hasQuery && (Request.Query.GetOptProperty("logout","0") == "1"))
	{
		logDbg("logout=1" );
		
		if (Request.Session.GetOptProperty('gmOAuthToken', '') != '') {
			logoutUrl = settings.UserLogoutUrl;
			logoutUrl += '?';
			logoutUrl += ('id_token_hint=' + Request.Session.GetOptProperty('gmOAuthToken', ''));
			logoutUrl += '&';
			logoutUrl += 'post_logout_redirect_uri=' + settings.NotAuthetificatedUrl + '?login_error=2';
			
			Request.Redirect(logoutUrl);
		
			return gmLogin;
		} else {
			gmUserLoginedFrom = String(Session.GetOptProperty("gmUserLoginedFrom","form"));
		
			clearGMSession(Session);
		
			logDbg("gmUserLoginedFrom = " + gmUserLoginedFrom);
			
			logoutUrl = settings.NotAuthetificatedUrl;
								
			logDbg("logoutUrl = " + logoutUrl);
			
			Request.Redirect(logoutUrl);
			
			return '';
		}
	}
	
	if (gmSessionCurUserId == 0)
	{
		gmLoginMode = Request.Query.GetOptProperty("entry_mode","");
		
		logDbg("gmLoginMode=" + gmLoginMode);
		
		gmLoginCounter = Session.GetOptProperty("gmLoginCounter","0")
		
		logDbg("gmLoginCounter=" + gmLoginCounter);
		
		if (Request.Session.GetOptProperty('target_url') == undefined && !StrContains(Request.Url, '/default') && !StrContains(Request.Header.GetOptProperty('$url'), 'lpapi.html')) {
            Request.Session.SetProperty('target_url', Request.Header.GetOptProperty('$url'));
        }
		
		if (gmLoginCounter != "0")
		{
			logDbg("gmLoginCounter !=0");
			
			gmLoginFormError = Session.GetOptProperty("gmLoginFormError","0");
			
			if (gmLoginFormError == "0")
				errorUrl = "?login_error=1";
			else
				errorUrl = "?login_error=2";
			
			logDbg("errorUrl - " + errorUrl);
			
			Session.gmLoginCounter = "0";
			Session.gmLoginFormError = "0";
			
			Request.Redirect(getNotAuthetificatedUri(Request) + errorUrl);
			return "";
		}		
		
		gmRequestedUrl = String(Session.GetOptProperty("gmRequestedUrl",""));	
	
		if (gmRequestedUrl == "" && gmLogin == "")
		{
			logDbg("gmRequestedUrl - " + gmRequestedUrl);
			
			if (Request.Url != getNotAuthetificatedUri(Request))
				Session.gmRequestedUrl = removeServicesParmFromUrl(Request.Url);
			
			logDbg("Request.Url - " + Request.Url);
			logDbg("gmRequestedUrl - " + gmRequestedUrl);
		}	
		
		gmAutoLoginMode = Request.Query.GetOptProperty("autologin_mode","");	
		
		if (gmAutoLoginMode == "login")
		{
			logDbg("gmAutoLoginMode - " + gmAutoLoginMode);
			
			processRedirectToOAuth(Request);
		}
		
		if (isOAuthResponse(Request))
		{
			logDbg("in if isOAuthResponse");
			
			Session.gmLoginCounter = "1";			
			
			try
			{
				gmLogin = processOAuthResponse(Request);
			}
			catch(err)
			{
				logError(err);
				
				Session.gmError = err.message;
			}			
			
			if (gmLogin != '')
				Session.gmUserLoginedFrom = "login";
			
			Session.gmLogin = gmLogin;
			
			redirectAuthenificatedUser (Request, gmLogin);
			
			return gmLogin;
		}
		else
		{
			logDbg("in not if isOAuthResponse");			
			
			switch (gmLoginMode)
			{
				case "login":
				case "login2":
					
					processRedirectToOAuth(Request,gmLoginMode);
					break;
					
				case "form":
					
					Session.gmLoginCounter = "1";
					
					gmLogin = '';
				
					if (Request.Form.HasProperty("user_login") || Request.Form.HasProperty("user_login2"))
					{
						try
						{
							gmLogin = processLoginForm(Request);
						}
						catch(err)
						{
							logError(err);
							
							Session.gmError = err.message;
						}
					}
					
					logDbg("in processLoginForm found gmLogin - '" + gmLogin + "'");					
					
					Session.gmLogin = gmLogin;	
					
					redirectAuthenificatedUser (Request, gmLogin);
		
					return gmLogin;
					
					break;
					
				case "":				
					
					return "";
					break;
			}			
		}
	}
	else
	{
		logDbg("gmLogin found  - '" + gmLogin +"'");
	}	
	
	return gmLogin;
}

function isOAuthResponse(Request){
	
	oauthCode = Request.Query.GetOptProperty("code");
	
	return oauthCode != undefined;	
}

function processLoginForm(Request){
	
	logDbg('start processLoginForm');
	
	if (Request.Form.GetOptProperty('user_login2','') == '')
	{
		sLogin = Request.Form.user_login;
		sPassword = Request.Form.user_password;
	}
	else
	{
		sLogin = Request.Form.user_login2;
		sPassword = Request.Form.user_password2;
	}
	
	logDbg("sLogin - '" + sLogin +"'");
	logDbg("sPassword - '" + sPassword +"'");
	
	loginFounded = findCollaboratorByLoginAndPassword(sLogin, sPassword);	

	Request.Session.gmUserLoginedFrom = "form";
	
	return loginFounded;
	
}

function processOAuthResponse(Request){
	
	logDbg('start processOAuthResponse');
	
	settings = getSettings();		
	
	//получаем токен
	
	code = Request.Query.GetOptProperty("code");
	
	strHeaders = "Content-Type: application/x-www-form-urlencoded\nIgnore-Errors: 1\n";
	
	strRequest = "grant_type=authorization_code&redirect_uri=" + UrlEncode(settings.RedirectUrl) + "&client_id=" + settings.ClientId + "&client_secret=" + UrlEncode(settings.Secret) + "&code=" + code;	
	logDbg('strRequest - ' + strRequest);
	logDbg('TokenUrl - ' + settings.TokenUrl);
	
	try
	{
		tokenResponse = HttpRequest(
			settings.TokenUrl,
			'post',
			strRequest,
			strHeaders	
		);	

        if (OptInt(tokenResponse.RespCode) != 200) {
            responseBody = tools.read_object(tokenResponse.Body, 'json');
            logError('ќшибка получени€ токена - ' + responseBody.error + ' - ' + responseBody.error_description);

            throw ("login error1");
        }

		logDbg('httpCode - ' + tokenResponse.RespCode);

		logDbg('Body - ' + tokenResponse.Body);	

		tokenData = tools.read_object(tokenResponse.Body);
		
		logDbg('tokenData - ' + tokenData.access_token);
	}
	catch (err)
	{
		logError('ќшибка получени€ токена - ' + err);
		
		throw ("login error1");
		
	}	
	
	//получаем данные юзера
	strHeaders = "Accept: application/json \nAuthorization: Bearer " + tokenData.access_token;
	logDbg(strHeaders);
	
	logDbg("DataUrl" + settings.DataUrl);
	
	
	try {
		userResponse = HttpRequest(
			settings.DataUrl,
			'get',
			'',
			strHeaders	
		);	
	}
	catch (err)
	{
		logError('ќшибка получени€ данных пользовател€ - ' + err);
		
		throw ("login error1");
		
	}
	
	logDbg('httpCode - ' + userResponse.RespCode);	
	
	logDbg('userResponse.Body - ' + userResponse.Body);
	userData = tools.read_object(userResponse.Body);

    login = userData.GetOptProperty('employeeTabNumber', '');
	
	//login = OptInt(login, '');
	
	//uid
	//employeeTabNumber
    if (login == '') {
		//login = userData.GetOptProperty('uid', '');
		//if (login == '') {
			throw ("login error2");
		//}
    }
	
	login = OptInt(login, '');
	
	//login = findCollaborator(arrUIDs);
    isLoginExists = ArrayOptFirstElem(XQuery("sql: SELECT * FROM collaborators WHERE login = '" + login + "' AND web_banned != 1")) != undefined;
    if (!isLoginExists) {
        throw ("login error3");
    }
	
	// Выдаем роль сотруднику
	var ADMIN_USERS = ArrayExtract(XQuery("for $elem in group_collaborators where $elem/code = 'admin_role' return $elem"), "This.collaborator_id"); 
	var findUser = ArrayOptFirstElem(XQuery("sql: SELECT * FROM collaborators WHERE login = '" + login + "' AND web_banned != 1"));

	if ( findUser.role_id != 'admin' && userData.HasProperty("memberof") ) {
		var allUsersGroup = [];
		var rolesArr = XQuery("for $elem in cc_role_models return $elem");
		for (el in userData.memberof) {
			allUsersGroup.push(el.split(",")[0].split("CN=")[1])
		}
		var relevantGroup = ArrayIntersect( rolesArr, allUsersGroup, "This.ad_role", "This");
		var releventCount = ArrayCount(relevantGroup);
		var resultRole = null;
		if ( releventCount > 0 ) {
			// ЕСЛИ ГРУППА ОДНА ТО ВСЕ ОК И ПРОСТО ВЫДАЕМ СООТВЕТСТВУЮЩУЮ РОЛЬ
			if (releventCount == 1) {
				resultRole = relevantGroup[0].wt_role;
			} else {
				// Начинаем концерт
				roleStr = ArrayMerge(ArraySort(ArrayExtract(relevantGroup, "This.wt_role"), "This", "+"), "This", ";")
				findRole = ArrayOptFirstElem(XQuery("for $elem in cc_overlapping_roles where $elem/role_str = '"+roleStr+"' return $elem"));
				if (findRole == undefined) {
					// Если такой роли нет, пишем писом админам и решаем вопрос РУКАМИ
					resultRole = null;
					var mesageText = "Сотрудник c ID = " +findUser.id+ " хотел получить роль доступа = " +roleStr+ " ,но в справочнике cc_overlapping_roles такой нет."
					for (el in ADMIN_USERS) {
						tools.create_notification("nlmk_blitz_error", el, mesageText );
					}
					// tools.create_notification("code_letter2", findUser.id, mesageText ); // Мы знаем о проблеме
				} else {
					resultRole = findRole.wt_role;
				}
			}
			if (resultRole != null && resultRole != findUser.role_id) {
				userCard = tools.open_doc(findUser.id);
				userCard.TopElem.access.is_arm_admin = 1;
				userCard.TopElem.access.access_role = resultRole;
				userCard.Save();
				tools.create_notification("nlmk_blitz_ok", findUser.id, resultRole );
			}
		} else {
			// Сброс роли
			if (findUser.role_id != 'user' ) {
				userCard = tools.open_doc(findUser.id);
				userCard.TopElem.access.is_arm_admin = 0;
				userCard.TopElem.access.access_role = 'user';
				userCard.Save();
			}
		}
	}
	// Конец блока
	
	Request.Session.SetProperty('gmOAuthToken', tokenData.id_token);
	
	logDbg('login - ' + login);
	
	return login;
}
function redirectAuthenificatedUser(Request, userLogin)
{
	logDbg('start redirectAuthenificatedUser');
	logDbg('userLogin ' + userLogin);
	
	s = Request.Session;
    settings = getSettings()
	
	requestedUrl = UrlEncode('home');
    if (Request.Session.GetOptProperty('target_url') != undefined) {
        requestedUrl = Request.Session.GetOptProperty('target_url');
		Request.Session.SetProperty('target_url', undefined);
    }
	
	logDbg('requestedUrl ' + requestedUrl);
	
	if (requestedUrl != "" && userLogin != "")
	{
		s.gmRequestedUrl = "";
		
		s.gmLoginCounter = "0";
		
		logDbg('redirecting redirectAuthenificatedUser to ' + requestedUrl);
		Request.Redirect(requestedUrl);
	}
}

function processRedirectToOAuth(Request,gmLoginMode)
{
	
	logDbg('start processRedirectToOAuth');
	
	s = getSettings();
	
	redirectUrl = s.UserRedirectUrl + 
		"&client_id=" + s.ClientId + 
		"&redirect_uri=" + UrlEncode(s.RedirectUrl);
		//"&scope=" + UrlEncode(s.Scope);
		
	if (gmLoginMode == "login2")
		redirectUrl = redirectUrl + "&login_mode=2";
		
	logDbg('redirectUrl - ' + redirectUrl);
	
	Request.Redirect(redirectUrl);
}

function getRedirectUri(Request){
	
	logDbg('start getRedirectUri');
	
	redirectUri = '';
	
	curSite = tools.open_doc(Request.Session.Env.curSiteID).TopElem;

	if (String(Request.Session.GetOptProperty("gmRequestedUrl","")) == "")
	{
		redirectUri = curSite.first_authorized_url.HasValue ? curSite.first_authorized_url : "view_doc.html?mode=home";
		redirectUri = UrlSchema(Request.Url) + "://" + Request.UrlHost +"/" + redirectUri;
	}
	else
	{
		redirectUri = removeServicesParmFromUrl(Request.Session.gmRequestedUrl);
	}
	
	logDbg('redirectUri = ' + redirectUri);
	
	return redirectUri;
}

function removeServicesParmFromUrl(url){
	
	logDbg('start removeServicesParmFromUrl');
	
	url =  removeParamFromUrl(url, "autologin_mode");
	
	return url;
}

function removeParamFromUrl(url, removeParm){	

	logDbg('start removeParamFromUrl');

	urlParam = UrlParam(url);

	parmStartPos = urlParam.indexOf(removeParm);
	
	if (parmStartPos == -1)
		return url;

	parmEndPos = urlParam.indexOf("&",parmStartPos);

	if (parmEndPos == -1)
		parmEndPos = urlParam.length;

	urlParamCleared = StrReplace(StrReplace(urlParam, urlParam.slice(parmStartPos, parmEndPos),""),"&&", "&");

	if (StrBegins(urlParamCleared, "&"))
		urlParamCleared = StrCharRangePos(urlParamCleared,1,urlParamCleared.length);

	urlCleared = UrlSchema(url)+"://"+ UrlHost(url) + UrlPath(url) + "?" + urlParamCleared;

	return urlCleared;
}

function getNotAuthetificatedUri(Request){
	
	logDbg('start NotAuthetificatedUri');
	
	notAuthUri = '';

    try {
        curSite = tools.open_doc(Request.Session.Env.curSiteID).TopElem;
    } catch(ex) {
        if (Request.Session.GetOptProperty('target_url') == undefined && !StrContains(Request.Url, '/default') && !StrContains(Request.Header.GetOptProperty('$url'), 'lpapi.html')) {
            Request.Session.SetProperty('target_url', Request.Header.GetOptProperty('$url'));
        }
        return ('/default');
    }
	
	notAuthUri = curSite.first_unauthorized_url.HasValue ? curSite.first_unauthorized_url : "view_doc.html?mode=default";
	
	logDbg('NotAuthetificatedUri = ' + notAuthUri);
	
	return notAuthUri;
}

function findCollaboratorByLoginAndPassword(sLogin, sPassword){
	logDbg('start findCollaboratorByLoginAndPassword');
	
	colLogin = '';
	
	strWhere = '';
	
	colls = [];

	strQuery = "for $elem in collaborators where $elem/login = '" + sLogin + "' return $elem";

	logDbg('strQuery - ' + strQuery);
	
	try
	{
		colls = XQuery(strQuery);
	}
	catch(err)
	{
		logError ("XQuery err - " + err);
		
		//throw ("form error1");
		return '';
	}
0
	if (ArrayCount(colls) != 1)
	{
		logError ("count cols - " + ArrayCount(colls));
		
		//throw ("form error2");
		return '';
	}

	colId = ArrayOptFirstElem(colls).id;
	
	logDbg('found colId  - ' + colId);
	
	try
	{
		doc = OpenDoc(UrlFromDocID(colId));
	}
	catch(err)
	{
		logError ("doc open error - " + err);
		
		//throw ("form error1");
		return '';
	}
	
	if ( (doc.TopElem.password == sPassword) || (doc.TopElem.password == "(" + HexData(SHA256(sPassword))  +")" ) )
	{
		colLogin = doc.TopElem.login;		
	}
	
	//if (colLogin == '')
        //throw ("form error2");
	
	return colLogin;
}

function logDbg(msg){
	
	EnableLogExt('OAuth','life-time=day');
	
	if (logLevel()>=2)
		LogEvent('OAuth',"gmOAuth: " + msg);
}

function logMsg(msg){
	
	EnableLogExt('OAuth','life-time=day');
	
	if (logLevel()>=1)
		LogEvent('OAuth',"gmOAuth: " + msg);
}

function logError(msg){
	
	EnableLogExt('OAuth','life-time=day');
	
	if (logLevel()>=0)
		LogEvent('OAuth',"gmOAuth error: " + msg);
}

function logLevel(){
	
	return OptInt(AppConfig.OA_LogLevel,0);
}

function clearGMSession(Session){
	
	Session.gmLoginCounter = "0";
	Session.gmLoginFormError = "";
	Session.gmLogin = "";
	Session.gmUserLoginedFrom = "";		
	Session.gmRequestedUrl = "";
	Session.cur_user_id = "0";
	Session.gmError = "";
	Session.gmOAuthToken = '';
}

function getSettings(){
	var s  = new Object();	
	
	try
	{
		s.UserRedirectUrl 		= AppConfig.OA_UserRedirectUrl;
        s.RedirectUrl    		= AppConfig.OA_RedirectUri;
		s.UserLogoutUrl			= AppConfig.OA_UserLogoutUrl;
		s.NotAuthetificatedUrl  = AppConfig.OA_NotAuthetificatedUri;
		s.ClientId 				= AppConfig.OA_ClientId;
		s.Secret 				= AppConfig.OA_Secret;
		s.Scope 				= AppConfig.OA_Scope;	
		s.TokenUrl 				= AppConfig.OA_TokenUrl;
		s.DataUrl 				= AppConfig.OA_DataUrl;
	}
	catch(err)
	{
		logDbg("getSettings error - " + err);
	}
	
	return s;
}

function isNullOrEmpty(value) {
    return (value == null || value == undefined || value == '');
}