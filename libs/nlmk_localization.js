/**
 *Получение массива локализованных переменных
 * @param {string} templateID Id шаблона документов
 * @returns {any[]}
 */
function getObjectFromWebTemplate(templateID) {
    templateDoc = tools.open_doc(templateID);

    if (templateDoc == undefined) {
        return [];
    }

    data = tools.read_object(templateDoc.TopElem.exec_code.code_text.Value);

    if (DataType(data) != "object") {
        return [];
    }

    return data;
}

/**
 *Получение языка пользователя
 * @param {string} personId Id пользователя
 * @param {TopElem} personTopElem TopElem пользователя
 * @returns {string} язык пользователя (ru или en)
 */
function getCurLng(personId, personTopElem) {

    try {
        lng = personTopElem.lng_id;
    } catch (err) {
        personDoc = tools.open_doc(personId);
        if (personDoc != undefined) {
            lng = personDoc.TopElem.lng_id;
        }
    }

    if (lng != 'russian' && lng != '') {
        return 'en';
    }

    return 'ru';
}

/**
 *Получение локализованной переменной
 * @param {any[]} data массив переменных
 * @param {string} lng Язык ru/en
 * @param {string} valueI id переменной
 * @returns {string/undefined}
 */
function getCurLngValue(data, lng, valueId) {
    value = undefined;

    if (ArrayCount(data) == 0) {
        return value;
    }

    curValue = ArrayOptFind(data, "This.id == " + XQueryLiteral(valueId));

    if (curValue != undefined) {
        value = lng == "ru" ? curValue.ru : curValue.en;
    }

    return value;
}


/**
 *Перевод русского текста на латиницу
 * @param {string} DataStr текст на русском языке
 * @returns {string}
 */
function latinTranslation(DataStr) {
    var converter = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
        'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i',
        'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
        'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
        'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch',
        'ш': 'sh', 'щ': 'sch', 'ь': '', 'ы': 'y', 'ъ': '',
        'э': 'e', 'ю': 'yu', 'я': 'ya',
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D',
        'Е': 'E', 'Ё': 'E', 'Ж': 'Zh', 'З': 'Z', 'И': 'I',
        'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N',
        'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T',
        'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'C', 'Ч': 'Ch',
        'Ш': 'Sh', 'Щ': 'Sch', 'Ь': '', 'Ы': 'Y', 'Ъ': '',
        'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya', ' ': ' '
    };

    var result = '';
    var textToArray = StrToCharArray(DataStr)

    for (i = 0; i < ArrayCount(textToArray); i++) {

        try {
            result += converter[textToArray[i]]
        } catch (err) {
            result += textToArray[i];
        }
    }

    return result;
}