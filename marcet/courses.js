function get_Courses() {
    var RESULT = [];

    var  courses = ArraySelectAll(XQuery("for $elem in courses return $elem"));

    alert(ArrayCount(courses))

    for(course in courses) {
        courseDocTE = tools.open_doc(course.id).TopElem;
        // alert(tools.object_to_text(courseDocTE, 'json'))
        
        RESULT.push({
            id: Trim(course.id),
            name: Trim(course.name),
            code: Trim(course.code),
            resource_id: Trim(course.resource_id),
            status: Trim(course.status),
            duration: Trim(course.duration),
            price: Trim(course.price),
            course_finish_redirect: Trim(courseDocTE.course_finish_redirect),
            course_finish_redirect_url: Trim(courseDocTE.course_finish_redirect_url),
            base_url: Trim(course.base_url),
            view_type: Trim(course.view_type),
            mastery_score: OptInt(course.mastery_score, null),
            max_score: OptInt(course.max_score, null),
            yourself_start: Trim(course.yourself_start)
        })

    }

    alert("return")

    return tools.object_to_text({
        type: "success",
        message: "",
        data: RESULT
    }, "json"); 

}

// res = get_courses()

// alert(tools.object_to_text(res, 'json'))