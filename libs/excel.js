
function saveFile(path: string, name: string) {
    var binaryData = new Binary;
    binaryData.LoadFromUrl(path);
    binaryData.PutToUrl(FilePathToUrl(`${tempDirectory}\\${name}`));
}

function saveFile(binaryData, name) {
    var url = FilePathToUrl(tempDirectory + '\\' + name)
    binaryData.PutToUrl(url);

    return url;
}

/**
 * Парсер данных из Excel в JS массив
 * @param {string} filePath Путь до файла
 * @param {parseOptions} options - Настройки парсера.{
    worksheet_num?: number;
    start_row_num?: number;
    empty_condition?: string;
    columns: fileColumn[];
};
fileColumn = {
    name: string;
    type?: string;
};
 * @returns {any[]}
*/
function fileToArray(filePath, options) {

    function isNull(v) {
        const valueType = DataType(v);
        return valueType == "object" || valueType == "array"
            ? false
            : v == undefined || v == null || v == "";
    }
    
    function optSafeEval(codeString, args, defaultValue) {
        try {
            return SafeEval(codeString, args);
        } catch (err) {
            return defaultValue;
        }
    }
    
    const importOptions = isNull(options) ? {} : options;
    const worksheetNum = OptInt(importOptions.GetOptProperty("worksheet_num", 1));
    const startRowNum = OptInt(importOptions.GetOptProperty("start_row_num", 1));
    const emptyCondition = importOptions.GetOptProperty("empty_condition", "firstCellValue == undefined");
    const columns = importOptions.GetOptProperty("columns", []);
    const rowsLimit = 200000 + startRowNum; // Ограничение кол-ва обрабатываемых строк

    const excelLib = tools.get_object_assembly("Excel");
    excelLib.Open(filePath);

    const workSheet = excelLib.GetWorksheet(worksheetNum - 1);
    const cells = workSheet.Cells;

    let rowIndex = startRowNum - 1;
    let row = undefined;
    let cell = undefined;
    const result = [];
    let firstCellValue = undefined;

    const pickedFields = [];
    let fieldObject = undefined;
    let j = 0;
    let field = undefined;

    for (var i = 0; i < columns.length; i++) {
        fieldObject = columns[i];

        if (fieldObject !== null) {
            pickedFields.push({
                index: i,
                name: fieldObject.name,
                type: fieldObject.GetOptProperty("type", "string")
            });
        }
    }

    while (rowIndex < rowsLimit) {
        firstCellValue = cells.GetCell(getCellName(0, rowIndex)).Value;

        row = {};

        for (j = 0; j < ArrayCount(pickedFields); j++) {
            field = pickedFields[j];
            cell = cells.GetCell(getCellName(field.index, rowIndex));
            row.SetProperty(field.name, cell.Value);
        }

        if (optSafeEval(emptyCondition, [{ firstCellValue: firstCellValue, rowIndex: rowIndex, pickedFields: pickedFields, row: row }], false)) {
            break;
        }

        result.push(row);
        rowIndex++;
    }

    excelLib.Close();

    return result;
}