<%
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
    
    access.SetProperty("access_roles", ArrayExtract(ArraySelectAll(courseDocTE.access.access_roles), "This.access_role_id.Value"));
    access.SetProperty("access_groups", ArrayExtract(ArraySelectAll(courseDocTE.access.access_groups), "This.group_id.Value"));
    access.SetProperty("access_org_id", courseDocTE.access.access_org_id.Value);

    return access;
}

function getCompetenceCourse(courseId) {

    COMP = [];

    competencesIndIds = ArraySelectAll(XQuery("for $elem in cc_comp_ind_courses where $elem/course_id = '"+ XQueryLiteral(courseId) + "' return $elem"));
    competencesProfIds = ArraySelectAll(XQuery("for $elem in cc_prof_comp_courses where $elem/course_id = '"+ XQueryLiteral(courseId) + "' return $elem"));

    if (ArrayCount(competencesIndIds) == 0 && ArrayCount(competencesProfIds) == 0) {
        return null;
    }

    if(ArrayCount(competencesIndIds) > 0) {
        for (competenceInd in competencesIndIds) {

            try {competence_name = competenceInd.competence_id.ForeignElem.name.Value }catch(error) {competence_name = null};
            try {competence_block_id = competenceInd.competence_id.ForeignElem.competence_block_id.ForeignElem.name.Value }catch(error) {competence_block_id  = null};
            try {competence_block_name = competenceInd.competence_id.ForeignElem.name.Value }catch(error) {competence_block_name = null};

            COMP.push({
                'competence_id': competenceInd.competence_id.Value,
                'competence_name': competence_name,
                'competence_type': 'ind',
                'competence_block_id' : competence_block_id,
                'competence_block_name' : competence_block_name
            })
        }
    }

    if(ArrayCount(competencesProfIds) > 0) {
        for (competencePro in competencesProfIds) {

            try {competence_name = competenceInd.competence_id.ForeignElem.name.Value }catch(error) {competence_name = null};

            COMP.push({
                'competence_id': competencePro.competence_id.Value,
                'competence_name': competence_name,
                'competence_type': 'prof',
                'competence_block_id' : null,
                'competence_block_name' : null
            })

        //    alert(tools.object_to_text(competencePro, 'json'))
        }
    }

    return COMP;
}

function get_CoursesFull() {
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
            item_learn_type: courseDocTE.custom_elems.ObtainChildByKey("itemLearnType").value.Value,
            id_learn_type: courseDocTE.custom_elems.ObtainChildByKey("idLearnType").value.Value,
            long_learning: courseDocTE.custom_elems.ObtainChildByKey("longLearning").value.Value,
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

function get_Courses() {
    var RESULT = [];

    // var courses = ArraySelectAll(XQuery("for $elem in courses where id = '7195485524590863492' return $elem"));

    var courses = ArraySelectAll(XQuery("for $elem in courses return $elem"));

    for(course in courses) {
        courseDocTE = tools.open_doc(course.id).TopElem;

        tagsArr = ArraySelectAll(ArrayExtract(ArraySelectAll(courseDocTE.tags), "return {tag_id: This.tag_id.Value, tag_name: This.tag_name.Value}"));
        
        RESULT.push({
            id: Trim(course.id),
            code: Trim(courseDocTE.code),
            name: Trim(courseDocTE.name),
            resource_id: OptInt(courseDocTE.resource_id, null),
            status: Trim(courseDocTE.status),
            duration: OptInt(courseDocTE.duration, null),
            price: OptInt(courseDocTE.price, null),
            mastery_score: OptInt(courseDocTE.mastery_score, null),
            max_score: OptInt(courseDocTE.max_score, null),
            yourself_start: (courseDocTE.yourself_start == true ? true : false),
            comment: Trim(courseDocTE.comment),
            item_learn_type: courseDocTE.custom_elems.ObtainChildByKey("itemLearnType").value.Value,
            id_learn_type: courseDocTE.custom_elems.ObtainChildByKey("idLearnType").value.Value,
            course_holder: courseDocTE.custom_elems.ObtainChildByKey("courseHolder").value.Value,
            source: courseDocTE.custom_elems.ObtainChildByKey("theSource").value.Value,
            historical_item_format: courseDocTE.custom_elems.ObtainChildByKey("historicalItemFormat").value.Value,
            name_or_catalog: courseDocTE.custom_elems.ObtainChildByKey("nameORCatalog").value.Value,
            access: getAccess(courseDocTE),
            competences: getCompetenceCourse(course.id),
            tags: ArrayCount(tagsArr) > 0 ? tagsArr : null
        })
    }

    return tools.object_to_text({
        type: "success",
        message: "",
        data: RESULT
    }, "json"); 

    // return RESULT;
}

function get_CompetenceProfiles() {

    function getIndicators(indicators) {
        curIndicators = [];

        if(ArrayCount(indicators) == 0) {
            return null;
        }

        for(indicator in indicators) {
            try {isName = indicator.indicator_id.ForeignElem.name.Value }catch(error) {isName = null};

            curIndicators.push({
                'id': Trim(indicator.indicator_id),
                'name': isName,
                'plan_text': Trim(indicator.plan_text),
                'weight': Trim(indicator.weight)
            })
        }

        return curIndicators;
    }

    function getCompetences(competences) {
        curCompetences = [];

        if(ArrayCount(competences) == 0) {
            return null;
        }

        for(competence in competences) {
            try {competence_name = competence.competence_id.ForeignElem.name.Value }catch(error) {competence_name = null};

            curCompetences.push({
                'competence_id': Trim(competence.competence_id),
                'competence_name': competence_name,
                'weight':Trim(competence.weight),
                'indicators': getIndicators(competence.indicators)
            })
        }

        return curCompetences;
    }

    var RESULT = [];
    var competenceProfiles = ArraySelectAll(XQuery("for $elem in competence_profiles return $elem"));

    for(competenceProfile in competenceProfiles) {
        
        competenceProfilesDocTE = tools.open_doc(competenceProfile.id).TopElem;

        RESULT.push({
            id: Trim(competenceProfile.id),
            code: Trim(competenceProfile.code),
            name: Trim(competenceProfile.name),
            competences: getCompetences(competenceProfilesDocTE.competences)
        })
    }

    return tools.object_to_text({
        type: "success",
        message: "",
        data: RESULT
    }, "json"); 
}

function get_CompoundPrograms() {

    function getPrograms(programs) {
        curPrograms = [];

        if(ArrayCount(programs) == 0) {
            return null;
        }

        for(program in programs) {

            curPrograms.push({
                'id': Trim(program.id),
                'name': Trim(program.name),
                'type': Trim(program.type),
                'object_id': Trim(program.object_id),
                'delay_days': OptInt(program.delay_days, null),
			    'days': OptInt(program.days, null),
			    'start_type': Trim(program.start_type),
			    'required': tools_web.is_true(program.required),
                'parent_program_id':  (program.parent_progpam_id.HasValue ? Trim(program.parent_progpam_id) : null),
                'completed_parent_programs' : (ArrayCount(program.completed_parent_programs) > 0 ? ArraySelectAll(program.completed_parent_programs) : null)
                
            })
        }

        return curPrograms;
    }

    var RESULT = [];
    var compoundPrograms = ArraySelectAll(XQuery("for $elem in compound_programs where id = '7198536501761629957' return $elem"));

    for(compoundProgram in compoundPrograms) {
        
        compoundProgramDocTE = tools.open_doc(compoundProgram.id).TopElem;

        RESULT.push({
            'id': Trim(compoundProgram.id),
            'code': Trim(compoundProgram.code),
            'name': Trim(compoundProgram.name),
            'resource_id': Trim(compoundProgram.resource_id),
            'allow_self_assignment': tools_web.is_true(compoundProgram.allow_self_assignment),
            'programs': getPrograms(compoundProgramDocTE.programs),
           
        })
    }

    return tools.object_to_text({
        type: "success",
        message: "",
        data: RESULT
    }, "json"); 
}

%>
