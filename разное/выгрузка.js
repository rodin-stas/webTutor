if ( Trim('{[1]}')==""  ) {  continueFlag = true; 
} else {
     arrFMDelete = ArraySelect ( curObject.func_managers,"This.boss_type_id == 6148914691236517290" );
     for ( fldFMDelete in arrFMDelete )
     {
     	curObject.func_managers.DeleteChildByKey(fldFMDelete.PrimaryKey)
     }
    regObj = ArrayOptFirstElem( XQuery("for $elem in regions where $elem/code ='"+ Trim('{[24]}') +"' return $elem/Fields('id')") );

    if ( regObj != undefined ) {
          curObject.region_id = regObj.id;
     }


     var orgId = OptInt(Trim('{[25]}'), null);
     var inn = Trim('{[26]}')

     if(Trim('{[26]}') != '') {
          orgInInn = ArrayOptFirstElem(XQuery("sql:  \n\
          DECLARE @INN VARCHAR(224) = "+ SqlLiteral(inn) +"; \n\
          SELECT\n\
               [t1].[id],\n\
                R.p.query('inn').value('.', 'varchar(max)') as 'inns'\n\
          FROM\n\
               org AS [t1]\n\
               INNER JOIN [orgs] AS [t2] ON [t2].[id] = [t1].[id] \n
               cross apply [t1].data.nodes('//essentials') as R(p)\n\
          WHERE\n\
               R.p.query('inn').value('.', 'varchar(max)') = @INN"
	     ));

          alert("orgInInn == "+ orgInInn)
          if(orgInInn != undefined) {
               alert("orgInInn.id == "+ orgInInn.id)
               orgId =  orgInInn.id;
          } else {
               alert("Создаем орг")
               docOrg = OpenNewDoc( 'x-local://wtv/wtv_org.xmd' );
               docOrg.TopElem.code = Trim('{[17]}');
               docOrg.TopElem.name = Trim('{[17]}');
               docOrg.TopElem.disp_name = Trim('{[17]}');
     
               essential = docOrg.TopElem.essentials.Add();
               essential.inn = Trim('{[26]}');
     
               docOrg.BindToDb(DefaultDb);
               docOrg.Save();
     
               orgId = docOrg.DocID
           }

     } 

     curObject.org_id = orgId !=  null ? orgId: '7163474455229842991';

     

     subdivisionId = null;
     if (Trim('{[28]}')!="") {

          subdivision = ArrayOptFirstElem( XQuery("for $elem in subdivisions where $elem/name ='"+ Trim('{[28]}') +"' and $elem/org_id = '"+Trim(curObject.org_id)+"'  return $elem/Fields('id')") );


          if (subdivision == undefined) {
               alert("subdivision == undefined")
               docSubdivision = OpenNewDoc( 'x-local://wtv/wtv_subdivision.xmd' );
               docSubdivision.TopElem.code = Trim('{[28]}');
               docSubdivision.TopElem.name = Trim('{[28]}');
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

     positonId = null;
     if (Trim('{[29]}')!="") {

          alert("pos_name = "+ Trim('{[29]}'))
          alert("curObject.org_id= "+ Trim(curObject.org_id))
          alert("name= "+ Trim('{[28]}'))
          alert("name2= "+ "for $elem in positions where $elem/name ='"+ Trim('{[28]}') +"' and $elem/parent_object_id = '"+Trim(curObject.position_parent_id)+"' return $elem/Fields('id')")

          alert(ArrayCount(XQuery("for $elem in positions where $elem/name ='"+ Trim('{[28]}') +"' and $elem/parent_object_id = '"+Trim(curObject.position_parent_id)+"' return $elem/Fields('id')")))
          positon = ArrayOptFirstElem( XQuery("for $elem in positions where $elem/name ='"+ Trim('{[28]}') +"' and $elem/parent_object_id = '"+Trim(curObject.position_parent_id)+"' return $elem/Fields('id')") );

          if (positon == undefined) {
               alert("positon == undefined")
     
               docPosition = OpenNewDoc( 'x-local://wtv/wtv_position.xmd' );
               docPosition.TopElem.code = Trim('contractors');
               docPosition.TopElem.name = Trim('{[29]}');
               docPosition.TopElem.org_id = curObject.org_id;
               docPosition.TopElem.parent_object_id = curObject.position_parent_id;
               docPosition.TopElem.basic_collaborator_id = DocID
               docPosition.BindToDb(DefaultDb);
               docPosition.Save();
              alert("positonID =="+docPosition.DocID)
              positonId  = docPosition.DocID;
          } else {
               positonId = positon.id;
          }

          curObject.position_id = positonId;

          alert(positonId)
     }

}