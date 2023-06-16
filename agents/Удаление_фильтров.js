// Название каталога в котором необходимо удалить фильтры.
// Для удаления фильтра (указанного в параметре filterName) сразу во всех каталогах, необходимо присвоить значение - all
// Для определения каталога :
// 1. Выделите любую карточку каталога в котором хотите удалить фильтр
// 2. Нажмите ctrl + shift + c
// 3. Откройет любой текстовый редактор и нажмите ctrl + shift + v
// 4. <objects><[название каталога]>.
// Примеры каталогов : collaborator, subdivision, group, event и.т.д

// Название фильтра, который необходимо удалить.
// Для удаления всех фильтров ( каталога указанного в catalogName ) необходимо, присвоить значение - all

var catalogName = Trim(Param.catalogName);
var filterName = Trim(Param.filterName);

if ( catalogName == "" || filterName == "" ) {
	alert("( Агент: 6649651166799492300 ). Необходимо заполнить обязательные параметры в закладке 'Общие сведения'");
} else {
	var delCount = 0;
	var queryConditions = "";
	queryConditions = catalogName == "all" ? queryConditions : " && This.catalog == " + XQueryLiteral(catalogName);
	queryConditions = filterName == "all" ? queryConditions : queryConditions + " && This.name == " + XQueryLiteral(filterName);
	queryConditions = queryConditions == "" ? "1 == 1" : "1 == 1 " + queryConditions;

	try {
		// Удаление фильтров на сервере
		var listsCard = OpenDoc(lists.Doc.Url);
		var conditionsForDelete = ArraySelect(listsCard.TopElem.view_conditions_schemes, queryConditions );
		for ( _cond in conditionsForDelete ) {
		    _cond.Clear();
		    delCount++;
		}
		listsCard.Save();

		// Удаление фильтров в админке
		var clientConditionsForDelete = ArraySelect(lists.view_conditions_schemes.view_conditions_scheme, queryConditions );
		for ( _cond in clientConditionsForDelete ) {
		    _cond.Clear();
		}
	} catch(e) {
		alert("( Агент: 6649651166799492300 ). Ошибка при удалении фильтров; текст ошибки - " + e);
	}
}
alert("( Агент: 6649651166799492300 ). Агент удалил - " + delCount + " фильтров");