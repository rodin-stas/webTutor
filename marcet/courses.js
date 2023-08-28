function getSettings(courseDocTE) {
    settings = new Object;

    settings.SetProperty("resizable", courseDocTE.resizable.Value);
    settings.SetProperty("win_width", OptInt(courseDocTE.win_width.Value, null));
    settings.SetProperty("win_height", OptInt(courseDocTE.win_height.Value, null));
    settings.SetProperty("struct_type", courseDocTE.struct_type.Value);

    settings.SetProperty("open_single_module", courseDocTE.settings.open_single_module.Value);
    settings.SetProperty("open_first_module", courseDocTE.settings.open_first_module.Value);
    settings.SetProperty("open_last_visited", courseDocTE.settings.open_last_visited.Value);
    settings.SetProperty("open_next_after_completed", courseDocTE.settings.open_next_after_completed.Value);
    settings.SetProperty("no_display_status_msg", courseDocTE.settings.no_display_status_msg.Value);
    settings.SetProperty("enable_user_completion", courseDocTE.settings.enable_user_completion.Value);
    settings.SetProperty("display_completion_msg", courseDocTE.settings.display_completion_msg.Value);
    settings.SetProperty("completion_msg", courseDocTE.settings.completion_msg.Value);
    settings.SetProperty("allow_checks", courseDocTE.settings.allow_checks.Value);
    settings.SetProperty("after_checks", courseDocTE.settings.after_checks.Value);
    settings.SetProperty("launch_type", courseDocTE.settings.launch_type.Value);
    settings.SetProperty("panel", courseDocTE.settings.panel.Value);
    settings.SetProperty("course_finish_action", courseDocTE.settings.course_finish_action.Value);
    settings.SetProperty("course_finish_msg", courseDocTE.settings.course_finish_msg.Value);
    settings.SetProperty("course_manually_finish_msg", courseDocTE.settings.course_manually_finish_msg.Value);

    return settings;
}

function getAccess(courseDocTE) {

    access = new Object;

    access.SetProperty("access_level", courseDocTE.access.access_level.Value)
    access.SetProperty("user_access_role", courseDocTE.user_access_role.Value); // Доступ администратора
    access.SetProperty("user_group_id", courseDocTE.user_group_id.Value); // Доступ администратора
    access.SetProperty("enable_anonymous_access", courseDocTE.access.enable_anonymous_access.Value)
    access.SetProperty("access_roles", ArrayExtract(ArraySelectAll(courseDocTE.access.access_roles), "This.access_role_id.Value"));
    access.SetProperty("access_groups", ArrayExtract(ArraySelectAll(courseDocTE.access.access_groups), "This.group_id.Value"));
    access.SetProperty("access_groups", ArrayExtract(ArraySelectAll(courseDocTE.access.access_groups), "This.group_id.Value"));
    access.SetProperty("access.access_org_id", courseDocTE.access.access_org_id.Value);
    access.SetProperty("access_host_id", courseDocTE.access.access_host_id.Value);
    access.SetProperty("access_site_id", courseDocTE.access.access_site_id.Value);

    return access;
}

function get_Courses() {
    var RESULT = [];

    var  courses = ArraySelectAll(XQuery("for $elem in courses return $elem"));

    alert(ArrayCount(courses))

    for(course in courses) {
        courseDocTE = tools.open_doc(course.id).TopElem;
        
        RESULT.push({
            id: Trim(course.id),
            code: Trim(courseDocTE.code),
            name: Trim(courseDocTE.name),
            resource_id: Trim(courseDocTE.resource_id),
            status: Trim(courseDocTE.status),
            duration: OptInt(courseDocTE.duration, null),
            price: OptInt(courseDocTE.price, null),
            course_finish_redirect: Trim(courseDocTE.course_finish_redirect),
            course_finish_redirect_url: Trim(courseDocTE.course_finish_redirect_url),
            base_url: Trim(course.base_url),
            struct_type: Trim(courseDocTE.struct_type),
            view_type: Trim(courseDocTE.view_type),
            mastery_score: OptInt(courseDocTE.mastery_score, null),
            max_score: OptInt(courseDocTE.max_score, null),
            yourself_start: (courseDocTE.yourself_start == true ? true : false),
            comment: Trim(courseDocTE.comment),
            item_learn_type:Trim(courseDocTE.custom_elems.ObtainChildByKey("itemLearnType").value.Value),
            id_learn_type: Trim(courseDocTE.custom_elems.ObtainChildByKey("idLearnType").value.Value),
            long_learning: Trim(courseDocTE.custom_elems.ObtainChildByKey("longLearning").value.Value),
            long_learning_minute: courseDocTE.custom_elems.ObtainChildByKey("longLearningMinute").value.Value,
            course_holder: courseDocTE.custom_elems.ObtainChildByKey("courseHolder").value.Value,
            source: courseDocTE.custom_elems.ObtainChildByKey("theSource").value.Value,
            ot_and_pb: courseDocTE.custom_elems.ObtainChildByKey("otAndPB").value.Value,
            ecology: courseDocTE.custom_elems.ObtainChildByKey("ecology").value.Value,
            historical_item_format: courseDocTE.custom_elems.ObtainChildByKey("historicalItemFormat").value.Value,
            name_or_catalog: courseDocTE.custom_elems.ObtainChildByKey("nameORCatalog").value.Value,
            contact_person: courseDocTE.custom_elems.ObtainChildByKey("f_rtuz").value.Value,
            reread: courseDocTE.custom_elems.ObtainChildByKey("reread").value.Value,
            reread_days: courseDocTE.custom_elems.ObtainChildByKey("reread_days").value.Value,
            settings : getSettings(courseDocTE),
            persons :ArraySelectAll(courseDocTE.persons),
            access: getAccess(courseDocTE),
            parts: ArraySelectAll(courseDocTE.parts)
        })

        // break;

    }

    return tools.object_to_text({
        type: "success",
        message: "",
        data: RESULT
    }, "json"); 

    // return RESULT;

}

res = get_Courses()

alert(tools.object_to_text(res, 'json'))