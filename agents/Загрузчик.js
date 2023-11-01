function getDataFiles()
	{
		try
			{
				sExcelFileUrl = Screen.AskFileOpen( '', 'Выберите файл Excel' );
			}
		catch(err)
			{
				if (StrCharCount(Param.SERVER_FILE_URL) == 0)
				{
					alert( 'ОШИБКА: не задан пусть к файлу на сервере в Переменной SERVER_FILE_URL.\nВыполнение Агента остановлено.');
					Cancel();
				}
				sExcelFileUrl = Trim(Param.SERVER_FILE_URL);
			}

		try
			{
				docFile = OpenDoc( sExcelFileUrl, 'format=excel' );
				oSheet = ArrayFirstElem( docFile.TopElem );
			}
		catch(err)
			{
				alert( 'ОШИБКА: невозможно получить доступ к файлу ' + sExcelFileUrl + '\nСкорее всего, файл открыт.\nЗакройте файл и повторите попытку.');
				Cancel();
			}

		return oSheet;
}

function createBlock(block) {
    docBlock = OpenNewDoc('x-local://udt/udt_cc_thematic_block.xmd');
	docBlockTE = docBlock.TopElem;

    docBlockTE.code = block.code
    docBlockTE.name = block.name

    docBlock.BindToDb(DefaultDb);
	docBlock.Save();
}
try {
	data = getDataFiles();
    aEntries= [];

	if (ArrayCount(data) == 0) {
        alert("Нет данных на обработку")
		Cancel();
	}

    for ( i = 1; i < ArrayCount( data ); i++ )
	{
		aEntries.push({
			'code': String( data[i][0] ),
			'name': String( data[i][1] )
		})
	}
    data = [];

alert(ArrayCount(aEntries))

for(item in aEntries) {
    createBlock(item)
}



	

} catch (err) {
 alert(err)
}