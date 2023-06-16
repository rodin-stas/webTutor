/**
 * @function rereadProgram
 * @memberof NLMK.Developers
 * @description Перезачитывает пройденные курсы в плане обучения
 * @author Rodin_Stas
 * @param  programs  все этапы из плана обучения
 * @param personId id человека
 * @param planId id плана обучения
 * @returns {void}
 */
function rereadProgram(programs, personId, planId) {
    for (program in programs) {
        rereadDate = null;
        rereadLearning = undefined;

        if(program.type == "course") {
            courseDoc = OpenDoc( UrlFromDocID( program.object_id ) );
            courseTE = courseDoc.TopElem;

            if(courseTE.custom_elems.ChildByKeyExists("reread") && courseTE.custom_elems.ObtainChildByKey("reread").value == 'true') {
		
                rereadDate = DateOffset(Date(), 1000000 * 86400 *(-1))
                if(courseTE.custom_elems.ChildByKeyExists("reread_days") && OptInt(courseTE.custom_elems.ObtainChildByKey("reread_days").value) != undefined ) {
            
                    rereadDate = DateOffset(Date(), OptInt(courseTE.custom_elems.ObtainChildByKey("reread_days").value,0) * 86400* (-1))
                }
            
            }

            if (rereadDate != null) {
                rereadLearning = ArrayOptFirstElem(XQuery( "for $elem in learnings where $elem/course_id = " + XQueryLiteral(program.object_id) + " and  $elem/person_id = " + XQueryLiteral(personId) + " and $elem/last_usage_date >= date('" + rereadDate + "')order by $elem/last_usage_date  return $elem" ));
    
        
                if (rereadLearning != undefined) {
                    program.result_type = 'learning';
                    program.result_object_id = rereadLearning.id;
                    program.state_id = 4;
                    program.start_type = "manual";
                    program.readiness_percent = rereadLearning.score;

                    learningDoc =  OpenDoc( UrlFromDocID( rereadLearning.id ) )
                    learningDoc.TopElem.education_plan_id = planId;
                    learningDoc.Save();
                }
            }
        }
    }
}

/**
 * @function updateStructureEducationPlan
 * @memberof LMK.Developers
 * @description Обновляет структуру плана обучения по модульной программе
 * @author Rodin_Stas
 * @param educationPlanTE карточка плана обучения
 * @param compoundProgramID id модубной программы
 * @returns {void}
 */
function updateStructureEducationPlan(educationPlanTE, compoundProgramID) {
    var teCompoundProgram = tools.open_doc(OptInt(compoundProgramID)).TopElem;
    var oldProgrammAll = ArraySelectAll(educationPlanTE.programs.Clone());
    var newProgrommAll = ArraySelectAll(teCompoundProgram.programs.Clone());

    educationPlanTE.programs.Clear();
    educationPlanTE.programs.AssignElem( teCompoundProgram.programs );

    for(newProgromm in educationPlanTE.programs) {
        oldProgramm = ArrayOptFirstElem(ArraySelectByKey( oldProgrammAll, newProgromm.id, 'id' ));

        if(oldProgramm != undefined) {
            _programm = ArrayOptFirstElem(ArraySelectByKey( newProgrommAll, newProgromm.id, 'id' ))
            newProgromm.AssignExtraElem( oldProgramm );

            if(_programm.days == "" || _programm.days == null || _programm.days == undefined) {
                newProgromm.days = null;
            }

            if(_programm.delay_days == "" || _programm.delay_days == null || _programm.delay_days == undefined) {
                newProgromm.delay_days = null;
            }
        }           
    }

    educationPlanTE.compound_program_id = teCompoundProgram.id.Value;
}