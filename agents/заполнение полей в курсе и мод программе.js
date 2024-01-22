var allCourses = XQuery("for $elem in courses return $elem/Fields('id')");
var allCompoundPrograms = XQuery("for $elem in compound_programs where  return $elem/Fields('id')");
var curProviders = XQuery("for $elem in cc_ors_providers return $elem/Fields('id', 'name')");

for (curCourse in allCourses) {
    courseDoc = tools.open_doc(curCourse.id);
    courseHolder = courseDoc.TopElem.custom_elems.ObtainChildByKey("courseHolder").value.Value;
    provider = ArrayOptFind(curProviders, "This.name == " + XQueryLiteral(courseHolder));

    if (courseHolder != '' && provider != undefined) {
        courseDoc.TopElem.custom_elems.ObtainChildByKey("provider_or").value.Value = provider.id;
        courseDoc.Save()
    }
}

for (curCompoundProgram in allCompoundPrograms) {
    compoundProgramDoc = tools.open_doc(curCompoundProgram.id);
    courseHolder = compoundProgramDoc.TopElem.custom_elems.ObtainChildByKey("f_n5g8").value.Value;
    needCourseHolder = "";
    provider = undefined;

    switch (courseHolder) {
        case "КУ":
            needCourseHolder = "Корпоративный университет";
            break;
        case "ТУ":
            needCourseHolder = "Технологический университет";
            break;
    }

    provider = ArrayOptFind(curProviders, "This.name == " + XQueryLiteral(needCourseHolder));

    if (needCourseHolder != '' && provider != undefined) {
        compoundProgramDoc.TopElem.custom_elems.ObtainChildByKey("provider_or").value.Value = provider.id;
        compoundProgramDoc.Save()
    }
}