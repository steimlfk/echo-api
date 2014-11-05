/**
 * New node file
 */


exports.list = function(req,res,next){
	db.getConnection(function(err, connection) {
		if (err) {
			console.error('DB Connection error on GET /accounts: ',err);
			res.send(503);
		} else {
			var pg = 0;
			var pgS = 0;
			var sort = null;
			var order = false;
			if (req.query.sortBy && req.query.sortBy != 'undefined'){
				sort = req.query.sortBy;
				if (req.query.order && req.query.order != 'undefined'){
					if (req.query.order.toLowerCase() == 'desc') order = true;
				}
			}
			if (req.query.page && req.query.page != 'undefined'){
				pg = parseInt(req.query.page);
				if (req.query.pageSize && req.query.pageSize != 'undefined'){
					pgS = parseInt(req.query.pageSize);
				}
			}
			var qry = 'CALL accountsList(?, ?, ? ,?)';
			connection.query(qry, [pg, pgS, sort, order], function(err, rows) {
				if (err) {
					console.error('Query error on GET /accounts: ', err);
					return res.send(500);
				}
				if (rows.length > 0){
					res.send({'accounts' : rows});
				}
				else{
					res.statusCode = 204;
					res.send();
				}
				connection.release();
			});
		}
	});
}