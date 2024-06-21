

function createEducationPlans(persons, educationProgramID) {

            compoundProgramDocTE = tools.open_doc(educationProgramID).TopElem;
            _max_days_pr = ArrayMax(ArraySelect(compoundProgramDocTE.programs,'!This.parent_progpam_id.HasValue'),'OptInt(This.delay_days,0)+OptInt(This.days,0)');
		    _max_days = OptInt(_max_days_pr.delay_days,0)+OptInt(_max_days_pr.days,0);

            for ( person in persons ) {
                try
                {
                    if( ArrayOptFirstElem(XQuery('for $elem in education_plans where $elem/person_id =' + XQueryLiteral(person.id) + ' and $elem/compound_program_id = ' + XQueryLiteral(educationProgramID) + ' return $elem/Fields(\'id\')')) != undefined ) {
                        continue;
                    }

                    personDoc = OpenDoc(UrlFromDocID(person.collaborator_id)).TopElem;
                    docEducationPlan = OpenNewDoc( 'x-local://wtv/wtv_education_plan.xmd' );
                    docEducationPlan.TopElem.AssignElem( compoundProgramDocTE );
                    docEducationPlan.TopElem.code = '';
                    docEducationPlan.TopElem.comment = '';
                    docEducationPlan.TopElem.group_id = group_id;
                    docEducationPlan.TopElem.compound_program_id = compoundProgramDocTE.id;
                    docEducationPlan.TopElem.person_id = person.collaborator_id;
                    tools.common_filling( 'collaborator', docEducationPlan.TopElem, person.collaborator_id, personDoc );
                    docEducationPlan.TopElem.create_date = Date();
                    docEducationPlan.TopElem.plan_date = Date();
                    docEducationPlan.TopElem.finish_date = tools.AdjustDate(Date(),_max_days);
                    docEducationPlan.BindToDb(DefaultDb);
                    docEducationPlan.Save();
                    docEducationPlan.TopElem.last_state_id = docEducationPlan.TopElem.state_id;
                    tools.call_code_library_method( 'libEducation', 'update_education_plan_date', [ docEducationPlan.DocID, docEducationPlan ] );
                    CallServerMethod( 'tools', 'call_code_library_method', [ 'libEducation', 'update_education_plan', [ docEducationPlan.DocID, null, person.collaborator_id, true ] ] );
                    //_first = false;
                }
                catch ( err )
                {
                    alert("Err ==" + err)
                }
            }
    	
}

try {

    var a = ArraySelectAll(XQuery("sql:  \
    DECLARE @compound_program_id AS BIGINT = '7135758684291930529'\
        SELECT\
            [t0].[id]\
        FROM\
            (\
                SELECT\
                    [t0].[id],\
                    [t0].[fullname],\
                    [t0].[position_id],\
                    [t0].[position_name],\
                    [t0].[org_id],\
                    [t0].[org_name],\
                    [cx].[f_funcroute],\
                    (\
                        SELECT\
                            COUNT(id)\
                        FROM\
                            [education_plans]\
                        WHERE\
                            [person_id] = [t0].[id]\
                            AND [compound_program_id] = @compound_program_id\
                    ) AS [count_edu_plans],\
                    IIF(\
                        cx.count_changes > 1,\
                        cx.change_log_position_id,\
                        NULL\
                    ) AS [previous_position_id],\
                    IIF(\
                        cx.count_changes > 1,\
                        [d2].data.value(\
                            '(position/custom_elems/custom_elem[name/text()=''cust_catergory'']/value/text())[1]',\
                            'VARCHAR(12)'\
                        ),\
                        NULL\
                    ) AS [cust_catergory],\
                    cx.count_changes AS [count_changes]\
                FROM\
                    [collaborators] AS [t0]\
                    INNER JOIN [collaborator] AS [d0] ON [t0].[id] = [d0].[id]\
                    CROSS APPLY (\
                        SELECT\
                            [d0].data.value(\
                                'count((collaborator/change_logs)[1]/change_log/id/text())',\
                                'bigint'\
                            ) [count_changes],\
                            [d0].data.value(\
                                '(/collaborator/change_logs/change_log[last() - 1]/position_id)[1]',\
                                'bigint'\
                            ) [change_log_position_id],\
                            [d0].data.value(\
                                '(/collaborator/custom_elems/custom_elem[name/text()=''f_funcroute'']/value/text())[1]',\
                                'VARCHAR(224)'\
                            ) [f_funcroute]\
                    ) [cx]\
                    INNER JOIN [position] AS [d1] ON [d1].[id] = [t0].[position_id]\
                    left JOIN [position] AS [d2] ON [d2].[id] = cx.change_log_position_id\
                WHERE\
                    [t0].[is_dismiss] != 1\
                    AND [t0].[position_name] != 'Главный специалист'\
                    AND (\
                        CASE\
                            WHEN [t0].[org_id] IN('116612032298310523', '7116612032494196892')\
                            AND [cx].[f_funcroute] != 'Цифровизация производства'\
                            AND [t0].[position_name] IN(\
                                'Руководитель проектов',\
                                'Руководитель программ',\
                                'Младший руководитель проектов',\
                                'Менеджер',\
                                'Бизнес-партнер'\
                            ) THEN 0\
                            WHEN [t0].[org_id] = '7116612032892594031'\
                            AND [t0].[position_name] = 'Главный инженер проекта' THEN 0\
                            ELSE 1\
                        END = 1\
                    )\
                    AND [d0].data.value(\
                        '(collaborator/custom_elems/custom_elem[name/text()=''f_categ'']/value/text())[1]',\
                        'VARCHAR(10)'\
                    ) = '2'\
                    AND [d1].data.value(\
                        '(position/custom_elems/custom_elem[name/text()=''cust_grade'']/value/text())[1]',\
                        'int'\
                    ) >= 12\
                    AND DATEDIFF(\
                        day,\
                        [d0].data.value(\
                            '(collaborator/change_logs/change_log[last()]/date/text())[1]',\
                            'date'\
                        ),\
                        GETDATE()\
                    ) = 5\
            ) t0\
        WHERE\
            [t0].[count_edu_plans] = 0\
            AND (\
                [t0].[count_changes] = 1\
    "))

    if (ArrayCount(a) > 0) {
        createEducationPlans(a, '7135758684291930529')
    }

    var b = ArraySelectAll(XQuery("sql:  \
        DECLARE @compound_program_id AS BIGINT = '7164021957306680477';\
        DECLARE @fn VARCHAR(MAX) = 'Аппарат Президента (Председ. Правления),Аппарат управляющего директора,ВЗАИМОДЕЙСТВИЕ С ГОСУДАРСТВЕННЫМИ ОРГАНИ,ВНУТРЕННИЙ АУДИТ,ЗАКУПКА СЫРЬЕВЫХ КАТЕГОРИЙ,ИНВЕСТИЦИИ,КОРПОРАТИВНОЕ УПРАВЛЕНИЕ,ОПЕРАЦИОННАЯ ЭФФЕКТИВНОСТЬ,ПРОДАЖИ,РАЗВИТИЕ ТЕХНОЛОГИИ,СВЯЗИ С ОБЩЕСТВЕННОСТЬЮ,СНАБЖЕНИЕ,СТРАТЕГИЧЕСКОЕ РАЗВИТИЕ,УПРАВЛЕНИЕ ПЕРСОНАЛОМ,УПРАВЛЕНИЕ РИСКАМИ,ФИНАНСЫ И ЭКОНОМИКА,ЦИФР. ТРАНСФОРМАЦИЯ И ИНФОРМ. ТЕХНОЛОГИИ,Цифровизация производства,Экология,ЮРИДИЧЕСКАЯ ПОДДЕРЖКА'\
        SELECT\
            [t0].[id]\
        FROM\
            (\
                SELECT\
                    [t0].[id],\
                    [t0].[fullname],\
                    [t0].[position_id],\
                    [t0].[position_name],\
                    [t0].[org_id],\
                    [t0].[org_name],\
                    [cx].[f_funcroute],\
                    (\
                        SELECT\
                            COUNT(id)\
                        FROM\
                            [education_plans]\
                        WHERE\
                            [person_id] = [t0].[id]\
                            AND [compound_program_id] = @compound_program_id\
                    ) AS [count_edu_plans],\
                    IIF(\
                        cx.count_changes > 1,\
                        cx.change_log_position_id,\
                        NULL\
                    ) AS [previous_position_id],\
                    IIF(\
                        cx.count_changes > 1,\
                        [d2].data.value(\
                            '(position/custom_elems/custom_elem[name/text()=''cust_catergory'']/value/text())[1]',\
                            'VARCHAR(12)'\
                        ),\
                        NULL\
                    ) AS [cust_catergory],\
                    cx.count_changes AS [count_changes]\
                FROM\
                    [collaborators] AS [t0]\
                    INNER JOIN [collaborator] AS [d0] ON [t0].[id] = [d0].[id]\
                    CROSS APPLY (\
                        SELECT\
                            [d0].data.value(\
                                'count((collaborator/change_logs)[1]/change_log/id/text())',\
                                'bigint'\
                            ) [count_changes],\
                            [d0].data.value(\
                                '(/collaborator/change_logs/change_log[last() - 1]/position_id)[1]',\
                                'bigint'\
                            ) [change_log_position_id],\
                            [d0].data.value(\
                                '(/collaborator/custom_elems/custom_elem[name/text()=''f_funcroute'']/value/text())[1]',\
                                'VARCHAR(224)'\
                            ) [f_funcroute]\
                    ) [cx]\
                    INNER JOIN [position] AS [d1] ON [d1].[id] = [t0].[position_id]\
                    LEFT JOIN [position] AS [d2] ON [d2].[id] = cx.change_log_position_id\
                    INNER JOIN (\
                        SELECT\
                            [Value]\
                        FROM\
                            STRING_SPLIT(@fn, ',')\
                    ) AS [t1] ON [t1].[Value] = [cx].[f_funcroute]\
                WHERE\
                    [t0].[is_dismiss] != 1\
                    AND [t0].[position_name] != 'Главный специалист'\
                    AND (\
                        CASE\
                            WHEN [t0].[org_id] IN('7116612032298310523', '7116612032494196892')\
                            AND [cx].[f_funcroute] != 'Цифровизация производства'\
                            AND [t0].[position_name] IN(\
                                'Руководитель проектов',\
                                'Руководитель программ',\
                                'Младший руководитель проектов',\
                                'Менеджер',\
                                'Бизнес-партнер'\
                            ) THEN 0\
                            WHEN [t0].[org_id] = '7116612032892594031'\
                            AND [t0].[position_name] = 'Главный инженер проекта' THEN 0\
                            ELSE 1\
                        END = 1\
                    )\
                    AND [d0].data.value(\
                        '(collaborator/custom_elems/custom_elem[name/text()=''f_categ'']/value/text())[1]',\
                        'VARCHAR(10)'\
                    ) = '2'\
                    AND [d1].data.value(\
                        '(position/custom_elems/custom_elem[name/text()=''cust_grade'']/value/text())[1]',\
                        'int'\
                    ) >= 12\
                    AND DATEDIFF(\
                        day,\
                        [d0].data.value(\
                            '(collaborator/change_logs/change_log[last()]/date/text())[1]',\
                            'date'\
                        ),\
                        GETDATE()\
                    ) = 5\
            ) t0\
        WHERE\
            [t0].[count_edu_plans] = 0\
            AND (\
                [t0].[count_changes] = 1\
                OR [t0].[cust_catergory] != 'Руководитель'\
            )\
    "))
        
    if (ArrayCount(b) > 0) {
        createEducationPlans(b, '7164021957306680477')
    }

    var c = ArraySelectAll(XQuery("sql:  \
            DECLARE @compound_program_id AS BIGINT = '7164021957306680477';\
            DECLARE @fn VARCHAR(MAX) = 'АВТОМАТИЗАЦИЯ ТЕХНОЛОГИЧЕСКИХ ПРОЦЕССОВ,Аглодоменное производство,Вспомогательное производство,Горнодобывающее производство,ЛОГИСТИКА,Машиностроительное производство,ОБЕСПЕЧЕНИЕ БЕЗОПАСНОСТИ,Организация и выполнение ТОиР,ОХРАНА ТРУДА И ПРОМЫШЛЕННАЯ БЕЗОПАСНОСТЬ,Переработка и утилизация вторичных ресур,Прокатное производство,РАЗВИТИЕ СИСТЕМЫ РЕМОНТОВ,Сталеплавильное производство,Технология и технические функции,Управление непроизводственными объектами,ЭНЕРГЕТИКА,Энергетическое производство'\
            SELECT\
                [t0].[id]\
            FROM\
                (\
                    SELECT\
                        [t0].[id],\
                        [t0].[fullname],\
                        [t0].[position_id],\
                        [t0].[position_name],\
                        [t0].[org_id],\
                        [t0].[org_name],\
                        [cx].[f_funcroute],\
                        (\
                            SELECT\
                                COUNT(id)\
                            FROM\
                                [education_plans]\
                            WHERE\
                                [person_id] = [t0].[id]\
                                AND [compound_program_id] = @compound_program_id\
                        ) AS [count_edu_plans],\
                        IIF(\
                            cx.count_changes > 1,\
                            cx.change_log_position_id,\
                            NULL\
                        ) AS [previous_position_id],\
                        IIF(\
                            cx.count_changes > 1,\
                            [d2].data.value(\
                                '(position/custom_elems/custom_elem[name/text()=''cust_catergory'']/value/text())[1]',\
                                'VARCHAR(12)'\
                            ),\
                            NULL\
                        ) AS [cust_catergory],\
                        cx.count_changes AS [count_changes]\
                    FROM\
                        [collaborators] AS [t0]\
                        INNER JOIN [collaborator] AS [d0] ON [t0].[id] = [d0].[id]\
                        CROSS APPLY (\
                            SELECT\
                                [d0].data.value(\
                                    'count((collaborator/change_logs)[1]/change_log/id/text())',\
                                    'bigint'\
                                ) [count_changes],\
                                [d0].data.value(\
                                    '(/collaborator/change_logs/change_log[last() - 1]/position_id)[1]',\
                                    'bigint'\
                                ) [change_log_position_id],\
                                [d0].data.value(\
                                    '(/collaborator/custom_elems/custom_elem[name/text()=''f_funcroute'']/value/text())[1]',\
                                    'VARCHAR(224)'\
                                ) [f_funcroute]\
                        ) [cx]\
                        INNER JOIN [position] AS [d1] ON [d1].[id] = [t0].[position_id]\
                        LEFT JOIN [position] AS [d2] ON [d2].[id] = cx.change_log_position_id\
                        INNER JOIN (\
                            SELECT\
                                [Value]\
                            FROM\
                                STRING_SPLIT(@fn, ',')\
                        ) AS [t1] ON [t1].[Value] = [cx].[f_funcroute]\
                    WHERE\
                        [t0].[is_dismiss] != 1\
                        AND [t0].[position_name] != 'Главный специалист'\
                        AND (\
                            CASE\
                                WHEN [t0].[org_id] IN('7116612032298310523', '7116612032494196892')\
                                AND [cx].[f_funcroute] != 'Цифровизация производства'\
                                AND [t0].[position_name] IN(\
                                    'Руководитель проектов',\
                                    'Руководитель программ',\
                                    'Младший руководитель проектов',\
                                    'Менеджер',\
                                    'Бизнес-партнер'\
                                ) THEN 0\
                                WHEN [t0].[org_id] = '7116612032892594031'\
                                AND [t0].[position_name] = 'Главный инженер проекта' THEN 0\
                                ELSE 1\
                            END = 1\
                        )\
                        AND [d0].data.value(\
                            '(collaborator/custom_elems/custom_elem[name/text()=''f_categ'']/value/text())[1]',\
                            'VARCHAR(10)'\
                        ) = '2'\
                        AND [d1].data.value(\
                            '(position/custom_elems/custom_elem[name/text()=''cust_grade'']/value/text())[1]',\
                            'int'\
                        ) >= 12\
                        AND DATEDIFF(\
                            day,\
                            [d0].data.value(\
                                '(collaborator/change_logs/change_log[last()]/date/text())[1]',\
                                'date'\
                            ),\
                            GETDATE()\
                        ) = 90\
                ) t0\
            WHERE\
                [t0].[count_edu_plans] = 0\
                AND (\
                    [t0].[count_changes] = 1\
                    OR [t0].[cust_catergory] != 'Руководитель'\
                )\
    "))
            
    if (ArrayCount(c) > 0) {
        createEducationPlans(c, '7164021957306680477')
    }

    var d = ArraySelectAll(XQuery("sql:  \
        DECLARE @compound_program_id AS BIGINT = '7202237023864635644';\
        DECLARE @fn VARCHAR(MAX) = 'Аппарат Президента (Председ. Правления),Аппарат управляющего директора,ВЗАИМОДЕЙСТВИЕ С ГОСУДАРСТВЕННЫМИ ОРГАНИ,ВНУТРЕННИЙ АУДИТ,ЗАКУПКА СЫРЬЕВЫХ КАТЕГОРИЙ,ИНВЕСТИЦИИ,КОРПОРАТИВНОЕ УПРАВЛЕНИЕ,ОПЕРАЦИОННАЯ ЭФФЕКТИВНОСТЬ,ПРОДАЖИ,РАЗВИТИЕ ТЕХНОЛОГИИ,СВЯЗИ С ОБЩЕСТВЕННОСТЬЮ,СНАБЖЕНИЕ,СТРАТЕГИЧЕСКОЕ РАЗВИТИЕ,УПРАВЛЕНИЕ ПЕРСОНАЛОМ,УПРАВЛЕНИЕ РИСКАМИ,ФИНАНСЫ И ЭКОНОМИКА,ЦИФР. ТРАНСФОРМАЦИЯ И ИНФОРМ. ТЕХНОЛОГИИ,Цифровизация производства,Экология,ЮРИДИЧЕСКАЯ ПОДДЕРЖКА'\
        SELECT\
            [t0].[id]\
        FROM\
            (\
                SELECT\
                    [t0].[id],\
                    [t0].[fullname],\
                    [t0].[position_id],\
                    [t0].[position_name],\
                    [t0].[org_id],\
                    [t0].[org_name],\
                    [cx].[f_funcroute],\
                    (\
                        SELECT\
                            COUNT(id)\
                        FROM\
                            [education_plans]\
                        WHERE\
                            [person_id] = [t0].[id]\
                            AND [compound_program_id] = @compound_program_id\
                    ) AS [count_edu_plans],\
                    IIF(\
                        cx.count_changes > 1,\
                        cx.change_log_position_id,\
                        NULL\
                    ) AS [previous_position_id],\
                    IIF(\
                        cx.count_changes > 1,\
                        [d2].data.value(\
                            '(position/custom_elems/custom_elem[name/text()=''cust_catergory'']/value/text())[1]',\
                            'VARCHAR(12)'\
                        ),\
                        NULL\
                    ) AS [cust_catergory],\
                    cx.count_changes AS [count_changes]\
                FROM\
                    [collaborators] AS [t0]\
                    INNER JOIN [collaborator] AS [d0] ON [t0].[id] = [d0].[id]\
                    CROSS APPLY (\
                        SELECT\
                            [d0].data.value(\
                                'count((collaborator/change_logs)[1]/change_log/id/text())',\
                                'bigint'\
                            ) [count_changes],\
                            [d0].data.value(\
                                '(/collaborator/change_logs/change_log[last() - 1]/position_id)[1]',\
                                'bigint'\
                            ) [change_log_position_id],\
                            [d0].data.value(\
                                '(/collaborator/custom_elems/custom_elem[name/text()=''f_funcroute'']/value/text())[1]',\
                                'VARCHAR(224)'\
                            ) [f_funcroute]\
                    ) [cx]\
                    INNER JOIN [position] AS [d1] ON [d1].[id] = [t0].[position_id]\
                    LEFT JOIN [position] AS [d2] ON [d2].[id] = cx.change_log_position_id\
                    INNER JOIN (\
                        SELECT\
                            [Value]\
                        FROM\
                            STRING_SPLIT(@fn, ',')\
                    ) AS [t1] ON [t1].[Value] = [cx].[f_funcroute]\
                WHERE\
                    [t0].[is_dismiss] != 1\
                    AND [t0].[position_name] != 'Главный специалист'\
                    AND (\
                        CASE\
                            WHEN [t0].[org_id] IN('7116612032298310523', '7116612032494196892')\
                            AND [cx].[f_funcroute] != 'Цифровизация производства'\
                            AND [t0].[position_name] IN(\
                                'Руководитель проектов',\
                                'Руководитель программ',\
                                'Младший руководитель проектов',\
                                'Менеджер',\
                                'Бизнес-партнер'\
                            ) THEN 0\
                            WHEN [t0].[org_id] = '7116612032892594031'\
                            AND [t0].[position_name] = 'Главный инженер проекта' THEN 0\
                            ELSE 1\
                        END = 1\
                    )\
                    AND [d0].data.value(\
                        '(collaborator/custom_elems/custom_elem[name/text()=''f_categ'']/value/text())[1]',\
                        'VARCHAR(10)'\
                    ) = '2'\
                    AND [d1].data.value(\
                        '(position/custom_elems/custom_elem[name/text()=''cust_grade'']/value/text())[1]',\
                        'int'\
                    ) >= 12\
                    AND DATEDIFF(\
                        day,\
                        [d0].data.value(\
                            '(collaborator/change_logs/change_log[last()]/date/text())[1]',\
                            'date'\
                        ),\
                        GETDATE()\
                    ) = 90\
            ) t0\
        WHERE\
            [t0].[count_edu_plans] = 0\
            AND (\
                [t0].[count_changes] = 1\
                OR [t0].[cust_catergory] != 'Руководитель'\
            )\
    "))
        
    if (ArrayCount(d) > 0) {
        createEducationPlans(d, '7202237023864635644')
    }

    var e = ArraySelectAll(XQuery("sql:  \
        DECLARE @compound_program_id AS BIGINT = '7202237023864635644';\
        DECLARE @fn VARCHAR(MAX) = 'АВТОМАТИЗАЦИЯ ТЕХНОЛОГИЧЕСКИХ ПРОЦЕССОВ,Аглодоменное производство,Вспомогательное производство,Горнодобывающее производство,ЛОГИСТИКА,Машиностроительное производство,ОБЕСПЕЧЕНИЕ БЕЗОПАСНОСТИ,Организация и выполнение ТОиР,ОХРАНА ТРУДА И ПРОМЫШЛЕННАЯ БЕЗОПАСНОСТЬ,Переработка и утилизация вторичных ресур,Прокатное производство,РАЗВИТИЕ СИСТЕМЫ РЕМОНТОВ,Сталеплавильное производство,Технология и технические функции,Управление непроизводственными объектами,ЭНЕРГЕТИКА,Энергетическое производство'\
        SELECT\
            [t0].[id]\
        FROM\
            (\
                SELECT\
                    [t0].[id],\
                    [t0].[fullname],\
                    [t0].[position_id],\
                    [t0].[position_name],\
                    [t0].[org_id],\
                    [t0].[org_name],\
                    [cx].[f_funcroute],\
                    (\
                        SELECT\
                            COUNT(id)\
                        FROM\
                            [education_plans]\
                        WHERE\
                            [person_id] = [t0].[id]\
                            AND [compound_program_id] = @compound_program_id\
                    ) AS [count_edu_plans],\
                    IIF(\
                        cx.count_changes > 1,\
                        cx.change_log_position_id,\
                        NULL\
                    ) AS [previous_position_id],\
                    IIF(\
                        cx.count_changes > 1,\
                        [d2].data.value(\
                            '(position/custom_elems/custom_elem[name/text()=''cust_catergory'']/value/text())[1]',\
                            'VARCHAR(12)'\
                        ),\
                        NULL\
                    ) AS [cust_catergory],\
                    cx.count_changes AS [count_changes]\
                FROM\
                    [collaborators] AS [t0]\
                    INNER JOIN [collaborator] AS [d0] ON [t0].[id] = [d0].[id]\
                    CROSS APPLY (\
                        SELECT\
                            [d0].data.value(\
                                'count((collaborator/change_logs)[1]/change_log/id/text())',\
                                'bigint'\
                            ) [count_changes],\
                            [d0].data.value(\
                                '(/collaborator/change_logs/change_log[last() - 1]/position_id)[1]',\
                                'bigint'\
                            ) [change_log_position_id],\
                            [d0].data.value(\
                                '(/collaborator/custom_elems/custom_elem[name/text()=''f_funcroute'']/value/text())[1]',\
                                'VARCHAR(224)'\
                            ) [f_funcroute]\
                    ) [cx]\
                    INNER JOIN [position] AS [d1] ON [d1].[id] = [t0].[position_id]\
                    LEFT JOIN [position] AS [d2] ON [d2].[id] = cx.change_log_position_id\
                    INNER JOIN (\
                        SELECT\
                            [Value]\
                        FROM\
                            STRING_SPLIT(@fn, ',')\
                    ) AS [t1] ON [t1].[Value] = [cx].[f_funcroute]\
                WHERE\
                    [t0].[is_dismiss] != 1\
                    AND [t0].[position_name] != 'Главный специалист'\
                    AND (\
                        CASE\
                            WHEN [t0].[org_id] IN('7116612032298310523', '7116612032494196892')\
                            AND [cx].[f_funcroute] != 'Цифровизация производства'\
                            AND [t0].[position_name] IN(\
                                'Руководитель проектов',\
                                'Руководитель программ',\
                                'Младший руководитель проектов',\
                                'Менеджер',\
                                'Бизнес-партнер'\
                            ) THEN 0\
                            WHEN [t0].[org_id] = '7116612032892594031'\
                            AND [t0].[position_name] = 'Главный инженер проекта' THEN 0\
                            ELSE 1\
                        END = 1\
                    )\
                    AND [d0].data.value(\
                        '(collaborator/custom_elems/custom_elem[name/text()=''f_categ'']/value/text())[1]',\
                        'VARCHAR(10)'\
                    ) = '2'\
                    AND [d1].data.value(\
                        '(position/custom_elems/custom_elem[name/text()=''cust_grade'']/value/text())[1]',\
                        'int'\
                    ) >= 12\
                    AND DATEDIFF(\
                        day,\
                        [d0].data.value(\
                            '(collaborator/change_logs/change_log[last()]/date/text())[1]',\
                            'date'\
                        ),\
                        GETDATE()\
                    ) = 5\
            ) t0\
        WHERE\
            [t0].[count_edu_plans] = 0\
            AND (\
                [t0].[count_changes] = 1\
                OR [t0].[cust_catergory] != 'Руководитель'\
            )\
    "))
        
    if (ArrayCount(e) > 0) {
        createEducationPlans(e, '7202237023864635644')
    }
} catch(err) {
    alert("Ошибка в агенте" + укк)
}