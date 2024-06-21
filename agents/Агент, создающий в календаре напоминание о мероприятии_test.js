daysCount=OptInt(Param._daysCount); // берём из Переменной период за который отбираются мероприятия и по которым будут созданы напоминания ( текущая дата + daysCount )
OrgUser=Param._OrgUserFIO; // берём из Переменной пользователя, от имени которого будет создано в календаре напоминание
OrgUserMail=Param._OrgUserMail; // берём из Переменной адрес пользователя, от имени которого будет создано напоминание в календаре
DefCharset="utf-8"; //кодировка по умалчанию
ReminderDays=OptInt(Param._ReminderDays); // берём из Переменной частоту создания напоминаний 
if (OptInt(Param._SendFeedback)==1) SendFeedback=true; else SendFeedback=false; // берём из Переменной: отправлять ли пользователю от имени которого было послано напоминание сообщение о добавлении напоминания в календарь
if (OptInt(Param._SendInvitationsToParticipants)==1) SendInvitationsToParticipants=true; else SendInvitationsToParticipants=false; // берём из Переменной: отправлять ли уведомление для создания напоминания участникам мероприятия
if (OptInt(Param._SendInvitationsToLectors)==1) SendInvitationsToLectors=true; else SendInvitationsToLectors=false; // берём из Переменной: отправлять ли уведомление для создания напоминания преподавателям
if (OptInt(Param._SendInvitationsToResponsibleOfEvent)==1) SendInvitationsToResponsibleOfEvent=true; else SendInvitationsToResponsibleOfEvent=false; // берём из Переменной: отправлять ли уведомление для создания напоминания ответственным за проведение мероприятия
if (OptInt(Param._SendInvitationsToResponsibleOfEventPreparation)==1) SendInvitationsToResponsibleOfEventPreparation=true; else SendInvitationsToResponsibleOfEventPreparation=false; // берём из Переменной: отправлять ли уведомление для создания напоминания ответственным за подготовку мероприятия
if (OptInt(Param._ShowShortDescription)==0) ShowShortDescription=true; else ShowShortDescription=false; // берём из Переменной: показывать краткую/полную информацию о мероприятии в напоминании (по умолчанию - Показывать краткую информацию)
BASE_TIME_ZONE = OptReal(Param._BASE_TIME_ZONE); // берём из Переменной часовой пояс времени, указываемого в параметрах карточки мероприятия
Custom_Field_Code = Param._custom_field_code; // Код кастомного поля (по умолчанию f_n84u). После создания напоминания в карточке мероприятия в этом поле прописывается служебная информация. По умолчанию это поле скрыто от показа в карточке. Чтобы его показать, необходимо создать дополнительное поле (типа Строка) для объекта Мероприятие с данным кодом. Чтобы сформировалось повторное уведомление необходимо очистить данное поле в карточке нужного мероприятия и запустить агент сервера еще раз. Уведомление не приходят если уже заполнено кастом поле (то есть сотрудникам уже однажды отправлялось такое уведомлении).
//----------------------------------
ModDate="03.09.2022"; // скорее всего - дата разработки Агент, выводится в лог, больше нигде не участвует
ShowAlert=true; // писать сообщения в логи сервера при запуске на стороне сервера или показывать сообщения в модальных окнах при запуске на клиенте
_person_email = "";
//alert('uniCalendarEntryAgent starts'); // сообщение о запуске Агента - отключил
try
{
	ReminderDays=Int(ReminderDays); // пытаемся привести количество дней к целому числу, если не получается - сообщим об ошибке и установим параметр в 0, но в нашем случае это не актуально, так как мы берём значение из переменно и приводим к целому числу выше. Оставил как было в исходном коде - на работу это не влияет.
}
catch(ex)
{
	alert('Impossible to convert ReminderDays number to integer. There will be no reminder in the calendar.')
	ReminderDays=0;
}

// блок сообщений с выводом параметров Агента
if (ShowAlert) alert("ModDate="+ModDate);
if (ShowAlert)
{ 
	alert("daysCount="+daysCount);
	alert("OrgUser="+OrgUser);
	alert("OrgUserMail="+OrgUserMail);
	alert("DefCharset="+DefCharset);
	alert("ReminderDays="+ReminderDays);
	alert("SendFeedback="+SendFeedback);
	alert("SendInvitationsToParticipants="+SendInvitationsToParticipants);
	alert("SendInvitationsToLectors="+SendInvitationsToLectors);
	alert("SendInvitationsToResponsibleOfEvent="+SendInvitationsToResponsibleOfEvent);
	alert("SendInvitationsToResponsibleOfEventPreparation="+SendInvitationsToResponsibleOfEventPreparation);
	alert("ShowShortDescription="+ShowShortDescription);
}

SmtpFound=false
// ниже мы пытаемся получить параметры сервера отправки сообщений. Если не понятно, отрабатывает ли этот этап, можно либо убрать try-catch, либо после try-catch вывести значение SmtpFound
try
{
	_client = SmtpClient(); // создание нового объекта SMTP-клиента. Объект SmtpClient выполняет настройку отсылки и собственно отсылку электронного почтового сообщения, сформированного с использованием объекта MailMessage. https://news.websoft.ru/_wt/wiki_base/6763503595518043978
	if ( global_settings.settings.own_org.smtp_server == '' )
		return false;
		
	_Notification_system = ArrayOptFirstElem(XQuery('for $elem in notification_systems where $elem/code = "email" return $elem')); // получим систему уведомлений с кодом email
	_doc_Notification_system = OpenDoc(UrlFromDocID(_Notification_system.id));
	if (_doc_Notification_system.TopElem.parameters.GetOptChildByKey('bUseTLSPort','name').value == 'true') // получение параметра - Использовать TLS порт (Выделенный SSL-порт)
		_client.UseTLSPort = true;
	if (_doc_Notification_system.TopElem.parameters.GetOptChildByKey('bUseTLS','name').value == 'true') // получение параметра - Использовать TLS (Использовать SSL)
		_client.UseTLS  = true;


	// получение параметра - Использовать TLS порт (Выделенный SSL-порт)
	try { if (OptInt(Param.UseTLSPort)==1) _client.UseTLSPort = true;
	} catch (err) {}
	try { if (OptInt(Param.UseTLSPort)==0) _client.UseTLSPort = false;
	} catch (err) {}
	// Если данные параметры выбраны в переменных - берём их оттуда
	// получение параметра - Использовать TLS (Использовать SSL) 
	try { if (OptInt(Param.UseTLS)==1) _client.UseTLS = true;
	} catch (err) {}
	try { if (OptInt(Param.UseTLS)==0) _client.UseTLS = false;
	} catch (err) {}

	_client.OpenSession( global_settings.settings.own_org.smtp_server ); // Производится открытие сессии SMTP-клиента, заданного в параметре SMTP-сервер (Общие настройки - Администрирование - Отправка сообщений - SMTP-сервер). OpenSession() - метод объекта SmtpClient. Открывает сессию SMTP-клиента. https://news.websoft.ru/_wt/wiki_base/6765733987730485815/base_wiki_article_type_id/6680054725638828770/parent_id/6763503595518043978

	if ( global_settings.settings.own_org.use_smtp_authenticate ) // проверяем, используется ли аутентификация на SMTP сервере (Общие настройки - Администрирование - Отправка сообщений - Использовать аутентификацию на SMTP сервере)
		_client.Authenticate( global_settings.settings.own_org.smtp_login, global_settings.settings.own_org.smtp_password ); // Если да - выполняется аутентификация с указанными Логином-Паролем (Общие настройки - Администрирование - Отправка сообщений - Использовать аутентификацию на SMTP сервере - Логин / Пароль). Authenticate() - Метод объекта SmtpClient. Выполняет аутентификацию связи SMTP-клиента с почтовым сервером https://news.websoft.ru/_wt/wiki_base/6765733636139275991/base_wiki_article_type_id/6680054725638828770/parent_id/6763503595518043978
	
	SmtpFound=true; // если все условия сработали без ошибок - ставим переменной значение true, оно будет проверять далее и 
}
catch ( aa )
{
	LogEvent( 'email', aa );
	alert( aa );		
}	

// условие ниже выполнится, только если получены параметры сервера отправки сообщений (условие выше)
if (SmtpFound)
{
	try
	{
		sender_address = global_settings.settings.own_org.email; // адрес отправителя, установленный в параметрах Общие настройки - Администрирование - Отправка сообщений - Адрес электронной почты
	
		_start_date=Date(); // текущая дата с часами-минутами-секундами
		_start_date=Date(DateNewTime(_start_date,00,00,00)); // текущая дата с обнулёнными часами-минутами-секундами 00:00:00
		_end_date=RawSecondsToDate( DateToRawSeconds(_start_date)  + (daysCount)*86400); // daysCount дней спустя от текущей даты (сдвиг текущей даты на daysCount в будущее) с часами-минутами-секундами
		_end_date=Date(DateNewTime(_end_date,23,59,59)); // daysCount дней спустя от текущей даты (сдвиг текущей даты на daysCount в будущее) с часами-минутами-секундами 23:59:59
		
		// выводим сообщение о полученных датах в лог
		if (ShowAlert) alert("start="+_start_date+" end="+_end_date);
		
		event_arr=XQuery( "for $obj in events where ($obj/status_id='plan' or $obj/status_id='active') and $obj/start_date!= null() and $obj/start_date>= date('" +_start_date+"') and $obj/start_date<=date ('" +_end_date+"') return $obj" ); // получим массив мероприятий в статусе Планируется и Проводится с непустой датой начала, находящейся в промежутке между сегодняшней датой и daysCount в будущее

		// выводим сообщение о количестве таких мероприятий в лог
		if (ShowAlert) alert('ArrayCount(event_arr)='+ArrayCount(event_arr));
		
		// проходим в цикле по каждому мероприятию
		for ( _event in event_arr )
		{
			docEvent = OpenDoc( UrlFromDocID(_event.id)); // открываем документ мероприятия
			teEvent=docEvent.TopElem; // обращаемся к его поляем через TopElem
			
			file_id=String(_event.id).slice(String(_event.id).length-6); // выводит 6 последних символов id мероприятия, используется для формирования письма-события в календарь, видимо, такой способ нумерации
            PORTAL_URL = global_settings.settings.portal_base_url;	// адрес учебного портала, например, university.ru (Общие настройки - Портал - Адрес учебного портала )
			_event_settings = teEvent.event_settings;	// открываем настройки уведомлений мероприятия
			_is_send_lector_settings = tools_web.is_true(_event_settings.send_lectors);		//получаем настройки уведомлений по преподавателям
			lector_text = teEvent.custom_elems.ObtainChildByKey("lector_comment").value;
			lector_resource_id = teEvent.custom_elems.ObtainChildByKey("lector_resource").value;
		
			_header_host=UrlAppendPath( PORTAL_URL,'/_wt/'); // к адресу учебного портала добавляется https://university.ru/view_doc.html?mode=
			
			_as_ap='"'+'event_calendar_body'+'"'; // в блоке ниже идёт попытка получить ссылку на раздел портала с мероприятиями, но на тех порталах, где я работал сейчас это раздел календарь event_calendar_body, а раздел с кодом events найти не удаётся, поэтому это условие я передалал, изначально было _as_ap='"'+'events'+'"';
			_as_ap_arr=XQuery( 'for $elem in documents where $elem/code='+_as_ap+' and contains($elem/name, "календарь") return $elem' ); // это условие также дополнил, изначально оно не содержало and contains($elem/name, "календарь"), но я добавил это условие, чтобы мы получали ссылку на календарь мероприятий, а не на, например, раздел Вебинары. Изначально условие было таким: _as_ap_arr=XQuery( 'for $elem in documents where $elem/code='+_as_ap+' return $elem' );
			_as_ap_arr_fe=ArrayOptFirstElem(_as_ap_arr);
			
			_doc_id='';
			if (_as_ap_arr_fe!=undefined)
			{
				_doc_id=_as_ap_arr_fe.id;
			}
			
			// берётся из Переменной: показывать краткую/полную информацию о мероприятии в напоминании (по умолчанию - Показывать краткую информацию)
			if (ShowShortDescription)
			{
				// _header_host+'event&object_id='+_event.id+'&doc_id='+_doc_id - это ссылка на мероприятие в разделе Календарь мероприятий. В частном случае, если вдруг такая ссылка не работает (например, если раздел Календарь мероприятий доступен не всем) - можно сделать её короткой, только на само мероприятие, без раздела календарь мероприятий: _header_host+'event&object_id='+_event.id
				text_str='Тема: "'+teEvent.name+'" <br/>'+_header_host+_event.id;
				text_str_eng = 'Theme: "'+teEvent.name+'" <br/>'+_header_host+_event.id;
			}
			else
			{
				// _header_host+'event&object_id='+_event.id+'&doc_id='+_doc_id - это ссылка на мероприятие в разделе Календарь мероприятий. В частном случае, если вдруг такая ссылка не работает (например, если раздел Календарь мероприятий доступен не всем) - можно сделать её короткой, только на само мероприятие, без раздела календарь мероприятий: _header_host+'event&object_id='+_event.id
				text_str='Мероприятие "'+teEvent.name+'" запланировано: '+_header_host+_event.id;
				text_str_eng = 'Event "'+teEvent.name+'" planned: '+_header_host+_event.id;
			}
			if (ShowAlert) alert('teEvent.name='+teEvent.name); // выводим сообщение о названии мероприятия в лог
			_finish_date=Date(DateNewTime(_end_date,23,59,59));	// daysCount дней спустя от текущей даты (сдвиг текущей даты на daysCount в будущее) с часами-минутами-секундами 23:59:59. Немного странно, выше это же значение уже присваивалось переменной _end_date, можно было просто написать _finish_date = _end_date;
		
			if (teEvent.finish_date.HasValue) // если в мероприятии проставлена дата окончания (а она проставлена всегда)
			{
				_finish_date = teEvent.finish_date; // присваиваем переменной значение даты окончания из мероприятия
			}
		
            try{
				if (teEvent.place_id.HasValue) // если в мероприятии задано расположение
				{
					objPlace = OpenDoc(UrlFromDocID(teEvent.place_id)).TopElem; // открываем документ расположения
					PLACE_STR = Trim(objPlace.address); // задаём переменной Адрес из расположения
				}
				else
				{
					PLACE_STR = ""; // если расположение не проставлено - Адрес пустой
				}
            }
            catch(err){
                alert(err);
                PLACE_STR = "";
            }
            PLACE_STR += PLACE_STR!="" ? ", "+Trim(teEvent.place) : Trim(teEvent.place); // Если Адрес не пустой, то присваиваем переменной Расположение, Адрес. Иначе - просто Расположение

			arrRecipients=Array(); // массив получателей
			counter=0; // счётчик получателей
			arrAllIds = Array() // массив всех текущих идентификатор мероприятия для понимания кто был удален из мероприятия 
			_arr_str=teEvent.custom_elems.ObtainChildByKey(Custom_Field_Code).value; // здесь считываем значение кастомного поля из переменной (по умочанию - f_n84u). Про него сказано в описании Агента: После создания напоминания в карточке мероприятия в этом поле прописывается служебная информация. По умолчанию это поле скрыто от показа в карточке. Чтобы его показать, необходимо создать дополнительное поле (типа Строка) для объекта Мероприятие с данным кодом. Чтобы сформировалось повторное уведомление необходимо очистить данное поле в карточке нужного мероприятия и запустить агент сервера еще раз. Уведомление не приходят если уже заполнено кастом поле (то есть сотрудникам уже однажды отправлялось такое уведомлении).
			if (ShowAlert) alert('_arr_str='+String(_arr_str));
			was_cancelled = teEvent.custom_elems.ObtainChildByKey("was_canceled").value;
			_list=String(_arr_str).split(";");	// воспринимаем строку из этого кастомного поля как массив и делим её на элементы с разделителем ;
			_is_changed=false; // задаём переменную наличия изменений в false, позже будем с ней работать
			
			_lectors_list = '';
			for(lector_elem in teEvent.lectors)
			{
				lector_cat = ArrayOptFirstElem(XQuery('for $elem in lectors where $elem/id='+lector_elem.lector_id+' return $elem'));
				if(lector_cat != undefined)
				{
					if(_lectors_list == '')
						_lectors_list = ' - ' + lector_cat.person_fullname;
					else
						_lectors_list += '<br> - ' + lector_cat.person_fullname;
				}
			}
			
			// берём из Переменной: отправлять ли уведомление для создания напоминания участникам мероприятия (по умочанию - Да)
			if (SendInvitationsToParticipants)
			{
				for (iParticipantElem in teEvent.collaborators) // пройдём по участникам мероприятия 
				{
					_is_in_list=false; // переменная - присутствует ли в листе, кому уже отправили уведомления? (изначально - нет)
					arrAllIds.push(String(iParticipantElem.collaborator_id));
					
					for (_elem in _list) // присутствует ли в листе, кому уже отправили уведомления?
					{
						if (Trim(_elem)==Trim(iParticipantElem.collaborator_id))
						{
							if (ShowAlert) alert('111_is_in_list='+_is_in_list);
							_is_in_list=true; // присутствует
							break;
						}
					}
					// 02.03.2023, Проверяем что у сотрудника установлен статус Присутствие, VAV -->
					_IDPerson=XQuery("for $elem in event_results where $elem/is_assist=true() and $elem/event_id = " + teEvent.id  + " and  $elem/person_id = " + iParticipantElem.collaborator_id  + " return $elem");
					if (ArrayOptFirstElem(_IDPerson) == undefined)
					{
						_is_in_list=true;
					}
					// 02.03.2023, Проверяем что у сотрудника установлен статус Присутствие, VAV <--
					if (ShowAlert) alert('_is_in_list='+_is_in_list); // пишем в лог значение переменной присуствия в листе отправки прошлого уведомления
					if (_is_in_list!=true) // если ранее уведомление не отправлялось данному участнику
					{
						_person = ArrayOptFirstElem(XQuery('for $obj in collaborators where $obj/id='+iParticipantElem.collaborator_id+' return $obj')); // находим участника в каталоге пользователей
						if (_person == undefined)
							continue;

						if (String(_person.email) == ''){
							if (ShowAlert) alert(_person.fullname +"incorrect email"); // выводим в лог ФИО пользователя
							continue;
						}
						// проверим, нет ли ошибки в поле с электронной почтой. Если есть ошибка - пропустим формирование и отправку сообщения данному получателю
						if ((_person.email == '') || (StrContains (_person.email, '@', true) == false) || ((StrContains (_person.email, '.ru', true) == false) && (StrContains (_person.email, '.com', true) == false) && (StrContains (_person.email, '.ua', true) == false) && (StrContains (_person.email, '.net', true) == false) && (StrContains (_person.email, '.by', true) == false)) || StrContains (_person.email, '@.', true) || StrContains (_person.email, ' ', true) || StrContains (_person.email, '  ', true) || StrContains (_person.email, '!', true) || StrContains (_person.email, '#', true) || StrContains (_person.email, '$', true) || StrContains (_person.email, '&', true) || StrContains (_person.email, '~', true) || StrContains (_person.email, '#', true) || StrContains (_person.email, '=', true) || StrContains (_person.email, ',', true) || StrContains (_person.email, '..', true) || StrContains (_person.email, '<', true) || StrContains (_person.email, '>', true) || StrContains (_person.email, '/', true) || StrContains (_person.email, '*', true) || StrContains (_person.email, '[', true) || StrContains (_person.email, ']', true) || StrContains (_person.email, '{', true) || StrContains (_person.email, '}', true) || StrContains (_person.email, '|', true) || StrContains (_person.email, '^', true) || StrContains (_person.email, 'а', true) || StrContains (_person.email, 'б', true) || StrContains (_person.email, 'в', true) || StrContains (_person.email, 'г', true) || StrContains (_person.email, 'д', true) || StrContains (_person.email, 'е', true) || StrContains (_person.email, 'ё', true) || StrContains (_person.email, 'ж', true) || StrContains (_person.email, 'з', true) || StrContains (_person.email, 'и', true) || StrContains (_person.email, 'й', true) || StrContains (_person.email, 'к', true) || StrContains (_person.email, 'л', true) || StrContains (_person.email, 'м', true) || StrContains (_person.email, 'н', true) || StrContains (_person.email, 'о', true) || StrContains (_person.email, 'п', true) || StrContains (_person.email, 'р', true) || StrContains (_person.email, 'с', true) || StrContains (_person.email, 'т', true) || StrContains (_person.email, 'у', true) || StrContains (_person.email, 'ф', true) || StrContains (_person.email, 'х', true) || StrContains (_person.email, 'ц', true) || StrContains (_person.email, 'ч', true) || StrContains (_person.email, 'ш', true) || StrContains (_person.email, 'щ', true) || StrContains (_person.email, 'ъ', true) || StrContains (_person.email, 'ы', true) || StrContains (_person.email, 'ь', true) || StrContains (_person.email, 'э', true) || StrContains (_person.email, 'ю', true) || StrContains (_person.email, 'я', true)){
							if (ShowAlert) alert(_person.fullname +"incorrect email"); // выводим в лог ФИО пользователя
							continue;
						}
						if (ShowAlert) alert(_person.fullname); // выводим в лог ФИО пользователя

						curLng = tools.call_code_library_method("nlmk_localization", "getCurLng", [iParticipantElem.collaborator_id, null]);
						if (ShowAlert) alert(curLng); 

						NewElem=new Object; // создаём переменную - новый объект
						NewElem.email=_person.email; // пишем в неё свойство - почту пользователя
						NewElem.fullname=_person.fullname; // пишем в неё свойство - ФИО пользователя
						NewElem.place_id= (!tools_library.string_is_null_or_empty(_person.place_id) ? _person.place_id : ""); // пишем в неё свойство - Расположение пользователя
						NewElem.is_lector = false; // пишем в неё свойство - является ли преподавателем
						NewElem.is_participant = true; // пишем в нее свойство - является ли участникам мероприятия
						NewElem.id = _person.id; // пишем в нее свойство - айди сотрудника
						NewElem.curLng = curLng;
						arrRecipients[counter]=NewElem; // присваиваем в массив получателей
						counter++; // увеличиваем счётчик таких элементов

						_arr_str=_arr_str+iParticipantElem.collaborator_id+";"; // дописываем данного сотрудника в переменную с сотрудниками, кому отправлялось уведомление
						_is_changed=true; // изменения внесены
					}
					if (ShowAlert) alert('_is_changed='+_is_changed); // пишем в лог, что изменения внесены
				}
			}

			// берём из Переменной: отправлять ли уведомление для создания напоминания преподавателям
			// Так же проверяем настрйоки мероприятия
			
			if (SendInvitationsToLectors)
			{
                if (ShowAlert) alert('Преподаватели'); // пишем в лог заголовок Преподаватели
				for (iLectorElem in teEvent.lectors) // проходим по преподавателям мероприятия
				{
					_is_in_list=false; // переменная - присутствует ли в листе, кому уже отправили уведомления? (изначально - нет)
					arrAllIds.push(String(iLectorElem.lector_id));
					
					for (_elem in _list) // присутствует ли в листе, кому уже отправили уведомления?
					{
						if (Trim(_elem)==Trim(iLectorElem.lector_id))
						{
							_is_in_list=true; // присутствует
							break;
						}
					}
					if (ShowAlert) alert('_is_in_list='+_is_in_list); // пишем в лог значение переменной присуствия в листе отправки прошлого уведомления
					if (_is_in_list!=true) // если ранее уведомление не отправлялось преподавателю
					{
						_lector=ArrayOptFirstElem(XQuery( 'for $obj in lectors where $obj/id='+iLectorElem.lector_id+' return $obj')); // находим преподавателя в каталоге преподавателей (если вдруг не будет находить, то нужно будет изменить на каталог пользователей, но тогда искать будет только среди пользователей)
						if (_lector == undefined)
							continue;
						
						// MPROS START //
						if(_is_send_lector_settings)
							tools.call_code_library_method("nlmk", "create_notification", [ '55_notstd', iLectorElem.lector_id, '', teEvent.id, null, teEvent]);
						// MPROS END //
						// если пользователь из числа сотрудников компании - то берём его данные из каталога пользователей, иначе - из карточки преподавателя
						if (_lector.type=='collaborator')
						{
							_person = ArrayOptFirstElem(XQuery( 'for $obj in collaborators where $obj/id='+_lector.person_id+' return $obj'));
							if (_person != undefined)
							{
								_person_fullname = _person.fullname;
								_person_email = _person.email;
								_person_place_id = _person.place_id;
							}
							else
							{
								_person_fullname = _lector.lector_fullname;
								_person_email = _lector.email;
								_person_place_id = '';
							}
						}
						else
						{
							_person_fullname = _lector.lector_fullname;
							_person_email = _lector.email;
							_person_place_id = '';
						}
						if (String(_person_email) == ''){
							if (ShowAlert) alert(_person_fullname +"incorrect email"); // выводим в лог ФИО пользователя
							continue;
						}
						// проверим, нет ли ошибки в поле с электронной почтой. Если есть ошибка - пропустим формирование и отправку сообщения данному получателю
						if ((_person_email == '') || (StrContains (_person_email, '@', true) == false) || ((StrContains (_person_email, '.ru', true) == false) && (StrContains (_person_email, '.com', true) == false) && (StrContains (_person_email, '.ua', true) == false) && (StrContains (_person_email, '.net', true) == false) && (StrContains (_person_email, '.by', true) == false)) || StrContains (_person_email, '@.', true) || StrContains (_person_email, ' ', true) || StrContains (_person_email, '  ', true) || StrContains (_person_email, '!', true) || StrContains (_person_email, '#', true) || StrContains (_person_email, '$', true) || StrContains (_person_email, '&', true) || StrContains (_person_email, '~', true) || StrContains (_person_email, '#', true) || StrContains (_person_email, '=', true) || StrContains (_person_email, ',', true) || StrContains (_person_email, '..', true) || StrContains (_person_email, '<', true) || StrContains (_person_email, '>', true) || StrContains (_person_email, '/', true) || StrContains (_person_email, '*', true) || StrContains (_person_email, '[', true) || StrContains (_person_email, ']', true) || StrContains (_person_email, '{', true) || StrContains (_person_email, '}', true) || StrContains (_person_email, '|', true) || StrContains (_person_email, '^', true) || StrContains (_person_email, 'а', true) || StrContains (_person_email, 'б', true) || StrContains (_person_email, 'в', true) || StrContains (_person_email, 'г', true) || StrContains (_person_email, 'д', true) || StrContains (_person_email, 'е', true) || StrContains (_person_email, 'ё', true) || StrContains (_person_email, 'ж', true) || StrContains (_person_email, 'з', true) || StrContains (_person_email, 'и', true) || StrContains (_person_email, 'й', true) || StrContains (_person_email, 'к', true) || StrContains (_person_email, 'л', true) || StrContains (_person_email, 'м', true) || StrContains (_person_email, 'н', true) || StrContains (_person_email, 'о', true) || StrContains (_person_email, 'п', true) || StrContains (_person_email, 'р', true) || StrContains (_person_email, 'с', true) || StrContains (_person_email, 'т', true) || StrContains (_person_email, 'у', true) || StrContains (_person_email, 'ф', true) || StrContains (_person_email, 'х', true) || StrContains (_person_email, 'ц', true) || StrContains (_person_email, 'ч', true) || StrContains (_person_email, 'ш', true) || StrContains (_person_email, 'щ', true) || StrContains (_person_email, 'ъ', true) || StrContains (_person_email, 'ы', true) || StrContains (_person_email, 'ь', true) || StrContains (_person_email, 'э', true) || StrContains (_person_email, 'ю', true) || StrContains (_person_email, 'я', true))
							break;
						if (ShowAlert) alert(_person_fullname); // выводим в лог ФИО преподавателя
						
						// MPROS START //
						if(_is_send_lector_settings)
						{
							NewElem = new Object; // создаём переменную - новый объект
							NewElem.id = _person.id;
							NewElem.email = _person_email; // пишем в неё свойство - почту преподавателя
							NewElem.fullname = _person_fullname; // пишем в неё свойство - ФИО преподавателя
							NewElem.place_id = _person_place_id; // пишем в неё свойство - Расположение преподавателя
							NewElem.is_lector = true; // пишем в неё свойство - является ли преподавателем
							NewElem.is_participant = false; // пишем в нее свойство - является ли участникам мероприятия
							NewElem.curLng = 'ru';
							arrRecipients[counter] = NewElem; // присваиваем в массив получателей
							counter++; // увеличиваем счётчик таких элементов
						}
						// MPROS END //
						_arr_str=_arr_str+iLectorElem.lector_id+";"; // дописываем данного преподавателя в переменную с сотрудниками, кому отправлялось уведомление
						_is_changed=true; // изменения внесены
					}
					if (ShowAlert) alert('_is_changed='+_is_changed); // пишем в лог, что изменения внесены
				}
				
			}

			// берём из Переменной: отправлять ли уведомление для создания напоминания ответственным за проведение мероприятия
			if (SendInvitationsToResponsibleOfEvent)
			{
				for (iTutorElem in teEvent.tutors) // проходим по ответственным за проведение мероприятия
				{
					_is_in_list=false; // переменная - присутствует ли в листе, кому уже отправили уведомления? (изначально - нет)
					arrAllIds.push(String(iTutorElem.collaborator_id));					
					
					for (_elem in _list) // присутствует ли в листе, кому уже отправили уведомления?
					{
						if (Trim(_elem)==Trim(iTutorElem.collaborator_id))
						{
							_is_in_list=true; // присутствует
							break;
						}
					}
					if (ShowAlert) alert('_is_in_list='+_is_in_list); // пишем в лог значение переменной присуствия в листе отправки прошлого уведомления
					if (_is_in_list!=true) // если ранее уведомление не отправлялось отвественному
					{
						_person = ArrayOptFirstElem(XQuery( 'for $obj in collaborators where $obj/id='+iTutorElem.collaborator_id+' return $obj')); // находим ответственного в каталоге пользователей
						// проверим, нет ли ошибки в поле с электронной почтой. Если есть ошибка - пропустим формирование и отправку сообщения данному получателю
						if ((_person.email == '') || (StrContains (_person.email, '@', true) == false) || ((StrContains (_person.email, '.ru', true) == false) && (StrContains (_person.email, '.com', true) == false) && (StrContains (_person.email, '.ua', true) == false) && (StrContains (_person.email, '.net', true) == false) && (StrContains (_person.email, '.by', true) == false)) || StrContains (_person.email, '@.', true) || StrContains (_person.email, ' ', true) || StrContains (_person.email, '  ', true) || StrContains (_person.email, '!', true) || StrContains (_person.email, '#', true) || StrContains (_person.email, '$', true) || StrContains (_person.email, '&', true) || StrContains (_person.email, '~', true) || StrContains (_person.email, '#', true) || StrContains (_person.email, '=', true) || StrContains (_person.email, ',', true) || StrContains (_person.email, '..', true) || StrContains (_person.email, '<', true) || StrContains (_person.email, '>', true) || StrContains (_person.email, '/', true) || StrContains (_person.email, '*', true) || StrContains (_person.email, '[', true) || StrContains (_person.email, ']', true) || StrContains (_person.email, '{', true) || StrContains (_person.email, '}', true) || StrContains (_person.email, '|', true) || StrContains (_person.email, '^', true) || StrContains (_person.email, 'а', true) || StrContains (_person.email, 'б', true) || StrContains (_person.email, 'в', true) || StrContains (_person.email, 'г', true) || StrContains (_person.email, 'д', true) || StrContains (_person.email, 'е', true) || StrContains (_person.email, 'ё', true) || StrContains (_person.email, 'ж', true) || StrContains (_person.email, 'з', true) || StrContains (_person.email, 'и', true) || StrContains (_person.email, 'й', true) || StrContains (_person.email, 'к', true) || StrContains (_person.email, 'л', true) || StrContains (_person.email, 'м', true) || StrContains (_person.email, 'н', true) || StrContains (_person.email, 'о', true) || StrContains (_person.email, 'п', true) || StrContains (_person.email, 'р', true) || StrContains (_person.email, 'с', true) || StrContains (_person.email, 'т', true) || StrContains (_person.email, 'у', true) || StrContains (_person.email, 'ф', true) || StrContains (_person.email, 'х', true) || StrContains (_person.email, 'ц', true) || StrContains (_person.email, 'ч', true) || StrContains (_person.email, 'ш', true) || StrContains (_person.email, 'щ', true) || StrContains (_person.email, 'ъ', true) || StrContains (_person.email, 'ы', true) || StrContains (_person.email, 'ь', true) || StrContains (_person.email, 'э', true) || StrContains (_person.email, 'ю', true) || StrContains (_person.email, 'я', true))
							break;
						if (ShowAlert) alert(_person.fullname); // выводим в лог ФИО ответственного
						NewElem=new Object; // создаём переменную - новый объект
						NewElem.id = _person.id;
						NewElem.email=_person.email; // пишем в неё свойство - почту ответственного
						NewElem.fullname=_person.fullname; // пишем в неё свойство - ФИО ответственного
						NewElem.place_id=_person.place_id; // пишем в неё свойство - Расположение ответственного
						NewElem.is_lector = false; // пишем в неё свойство - является ли преподавателем
						NewElem.is_participant = false; // пишем в нее свойство - является ли участникам мероприятия
						NewElem.curLng = 'ru'
						arrRecipients[counter]=NewElem; // присваиваем в массив получателей
						counter++; // увеличиваем счётчик таких элементов

						_arr_str=_arr_str+iTutorElem.collaborator_id+";"; // дописываем данного ответственного в переменную с сотрудниками, кому отправлялось уведомление
						_is_changed=true; // изменения внесены
					}
					if (ShowAlert) alert('_is_changed='+_is_changed); // пишем в лог, что изменения внесены
				}	
			}

			// берём из Переменной: отправлять ли уведомление для создания напоминания ответственным за подготовку мероприятия
			if (SendInvitationsToResponsibleOfEventPreparation)
			{
				for (iEventPreparationElem in teEvent.even_preparations) // проходим по ответственным за подготовку мероприятия
				{
					_is_in_list=false; // переменная - присутствует ли в листе, кому уже отправили уведомления? (изначально - нет)
					arrAllIds.push(String(iEventPreparationElem.id));	
					for (_elem in _list) // присутствует ли в листе, кому уже отправили уведомления?
					{
						if (Trim(_elem)==Trim(iEventPreparationElem.id))
						{
							_is_in_list=true; // присутствует
							break;
						}
					}
					if (ShowAlert) alert('_is_in_list='+_is_in_list); // пишем в лог значение переменной присуствия в листе отправки прошлого уведомления
					if (_is_in_list!=true) // если ранее уведомление не отправлялось отвественному
					{
						_person = ArrayOptFirstElem(XQuery( 'for $obj in collaborators where $obj/id='+iEventPreparationElem.person_id+' return $obj')); // находим ответственного в каталоге пользователей
						// проверим, нет ли ошибки в поле с электронной почтой. Если есть ошибка - пропустим формирование и отправку сообщения данному получателю
						if ((_person.email == '') || (StrContains (_person.email, '@', true) == false) || ((StrContains (_person.email, '.ru', true) == false) && (StrContains (_person.email, '.com', true) == false) && (StrContains (_person.email, '.ua', true) == false) && (StrContains (_person.email, '.net', true) == false) && (StrContains (_person.email, '.by', true) == false)) || StrContains (_person.email, '@.', true) || StrContains (_person.email, ' ', true) || StrContains (_person.email, '  ', true) || StrContains (_person.email, '!', true) || StrContains (_person.email, '#', true) || StrContains (_person.email, '$', true) || StrContains (_person.email, '&', true) || StrContains (_person.email, '~', true) || StrContains (_person.email, '#', true) || StrContains (_person.email, '=', true) || StrContains (_person.email, ',', true) || StrContains (_person.email, '..', true) || StrContains (_person.email, '<', true) || StrContains (_person.email, '>', true) || StrContains (_person.email, '/', true) || StrContains (_person.email, '*', true) || StrContains (_person.email, '[', true) || StrContains (_person.email, ']', true) || StrContains (_person.email, '{', true) || StrContains (_person.email, '}', true) || StrContains (_person.email, '|', true) || StrContains (_person.email, '^', true) || StrContains (_person.email, 'а', true) || StrContains (_person.email, 'б', true) || StrContains (_person.email, 'в', true) || StrContains (_person.email, 'г', true) || StrContains (_person.email, 'д', true) || StrContains (_person.email, 'е', true) || StrContains (_person.email, 'ё', true) || StrContains (_person.email, 'ж', true) || StrContains (_person.email, 'з', true) || StrContains (_person.email, 'и', true) || StrContains (_person.email, 'й', true) || StrContains (_person.email, 'к', true) || StrContains (_person.email, 'л', true) || StrContains (_person.email, 'м', true) || StrContains (_person.email, 'н', true) || StrContains (_person.email, 'о', true) || StrContains (_person.email, 'п', true) || StrContains (_person.email, 'р', true) || StrContains (_person.email, 'с', true) || StrContains (_person.email, 'т', true) || StrContains (_person.email, 'у', true) || StrContains (_person.email, 'ф', true) || StrContains (_person.email, 'х', true) || StrContains (_person.email, 'ц', true) || StrContains (_person.email, 'ч', true) || StrContains (_person.email, 'ш', true) || StrContains (_person.email, 'щ', true) || StrContains (_person.email, 'ъ', true) || StrContains (_person.email, 'ы', true) || StrContains (_person.email, 'ь', true) || StrContains (_person.email, 'э', true) || StrContains (_person.email, 'ю', true) || StrContains (_person.email, 'я', true))
							break;
						if (ShowAlert) alert(_person.fullname); // выводим в лог ФИО ответственного
						NewElem=new Object; // создаём переменную - новый объект
						NewElem.id = _person.id;
						NewElem.email=_person.email; // пишем в неё свойство - почту ответственного
						NewElem.fullname=_person.fullname; // пишем в неё свойство - ФИО ответственного
						NewElem.place_id=_person.place_id; // пишем в неё свойство - Расположение ответственного
						NewElem.is_lector = false; // пишем в неё свойство - является ли преподавателем
						NewElem.is_participant = false; // пишем в нее свойство - является ли участникам мероприятия
						NewElem.curLng = 'ru'
						arrRecipients[counter]=NewElem; // присваиваем в массив получателей
						counter++; // увеличиваем счётчик таких элементов

						_arr_str=_arr_str+iEventPreparationElem.person_id+";"; // дописываем данного ответственного в переменную с сотрудниками, кому отправлялось уведомление
						_is_changed=true; // изменения внесены
					}
					if (ShowAlert) alert('_is_changed='+_is_changed); // пишем в лог, что изменения внесены
				}
			}
			
			if (ShowAlert) // пишем в лог всех новых получателей ФИО и почта
			{
				for (iRecipientElem in arrRecipients)
				{
					alert(iRecipientElem.fullname+' '+iRecipientElem.email)
				}
			}

			if (_is_changed==true) // если были внесены хоть какие-то изменения в список получателей
			{
			
				teEvent.custom_elems.ObtainChildByKey(Custom_Field_Code).value=_arr_str; // вносим обновлённый список в кастомное поле Custom_Field_Code
				docEvent.Save(); // сохраняем документ мероприятия
			}
			
			_array_phases = teEvent.phases; // пытаемся получить массив ресурсов. Если он есть - то будем отправлять в календарь приглашения по ресурсам, а если нет - по самому мероприятию
			
			// проходим в цикле по получателям и отправляем им приглашения
			for (iRecipientElem in arrRecipients)
			{
				// если у сотрудника задано расположение и в этом расположении есть часовой пояс
				if (StrCharCount(iRecipientElem.place_id)  != 0)
				{
					if (StrCharCount(ArrayOptFirstElem(XQuery('for $elem in places where $elem/id = ' + iRecipientElem.place_id + ' return $elem')).timezone_id) != 0)
						Recipient_TIME_ZONE = OptReal(ArrayOptFirstElem(XQuery('for $elem in places where $elem/id = ' + iRecipientElem.place_id + ' return $elem')).timezone_id)/10 - 12; // берём часовой пояс получателя из расположения, указанного в карточке сотрудника
					else
						Recipient_TIME_ZONE = 3;
				}
				else
					Recipient_TIME_ZONE = 3;
				
				
				// если у мероприятия задано расположение и в этом расположении есть часовой пояс
				if (StrCharCount(_event.place_id)  != 0)
				{
					if (StrCharCount(ArrayOptFirstElem(XQuery('for $elem in places where $elem/id = ' + _event.place_id + ' return $elem')).timezone_id) != 0)
						Event_TIME_ZONE = OptReal(ArrayOptFirstElem(XQuery('for $elem in places where $elem/id = ' + _event.place_id + ' return $elem')).timezone_id)/10 - 12; // берём часовой пояс из расположения, указанного в карточке мероприятия
					else
						Event_TIME_ZONE = 3;
				}
				else
					Event_TIME_ZONE = 3;


				// итоговый часовой пояс для запуска агента из переменной, а также разницей часовых поясов сотрудника и мероприятия
				AGENT_TIME_ZONE = Event_TIME_ZONE;
				// итоговый часовой пояс с учётом разницы часовых поясов сотрудника и мероприятия
				MESSAGE_TIME_ZONE = Event_TIME_ZONE - Recipient_TIME_ZONE;
				
				
				//if (_event.education_method_id.OptForeignElem.education_org_id != 7123100698241089323) 
				//{
					if ((ArrayOptFirstElem(_array_phases) == undefined) || (Param._use_Event_or_EventPhases == 'event'))// если ресурсов по мероприятию нет или в переменной _use_Event_or_EventPhases задано использование только дат мероприятия - отправляем уведомления по самому меропритию
					{
						_time_zone_start_date = DateOffset(teEvent.start_date,(0-MESSAGE_TIME_ZONE)*3600); // дата начала мероприятия с учётом разницы часового пояса сотрудника и мероприятия
						_time_zone_finish_date = DateOffset(_finish_date,(0-MESSAGE_TIME_ZONE)*3600); // дата окончания мероприятия с учётом разницы часового пояса сотрудника и мероприятия
						_subject="Invitation: "+_event.name+" ("+_time_zone_start_date+")"; // Тема - приглашение имя_мероприятия (дата начала мероприятия)

						// берём из Переменной: показывать краткую/полную информацию о мероприятии в напоминании (по умолчанию - Показывать краткую информацию)
						if (ShowShortDescription)
						{
							// _header_host+'event&object_id='+_event.id+'&doc_id='+_doc_id - это ссылка на мероприятие в разделе Календарь мероприятий. В частном случае, если вдруг такая ссылка не работает (например, если раздел Календарь мероприятий доступен не всем) - можно сделать её короткой, только на само мероприятие, без раздела календарь мероприятий: _header_host+'event&object_id='+_event.id
							
							if(iRecipientElem.curLng == 'ru'){
								text='Тема: "'+teEvent.name+'" \r\n'+_header_host+_event.id;
							} else {
								text='Theme: "'+teEvent.name+'" \r\n'+_header_host+_event.id;
							}
						}
						else
						{			
							// _header_host+'event&object_id='+_event.id+'&doc_id='+_doc_id - это ссылка на мероприятие в разделе Календарь мероприятий. В частном случае, если вдруг такая ссылка не работает (например, если раздел Календарь мероприятий доступен не всем) - можно сделать её короткой, только на само мероприятие, без раздела календарь мероприятий: _header_host+'event&object_id='+_event.id
							
						
							if(iRecipientElem.curLng == 'ru'){
								text="Календарь\r\n\t " +text_str+"\n\t"+"Дата начала:"+_time_zone_start_date+"\n\t"+"Дата окончания :"+_time_zone_finish_date+"\n\t"+"Место проведения :"+teEvent.place+"\n\t"+"Комментарий:"+teEvent.comment+"\n\t";
							} else {
								text="Calendar\r\n\t " +text_str_eng+"\n\t"+"Date start:"+_time_zone_start_date+"\n\t"+"Date end :"+_time_zone_finish_date+"\n\t"+"Location :"+teEvent.place+"\n\t"+"Комментарий:"+teEvent.comment+"\n\t";
							}
						}
						lector_comment = "";
						if (iRecipientElem.is_lector)
						{
							_lector_file = OptInt(lector_resource_id) != undefined ? UrlAppendPath( PORTAL_URL,'/download_file.html?file_id=')+lector_resource_id : ''

							lector_comment = '<tr bgcolor="#FFFFFF">
											<td>
												Комментарий для тренера:
											</td>
											<td align="left">
												'+lector_text+'
											</td>
										</tr>
										<tr bgcolor="#FFFFFF">
											<td>
												Файл для тренера:
											</td>
											<td align="left">
												'+_lector_file+'
											</td>
										</tr>'
					
						}
						// берём из Переменной: показывать краткую/полную информацию о мероприятии в напоминании (по умолчанию - Показывать краткую информацию)
						if (ShowShortDescription)
						{
							html_text='
							<html><body>
							<table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#666666">
								<tr>
									<td>	
										<table width="100%" cellspacing="1" cellpadding="0">
											<tr bgcolor="#FFFFFF">
												<td align="left">
													<font style="font:Arial" style="font-size:10px">'+(iRecipientElem.curLng == 'ru' ? text_str : text_str_eng)+'</font>
												</td>
											</tr>
										</table>
									</td>
								</tr>
							</table>
							</body></html>
									'
						}
						else if(iRecipientElem.is_participant)
						{
							if(iRecipientElem.curLng == 'ru'){
								text='Тема: "'+teEvent.name+'" \r\n'+_header_host+teEvent.id;
							} else {
								text='Theme: "'+teEvent.name+'" \r\n'+_header_host+teEvent.id;
							}
							
								
							_time_zone_start_date = "";
							_time_zone_finish_date = "";
							
							educ_plans = XQuery('for $elem in education_plans where $elem/person_id='+iRecipientElem.id+' and $elem/state_id < 2 return $elem');

							info = undefined;
							
							html_text = '<meta name="http-equiv" content="Content-type: text/html; charset=UTF-8">';
							html_text += '<table width="100%" style="background-color: #ebebeb; margin: 0; padding: 0;" border="0" cellpadding="0"cellspacing="0"><tbody><tr><td align="center"><table border="0" bgcolor="#FFFFFF" cellpadding="0" cellspacing="0" width="600px" style="width: 600px;"><tbody>';
							
							if (teEvent.education_method_id.OptForeignElem != undefined && teEvent.education_method_id.OptForeignElem.education_org_id == 7123100698241089323) {
								html_text += '
								<tr>
								<td bgcolor="#FFFFFF" style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #000000; line-height: 21px; padding: 20px 40px; text-align: justify;"><img src="https://websoft.nlmk.com/download_file.html?file_id='+(iRecipientElem.curLng == 'ru'? "7229163717358333892" : "7262708446785046116") +'" width="90" height="70" /></td>
								</tr>';
							}
							
							html_text +='</tbody></table><table border="0" cellpadding="0" cellspacing="0" width="600px" style="width: 600px;"><tbody><tr></tr><tr><td style="padding-top: 0px; padding-bottom: 0px; padding-right: 0px; margin: 0px;"></td></tr><tr><td bgcolor="#FFFFFF" style="font-family: Arial,Helvetica,sans-serif; font-size: 14px; color: #000000; line-height: 21px; padding: 20px 40px 20px 40px;">';
									
							educ_plans = XQuery('for $elem in education_plans where $elem/person_id='+iRecipientElem.id+' and $elem/state_id < 2 return $elem');

							info = undefined;
							
							for(elem_educ_plan in educ_plans)
							{	
								target_educ_plan_doc = tools.open_doc(elem_educ_plan.id);
								if(target_educ_plan_doc != undefined)
								{
									educ_programs = target_educ_plan_doc.TopElem.programs;
									target_program = ArrayOptFind(educ_programs, 'This.education_method_id == docEvent.TopElem.education_method_id');
									if(target_program != undefined && tools_web.is_true(target_program.custom_elems.ObtainChildByKey('firstStageLaunch').value))
									{
										
										entryStage = ArrayOptFind(educ_programs, 'This.type != "education_method" && This.custom_elems.ObtainChildByKey("firstStageLaunch").value == "true"');
										entryPrestage = null;
										prestages = ArraySelect(educ_programs, 'This.type != "education_method" && ArrayCount(This.completed_parent_programs) > 0');

										if (entryStage != undefined) {
											for (prestage in prestages) {
												if (ArrayOptFind(prestage.completed_parent_programs, 'This.program_id == entryStage.id') != undefined) {
													entryPrestage = prestage;
													break;
												}
											}
										}
										startDate = docEvent.TopElem.start_date;
										daysLeft = ((DateDiff(ParseDate(startDate), ParseDate(Date())) / 60) / 60) / 24;
										d1 = (iRecipientElem.curLng == 'ru'? " дня" : " days")
										d2 = (iRecipientElem.curLng == 'ru'? " дней" : " days")
										info = {
											itemId: String(elem_educ_plan.id),
											days: (daysLeft == 3 ? daysLeft + d1 : daysLeft == 7 ? daysLeft + d2 : ''),
											entryStage: (entryStage != undefined ? String(entryStage.name) : ''),
											entryPrestage: (entryPrestage != null ? String(entryPrestage.name) : ''),
										}
									}
								}
							}
							
							iRecipientElemDoc = tools.open_doc(iRecipientElem.id)

							if(iRecipientElem.curLng == 'ru'){
								html_text += '<h2 style="margin: 0cm; line-height: 21pt;"><span style="color: black; font-family: arial,sans-serif; font-size: 16pt;"><strong>'+iRecipientElemDoc.TopElem.firstname+' '+iRecipientElemDoc.TopElem.middlename+'</strong></span><span style="color: black; font-family: arial,sans-serif; font-size: 16pt; font-weight: normal;">, добрый день!</span></h2><br>';
								html_text += 'Рады подтвердить, что Вы зарегистрированы на обучение <strong>'+teEvent.name+'</strong>.<br><br>\r\n';
							} else {
								html_text += '<h2 style="margin: 0cm; line-height: 21pt;"><span style="color: black; font-family: arial,sans-serif; font-size: 16pt;"><strong>'+iRecipientElemDoc.TopElem.firstname+' '+iRecipientElemDoc.TopElem.middlename+'</strong></span><span style="color: black; font-family: arial,sans-serif; font-size: 16pt; font-weight: normal;">, good afternoon!</span></h2><br>';
								html_text += 'We are pleased to confirm that you have been registered <strong>'+teEvent.name+'</strong>.<br><br>\r\n';
							}
							
							

							placeid = teEvent.place_id;
							OptInt(placeid, 0) != 0 ? placeTimezoneId=teEvent.place_id.ForeignElem.timezone_id : placeTimezoneId=' '
							OptInt(placeTimezoneId,0) != 0 ? placeTimezone=teEvent.place_id.ForeignElem.timezone_id.ForeignElem.name : placeTimezone=' '
							
							
							if ((ArrayOptFirstElem(_array_phases) == undefined) || (Param._use_Event_or_EventPhases == 'event'))// если ресурсов по мероприятию нет или в переменной _use_Event_or_EventPhases задано использование только дат мероприятия - отправляем уведомления по самому меропритию
							{
								
								
								_time_zone_start_date = StrDate(teEvent.start_date); 
								_time_zone_finish_date = StrDate(teEvent.finish_date); 
								

								if(iRecipientElem.curLng == 'ru'){
									html_text += '<strong>'+StrDate(teEvent.start_date, false, false)+' c '+StrTime(teEvent.start_date)+' до  '+StrTime(teEvent.finish_date)+' '+placeTimezone+'</strong><br>';
								} else {
									html_text += '<strong>'+StrDate(teEvent.start_date, false, false)+' from '+StrTime(teEvent.start_date)+' to  '+StrTime(teEvent.finish_date)+' '+placeTimezone+'</strong><br>';
								}
								
							} else {
		
								for(i = 0; i < ArrayCount(_array_phases); i++) 
								{
					
								if(iRecipientElem.curLng == 'ru'){
									html_text += (i + 1)+' день: <strong>'+StrDate(_array_phases[i].start_date, false, false)+' c '+StrTime(_array_phases[i].start_date)+' до '+StrTime(_array_phases[i].finish_date)+' '+placeTimezone+'</strong><br>';
								} else {
									html_text += (i + 1)+' day: <strong>'+StrDate(_array_phases[i].start_date, false, false)+' from '+StrTime(_array_phases[i].start_date)+' to '+StrTime(_array_phases[i].finish_date)+' '+placeTimezone+'</strong><br>';
								}
							
									if (i == 0) _time_zone_start_date = StrDate(_array_phases[i].start_date);
									if (i == ArrayCount(_array_phases) - 1) _time_zone_finish_date = StrDate(_array_phases[i].finish_date);
								}
							}
							html_text += '<br>\r\n';

							if(OptInt(placeid, 0) != 0) {
								if(iRecipientElem.curLng == 'ru'){
									html_text += 'Место проведения: <strong>'+placeid.ForeignElem.name+'</strong><br><br>\r\n';
								} else {
									html_text += 'Location: <strong>'+placeid.ForeignElem.name+'</strong><br><br>\r\n';
								}
								
							}
							else {
								if(iRecipientElem.curLng == 'ru'){
									html_text += 'Место проведения: <strong>'+teEvent.place'</strong><br><br>\r\n';
								} else {
									html_text += 'Location: <strong>'+teEvent.place+'</strong><br><br>\r\n';
								}
							}

							list = '';

							for (i = 0; i < ArrayCount(teEvent.lectors); i++) 
							{
								lector = teEvent.lectors[i];

								if(iRecipientElem.curLng == 'ru'){
									lectorInfo = lector.lector_id.ForeignElem.person_fullname+', '+lector.lector_id.ForeignElem.person_id.ForeignElem.position_name;
								} else {
									lectorInfo = tools.call_code_library_method("nlmk_localization", "latinTranslation", [lector.lector_id.ForeignElem.person_fullname]);
								}

								
								list += (i == 0 ? lectorInfo : '; '+ lectorInfo);
							}
							
							if (list != '') 
							{

								if(iRecipientElem.curLng == 'ru'){
									html_text += 'Преподаватель(-и): <br>' + list;
								} else {
									html_text += 'Trainer(s): <br>' + list;
								}
								
							}
							
							html_text += '<hr />\r\n';
							
							if(info != undefined)
							{

								if(iRecipientElem.curLng == 'ru'){
									html_text += '<span style="color: red;"><strong>ВАЖНО: </strong><span style="color: black;">Этапы «Диагностика знаний» и «Предварительная подготовка» (при их наличии) необходимо пройти <strong>до начала обучения с преподавателем.</strong>';
								} else {
									html_text += '<span style="color: red;"><strong>IMPORTANT: </strong><span style="color: black;">The stages “Diagnostics of knowledge” and “Preliminary preparation” (if any) must be completed <strong>before starting training with a teacher.</strong>';
								}
							
								html_text += '<hr />\r\n';
							}

								if(iRecipientElem.curLng == 'ru'){
									html_text += 'Для ознакомления с этапами назначенного вам образовательного решения перейдите по <a href="https://websoft.nlmk.com/_wt/'+target_educ_plan_doc.TopElem.id+'" target="_blank">ссылке</a>.';
								} else {
									html_text += 'To review the stages of your assigned learning solutions, please follow this <a href="https://websoft.nlmk.com/_wt/'+target_educ_plan_doc.TopElem.id+'" target="_blank">link</a>.';
								}

						
							html_text += '<hr />\r\n';

							tutor = ArrayOptFirstElem(docEvent.TopElem.tutors)
							if(tutor != undefined) {
								email = tutor.collaborator_id.ForeignElem.email;

								if(iRecipientElem.curLng == 'ru'){
									html_text += 'По вопросам, связанным с обучением, обращайтесь к куратору программы <br>';
									html_text += tutor.person_fullname+' (<a href="'+email+'" target="_blank" rel="noopener">'+email+'</a>)\r\n';
								} else {
									html_text += 'For questions related to your learning, please contact the program supervisor <br>';
									html_text += tools.call_code_library_method("nlmk_localization", "latinTranslation", [tutor.person_fullname])+' (<a href="'+email+'" target="_blank" rel="noopener">'+email+'</a>)\r\n';
								}
				
							} else {

								if(iRecipientElem.curLng == 'ru'){
									html_text += 'Если у вас возникли какие-либо вопросы, пожалуйста, обращайтесь в подразделение, курирующее данное обучение.\r\n';
								} else {
									html_text += 'If you have any questions, please contact the department responsible for this training.\r\n';
								}
								
							}
							
							html_text += '<hr />\r\n';
							
								if(iRecipientElem.curLng == 'ru'){
									html_text += 'По техническим вопросам и сбоям системы необходимо обращаться в техническую поддержку <a href="mailto:help@nlmk.com" target="_blank" rel="noopener">help@nlmk.com</a> или по тел. 44-999, 81-44-999, +7(4742)444-999, 8-800-700-0449. </td></tr></tbody></table></td></tr></tbody></table>';
								} else {
									html_text += 'In case of any technical difficulties, please contact technical support at <a href="mailto:help@nlmk.com" target="_blank" rel="noopener">help@nlmk.com</a> or +7(4742)444-999, +7-800-700-0449.</td></tr></tbody></table></td></tr></tbody></table>';
								}
								
							
							
							_subject="Invitation: "+teEvent.name+" ("+_time_zone_start_date+")";
						} 
						else
						{
							html_text='
							<html><body>
							<table width="100%" border="0" cellspacing="0" cellpadding="0">
								<tr>
									<td>
										<table width="100%" border="0" cellspacing="0" cellpadding="0">
										<tr valign="top"><td width="100%" valign="middle"><font size="2" color="#4B6A85">Календарь</font><br>
										</td></tr>
										</table>
									</td>
								</tr>
								<tr>
									<td>
									
										<table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#666666">
											<tr>
												<td>
													<table width="100%" cellspacing="1" cellpadding="0">
														<tr bgcolor="#FFFFFF">
															<td>
															'+(iRecipientElem.curLng == "ru" ? "Мероприятие" : "Event")+':
															</td>
															<td align="left">
																'+text_str+'
															</td>
														</tr>
														<tr bgcolor="#FFFFFF">
															<td>
															'+(iRecipientElem.curLng == "ru" ? "Дата начала" : "Date start")+':
															</td>
															<td align="left">
																'+StrLeftCharRange(_time_zone_start_date, 16)+'
															</td>
														</tr>
														<tr bgcolor="#FFFFFF">
															<td>
															'+(iRecipientElem.curLng == "ru" ? "Дата окончания" : "Date end")+':
															</td>
															<td align="left">
																'+StrLeftCharRange(_time_zone_finish_date, 16)+'
															</td>
														</tr>
														<tr bgcolor="#FFFFFF">
															<td>
															'+(iRecipientElem.curLng == "ru" ? "Место проведения" : "Location")+':
															</td>
															<td align="left">
																'+teEvent.place+'
															</td>
														</tr>
														<tr bgcolor="#FFFFFF">
															<td>
															'+(iRecipientElem.curLng == "ru" ? "Комментарий" : "Comment")+':
															</td>
															<td align="left">
																'+teEvent.comment+'
															</td>
														</tr>
														<tr bgcolor="#FFFFFF">
															<td>
															'+(iRecipientElem.curLng == "ru" ? "Преподователи" : "Lectors")+':
																
															</td>
															<td align="left">
																'+_lectors_list+'
															</td>
														</tr>
														'+lector_comment+'
													</table>
												</td>
											</tr>
										</table>
										
									</td>
								</tr>
							</table>
							</body></html>
									'
						}

						// формирование и отправка самого сообщения
iValarmText='';
if (ReminderDays>0)
{
iValarmText='BEGIN:VALARM
TRIGGER:-P'+ReminderDays+'D
REPEAT:2
DURATION:PT15M
ACTION:DISPLAY
DESCRIPTION:'+teEvent.name+' '+_time_zone_start_date+'
X-WR-ALARMUID:'+StrHexInt(Int(teEvent.id)-1)+'
END:VALARM'
}	

RSVP_STR=SendFeedback?'TRUE':'FALSE';

DT_START = DateOffset(teEvent.start_date,(0-AGENT_TIME_ZONE)*3600);
DT_END = DateOffset(_finish_date,(0-AGENT_TIME_ZONE)*3600);

iCalendarText='BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//WebSoft LTD//WebTutor 2//EN
METHOD:REQUEST
BEGIN:VEVENT
DTSTART:'+StrReplace(StrReplace(StrLeftRange(StrXmlDate(DT_START),StrXmlDate(DT_START).lastIndexOf('+')),'-',''),':','')+'Z
DTEND:'+StrReplace(StrReplace(StrLeftRange(StrXmlDate(DT_END),StrXmlDate(DT_END).lastIndexOf('+')),'-',''),':','')+'Z
DTSTAMP:'+StrReplace(StrReplace(StrLeftRange(StrXmlDate(Date()),StrXmlDate(Date()).lastIndexOf('+')),'-',''),':','')+'Z
TRANSP:OPAQUE
SEQUENCE:0
ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;CN="'+iRecipientElem.fullname+'";RSVP='+RSVP_STR+'
:mailto:'+iRecipientElem.email+' 
CLASS:PUBLIC
DESCRIPTION:'+teEvent.comment+'\n
SUMMARY:'+teEvent.name+'
ORGANIZER;CN="'+OrgUser+'":mailto:'+OrgUserMail+'
UID:'+StrHexInt(teEvent.id)+'-WebTutor_Generated
LOCATION:'+PLACE_STR+'\n
'+iValarmText+'
END:VEVENT
END:VCALENDAR'

if (ShowAlert) alert("iCalendarText="+iCalendarText);

message_body ='X-Mru-BL: 0:0:2
X-Mru-NR: 1
X-Mru-OF: unknown (unknown)
To: '+iRecipientElem.email+'
Subject: '+_subject+'
MIME-Version: 1.0
From: '+sender_address+'
Content-Type: multipart/mixed; boundary="=_mixed 004128EAC32576F1_="
X-Spam: Not detected
X-Mras: Ok

This is a multipart message in MIME format.
--=_mixed 004128EAC32576F1_=
Content-Type: multipart/related; boundary="=_related 004128EAC32576F1_="


--=_related 004128EAC32576F1_=
Content-Type: multipart/alternative; boundary="=_alternative 004128EAC32576F1_="


--=_alternative 004128EAC32576F1_=
Content-Type: text/plain; charset='+DefCharset+'

'+text+'

--=_alternative 004128EAC32576F1_=
Content-Type: text/html; charset='+DefCharset+'
Content-Disposition: inline

'+html_text+'

--=_alternative 004128EAC32576F1_=
Content-Type: text/calendar; method=REQUEST; charset='+DefCharset+';

'+iCalendarText+'

--=_mixed 004128EAC32576F1_=--
'

						//alert(message_body)
						try
						{
							_client.SendMimeMessage(sender_address,iRecipientElem.email,message_body); // используем метод SendMimeMessage объекта SmtpClient().
							/*
							на форуме:
							https://news.websoft.ru/_wt/forum_entry/6313918168181327345
							написано, что аргументом является объект типа MailMessage, т.е.
							var smtpClient = new SmtpClient();
							....
							var message = new MailMessage();
							message.subject = subject; //тема
							message.body = body; //тело
							smtpClient.SendMailMessage(message);

							*/
							LogEvent( 'email', 'Email sending to '+iRecipientElem.fullname+' (e-mail: ' +iRecipientElem.email + ') successful.' ); // пишем в логи, что отправлено успешно
						}
						catch ( aa )
						{
							LogEvent( 'email', 'Email sending to '+iRecipientElem.fullname+' (e-mail: ' +iRecipientElem.email + ') failed. Error:'+ aa ); // пишем в логи, если ошибка
						}
					}
					else // если у мероприятия заданы ресурсы и их использование выбрано в переменной _use_Event_or_EventPhases - отправляем уведомления по ресурсам
					{
						j = 0; // число, вычетаемое из id мероприятия для формирования уникального кода уведомления. Используется ниже в X-WR-ALARMUID:'+StrHexInt(Int(_event.id)-1-i)+'
						for (_phase in _array_phases)
						{
							_time_zone_phase_start_date = DateOffset(_phase.start_date,(0-MESSAGE_TIME_ZONE)*3600); // дата начала ресурса мероприятия с учётом разницы часового пояса сотрудника и мероприятия
							_time_zone_phase_finish_date = DateOffset(_phase.finish_date,(0-MESSAGE_TIME_ZONE)*3600); // дата окончания ресурса мероприятия с учётом разницы часового пояса сотрудника и мероприятия
							_subject="Invitation: "+_event.name+" ("+_time_zone_phase_start_date+")"; // Тема - приглашение имя_мероприятия (дата начала ресурса)
							
							// если показываем полную информацию (НЕ ShowShortDescription)
							if (!ShowShortDescription)
							{
								text="Календарь\r\n\t " +text_str+"\n\t"+"Дата начала:"+_time_zone_phase_start_date+"\n\t"+"Дата окончания :"+_time_zone_phase_finish_date+"\n\t"+"Место проведения :"+teEvent.place+"\n\t"+"Комментарий:"+teEvent.comment+"\n\t"; // _header_host+'event&object_id='+_event.id+'&doc_id='+_doc_id - это ссылка на мероприятие в разделе Календарь мероприятий. В частном случае, если вдруг такая ссылка не работает (например, если раздел Календарь мероприятий доступен не всем) - можно сделать её короткой, только на само мероприятие, без раздела календарь мероприятий: _header_host+'event&object_id='+_event.id
								lector_comment = "";
								if (iRecipientElem.is_lector)
								{
									_lector_file = OptInt(lector_resource_id) != undefined ? UrlAppendPath( PORTAL_URL,'/download_file.html?file_id=')+lector_resource_id : ''
									lector_comment = '<tr bgcolor="#FFFFFF">
													<td>
														Комментарий для тренера:
													</td>
													<td align="left">
														'+lector_text+'
													</td>
												</tr>
												<tr bgcolor="#FFFFFF">
													<td>
														Файл для тренера:
													</td>
													<td align="left">
														'+_lector_file+'
													</td>
												</tr>'
								
								}
								if(iRecipientElem.is_participant)
								{
									text='Тема: "'+teEvent.name+'" \r\n'+_header_host+teEvent.id;
										
									_time_zone_start_date = "";
									_time_zone_finish_date = "";
									
									educ_plans = XQuery('for $elem in education_plans where $elem/person_id='+iRecipientElem.id+' and $elem/state_id < 2 return $elem');

									info = undefined;
									
									html_text = '<meta name="http-equiv" content="Content-type: text/html; charset=UTF-8">';
									html_text += '<table width="100%" style="background-color: #ebebeb; margin: 0; padding: 0;" border="0" cellpadding="0"cellspacing="0"><tbody><tr><td align="center"><table border="0" bgcolor="#FFFFFF" cellpadding="0" cellspacing="0" width="600px" style="width: 600px;"><tbody>';
									
									if (teEvent.education_method_id.OptForeignElem != undefined && teEvent.education_method_id.OptForeignElem.education_org_id == 7123100698241089323) {
										html_text += '
										<tr>
										<td bgcolor="#FFFFFF" style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #000000; line-height: 21px; padding: 20px 40px; text-align: justify;"><img src="https://websoft.nlmk.com/download_file.html?file_id='+(iRecipientElem.curLng == 'ru'? "7229163717358333892" : "7316623329195988046") +'" width="90" height="70" /></td>
										</tr>';
									}
									
									html_text +='</tbody></table><table border="0" cellpadding="0" cellspacing="0" width="600px" style="width: 600px;"><tbody><tr></tr><tr><td style="padding-top: 0px; padding-bottom: 0px; padding-right: 0px; margin: 0px;"></td></tr><tr><td bgcolor="#FFFFFF" style="font-family: Arial,Helvetica,sans-serif; font-size: 14px; color: #000000; line-height: 21px; padding: 20px 40px 20px 40px;">';
											
									educ_plans = XQuery('for $elem in education_plans where $elem/person_id='+iRecipientElem.id+' and $elem/state_id < 2 return $elem');

									info = undefined;
									
									for(elem_educ_plan in educ_plans)
									{	
										target_educ_plan_doc = tools.open_doc(elem_educ_plan.id);
										if(target_educ_plan_doc != undefined)
										{
											educ_programs = target_educ_plan_doc.TopElem.programs;
											target_program = ArrayOptFind(educ_programs, 'This.education_method_id == docEvent.TopElem.education_method_id');
											if(target_program != undefined && tools_web.is_true(target_program.custom_elems.ObtainChildByKey('firstStageLaunch').value))
											{
												
												entryStage = ArrayOptFind(educ_programs, 'This.type != "education_method" && This.custom_elems.ObtainChildByKey("firstStageLaunch").value == "true"');
												entryPrestage = null;
												prestages = ArraySelect(educ_programs, 'This.type != "education_method" && ArrayCount(This.completed_parent_programs) > 0');

												if (entryStage != undefined) {
													for (prestage in prestages) {
														if (ArrayOptFind(prestage.completed_parent_programs, 'This.program_id == entryStage.id') != undefined) {
															entryPrestage = prestage;
															break;
														}
													}
												}
												startDate = docEvent.TopElem.start_date;
												daysLeft = ((DateDiff(ParseDate(startDate), ParseDate(Date())) / 60) / 60) / 24;
												d1 = (iRecipientElem.curLng == 'ru'? " дня" : " days")
												d2 = (iRecipientElem.curLng == 'ru'? " дней" : " days")
												info = {
													itemId: String(elem_educ_plan.id),
													days: (daysLeft == 3 ? daysLeft + d1 : daysLeft == 7 ? daysLeft + d2 : ''),
													entryStage: (entryStage != undefined ? String(entryStage.name) : ''),
													entryPrestage: (entryPrestage != null ? String(entryPrestage.name) : ''),
												}
											}
										}
									}
									
									iRecipientElemDoc = tools.open_doc(iRecipientElem.id)

									if(iRecipientElem.curLng == 'ru'){
										html_text += '<h2 style="margin: 0cm; line-height: 21pt;"><span style="color: black; font-family: arial,sans-serif; font-size: 16pt;"><strong>'+iRecipientElemDoc.TopElem.firstname+' '+iRecipientElemDoc.TopElem.middlename+'</strong></span><span style="color: black; font-family: arial,sans-serif; font-size: 16pt; font-weight: normal;">, добрый день!</span></h2><br>';
										html_text += 'Рады подтвердить, что Вы зарегистрированы на обучение <strong>'+teEvent.name+'</strong>.<br><br>\r\n';
									} else {
										html_text += '<h2 style="margin: 0cm; line-height: 21pt;"><span style="color: black; font-family: arial,sans-serif; font-size: 16pt;"><strong>'+iRecipientElemDoc.TopElem.firstname+'</strong></span><span style="color: black; font-family: arial,sans-serif; font-size: 16pt; font-weight: normal;">, good afternoon!</span></h2><br>';
										html_text += 'We are pleased to confirm that you have been registered <strong>'+teEvent.name+'</strong>.<br><br>\r\n';
									}
									
									placeid = teEvent.place_id;
									OptInt(placeid,0) != 0 ? placeTimezoneId=teEvent.place_id.ForeignElem.timezone_id : placeTimezoneId=' '
									OptInt(placeTimezoneId, 0) != 0 ? placeTimezone=teEvent.place_id.ForeignElem.timezone_id.ForeignElem.name : placeTimezone=' '
									
									
									if ((ArrayOptFirstElem(_array_phases) == undefined) || (Param._use_Event_or_EventPhases == 'event'))// если ресурсов по мероприятию нет или в переменной _use_Event_or_EventPhases задано использование только дат мероприятия - отправляем уведомления по самому меропритию
									{
										
										
										_time_zone_start_date = StrDate(teEvent.start_date); 
										_time_zone_finish_date = StrDate(teEvent.finish_date); 
										
										if(iRecipientElem.curLng == 'ru'){
											html_text += '<strong>'+StrDate(teEvent.start_date, false, false)+' c '+StrTime(teEvent.start_date)+' до  '+StrTime(teEvent.finish_date)+' '+placeTimezone+'</strong><br>';
										} else {
											html_text += '<strong>'+StrDate(teEvent.start_date, false, false)+' from '+StrTime(teEvent.start_date)+' to  '+StrTime(teEvent.finish_date)+' '+placeTimezone+'</strong><br>';
										}
									
									} else {
				
										for(i = 0; i < ArrayCount(_array_phases); i++) 
										{

											if(iRecipientElem.curLng == 'ru'){
												html_text += (i + 1)+' день: <strong>'+StrDate(_array_phases[i].start_date, false, false)+' c '+StrTime(_array_phases[i].start_date)+' до '+StrTime(_array_phases[i].finish_date)+' '+placeTimezone+'</strong><br>';
											} else {
												html_text += (i + 1)+' day: <strong>'+StrDate(_array_phases[i].start_date, false, false)+' from '+StrTime(_array_phases[i].start_date)+' to '+StrTime(_array_phases[i].finish_date)+' '+placeTimezone+'</strong><br>';
											}
						  
											
											if (i == 0) _time_zone_start_date = StrDate(_array_phases[i].start_date);
											if (i == ArrayCount(_array_phases) - 1) _time_zone_finish_date = StrDate(_array_phases[i].finish_date);
										}
									}
									html_text += '<br>\r\n';
									
									if(OptInt(placeid, 0) != 0) {
										if(iRecipientElem.curLng == 'ru'){
											html_text += 'Место проведения: <strong>'+placeid.ForeignElem.name+'</strong><br><br>\r\n';
										} else {
											html_text += 'Location: <strong>'+placeid.ForeignElem.name+'</strong><br><br>\r\n';
										}
									}
									else {
										if(iRecipientElem.curLng == 'ru'){
											html_text += 'Место проведения: <strong>'+teEvent.place+'</strong><br><br>\r\n';
										} else {
											html_text += 'Location: <strong>'+teEvent.place+'</strong><br><br>\r\n';
										}
									}

									list = '';

									for (i = 0; i < ArrayCount(teEvent.lectors); i++) 
									{
										lector = teEvent.lectors[i];
										lectorDoc = ArrayOptFirstElem(XQuery('for $elem in lectors where $elem/id='+lector.lector_id+' return $elem'))
										lectorInfo = "";

										if(lectorDoc != undefined) {
											if(iRecipientElem.curLng == 'ru') {
												if(lector.lector_id.ForeignElem.type == "invitee") { 
													lectorInfo = lectorDoc.lector_fullname
												} else { 
													lectorInfo = lectorDoc.person_fullname + (!tools_library.string_is_null_or_empty(lectorDoc.person_position_name) ? ', ' + lectorDoc.person_position_name : '' )
												}
											
											} else {

												if(lector.lector_id.ForeignElem.type == "invitee") {
													lectorInfo = tools.call_code_library_method("nlmk_localization", "latinTranslation", [lectorDoc.lector_fullname])
												} else {
													lectorInfo = tools.call_code_library_method("nlmk_localization", "latinTranslation", [lectorDoc.person_fullname])
												}
										}
										
										if(lectorInfo != "") {
											list += (i == 0 ? lectorInfo : '; '+ lectorInfo);
										}
										}
									
									}
									
										if (list != '') 
										{
											if(iRecipientElem.curLng == 'ru'){
												html_text += 'Преподаватель(-и): <br>' + list;
											} else {
												html_text += 'Trainer(s): <br>' + list;
											}
										}
									
									html_text += '<hr />\r\n';
									
									if(info != undefined)
									{
										if(iRecipientElem.curLng == 'ru'){
											html_text += '<span style="color: red;"><strong>ВАЖНО: </strong><span style="color: black;">Этапы «Диагностика знаний» и «Предварительная подготовка» (при их наличии) необходимо пройти <strong>до начала обучения с преподавателем.</strong>';
										} else {
											html_text += '<span style="color: red;"><strong>IMPORTANT: </strong><span style="color: black;">The stages “Diagnostics of knowledge” and “Preliminary preparation” (if any) must be completed <strong>before starting training with a teacher.</strong>';
										}
										html_text += '<hr />\r\n';

										if(iRecipientElem.curLng == 'ru'){
											html_text += 'Для ознакомления с этапами назначенного вам образовательного решения перейдите по <a href="https://websoft.nlmk.com/_wt/'+info.itemId+'" target="_blank">ссылке</a>.';
										} else {
											html_text += 'To review the stages of your assigned learning solutions, please follow this <a href="https://websoft.nlmk.com/_wt/'+info.iitemId+'" target="_blank">link</a>.';
										}
										html_text += '<hr />\r\n';
									}

									

									tutor = ArrayOptFirstElem(docEvent.TopElem.tutors)
									if(tutor != undefined) {
										email = tutor.collaborator_id.ForeignElem.email;
										if(iRecipientElem.curLng == 'ru'){
											html_text += 'По вопросам, связанным с обучением, обращайтесь к куратору программы <br>';
											html_text += tutor.person_fullname+' (<a href="'+email+'" target="_blank" rel="noopener">'+email+'</a>)\r\n';
										} else {
											html_text += 'For questions related to your learning, please contact the program supervisor <br>';
											html_text += tools.call_code_library_method("nlmk_localization", "latinTranslation", [tutor.person_fullname])+' (<a href="'+email+'" target="_blank" rel="noopener">'+email+'</a>)\r\n';
										}
									} else {
										if(iRecipientElem.curLng == 'ru'){
											html_text += 'Если у вас возникли какие-либо вопросы, пожалуйста, обращайтесь в подразделение, курирующее данное обучение.\r\n';
										} else {
											html_text += 'If you have any questions, please contact the department responsible for this training.\r\n';
										}
									}
									
									html_text += '<hr />\r\n';
									
									if(iRecipientElem.curLng == 'ru'){
										html_text += 'По техническим вопросам и сбоям системы необходимо обращаться в техническую поддержку <a href="mailto:help@nlmk.com" target="_blank" rel="noopener">help@nlmk.com</a> или по тел. 44-999, 81-44-999, +7(4742)444-999, 8-800-700-0449. </td></tr></tbody></table></td></tr></tbody></table>';
									} else {
										html_text += 'In case of any technical difficulties, please contact technical support at <a href="mailto:help@nlmk.com" target="_blank" rel="noopener">help@nlmk.com</a> or +7(4742)444-999, +7-800-700-0449. </td></tr></tbody></table></td></tr></tbody></table>';
									}
									_subject="Invitation: "+teEvent.name+" ("+_time_zone_start_date+")";
								} 
								else
								{
								// тело письма
									html_text='
									<html><body>
									<table width="100%" border="0" cellspacing="0" cellpadding="0">
										<tr>
											<td>
												<table width="100%" border="0" cellspacing="0" cellpadding="0">
												<tr valign="top"><td width="100%" valign="middle"><font size="2" color="#4B6A85">Календарь</font><br>
												</td></tr>
												</table>
											</td>
										</tr>
										<tr>
											<td>
											
												<table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#666666">
													<tr>
														<td>
															<table width="100%" cellspacing="1" cellpadding="0">
																<tr bgcolor="#FFFFFF">
																	<td>
																		'+(iRecipientElem.curLng == "ru" ? "Мероприятие" : "Event")+':
																	</td>
																	<td align="left">
																		'+text_str+'
																	</td>
																</tr>
																<tr bgcolor="#FFFFFF">
																	<td>
																		'+(iRecipientElem.curLng == "ru" ? "Дата начала" : "Date start")+':
																	</td>
																	<td align="left">
																		'+StrLeftCharRange(_time_zone_phase_start_date, 16)+'
																	</td>
																</tr>
																<tr bgcolor="#FFFFFF">
																	<td>
																		'+(iRecipientElem.curLng == "ru" ? "Дата окончания" : "Date end")+':
																	</td>
																	<td align="left">
																		'+StrLeftCharRange(_time_zone_phase_finish_date, 16)+'
																	</td>
																</tr>
																<tr bgcolor="#FFFFFF">
																	<td>
																		'+(iRecipientElem.curLng == "ru" ? "Место проведения" : "Location")+':
																	</td>
																	<td align="left">
																		'+teEvent.place+'
																	</td>
																</tr>
																<tr bgcolor="#FFFFFF">
																	<td>
																		'+(iRecipientElem.curLng == "ru" ? "Комментарий" : "Comment")+':
																	</td>
																	<td align="left">
																		'+teEvent.comment+'
																	</td>
																</tr>
																<tr bgcolor="#FFFFFF">
																	<td>
																		'+(iRecipientElem.curLng == "ru" ? "Преподователи" : "Lectors")+':
																	</td>
																	<td align="left">
																		'+_lectors_list+'
																	</td>
																</tr>
																'+lector_comment+'
															</table>
														</td>
													</tr>
												</table>
												
											</td>
										</tr>
									</table>
									</body></html>
											'
								}
							}

							// формирование и отправка самого сообщения
iValarmText='';
if (ReminderDays>0)
{
iValarmText='BEGIN:VALARM
TRIGGER:-P'+ReminderDays+'D
REPEAT:2
DURATION:PT15M
ACTION:DISPLAY
DESCRIPTION:'+teEvent.name+' '+_time_zone_phase_start_date+'
X-WR-ALARMUID:'+StrHexInt(Int(teEvent.id)-1-j)+'
END:VALARM'
}	

RSVP_STR=SendFeedback?'TRUE':'FALSE';

DT_START = DateOffset(_phase.start_date,(0-AGENT_TIME_ZONE)*3600);
DT_END = DateOffset(_phase.finish_date,(0-AGENT_TIME_ZONE)*3600);
		
iCalendarText='BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//WebSoft LTD//WebTutor 2//EN
METHOD:REQUEST
BEGIN:VEVENT
DTSTART:'+StrReplace(StrReplace(StrLeftRange(StrXmlDate(DT_START),StrXmlDate(DT_START).lastIndexOf('+')),'-',''),':','')+'Z
DTEND:'+StrReplace(StrReplace(StrLeftRange(StrXmlDate(DT_END),StrXmlDate(DT_END).lastIndexOf('+')),'-',''),':','')+'Z
DTSTAMP:'+StrReplace(StrReplace(StrLeftRange(StrXmlDate(Date()),StrXmlDate(Date()).lastIndexOf('+')),'-',''),':','')+'Z
TRANSP:OPAQUE
SEQUENCE:0
ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;CN="'+iRecipientElem.fullname+'";RSVP='+RSVP_STR+'
 :mailto:'+iRecipientElem.email+' 
CLASS:PUBLIC
DESCRIPTION:'+teEvent.comment+'\n
SUMMARY:'+teEvent.name+' (этап ' +OptInt(j+1)+ ' из ' + ArrayCount(_array_phases)+') '+DateNewTime(_phase.start_date)+'
ORGANIZER;CN="'+OrgUser+'":mailto:'+OrgUserMail+'
UID:'+StrHexInt(teEvent.id)+j'-WebTutor_Generated
LOCATION:'+PLACE_STR+'\n
'+iValarmText+'
END:VEVENT
END:VCALENDAR'
	
if (ShowAlert) alert("iCalendarText="+iCalendarText);
		 
message_body ='X-Mru-BL: 0:0:2
X-Mru-NR: 1
X-Mru-OF: unknown (unknown)
To: '+iRecipientElem.email+'
Subject: '+_subject+'
MIME-Version: 1.0
From: '+sender_address+'
Content-Type: multipart/mixed; boundary="=_mixed 004128EAC32576F1_="
X-Spam: Not detected
X-Mras: Ok

This is a multipart message in MIME format.
--=_mixed 004128EAC32576F1_=
Content-Type: multipart/related; boundary="=_related 004128EAC32576F1_="


--=_related 004128EAC32576F1_=
Content-Type: multipart/alternative; boundary="=_alternative 004128EAC32576F1_="


--=_alternative 004128EAC32576F1_=
Content-Type: text/plain; charset='+DefCharset+'

'+text+'

--=_alternative 004128EAC32576F1_=
Content-Type: text/html; charset='+DefCharset+'
Content-Disposition: inline

'+html_text+'

--=_alternative 004128EAC32576F1_=
Content-Type: text/calendar; method=REQUEST; charset='+DefCharset+';

'+iCalendarText+'
--=_mixed 004128EAC32576F1_=--
'

							//alert(message_body)
							try
							{
								_client.SendMimeMessage(sender_address,iRecipientElem.email,message_body); // используем метод SendMimeMessage объекта SmtpClient().
								/*
								на форуме:
								https://news.websoft.ru/_wt/forum_entry/6313918168181327345
								написано, что аргументом является объект типа MailMessage, т.е.
								var smtpClient = new SmtpClient();
								....
								var message = new MailMessage();
								message.subject = subject; //тема
								message.body = body; //тело
								smtpClient.SendMailMessage(message);

								*/
								LogEvent( 'email', 'Email sending to '+iRecipientElem.fullname+' (e-mail: ' +iRecipientElem.email + ') successful.' ); // пишем в логи, что отправлено успешно
							}
							catch ( aa )
							{
								LogEvent( 'email', 'Email sending to '+iRecipientElem.fullname+' (e-mail: ' +iRecipientElem.email + ') failed. Error:'+ aa ); // пишем в логи, если ошибка
							}
							j++; // увеличиваем счётчик для X-WR-ALARMUID:'+StrHexInt(Int(_event.id)-1-i)+'
						}
					}
				//}
			}
			
			deletedParticipators = Array();
			_is_changed = false;
			part = undefined;
			for (oldPart in _list)
			{
				part = ArrayOptFind(arrAllIds,"This=='"+String(oldPart)+"'")
				if (part == undefined)
				{
					deletedParticipators.push(String(oldPart));
				}
			}

			if ( ArrayOptFirstElem(deletedParticipators) != undefined )
			{
				arrRecipients = Array(); // массив получателей
				counter=0; // счётчик получателей
				delPersons = Array();
				for (del in deletedParticipators)
				{
					_person = ArrayOptFirstElem(XQuery('for $obj in collaborators where $obj/id='+del+' return $obj')); // пробуем найти удаленного участника в каталоге сотрудника
					if (_person != undefined)
					{
						if (ShowAlert) alert(_person.fullname); // выводим в лог ФИО пользователя
						NewElem=new Object; // создаём переменную - новый объект
						NewElem.email=_person.email; // пишем в неё свойство - почту пользователя
						NewElem.fullname=_person.fullname; // пишем в неё свойство - ФИО пользователя
						NewElem.place_id=_person.place_id; // пишем в неё свойство - Расположение пользователя
						NewElem.curLng=_person.place_id; // 
						arrRecipients[counter]=NewElem; // присваиваем в массив получателей
						counter++; // увеличиваем счётчик таких элементов
						
						_is_changed = true;
						_arr_str=StrReplace(_arr_str,del+";",""); // Удаляем удаленного сотрудника, из строки с отправлеными уведомлениями
						_arr_str=StrReplace(_arr_str,del,""); // Удаляем удаленного сотрудника, из строки с отправлеными уведомлениями
						alert(_arr_str)
					}
					else
					{
						_lector=ArrayOptFirstElem(XQuery( 'for $obj in lectors where $obj/id='+del+' return $obj')); // находим преподавателя в каталоге преподавателей (если вдруг не будет находить, то нужно будет изменить на каталог пользователей, но тогда искать будет только среди пользователей)
						// если пользователь из числа сотрудников компании - то берём его данные из каталога пользователей, иначе - из карточки преподавателя
						if (_lector != undefined)
						{
							if (_lector.type=='collaborator')
							{
								_person = ArrayOptFirstElem(XQuery( 'for $obj in collaborators where $obj/id='+_lector.person_id+' return $obj'));
								if (_person != undefined)
								{
									_person_fullname = _person.fullname;
									_person_email = _person.email;
									_person_place_id = _person.place_id;
								}
								else
								{
									_person_fullname = _lector.lector_fullname;
									_person_email = _lector.email;
									_person_place_id = '';
								}
							}
							else
							{
								_person_fullname = _lector.lector_fullname;
								_person_email = _lector.email;
								_person_place_id = '';
							}
							
							if (ShowAlert) alert(_person_fullname); // выводим в лог ФИО преподавателя
							
							// MPROS START //
							if(_is_send_lector_settings)
							{
								NewElem = new Object; // создаём переменную - новый объект
								NewElem.email = _person_email; // пишем в неё свойство - почту преподавателя
								NewElem.fullname = _person_fullname; // пишем в неё свойство - ФИО преподавателя
								NewElem.place_id = _person_place_id; // пишем в неё свойство - Расположение преподавателя
								NewElem.curLng = "ru";
								arrRecipients[counter] = NewElem; // присваиваем в массив получателей
								counter++; // увеличиваем счётчик таких элементов
							}
							// MPROS END //
								
							_is_changed = true;
							_arr_str=StrReplace(_arr_str,del+";",""); // Удаляем удаленного сотрудника, из строки с отправлеными уведомлениями
							_arr_str=StrReplace(_arr_str,del,""); // Удаляем удаленного сотрудника, из строки с отправлеными уведомлениями
							alert(_arr_str)
						}
					}
				}
				
				if (_is_changed==true) // если были внесены хоть какие-то изменения в список получателей
				{
					teEvent.custom_elems.ObtainChildByKey(Custom_Field_Code).value=_arr_str; // вносим обновлённый список в кастомное поле Custom_Field_Code
					docEvent.Save(); // сохраняем документ мероприятия
				}
				
				for (iRecipientElem in arrRecipients)
				{
					// если у сотрудника задано расположение и в этом расположении есть часовой пояс
					if (StrCharCount(iRecipientElem.place_id)  != 0)
					{
						if (StrCharCount(ArrayOptFirstElem(XQuery('for $elem in places where $elem/id = ' + iRecipientElem.place_id + ' return $elem')).timezone_id) != 0)
							Recipient_TIME_ZONE = OptReal(ArrayOptFirstElem(XQuery('for $elem in places where $elem/id = ' + iRecipientElem.place_id + ' return $elem')).timezone_id)/10 - 12; // берём часовой пояс получателя из расположения, указанного в карточке сотрудника
						else
							Recipient_TIME_ZONE = 3;
					}
					else
						Recipient_TIME_ZONE = 3;
					
					// если у мероприятия задано расположение и в этом расположении есть часовой пояс
					if (StrCharCount(_event.place_id)  != 0)
					{
						if (StrCharCount(ArrayOptFirstElem(XQuery('for $elem in places where $elem/id = ' + _event.place_id + ' return $elem')).timezone_id) != 0)
							Event_TIME_ZONE = OptReal(ArrayOptFirstElem(XQuery('for $elem in places where $elem/id = ' + _event.place_id + ' return $elem')).timezone_id)/10 - 12; // берём часовой пояс из расположения, указанного в карточке мероприятия
						else
							Event_TIME_ZONE = 3;
					}
					else
						Event_TIME_ZONE = 3;

					// итоговый часовой пояс для запуска агента из переменной, а также разницей часовых поясов сотрудника и мероприятия
					AGENT_TIME_ZONE = Event_TIME_ZONE;
					// итоговый часовой пояс с учётом разницы часовых поясов сотрудника и мероприятия
					MESSAGE_TIME_ZONE = Event_TIME_ZONE - Recipient_TIME_ZONE;
					
					if ((ArrayOptFirstElem(_array_phases) == undefined) || (Param._use_Event_or_EventPhases == 'event'))// если ресурсов по мероприятию нет или в переменной _use_Event_or_EventPhases задано использование только дат мероприятия - отправляем уведомления по самому меропритию
					{
						_time_zone_start_date = DateOffset(teEvent.start_date,(0-MESSAGE_TIME_ZONE)*3600); // дата начала мероприятия с учётом разницы часового пояса сотрудника и мероприятия
						_time_zone_finish_date = DateOffset(_finish_date,(0-MESSAGE_TIME_ZONE)*3600); // дата окончания мероприятия с учётом разницы часового пояса сотрудника и мероприятия
						_subject="Cancel: "+_event.name+" ("+_time_zone_start_date+")"; // Тема - приглашение имя_мероприятия (дата начала мероприятия)

						// берём из Переменной: показывать краткую/полную информацию о мероприятии в напоминании (по умолчанию - Показывать краткую информацию)
						if (ShowShortDescription)
						{
							// _header_host+'event&object_id='+_event.id+'&doc_id='+_doc_id - это ссылка на мероприятие в разделе Календарь мероприятий. В частном случае, если вдруг такая ссылка не работает (например, если раздел Календарь мероприятий доступен не всем) - можно сделать её короткой, только на само мероприятие, без раздела календарь мероприятий: _header_host+'event&object_id='+_event.id
							text='Тема: "'+teEvent.name+'" \r\n'+_header_host+_event.id;
						}
						else
						{			
							// _header_host+'event&object_id='+_event.id+'&doc_id='+_doc_id - это ссылка на мероприятие в разделе Календарь мероприятий. В частном случае, если вдруг такая ссылка не работает (например, если раздел Календарь мероприятий доступен не всем) - можно сделать её короткой, только на само мероприятие, без раздела календарь мероприятий: _header_host+'event&object_id='+_event.id
							text="Календарь\r\n\t " +text_str+"\n\t"+"Дата начала:"+_time_zone_start_date+"\n\t"+"Дата окончания :"+_time_zone_finish_date+"\n\t"+"Место проведения :"+teEvent.place+"\n\t"+"Комментарий:"+teEvent.comment+"\n\t";
						}
						
						lector_comment = "";
						/*if (iRecipientElem.is_lector)
						{
							lector_comment = '<tr bgcolor="#FFFFFF">
											<td>
												Комментарий для тренера:
											</td>
											<td align="left">
												'+lector_text+'
											</td>
										</tr>
										<tr bgcolor="#FFFFFF">
											<td>
												Файл для тренера:
											</td>
											<td align="left">
												'+UrlAppendPath( PORTAL_URL,'/download_file.html?file_id=')+lector_resource_id+'
											</td>
										</tr>'
				
						}*/
						// берём из Переменной: показывать краткую/полную информацию о мероприятии в напоминании (по умолчанию - Показывать краткую информацию)
						if (ShowShortDescription)
						{
							html_text='
							<html><body>
							<table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#666666">
								<tr>
									<td>	
										<table width="100%" cellspacing="1" cellpadding="0">
											<tr bgcolor="#FFFFFF">
												<td align="left">
													<font style="font:Arial" style="font-size:10px">'+text_str+'</font>
												</td>
											</tr>
										</table>
									</td>
								</tr>
							</table>
							</body></html>
									'
						}
						else
						{
							html_text='
							<html><body>
							<table width="100%" border="0" cellspacing="0" cellpadding="0">
								<tr>
									<td>
										<table width="100%" border="0" cellspacing="0" cellpadding="0">
										<tr valign="top"><td width="100%" valign="middle"><font size="2" color="#4B6A85">Календарь</font><br>
										</td></tr>
										</table>
									</td>
								</tr>
								<tr>
									<td>
									
										<table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#666666">
											<tr>
												<td>
													<table width="100%" cellspacing="1" cellpadding="0">
														<tr bgcolor="#FFFFFF">
															<td>
																Мероприятие:
															</td>
															<td align="left">
																'+text_str+'
															</td>
														</tr>
														<tr bgcolor="#FFFFFF">
															<td>
																Дата начала:
															</td>
															<td align="left">
																'+StrLeftCharRange(_time_zone_start_date, 16)+'
															</td>
														</tr>
														<tr bgcolor="#FFFFFF">
															<td>
																Дата окончания:
															</td>
															<td align="left">
																'+StrLeftCharRange(_time_zone_finish_date, 16)+'
															</td>
														</tr>
														<tr bgcolor="#FFFFFF">
															<td>
																Место проведения:
															</td>
															<td align="left">
																'+teEvent.place+'
															</td>
														</tr>
														<tr bgcolor="#FFFFFF">
															<td>
																Комментарий:
															</td>
															<td align="left">
																'+teEvent.comment+'
															</td>
														</tr>
														<tr bgcolor="#FFFFFF">
															<td>
																Преподователи:
															</td>
															<td align="left">
																'+_lectors_list+'
															</td>
														</tr>
														'+lector_comment+'
													</table>
												</td>
											</tr>
										</table>
										
									</td>
								</tr>
							</table>
							</body></html>
										'
						}

						// формирование и отправка самого сообщения
iValarmText='';
if (ReminderDays>0)
{
iValarmText='BEGIN:VALARM
TRIGGER:-P'+ReminderDays+'D
REPEAT:2
DURATION:PT15M
ACTION:DISPLAY
DESCRIPTION:'+teEvent.name+' '+_time_zone_start_date+'
X-WR-ALARMUID:'+StrHexInt(Int(teEvent.id)-1)+'
END:VALARM'
}	

RSVP_STR=SendFeedback?'TRUE':'FALSE';

DT_START = DateOffset(teEvent.start_date,(0-AGENT_TIME_ZONE)*3600);
DT_END = DateOffset(_finish_date,(0-AGENT_TIME_ZONE)*3600);

iCalendarText='BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//WebSoft LTD//WebTutor 2//EN
METHOD:REQUEST
BEGIN:VEVENT
DTSTART:'+StrReplace(StrReplace(StrLeftRange(StrXmlDate(DT_START),StrXmlDate(DT_START).lastIndexOf('+')),'-',''),':','')+'Z
DTEND:'+StrReplace(StrReplace(StrLeftRange(StrXmlDate(DT_END),StrXmlDate(DT_END).lastIndexOf('+')),'-',''),':','')+'Z
DTSTAMP:'+StrReplace(StrReplace(StrLeftRange(StrXmlDate(Date()),StrXmlDate(Date()).lastIndexOf('+')),'-',''),':','')+'Z
TRANSP:OPAQUE
SEQUENCE:0
ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;CN="'+iRecipientElem.fullname+'";RSVP='+RSVP_STR+'
:mailto:'+iRecipientElem.email+' 
CLASS:PUBLIC
DESCRIPTION:'+teEvent.comment+'\n
SUMMARY:'+teEvent.name+'
ORGANIZER;CN="'+OrgUser+'":mailto:'+OrgUserMail+'
UID:'+StrHexInt(teEvent.id)+'-WebTutor_Generated
LOCATION:'+PLACE_STR+'\n
'+iValarmText+'
END:VEVENT
END:VCALENDAR'

if (ShowAlert) alert("iCalendarText="+iCalendarText);

message_body ='X-Mru-BL: 0:0:2
X-Mru-NR: 1
X-Mru-OF: unknown (unknown)
To: '+iRecipientElem.email+'
Subject: '+_subject+'
MIME-Version: 1.0
From: '+sender_address+'
Content-Type: multipart/mixed; boundary="=_mixed 004128EAC32576F1_="
X-Spam: Not detected
X-Mras: Ok

This is a multipart message in MIME format.
--=_mixed 004128EAC32576F1_=
Content-Type: multipart/related; boundary="=_related 004128EAC32576F1_="


--=_related 004128EAC32576F1_=
Content-Type: multipart/alternative; boundary="=_alternative 004128EAC32576F1_="


--=_alternative 004128EAC32576F1_=
Content-Type: text/plain; charset='+DefCharset+'

'+text+'

--=_alternative 004128EAC32576F1_=
Content-Type: text/html; charset='+DefCharset+'
Content-Disposition: inline

'+html_text+'

--=_alternative 004128EAC32576F1_=
Content-Type: text/calendar; method=REQUEST; charset='+DefCharset+';

'+iCalendarText+'

--=_mixed 004128EAC32576F1_=--
'

						//alert(message_body)
						try
						{
							_client.SendMimeMessage(sender_address,iRecipientElem.email,message_body); // используем метод SendMimeMessage объекта SmtpClient().
							LogEvent( 'email', 'Email sending to '+iRecipientElem.fullname+' (e-mail: ' +iRecipientElem.email + ') successful.' ); // пишем в логи, что отправлено успешно
						}
						catch ( aa )
						{
							LogEvent( 'email', 'Email sending to '+iRecipientElem.fullname+' (e-mail: ' +iRecipientElem.email + ') failed. Error:'+ aa ); // пишем в логи, если ошибка
						}
					}
					else // если у мероприятия заданы ресурсы и их использование выбрано в переменной _use_Event_or_EventPhases - отправляем уведомления по ресурсам
					{
						j = 0; // число, вычетаемое из id мероприятия для формирования уникального кода уведомления. Используется ниже в X-WR-ALARMUID:'+StrHexInt(Int(_event.id)-1-i)+'
						for (_phase in _array_phases)
						{
							_time_zone_phase_start_date = DateOffset(_phase.start_date,(0-MESSAGE_TIME_ZONE)*3600); // дата начала ресурса мероприятия с учётом разницы часового пояса сотрудника и мероприятия
							_time_zone_phase_finish_date = DateOffset(_phase.finish_date,(0-MESSAGE_TIME_ZONE)*3600); // дата окончания ресурса мероприятия с учётом разницы часового пояса сотрудника и мероприятия
							_subject="Cancel: "+_event.name+" ("+_time_zone_phase_start_date+")"; // Тема - приглашение имя_мероприятия (дата начала ресурса)
							
							// если показываем полную информацию (НЕ ShowShortDescription)
							if (!ShowShortDescription)
							{
								text="Календарь\r\n\t " +text_str+"\n\t"+"Дата начала:"+_time_zone_phase_start_date+"\n\t"+"Дата окончания :"+_time_zone_phase_finish_date+"\n\t"+"Место проведения :"+teEvent.place+"\n\t"+"Комментарий:"+teEvent.comment+"\n\t"; // _header_host+'event&object_id='+_event.id+'&doc_id='+_doc_id - это ссылка на мероприятие в разделе Календарь мероприятий. В частном случае, если вдруг такая ссылка не работает (например, если раздел Календарь мероприятий доступен не всем) - можно сделать её короткой, только на само мероприятие, без раздела календарь мероприятий: _header_host+'event&object_id='+_event.id
									
								lector_comment = "";
								/*if (iRecipientElem.is_lector)
								{
								lector_comment = '<tr bgcolor="#FFFFFF">
												<td>
													Комментарий для тренера:
												</td>
												<td align="left">
													'+lector_text+'
												</td>
											</tr>
											<tr bgcolor="#FFFFFF">
												<td>
													Файл для тренера:
												</td>
												<td align="left">
													'+UrlAppendPath( PORTAL_URL,'/download_file.html?file_id=')+lector_resource_id+'
												</td>
											</tr>'
							
								}*/
								// тело письма
								html_text='
								<html><body>
								<table width="100%" border="0" cellspacing="0" cellpadding="0">
									<tr>
										<td>
											<table width="100%" border="0" cellspacing="0" cellpadding="0">
											<tr valign="top"><td width="100%" valign="middle"><font size="2" color="#4B6A85">Календарь</font><br>
											</td></tr>
											</table>
										</td>
									</tr>
									<tr>
										<td>
										
											<table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#666666">
												<tr>
													<td>
														<table width="100%" cellspacing="1" cellpadding="0">
															<tr bgcolor="#FFFFFF">
																<td>
																	Мероприятие:
																</td>
																<td align="left">
																	'+text_str+'
																</td>
															</tr>
															<tr bgcolor="#FFFFFF">
																<td>
																	Дата начала:
																</td>
																<td align="left">
																	'+StrLeftCharRange(_time_zone_phase_start_date, 16)+'
																</td>
															</tr>
															<tr bgcolor="#FFFFFF">
																<td>
																	Дата окончания:
																</td>
																<td align="left">
																	'+StrLeftCharRange(_time_zone_phase_finish_date, 16)+'
																</td>
															</tr>
															<tr bgcolor="#FFFFFF">
																<td>
																	Место проведения:
																</td>
																<td align="left">
																	'+teEvent.place+'
																</td>
															</tr>
															<tr bgcolor="#FFFFFF">
																<td>
																	Комментарий:
																</td>
																<td align="left">
																	'+teEvent.comment+'
																</td>
															</tr>
															<tr bgcolor="#FFFFFF">
																<td>
																	Преподователи:
																</td>
																<td align="left">
																	'+_lectors_list+'
																</td>
															</tr>
															'+lector_comment+'
														</table>
													</td>
												</tr>
											</table>
											
										</td>
									</tr>
								</table>
								</body></html>
										'
							}

							// формирование и отправка самого сообщения
iValarmText='';
if (ReminderDays>0)
{
iValarmText='BEGIN:VALARM
TRIGGER:-P'+ReminderDays+'D
REPEAT:2
DURATION:PT15M
ACTION:DISPLAY
DESCRIPTION:'+teEvent.name+' '+_time_zone_phase_start_date+'
X-WR-ALARMUID:'+StrHexInt(Int(teEvent.id)-1-j)+'
END:VALARM'
}	

RSVP_STR=SendFeedback?'TRUE':'FALSE';

DT_START = DateOffset(_phase.start_date,(0-AGENT_TIME_ZONE)*3600);
DT_END = DateOffset(_phase.finish_date,(0-AGENT_TIME_ZONE)*3600);
		
iCalendarText='BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//WebSoft LTD//WebTutor 2//EN
METHOD:REQUEST
BEGIN:VEVENT
DTSTART:'+StrReplace(StrReplace(StrLeftRange(StrXmlDate(DT_START),StrXmlDate(DT_START).lastIndexOf('+')),'-',''),':','')+'Z
DTEND:'+StrReplace(StrReplace(StrLeftRange(StrXmlDate(DT_END),StrXmlDate(DT_END).lastIndexOf('+')),'-',''),':','')+'Z
DTSTAMP:'+StrReplace(StrReplace(StrLeftRange(StrXmlDate(Date()),StrXmlDate(Date()).lastIndexOf('+')),'-',''),':','')+'Z
TRANSP:OPAQUE
SEQUENCE:0
ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;CN="'+iRecipientElem.fullname+'";RSVP='+RSVP_STR+'
 :mailto:'+iRecipientElem.email+' 
CLASS:PUBLIC
DESCRIPTION:'+teEvent.comment+'\n
SUMMARY:'+teEvent.name+' (этап ' +OptInt(j+1)+ ' из ' + ArrayCount(_array_phases)+') '+DateNewTime(_phase.start_date)+'
ORGANIZER;CN="'+OrgUser+'":mailto:'+OrgUserMail+'
UID:'+StrHexInt(teEvent.id)+j'-WebTutor_Generated
LOCATION:'+PLACE_STR+'\n
'+iValarmText+'
END:VEVENT
END:VCALENDAR'
	
if (ShowAlert) alert("iCalendarText="+iCalendarText);
		 
message_body ='X-Mru-BL: 0:0:2
X-Mru-NR: 1
X-Mru-OF: unknown (unknown)
To: '+iRecipientElem.email+'
Subject: '+_subject+'
MIME-Version: 1.0
From: '+sender_address+'
Content-Type: multipart/mixed; boundary="=_mixed 004128EAC32576F1_="
X-Spam: Not detected
X-Mras: Ok

This is a multipart message in MIME format.
--=_mixed 004128EAC32576F1_=
Content-Type: multipart/related; boundary="=_related 004128EAC32576F1_="


--=_related 004128EAC32576F1_=
Content-Type: multipart/alternative; boundary="=_alternative 004128EAC32576F1_="


--=_alternative 004128EAC32576F1_=
Content-Type: text/plain; charset='+DefCharset+'

'+text+'

--=_alternative 004128EAC32576F1_=
Content-Type: text/html; charset='+DefCharset+'
Content-Disposition: inline

'+html_text+'

--=_alternative 004128EAC32576F1_=
Content-Type: text/calendar; method=REQUEST; charset='+DefCharset+';

'+iCalendarText+'
--=_mixed 004128EAC32576F1_=--
'

							//alert(message_body)
							try
							{
								_client.SendMimeMessage(sender_address,iRecipientElem.email,message_body); // используем метод SendMimeMessage объекта SmtpClient().
								LogEvent( 'email', 'Email sending to '+iRecipientElem.fullname+' (e-mail: ' +iRecipientElem.email + ') successful.' ); // пишем в логи, что отправлено успешно
							}
							catch ( aa )
							{
								LogEvent( 'email', 'Email sending to '+iRecipientElem.fullname+' (e-mail: ' +iRecipientElem.email + ') failed. Error:'+ aa ); // пишем в логи, если ошибка
							}
							j++; // увеличиваем счётчик для X-WR-ALARMUID:'+StrHexInt(Int(_event.id)-1-i)+'
						}
					}
				}
			}
		}
		_client.CloseSession();
		//return true;
	}
	catch ( aa )
	{
		LogEvent( 'email', aa );
		alert( aa );
		_client.CloseSession();
		//return false;
	}
}