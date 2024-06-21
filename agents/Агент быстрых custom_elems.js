/**
 * 7375079590925379372
 * Агент быстрых custom_elems
 */

EnableLog("nlmk_custom_elems_tables_agent");

function log(msg) {
    LogEvent("nlmk_custom_elems_tables_agent", "" + msg);
}

var TRIGGER_PREFIX = "custom_elems_trigger__";
var PROC_PREFIX = "custom_elems_update__";
var TABLE_PREFIX = "_custom_elems";

/**
 * @typedef CustomFieldsParams
 * @property {string} name Код поля
 * @property {string} type Тип поля
 */

/**
 * Возвращает список настаиваемых полей по каталогу.
 * @param {string} catalog Название каталога в единственном числe. Например, collaborator.
 * @returns {CustomFieldsParams[]} JS Массив полей
 */
function getCustomFields(catalog) {
    var root = custom_templates.OptChild(catalog);

    if (root == undefined || root.fields.ChildNum == 0) {
        throw "Для каталога '" + catalog + "' не найдены дополнительные поля";
    }

    /** Поддерживаемые типы доп полей */
    var fieldsTypes = [
        "string",
        "combo",
        "text",
        "list",
        "object",
        "integer",
        "real",
        "date",
        "bool",
        "file",
        "foreign_elem",
    ];
    var fields = ArraySelect(root.fields, "fieldsTypes.indexOf(This.type.Value) >= 0");
    fields = ArrayExtract(fields, "({name: This.name.Value, type: This.type.Value})");
    log("Дополнительные поля: " + tools.object_to_text(fields, "json"));

    return fields;
}

/**
 * Конвертирует xml тип данных в sql тип
 * @param {string} type Тип данных из custom_templates
 * @returns {string} Тип данных SQL
 */
function convertXmlTypeToSql(type) {
    switch (type) {
        case "string":
        case "combo":
            return "VARCHAR(900)";

        case "text":
        case "list":
        case "object":
            return "VARCHAR(MAX)";

        case "integer":
            return "INTEGER";

        case "real":
            return "REAL";

        // Так как в полях с датами бывают разные форматы дат, то мы просто возвращаем как строку, а далее уже конвертируем в формат DATETIME
        case "date":
            return "VARCHAR(25)";

        case "bool":
            return "BIT";

        case "file":
        case "foreign_elem":
            return "BIGINT";

        default:
            throw "Указанный тип не найден в списке допустимых значений " + type;
    }
}

/**
 * Подготавливает строку для запроса полей с приведением типов данных согласно настройкам в custom_templates.
 * @param {CustomFieldsParams[]} fields Массив полей (реультат метода getCustomFields)
 * @returns {string}
 */
function buildSelectFieldsStr(fields) {
    var result = [];
    /** @type{Object} */
    var field;

    for (field in fields) {
        if (field.type == "date") {
            result.push(
                "IIF (
    [" +
                    field.name +
                    "] LIKE '__.__.____%',
    CONVERT(DATETIME, [" +
                    field.name +
                    "], 103),
    TRY_CAST(LEFT([" +
                    field.name +
                    "], 19) AS DATETIME)
)  AS [" +
                    field.name +
                    "]"
            );
            continue;
        }

        // В связи с тем, что тьютор не всегда сохраняет айдишники в BIGINT, а иногда в Hex, то приходится приминять метод ToBigInt.
        if (field.type == "file" || field.type == "foreign_elem") {
            result.push(
                "IIF (
    CHARINDEX('0x', [" +
                    field.name +
                    "]) >= 1,
    CAST(CONVERT(VARBINARY(MAX), [" +
                    field.name +
                    "], 1) AS BIGINT),
    TRY_CAST([" +
                    field.name +
                    "] AS BIGINT)
) AS [" +
                    field.name +
                    "]"
            );
            continue;
        }

        result.push("CAST([" + field.name + "] AS " + convertXmlTypeToSql(field.type) + ") AS [" + field.name + "]");
    }

    return ArrayMerge(result, "This", ",\n");
}

/**
 * Возвращает SQL строку с запросом на создание реляционной таблицы с custom_elems.
 * @param {string} catalog Название каталога в единственном числe. Например, collaborator.
 * @param {CustomFieldsParams[]} fields Массив полей (реультат метода getCustomFields)
 * @returns {string}
 */
function buildSqlString(catalog, fields) {
    var uniqueNamesStr = ArrayMerge(ArrayExtract(fields, "('[' + This.name + ']')"), "This", ",");
    var fieldsSelectStr = buildSelectFieldsStr(fields);

    var sqlTemplate =
        "sql:
DROP TABLE IF EXISTS #temp_" +
        catalog +
        TABLE_PREFIX +
        "; 
WITH 
    [custom_elems] AS (
        SELECT
            [d0].[id],
            [x0].[data].value('(name/text())[1]', 'NVARCHAR(255)') AS [name],
            [x0].[data].value('(value/text())[1]', 'NVARCHAR(MAX)') AS [value]
        FROM 
            [" +
        catalog +
        "s] AS [t0]
            INNER JOIN [" +
        catalog +
        "] AS [d0]
            ON [t0].[id] = [d0].[id]
            OUTER APPLY [d0].[data].nodes('(" +
        catalog +
        "/custom_elems)[1]/custom_elem') AS [x0](data)
    ),
    [pivot_fields] AS (
        SELECT 
            id,
            " +
        fieldsSelectStr +
        "
        FROM 
            [custom_elems]
        PIVOT
        (
            MAX([value])
            FOR [name] IN (" +
        uniqueNamesStr +
        ")
        ) AS [pvt]
    )
    
SELECT *
INTO #temp_" +
        catalog +
        TABLE_PREFIX +
        "
FROM [pivot_fields];

DROP PROC IF EXISTS [dbo].[" +
        PROC_PREFIX +
        catalog +
        "];

DROP TABLE IF EXISTS [dbo].[" +
        catalog +
        TABLE_PREFIX +
        "];

SELECT * 
INTO [dbo].[" +
        catalog +
        TABLE_PREFIX +
        "] 
FROM #temp_" +
        catalog +
        TABLE_PREFIX +
        ";

ALTER TABLE [dbo].[" +
        catalog +
        TABLE_PREFIX +
        "]
ADD CONSTRAINT [PK__" +
        catalog +
        TABLE_PREFIX +
        "] PRIMARY KEY CLUSTERED (id);

SELECT 1 [is_done];
  ";

    return sqlTemplate;
}

/**
 * Возвращает SQL строку с запросом на создание процедуры таблицы с custom_elems.
 * @param {string} catalog Название каталога в единственном числe. Например, collaborator.
 * @param {CustomFieldsParams[]} fields Массив полей (реультат метода getCustomFields)
 * @returns {string}
 */
function createProcedure(catalog, fields) {
    var uniqueNamesStr = ArrayMerge(ArrayExtract(fields, "('[' + This.name + ']')"), "This", ",");
    var fieldsSelectStr = buildSelectFieldsStr(fields);
    var sQuery =
        "sql:
-- =============================================
-- Author:		Сгенерированная процедура (" +
        USER_NAME +
        ")
-- Create date: " +
        ParseDate(Date()) +
        "
-- Description: Обновление custom_elems для таблицы " +
        catalog +
        "
-- =============================================
CREATE PROCEDURE [dbo].[" +
        PROC_PREFIX +
        catalog +
        "]
    @modification_date datetime = null
AS
BEGIN
    SET NOCOUNT ON;
    SET QUOTED_IDENTIFIER ON;
    SET ANSI_NULLS ON;

    
WITH \
    [custom_elems] AS (\
    SELECT\
        [d0].[id],\
        [x0].[data].value('(name/text())[1]', 'NVARCHAR(255)') AS [name],\
        [x0].[data].value('(value/text())[1]', 'NVARCHAR(MAX)') AS [value]\
    FROM \
        [" +
        catalog +
        "s] AS [t0]\
        INNER JOIN [" +
        catalog +
        "] AS [d0]\
        ON [t0].[id] = [d0].[id]\
        OUTER APPLY [d0].[data].nodes('(" +
        catalog +
        "/custom_elems)[1]/custom_elem') AS [x0](data)\
    WHERE @modification_date is null or t0.modification_date >= @modification_date
    ),\
    [pivot_fields] AS (\
    SELECT \
        id,\
        " +
        fieldsSelectStr +
        "\
    FROM \
        [custom_elems]\
    PIVOT\
    (\
        MAX([value])\
        FOR [name] IN (" +
        uniqueNamesStr +
        ")\
    ) AS [pvt]\
)\
        
merge [" +
        catalog +
        TABLE_PREFIX +
        "] as target
using (
    SELECT *
    FROM [pivot_fields]
) as source on source.id = target.id
when matched AND (" +
        ArrayMerge(
            ArrayExtract(
                fields,
                "('(target.[' + This.name + '] is null and source.[' + This.name + '] is not null)\nor (target.[' + This.name + '] is not null and source.[' + This.name + '] is null)\nor target.[' + This.name + '] != source.[' + This.name + ']')"
            ),
            "This",
            "\nor "
        ) +
        ")
    then
        update set " +
        ArrayMerge(ArrayExtract(fields, "('[' + This.name + '] = source.[' + This.name + ']')"), "This", ",\n") +
        "
when not matched by target
    then insert ([id], " +
        uniqueNamesStr +
        ")
    values (source.id, " +
        ArrayMerge(ArrayExtract(fields, "('source.[' + This.name + ']')"), "This", ",\n") +
        ");

END
    ";
    return sQuery;
}

/**
 * Возвращает SQL строку с запросом на создание триггера таблицы с custom_elems.
 * @param {string} catalog Название каталога в единственном числe. Например, collaborator.
 * @param {CustomFieldsParams[]} fields Массив полей (реультат метода getCustomFields)
 * @returns {string}
 */
function createTrigger(catalog, fields) {
    var uniqueNamesStr = ArrayMerge(ArrayExtract(fields, "('[' + This.name + ']')"), "This", ",");
    var fieldsSelectStr = buildSelectFieldsStr(fields);
    var sQuery =
        "sql:
-- =============================================
-- Author:		Сгенерированный триггер (" +
        USER_NAME +
        ")
-- Create date: " +
        ParseDate(Date()) +
        "
-- Description: Обновление custom_elems для таблицы " +
        catalog +
        "
-- =============================================
CREATE TRIGGER [dbo].[" +
        TRIGGER_PREFIX +
        catalog +
        "]
   ON  [dbo].[" +
        catalog +
        "]
   AFTER INSERT, UPDATE
AS 
BEGIN
	IF (ROWCOUNT_BIG() = 0)
		RETURN;

    
WITH \
    [custom_elems] AS (\
    SELECT\
        [d0].[id],\
        [x0].[data].value('(name/text())[1]', 'NVARCHAR(255)') AS [name],\
        [x0].[data].value('(value/text())[1]', 'NVARCHAR(MAX)') AS [value]\
    FROM inserted [d0]\
        OUTER APPLY [d0].[data].nodes('(" +
        catalog +
        "/custom_elems)[1]/custom_elem') AS [x0](data)\
    ),\
    [pivot_fields] AS (\
    SELECT \
        id,\
        " +
        fieldsSelectStr +
        "\
    FROM \
        [custom_elems]\
    PIVOT\
    (\
        MAX([value])\
        FOR [name] IN (" +
        uniqueNamesStr +
        ")\
    ) AS [pvt]\
)\
        
merge [" +
        catalog +
        TABLE_PREFIX +
        "] as target
using (
    SELECT *
    FROM [pivot_fields]
) as source on source.id = target.id
when matched AND (" +
        ArrayMerge(
            ArrayExtract(
                fields,
                "('(target.[' + This.name + '] is null and source.[' + This.name + '] is not null)\nor (target.[' + This.name + '] is not null and source.[' + This.name + '] is null)\nor target.[' + This.name + '] != source.[' + This.name + ']')"
            ),
            "This",
            "\nor "
        ) +
        ")
    then
        update set " +
        ArrayMerge(ArrayExtract(fields, "('[' + This.name + '] = source.[' + This.name + ']')"), "This", ",\n") +
        "
when not matched by target
    then insert ([id], " +
        uniqueNamesStr +
        ")
    values (source.id, " +
        ArrayMerge(ArrayExtract(fields, "('source.[' + This.name + ']')"), "This", ",\n") +
        ");
END
    ";
    return sQuery;
}

/**
 * Выполняет запрос SQL
 * @param {string} sQuery запрос
 */
function execSql(sQuery, isRequired) {
    if (isRequired == undefined) {
        isRequired = false;
    }
    var startDate = GetCurTicks();
    log(sQuery);
    var resp = ArrayOptFirstElem(tools.xquery(sQuery));
    if (isRequired == true && resp == undefined) {
        throw "Запрос не выполнен. Проверьте лог spxml_unibridge.";
    }
    var seconds = (1.0 * (GetCurTicks() - startDate)) / 1000;
    log("Время выполнения операции: " + StrRealFixed(seconds, 3) + " сек.");
}

/**
 * Обновляет таблицу быстрого доступа к custom_elems.
 *
 * Таблица будет иметь название "${catalog}${TABLE_PREFIX}".
 * @example updateRapidTable("collaborator") - создаст или обновит таблицу 'collaborators_custom_elems'
 * @param {string} catalog целевой каталог
 */
function updateRapidTable(catalog) {
    var fields = getCustomFields(catalog);

    var buildSql = buildSqlString(catalog, fields);
    execSql(buildSql, true);

    var procedureSql = createProcedure(catalog, fields);
    execSql(procedureSql);

    if (CREATE_TRIGGER) {
        var triggerSql = createTrigger(catalog, fields);
        execSql(triggerSql);
    }
}

/**
 * Запускающая функция
 * @returns {any}
 */
function main() {
    if (LdsIsClient) {
        alert("Агент нельзя запустить на клиенте");
        return false;
    }

    var agent = tools.open_doc(oData.id).TopElem;
    var curUserID = agent.doc_info.modification.user_id;
    var curUser = tools.open_doc(curUserID).TopElem;
    var USER_NAME = curUser.fullname;

    /**
     * Целевой каталог
     */
    var TARGET_CATALOG = Param.GetOptProperty("catalog", "");
    /**
     * Создание триггера
     * @type {boolean}
     */
    var CREATE_TRIGGER = Param.GetOptProperty("create_trigger", 0) == "1";

    if (TARGET_CATALOG == "") {
        throw "Не указан каталог";
    }

    log("=========================");
    log("Создание custom_elems для '" + TARGET_CATALOG + "'");
    log("Инициатор: " + USER_NAME);

    updateRapidTable(TARGET_CATALOG);
}

try {
    main();
} catch (e) {
    log("ERROR " + e);
}
log("Агент завершен");