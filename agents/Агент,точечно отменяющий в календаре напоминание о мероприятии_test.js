// В OBJECT_ID - id мероприятия

//OBJECT_ID = 6935697595633528624

//alert(OBJECT_ID)

daysCount=7;// период за который отбираются мероприятия и по которым будут созданы напоминания ( текущая дата + daysCount )
OrgUser="websoft";//пользователь, от имени которого будет создано в календаре напоминание
OrgUserMail="websoft@nlmk.com";//адрес пользователя, от имени которого будет создано напоминание в календаре
DefCharset="utf-8"//кодировка по умалчанию
ReminderDays=1// частота создания напоминаний 
SendFeedback=false//отправлять пользователю от имени которого было послано напоминание сообщение о добавлении напоминания в календарь
SendInvitationsToParticipants=true//отправлять уведомление для создания напоминания преподавателям
SendInvitationsToLectors=true//If parameter is true then the invitations will be send to the trainers of the event
SendInvitationsToResponsibleOfEvent=true//отправлять уведомление для создания напоминания ответственным за проведения мероприятия
SendInvitationsToResponsibleOfEventPreparation=true//отправлять уведомление для создания напоминания ответственным за подготовку мероприятия
ShowShortDescription=false
//----------------------------------
// часовой пояс времени, указываемого в параметрах карточки мероприятия, 
// если параметр отрицательный укажите (0-X), где X - число часов [десятичная дробь]
BASE_TIME_ZONE = 0; 
//----------------------------------
ModDate="28.04.2010 16:31"
ShowAlert=true;
//alert('uniCalendarEntryAgent starts')
try
{
                ReminderDays=Int(ReminderDays)
}
catch(ex)
{
                alert('Impossible to convert ReminderDays number to integer. There will be no reminder in the calendar.')
                ReminderDays=0;
}

if (ShowAlert) alert("ModDate="+ModDate);
if (ShowAlert)
{ 
                alert("daysCount="+daysCount);
                alert("OrgUser="+OrgUser);
                alert("OrgUserMail="+OrgUserMail);
                alert("DefCharset="+DefCharset);
                alert("ReminderDays="+ReminderDays);
                alert("SendFeedback="+ReminderDays);
                alert("SendInvitationsToParticipants="+SendInvitationsToParticipants)
                alert("SendInvitationsToLectors="+SendInvitationsToLectors)
                alert("SendInvitationsToResponsibleOfEvent="+SendInvitationsToResponsibleOfEvent)
                alert("SendInvitationsToResponsibleOfEventPreparation="+SendInvitationsToResponsibleOfEventPreparation)
                alert("ShowShortDescription="+ShowShortDescription)
}

SmtpFound=false
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
	try { if (OptInt(Param.UseTLSPort)==1) _client.UseTLSPort = true;} catch (err) {}
	try { if (OptInt(Param.UseTLSPort)==0) _client.UseTLSPort = false;} catch (err) {}
	// Если данные параметры выбраны в переменных - берём их оттуда
	// получение параметра - Использовать TLS (Использовать SSL) 
	try { if (OptInt(Param.UseTLS)==1) _client.UseTLS = true;} catch (err) {}
	try { if (OptInt(Param.UseTLS)==0) _client.UseTLS = false;} catch (err) {}

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
             

if (SmtpFound)
{
                try
                {
                               sender_address = global_settings.settings.own_org.email;
                
                               _start_date=Date();
                               _start_date=Date(DateNewTime(_start_date,00,00,00));
                               _end_date=RawSecondsToDate( DateToRawSeconds(_start_date)  + (daysCount)*86400);
                               _end_date=Date(DateNewTime(_end_date,23,59,59));
                               
                               
                               
                               if (ShowAlert) alert("start="+_start_date+" end="+_end_date);
                               
                               event_arr=XQuery( "for $obj in events where $obj/id = " + OBJECT_ID + "  return $obj" ); //and $obj/status_id = 'cancel'


                               if (ShowAlert) alert('ArrayCount(event_arr)='+ArrayCount(event_arr));
                               
                               for ( _event in event_arr )
                               {
                               
                                               docEvent = OpenDoc( UrlFromDocID(_event.id));
                                               teEvent=docEvent.TopElem;
                                                                                            
			//определяем TIMEZONE
			if (OptInt(teEvent.place_id, 0) != 0) {
			  teTz = OpenDoc(UrlFromDocID(teEvent.place_id)).TopElem
			  
			  catTimeZone1 = common.timezones.GetChildByKey( teTz.timezone_id )
			  
			  if (catTimeZone1.direction == 0) 
			  	BASE_TIME_ZONE = 0 - catTimeZone1.tm
			  else
			  	BASE_TIME_ZONE = catTimeZone1.tm
			  
			}	

            file_id=String(_event.id).slice(String(_event.id).length-6) 
             PORTAL_URL = global_settings.settings.portal_base_url; 
            _header_host=UrlAppendPath( PORTAL_URL,'/view_doc.html?mode=');
            _as_ap='"'+'events'+'"';
            _as_ap_arr=XQuery( 'for $elem in documents where $elem/code='+_as_ap+' return $elem' );
            _as_ap_arr_fe=ArrayOptFirstElem(_as_ap_arr);
            
            _doc_id='';
            if (_as_ap_arr_fe!=undefined)
            {
                            _doc_id=_as_ap_arr_fe.id;
            }
            
            _subject="Canceled: "+_event.name+" ("+_event.start_date+")";
            
            if (ShowShortDescription)
            {
                            text_str='Тема: "'+teEvent.name+'" <br/>'+_header_host+'event&object_id='+_event.id+'&doc_id='+_doc_id;
            }
            else
            {
                            text_str='Мероприятие "'+teEvent.name+'" запланировано: '+_header_host+'event&object_id='+_event.id+'&doc_id='+_doc_id;
            }
            if (ShowAlert) alert('teEvent.name='+teEvent.name);
            _finish_date=Date(DateNewTime(_end_date,23,59,59));             
            if (teEvent.finish_date.HasValue)
            {
                            _finish_date = teEvent.finish_date;
            }
                          
            try{
                objPlace = OpenDoc(UrlFromDocID(teEvent.place_id)).TopElem;
				if (Trim(objPlace.address) != "")
                  PLACE_STR = Trim(objPlace.name + ", " + Trim(objPlace.address))
				else
				 PLACE_STR = Trim(objPlace.name)
            }
            catch(err){                
                PLACE_STR = "";
            }
            PLACE_STR += (PLACE_STR!="" && Trim(teEvent.place)!="") ? ", "+Trim(teEvent.place) : Trim(teEvent.place);

                                               if (ShowShortDescription) 
                                               {

												html_text = "<table><tr><th>Тема:</th><th>текст заголовка</th></tr><tr><td>"'+teEvent.name+'"</td><td>данные</td></tr></table>"
                                                html_text='Тема: "'+teEvent.name+'" \r\n'+_header_host+'event&object_id='+_event.id+'&doc_id='+_doc_id;
                                               }
                                               else
                                               {                                             
                                                html_text="Календарь\r\n\t " +text_str+"\n\t"+"Дата начала:"+teEvent.start_date+"\n\t"+"Дата окончания :"+_finish_date+"\n\t"+"Место проведения :"+teEvent.place+"\n\t"+"Комментарий:"+teEvent.comment+"\n\t";
                                               }
                
												// html_text=''

                                               arrRecipients=Array();
                                               counter=0;

                                               _arr_str=teEvent.custom_elems.ObtainChildByKey('f_n84u').value;
                                               _list=String(_arr_str).split(';');   
                                               if (ShowAlert) alert('ArrayCount(_list)='+ArrayCount(_list));
                                               _is_changed=false;
                                               if (SendInvitationsToParticipants)
                                               {
                                                               for (iParticipantElem in teEvent.collaborators) 
                                                               {
                                                                               _is_in_list=false; //отправляем только тем, по ком уже была рассылка
                                                                               
                                                                               
                                                                               for (_elem in _list) 
                                                                               {
                                                                                              if (Trim(_elem)==Trim(iParticipantElem.collaborator_id))
                                                                                              {
                                                                                                              _is_in_list=true;
                                                                                                              break;
                                                                                              }
                                                                               }
                                                                               if (ShowAlert) alert('_is_in_list='+_is_in_list);
                                                                               if (_is_in_list==true)
                                                                               {
                                                                                              
                                                                                              _arr_str=_arr_str+iParticipantElem.collaborator_id+";";
                                                                                              person_arr=XQuery( 'for $obj in collaborators where $obj/id='+iParticipantElem.collaborator_id+' and $obj/email != "" return $obj');

                                                                                              for ( _person in person_arr )
                                                                                              {
                                                                                                              if (ShowAlert)(_person.fullname);
                                                                                                              NewElem=new Object;
                                                                                                              NewElem.email=_person.email;
                                                                                                              NewElem.fullname=_person.fullname;
																											  NewElem.place_id=_person.place_id;
                                                                                                              arrRecipients[counter]=NewElem
                                                                                                              counter++                          
                                                                                              }
                                                                                              
                                                                                              _is_changed=true;
                                                                               }
                                                                               if (ShowAlert) alert('_is_changed='+_is_changed);
                                                               }
                                                               
                                               }


                                               if (SendInvitationsToLectors)
                                               {
                                                     if (ShowAlert) alert('Преподаватели');
                                                               for (iLectorElem in teEvent.lectors) 
                                                               {
                                                                               _is_in_list=false;                                                            
                                                                               
                                                                               for (_elem in _list) 
                                                                               {
                                                                                              if (Trim(_elem)==Trim(iLectorElem.lector_id))
                                                                                              {
                                                                                                              _is_in_list=true;
                                                                                                              break;
                                                                                              }
                                                                               }
                                                                               if (ShowAlert) alert('_is_in_list='+_is_in_list);
                                                                               if (_is_in_list==true)
                                                                               {
                                                                                              
                                                                                              //_arr_str=_arr_str+iLectorElem.lector_id+";";
                                                                                              lector_arr=XQuery( 'for $obj in lectors where $obj/id='+iLectorElem.lector_id+' return $obj');

                                                                                              for ( _lector in lector_arr )
                                                                                              {
                            if (_lector.type=='collaborator'){
							    _arr_str=_arr_str+_lector.person_id+";";
                                _person = ArrayOptFirstElem(XQuery( 'for $obj in collaborators where $obj/id='+_lector.person_id+' and $obj/email != "" return $obj'));
                                if (_person != undefined){
                                    _person_fullname = _person.fullname;
                                    _person_email = _person.email;
									_person_place_id = _person.place_id;
                                }
                            }
                            else{
                                _person_fullname = _lector.lector_fullname;
                                _person_email = _lector.email;
								_person_place_id = '';
                            }
                                                                                                              if (ShowAlert) alert(_person_fullname);
                                                                                                              NewElem = new Object;
                                                                                                              NewElem.email = _person_email;
                                                                                                              NewElem.fullname = _person_fullname
																											  NewElem.place_id=_person_place_id;
                                                                                                              arrRecipients[counter] = NewElem
                                                                                                              counter++                          
                                                                                              }
                                                                                              
                                                                                              _is_changed=true;
                                                                               }
                                                                               if (ShowAlert) alert('_is_changed='+_is_changed);
                                                               }
                                                               
                                               }


                                               if (SendInvitationsToResponsibleOfEvent)
                                               {
                                                               for (iTutorElem in teEvent.tutors) 
                                                               {
                                                                               _is_in_list=false;
                                                                               
                                                                               
                                                                               for (_elem in _list) 
                                                                               {
                                                                                              if (Trim(_elem)==Trim(iTutorElem.collaborator_id))
                                                                                              {
                                                                                                              _is_in_list=true;
                                                                                                              break;
                                                                                              }
                                                                               }
                                                                               if (ShowAlert) alert('_is_in_list='+_is_in_list);
                                                                               if (_is_in_list==true)
                                                                               {
                                                                                              
                                                                                              _arr_str=_arr_str+iTutorElem.collaborator_id+";";
                                                                                              person_arr=XQuery( 'for $obj in collaborators where $obj/id='+iTutorElem.collaborator_id+' and $obj/email != "" return $obj');

                                                                                              for ( _person in person_arr )
                                                                                              {
                                                                                                              if (ShowAlert)(_person.fullname);
                                                                                                              NewElem=new Object;
                                                                                                              NewElem.email=_person.email;
                                                                                                              NewElem.fullname=_person.fullname
																											  NewElem.place_id=_person.place_id;
                                                                                                              arrRecipients[counter]=NewElem
                                                                                                              counter++                          
                                                                                              }
                                                                                              
                                                                                              _is_changed=true;
                                                                               }
                                                                               if (ShowAlert) alert('_is_changed='+_is_changed);
                                                               }
                                                               
                                               }

                                               if (SendInvitationsToResponsibleOfEventPreparation)
                                               {
                                                               for (iEventPreparationElem in teEvent.even_preparations) 
                                                               {
                                                                               _is_in_list=false;
                                                                               
                                                                               
                                                                               for (_elem in _list) 
                                                                               {
                                                                                              if (Trim(_elem)==Trim(iEventPreparationElem.person_id))
                                                                                              {
                                                                                                              _is_in_list=true;
                                                                                                              break;
                                                                                              }
                                                                               }
                                                                               if (ShowAlert) alert('_is_in_list='+_is_in_list);
                                                                               if (_is_in_list==true)
                                                                               {
                                                                                              
                                                                                              _arr_str=_arr_str+iEventPreparationElem.person_id+";";
                                                                                              person_arr=XQuery( 'for $obj in collaborators where $obj/id='+iEventPreparationElem.person_id+' and $obj/email != "" return $obj');

                                                                                              for ( _person in person_arr )
                                                                                              {
                                                                                                              if (ShowAlert)(_person.fullname);
                                                                                                              NewElem=new Object;
                                                                                                              NewElem.email=_person.email;
                                                                                                              NewElem.fullname=_person.fullname
																											  NewElem.place_id=_person.place_id;
                                                                                                              arrRecipients[counter]=NewElem
                                                                                                              counter++                          
                                                                                              }
                                                                                              
                                                                                              _is_changed=true;
                                                                               }
                                                                               if (ShowAlert) alert('_is_changed='+_is_changed);
                                                               }
                                                               
                                               }
                                               
                                               arrRecipients = ArraySelectDistinct(arrRecipients, "This.fullname+' '+This.email")
                                               
                                               if (ShowAlert) 
                                               {
                                                   
                                                               for (iRecipientElem in arrRecipients)
                                                               {
                                                                               alert(iRecipientElem.fullname+' '+iRecipientElem.email)
                                                               }
                                               }
                                               
                                               for (iRecipientElem in arrRecipients)
                                               {
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
				if (StrCharCount(teEvent.place_id)  != 0)
				{
					if (StrCharCount(ArrayOptFirstElem(XQuery('for $elem in places where $elem/id = ' + teEvent.place_id + ' return $elem')).timezone_id) != 0)
						Event_TIME_ZONE = OptReal(ArrayOptFirstElem(XQuery('for $elem in places where $elem/id = ' + teEvent.place_id + ' return $elem')).timezone_id)/10 - 12; // берём часовой пояс из расположения, указанного в карточке мероприятия
					else
						Event_TIME_ZONE = 3;
				}
				else
					Event_TIME_ZONE = 3;

				// итоговый часовой пояс для запуска агента из переменной, а также разницей часовых поясов сотрудника и мероприятия
				AGENT_TIME_ZONE = Event_TIME_ZONE;
				// итоговый часовой пояс с учётом разницы часовых поясов сотрудника и мероприятия
				MESSAGE_TIME_ZONE = Event_TIME_ZONE - Recipient_TIME_ZONE;			
				
				_array_phases = teEvent.phases; // пытаемся получить массив ресурсов. Если он есть - то будем отправлять в календарь приглашения по ресурсам, а если нет - по самому мероприятию
				_subject="Canceled: "+teEvent.name;
			
				if ((ArrayOptFirstElem(_array_phases) == undefined) || (!Param._use_Event_or_EventPhases))// если ресурсов по мероприятию нет или в переменной _use_Event_or_EventPhases задано использование только дат мероприятия - отправляем уведомления по самому меропритию
				{
				// если у сотрудника задано расположение и в этом расположении есть часовой пояс
				iValarmText='';
if (ReminderDays>0)
{
iValarmText='BEGIN:VALARM
TRIGGER:-P'+ReminderDays+'D
REPEAT:2
DURATION:PT15M
ACTION:DISPLAY
DESCRIPTION:'+teEvent.name+' '+teEvent.start_date+'
X-WR-ALARMUID:'+StrHexInt(Int(teEvent.id)-1)+'
END:VALARM'
}	

RSVP_STR=SendFeedback?'TRUE':'FALSE';

DT_START = DateOffset(teEvent.start_date,(0-BASE_TIME_ZONE)*3600);
DT_END = DateOffset(_finish_date,(0-BASE_TIME_ZONE)*3600);
		
iCalendarText='BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//WebSoft LTD//WebTutor 2//EN
METHOD:CANCEL
BEGIN:VEVENT
DTSTART:'+StrReplace(StrReplace(StrLeftRange(StrXmlDate(DT_START),StrXmlDate(DT_START).lastIndexOf('+')),'-',''),':','')+'Z
DTEND:'+StrReplace(StrReplace(StrLeftRange(StrXmlDate(DT_END),StrXmlDate(DT_END).lastIndexOf('+')),'-',''),':','')+'Z
DTSTAMP:'+StrReplace(StrReplace(StrLeftRange(StrXmlDate(Date()),StrXmlDate(Date()).lastIndexOf('+')),'-',''),':','')+'Z
TRANSP:OPAQUE
SEQUENCE:0
PRIORITY:1
STATUS:CANCELLED
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

'+text_str+'

--=_alternative 004128EAC32576F1_=
Content-Type: text/html; charset='+DefCharset+'
Content-Disposition: inline

'+html_text+'

--=_alternative 004128EAC32576F1_=
Content-Type: text/calendar; method=CANCEL; charset='+DefCharset+'

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
						
					
				}else{
					i = 0;
						for (_phase in _array_phases)
					{
						_subject="Cancel: "+teEvent.name; // Тема - приглашение имя_мероприятия (дата начала ресурса)
				iValarmText='';
if (ReminderDays>0)
{
iValarmText='BEGIN:VALARM
TRIGGER:-P'+ReminderDays+'D
REPEAT:2
DURATION:PT15M
ACTION:DISPLAY
DESCRIPTION:'+teEvent.name+' '+teEvent.start_date+'
X-WR-ALARMUID:'+StrHexInt(Int(teEvent.id)-1-i)+'
END:VALARM'
}	

RSVP_STR=SendFeedback?'TRUE':'FALSE';

DT_START = DateOffset(_phase.start_date,(0-AGENT_TIME_ZONE)*3600);
DT_END = DateOffset(_phase.finish_date,(0-AGENT_TIME_ZONE)*3600);
		
iCalendarText='BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//WebSoft LTD//WebTutor 2//EN
METHOD:CANCEL
BEGIN:VEVENT
DTSTART:'+StrReplace(StrReplace(StrLeftRange(StrXmlDate(DT_START),StrXmlDate(DT_START).lastIndexOf('+')),'-',''),':','')+'Z
DTEND:'+StrReplace(StrReplace(StrLeftRange(StrXmlDate(DT_END),StrXmlDate(DT_END).lastIndexOf('+')),'-',''),':','')+'Z
DTSTAMP:'+StrReplace(StrReplace(StrLeftRange(StrXmlDate(Date()),StrXmlDate(Date()).lastIndexOf('+')),'-',''),':','')+'Z
TRANSP:OPAQUE
SEQUENCE:0
PRIORITY:1
STATUS:CANCELLED
ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;CN="'+iRecipientElem.fullname+'";RSVP='+RSVP_STR+'
 :mailto:'+iRecipientElem.email+' 
CLASS:PUBLIC
DESCRIPTION:'+teEvent.comment+'\n
SUMMARY:'+teEvent.name+'
ORGANIZER;CN="'+OrgUser+'":mailto:'+OrgUserMail+'
UID:'+StrHexInt(teEvent.id)+i'-WebTutor_Generated
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

'+text_str+'

--=_alternative 004128EAC32576F1_=
Content-Type: text/html; charset='+DefCharset+'
Content-Disposition: inline

'+html_text+'

--=_alternative 004128EAC32576F1_=
Content-Type: text/calendar; method=CANCEL; charset='+DefCharset+'

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
						i++; // увеличиваем счётчик для X-WR-ALARMUID:'+StrHexInt(Int(teEvent.id)-1-i)+'				
				
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