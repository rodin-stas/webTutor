DECLARE @compound_program_id AS BIGINT = '7202237023864635644';
DECLARE @fn VARCHAR(MAX) = 'АВТОМАТИЗАЦИЯ ТЕХНОЛОГИЧЕСКИХ ПРОЦЕССОВ,Аглодоменное производство,Вспомогательное производство,Горнодобывающее производство,ЛОГИСТИКА,Машиностроительное производство,ОБЕСПЕЧЕНИЕ БЕЗОПАСНОСТИ,Организация и выполнение ТОиР,ОХРАНА ТРУДА И ПРОМЫШЛЕННАЯ БЕЗОПАСНОСТЬ,Переработка и утилизация вторичных ресур,Прокатное производство,РАЗВИТИЕ СИСТЕМЫ РЕМОНТОВ,Сталеплавильное производство,Технология и технические функции,Управление непроизводственными объектами,ЭНЕРГЕТИКА,Энергетическое производство'
SELECT
    [t0].[id]
FROM
    (
        SELECT
            [t0].[id],
            [t0].[fullname],
            [t0].[position_id],
            [t0].[position_name],
            [t0].[org_id],
            [t0].[org_name],
            [cx].[f_funcroute],
            (
                SELECT
                    COUNT(id)
                FROM
                    [education_plans]
                WHERE
                    [person_id] = [t0].[id]
                    AND [compound_program_id] = @compound_program_id
            ) AS [count_edu_plans],
            IIF(
                cx.count_changes > 1,
                cx.change_log_position_id,
                NULL
            ) AS [previous_position_id],
            IIF(
                cx.count_changes > 1,
                [d2].data.value(
                    '(position/custom_elems/custom_elem[name/text()=''cust_catergory'']/value/text())[1]',
                    'VARCHAR(12)'
                ),
                NULL
            ) AS [cust_catergory],
            cx.count_changes AS [count_changes]
        FROM
            [collaborators] AS [t0]
            INNER JOIN [collaborator] AS [d0] ON [t0].[id] = [d0].[id]
            CROSS APPLY (
                SELECT
                    [d0].data.value(
                        'count((collaborator/change_logs)[1]/change_log/id/text())',
                        'bigint'
                    ) [count_changes],
                    [d0].data.value(
                        '(/collaborator/change_logs/change_log[last() - 1]/position_id)[1]',
                        'bigint'
                    ) [change_log_position_id],
                    [d0].data.value(
                        '(/collaborator/custom_elems/custom_elem[name/text()=''f_funcroute'']/value/text())[1]',
                        'VARCHAR(224)'
                    ) [f_funcroute]
            ) [cx]
            INNER JOIN [position] AS [d1] ON [d1].[id] = [t0].[position_id]
            LEFT JOIN [position] AS [d2] ON [d2].[id] = cx.change_log_position_id
            INNER JOIN (
                SELECT
                    [Value]
                FROM
                    STRING_SPLIT(@fn, ',')
            ) AS [t1] ON [t1].[Value] = [cx].[f_funcroute]
        WHERE
            [t0].[is_dismiss] != 1
            AND [t0].[position_name] != 'Главный специалист'
            AND (
                CASE
                    WHEN [t0].[org_id] IN('7116612032298310523', '7116612032494196892')
                    AND [cx].[f_funcroute] != 'Цифровизация производства'
                    AND [t0].[position_name] IN(
                        'Руководитель проектов',
                        'Руководитель программ',
                        'Младший руководитель проектов',
                        'Менеджер',
                        'Бизнес-партнер'
                    ) THEN 0
                    WHEN [t0].[org_id] = '7116612032892594031'
                    AND [t0].[position_name] = 'Главный инженер проекта' THEN 0
                    ELSE 1
                END = 1
            )
            AND [d0].data.value(
                '(collaborator/custom_elems/custom_elem[name/text()=''f_categ'']/value/text())[1]',
                'VARCHAR(10)'
            ) = '2'
            AND [d1].data.value(
                '(position/custom_elems/custom_elem[name/text()=''cust_grade'']/value/text())[1]',
                'int'
            ) >= 12
            AND DATEDIFF(
                day,
                [d0].data.value(
                    '(collaborator/change_logs/change_log[last()]/date/text())[1]',
                    'date'
                ),
                GETDATE()
            ) = 5
    ) t0
WHERE
    [t0].[count_edu_plans] = 0
    AND (
        [t0].[count_changes] = 1
        OR [t0].[cust_catergory] != 'Руководитель'
    )