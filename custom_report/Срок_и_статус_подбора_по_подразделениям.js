try {

	var request_type_id = OptInt(criterions[0].value);
	var subdivision_id = OptInt(criterions[1].value);
	var str = "";

	if (subdivision_id != undefined) {
		var subs = XQuery("sql:  \n\
		DECLARE @subdivision_id BIGINT = "+ SqlLiteral(subdivision_id) + "; \n\
		WITH [tab] AS (\n\
            SELECT\n\
                [id],\n\
                [name],\n\
                [parent_object_id],\n\
                [lavel] = 1\n\
            FROM\n\
                [subdivisions] AS [ss]\n\
            WHERE\n\
                [id] = @subdivision_id\n\
            UNION ALL\n\
            SELECT\n\
                [ss].[id],\n\
                [ss].[name],\n\
                [ss].[parent_object_id],\n\
                [lavel] = [lavel] + 1\n\
            FROM\n\
                [subdivisions] AS [ss]\n\
                INNER JOIN [tab] ON [ss].[parent_object_id] = [tab].[id]\n\
        )\n\
		SELECT [id] FROM tab"
		);


		str = " AND [t3].[id] IN ("+ ArrayMerge(subs,'SqlLiteral(This.id)', ',') + ")"
	}


	var arr = XQuery("sql:  \n\
	DECLARE @type_id BIGINT = "+ SqlLiteral(request_type_id) + "; \n\
	WITH [cte] AS (\n\
		SELECT	\n\
			d0.data.value('(/request/workflow_fields/workflow_field[name=''or_id'']/value)[1]', 'bigint') AS [org_id],\n\
			d0.data.value('(/request/custom_elems/custom_elem[name=''div_id'']/value)[1]', 'varchar(300)') AS [subdiv_id],\n\
			d0.data.value('(/request/custom_elems/custom_elem[name=''code_position_st'']/value)[1]', 'varchar(300)') AS [code_position],\n\
			[t0].[code] AS [code_req],\n\
			d0.data.value('(/request/custom_elems/custom_elem[name=''pos_name'']/value)[1]', 'varchar(300)') AS [pos_name],\n\
			DATEDIFF(day, [t0].[create_date], [t0].[close_date]) AS [diff],\n\
			[t0].[create_date],\n\
			[t0].[close_date],\n\
			d0.data.value('(/request/workflow_fields/workflow_field[name=''boss_id'']/value)[1]', 'varchar(300)') AS [boss_id],\n\
			d0.data.value('(/request/workflow_fields/workflow_field[name=''higher_id'']/value)[1]', 'varchar(300)') AS [higher_id],\n\
			d0.data.value('(/request/workflow_fields/workflow_field[name=''recruiter'']/value)[1]', 'varchar(300)') AS [recruiter_id],\n\
			d0.data.value('(/request/workflow_fields/workflow_field[name=''hrbp'']/value)[1]', 'varchar(300)') AS [hrbp_id],\n\
			 d0.data.value('(/request/workflow_fields/workflow_field[name=''cs_privacy'']/value)[1]', 'varchar(300)') AS [cs_privacy],\n\
			[t0].[status_id],\n\
			[t0].[code]\n\
		FROM \n\
			[requests] AS [t0]\n\
			INNER JOIN [request] AS [d0] ON [d0].[id] = [t0].[id]\n\
			AND d0.data.value('(/request/workflow_fields/workflow_field[name=''cs_privacy'']/value)[1]', 'varchar(300)') != 'Да'\n\
		WHERE\n\
			request_type_id = @type_id\n\
		)\n\
		SELECT\n\
			[t2].[name] AS [org_name],\n\
			[t3].[name] AS [subdiv_name],\n\
			[t1].[code_position],\n\
			[t1].[code_req],\n\
			[t1].[code],\n\
			[t1].[pos_name],\n\
			[t1].[diff],\n\
			[t1].[create_date],\n\
			[t1].[close_date],\n\
			[t8].[name] AS [status],\n\
			[t4].[fullname] AS [boss_name],\n\
			[t5].[fullname] AS [higher_name],\n\
			[t6].[fullname] AS [recruiter_name],\n\
			[t7].[fullname] AS [hrbp_name],\n\
			[t1].[cs_privacy]\n\
		FROM\n\
			[cte] as [t1]\n\
			INNER JOIN [orgs] AS [t2] ON [t2].[id] = [t1].[org_id]\n\
			INNER JOIN [subdivisions] AS [t3] ON CONVERT(VARCHAR(300),[t3].[id]) = [t1].[subdiv_id]\n\
			LEFT JOIN [collaborators] AS [t4] ON CONVERT(VARCHAR(300),[t4].[id]) = [t1].[boss_id]\n\
			LEFT JOIN [collaborators] AS [t5] ON CONVERT(VARCHAR(300),[t5].[id]) = [t1].[higher_id]\n\
			LEFT JOIN [collaborators] AS [t6] ON CONVERT(VARCHAR(300),[t6].[id]) = [t1].[recruiter_id]\n\
			LEFT JOIN [collaborators] AS [t7] ON CONVERT(VARCHAR(300),[t7].[id]) = [t1].[hrbp_id]\n\
			INNER JOIN [common.request_status_types] AS [t8] ON [t8].[id] = [t1].[status_id]\n\
		WHERE\n\
			([t1].[org_id] = '7116612032298310523'\n\
			OR [t1].[org_id] = '7116612032494196892')" + str
	);

	return arr
} catch (err) {
	alert(err)
}