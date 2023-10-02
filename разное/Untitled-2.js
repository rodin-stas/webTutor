if (Trim('{[1]}') == "") {
    continueFlag = true;
} else {

    var orgId = OptInt(Trim('{[6]}'), null);
    var inn = Trim('{[7]}')

    if (orgId == null && inn != '') {
        orgInInn = ArrayOptFirstElem(XQuery("sql:  \n\
          DECLARE @INN VARCHAR(224) = "+ SqlLiteral(inn) + "; \n\
          SELECT\n\
               [t1].[id],\n\
                R.p.query('inn').value('.', 'varchar(max)') as 'inns'\n\
          FROM\n\
               org AS [t1]\n\
               INNER JOIN [orgs] AS [t2] ON [t2].[id] = [t1].[id] \n
               cross apply[t1].data.nodes('//essentials') as R(p) \n\
            WHERE\n\
            R.p.query('inn').value('.', 'varchar(max)') = @INN"
        ));

        alert("orgInInn == " + orgInInn
        )
        if (orgInInn != undefined) {
            alert("orgInInn.id == " + orgInInn.id)
            orgId = orgInInn.id;
        } else {
            alert("Создаем орг")
            docOrg = OpenNewDoc('x-local://wtv/wtv_org.xmd');
            docOrg.TopElem.code = Trim('{[5]}');
            docOrg.TopElem.name = Trim('{[5]}');
            docOrg.TopElem.disp_name = Trim('{[5]}');

            essential = docOrg.TopElem.essentials.Add();
            essential.inn = inn;

            docOrg.BindToDb(DefaultDb);
            docOrg.Save();

            orgId = docOrg.DocID
        }

    }

    curObject.org_id = orgId != null ? orgId : '7163474455229842991';

    subdivisionId = OptInt(Trim('{[10]}'), null);
    subdivisionName = Trim('{[9]}');
    if (subdivisionId == null && subdivisionName != "") {

        subdivision = ArrayOptFirstElem(XQuery("for $elem in subdivisions where $elem/name =" + XQueryLiteral(subdivisionName) + " and $elem/org_id = " + XQueryLiteral(curObject.org_id) + "  return $elem/Fields('id')"));


        if (subdivision == undefined) {
            alert("subdivision == undefined")
            docSubdivision = OpenNewDoc('x-local://wtv/wtv_subdivision.xmd');
            docSubdivision.TopElem.code = subdivisionName;
            docSubdivision.TopElem.name = subdivisionName;
            docSubdivision.TopElem.org_id = curObject.org_id;
            docSubdivision.BindToDb(DefaultDb);
            docSubdivision.Save();

            subdivisionId = docSubdivision.DocID;
        } else {
            subdivisionId = subdivision.id;
        }

        curObject.position_parent_id = subdivisionId;

        alert(subdivisionId)
    }

    positionId = OptInt(Trim('{[12]}'), null);
    positionName = Trim('{[11]}')
    if (positionId == null && positionName != "") {

        alert("positon == undefined")

        docPosition = OpenNewDoc('x-local://wtv/wtv_position.xmd');
        docPosition.TopElem.code = Trim('contractors');
        docPosition.TopElem.name = positionName;
        docPosition.TopElem.org_id = curObject.org_id;
        docPosition.TopElem.parent_object_id = curObject.position_parent_id;
        docPosition.TopElem.basic_collaborator_id = DocID
        docPosition.BindToDb(DefaultDb);
        docPosition.Save();
        alert("positionID ==" + docPosition.DocID)
        positionId = docPosition.DocID;



        alert(positionId)
    }
    curObject.position_id = positionId;
}