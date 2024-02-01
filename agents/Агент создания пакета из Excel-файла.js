/**
 * 7321991398156351602
 * Агент создания пакета из Excel-файла
 */

var debug = Param.GetOptProperty("debug", 0) == "1";
var logName = "nlmk_system_fill_package_excel_agent";

// добавлять файлы
var bAddFiles = Param.bAddFiles;
// добавлять категории
var bAddRoles = Param.bAddRoles;
// добавлять секции
var bAddSections = Param.bAddSections;
// добавлять связанные объекты
var bAddForeignElemObjects = Param.bAddForeignElemObjects;

function addObjectToPackage(iObjectID, fldPackage) {
    var docObject = OpenDoc(UrlFromDocID(iObjectID));
    var _child = fldPackage.objects.ObtainChildByKey(iObjectID);

    try {
        _child.name = tools.get_disp_name_value(docObject.TopElem);
    } catch (ewr) {}

    _child.type = docObject.TopElem.Name;

    if (bAddFiles && docObject.TopElem.ChildExists("files")) {
        for (_file in docObject.TopElem.files) {
            _child = fldPackage.objects.ObtainChildByKey(_file.PrimaryKey);
            try {
                _child.name = _file.PrimaryKey.ForeignElem.name;
            } catch (err) {}
            _child.type = "resource";
        }
    }

    if (bAddRoles && docObject.TopElem.ChildExists("role_id")) {
        for (fldRole in docObject.TopElem.role_id) {
            _child = fldPackage.objects.ObtainChildByKey(fldRole.Value);
            try {
                _child.name = fldRole.ForeignElem.name;
            } catch (err) {}
            _child.type = "role";
        }
    }

    if (bAddSections && docObject.TopElem.Name == "assessment") {
        for (_section in docObject.TopElem.sections) {
            for (_item in _section.items) {
                _child = fldPackage.objects.ObtainChildByKey(_item.PrimaryKey);
                _child.type = "item";
                try {
                    _fe = _item.PrimaryKey.ForeignElem;
                    _child.name = _fe.title.HasValue ? _fe.title : _fe.question_text;

                    if (bAddCategory) {
                        for (fldRole in _fe.role_id) {
                            _chi = fldPackage.objects.ObtainChildByKey(fldRole.Value);
                            _chi.type = "role";
                            try {
                                _chi.name = fldRole.ForeignElem.name;
                            } catch (e) {}
                        }
                    }
                } catch (err) {}
            }
        }
    }
    // if (bAddForeignElemObjects) {
    //     add_foreign_elem_objects(docObject.TopElem);
    // }
}

// function add_foreign_elem_objects(fldElem) {
//     try {
//         if (fldElem.Name == "files" || fldElem.Name == "role_id" || fldElem.Name == "sections") {
//             return;
//         }
//         for (_elem in fldElem) {
//             if (_elem.IsMultiElem) {
//                 for (_child in _elem) {
//                     add_foreign_elem_objects(_child);
//                 }
//                 return;
//             }
//             sForeignElem = _elem.ForeignArrayCodeStr;

//             if (
//                 _elem.HasValue &&
//                 sForeignElem != "" &&
//                 (StrContains(sForeignElem, "DefaultDb.GetOptCatalog") || !StrContains(sForeignElem, "."))
//             ) {
//                 tools.add_object_to_package(null, _elem.Value, Screen, fldPackage, {
//                     add_files: false,
//                     add_roles: false,
//                     add_sections: false,
//                     add_foreign_elem_objects: false,
//                     apply_to_all: true,
//                 });
//             }
//             add_foreign_elem_objects(_elem);
//         }
//     } catch (err) {
//         return;
//     }
// }

function addObjectsToPackage(objectIDs, fldPackage) {
    var task = OpenNewDoc("x-local://app_ui/app_ui_modal_task.xml");
    task.TopElem.title = "Добавляем объекты в пакет '" + fldPackage.name + "'";
    task.TopElem.msg = "";

    taskParam = {
        task: task,
        screen: null,
    };

    EvalAsync("taskParam.screen = CreateDocScreen(taskParam.task)", "taskParam", taskParam);

    var iObjectID;
    var count = ArrayCount(objectIDs);
    var i = 1;
    for (iObjectID in objectIDs) {
        task.TopElem.msg = "Объект " + i + " из " + count;
        addObjectToPackage(iObjectID, fldPackage);
        i++;
    }

    task.TopElem.title = "Сохраняем пакет";
    task.TopElem.msg = "";
    package_objects.Doc.Save();

    taskParam.screen.Close();
}

function main() {
    var fileUrl = Screen.AskFileOpen("", "Выберите Excel файл");
    var doc = OpenDoc(fileUrl, "format=excel");
    var objectIDs = ArrayExtract(ArraySelect(doc.TopElem.Child(0), "This[0].HasValue"), "Int(This[0])");
    var fldPackage = package_objects.GetChildByKey(local_settings.package_id);

    if (
        !Screen.MsgBox(
            "Загрузить в пакет '" + fldPackage.name + "' " + ArrayCount(objectIDs) + " объектов?",
            "Подтвердите действие",
            "question",
            "yes,no"
        )
    ) {
        return;
    }

    addObjectsToPackage(objectIDs, fldPackage);
}

main();