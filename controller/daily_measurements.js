/**
 * Route: DailyMeasurements Records
 */

var mysql = require('../config/mysql');
var db = mysql.db;

exports.add = function(req,res){
	db.getConnection(function(err, connection) {
		if (err) {
			console.error('DB Connection error on POST new question: ',err);
			res.send(503);
		} else {

			var question_text = db.escape(req.body.Text);
			var question_type = db.escape(req.body.Type);
			var question_category = db.escape(req.body.Category);
			var sql = 'Insert into questions (text, type, category) VALUES (' 
				+ question_text + ','
				+ question_type + ','
				+ question_category + ');'
			connection.query(sql, function(err, result) {
				if (err) {
					console.error('Query error on POST /question: ',err);
					return res.send(500);
				} else {
					var sql2 = 'Insert into answers (question, text, value) VALUES ' ;
					for (var i = 0; i <= req.body.Answers.length - 1; i++){
						sql2 += '(' + result.insertId + ',' 
									+  db.escape(req.body.Answers[i].Answertext) + ','
									+ db.escape(req.body.Answers[i].Value) + ')';
						if (i < req.body.Answers.length-1) sql2 += ',';
					}
					sql2 += ';';
					connection.query(sql2, function(err, result2) {
						if (err) {
							console.error('Query error on POST /question: ',err);
							return res.send(500);
						} 
					});
					res.statusCode = 201;
					res.location('questions/' + result.insertId);
					res.send();
				}
				connection.release();
			});
		}
	});
}

exports.list = function(req,res){
    db.getConnection(function(err, connection) {
        if (err) {
            console.error('DB Connection error on GET new measurement: ',err);
            res.send(503);
        } else {
            var id = db.escape(req.params.id);
            var qry = 'SELECT idMeasurements,date,mimetype,filename FROM measurements where refpatient =' + id ;
            connection.query(qry, function(err, rows) {
                if (err) {
                    console.error('Query error on GET new measurement: ',err);
                    return res.send(500);
                }
                if (rows.length > 0){
                    var real_id = id.replace(/'/g, "");
                    for (var i = 0; i<rows.length; i++){
                        rows[i].link = '/users/' + real_id + '/daily-measurements/' + rows[i].idMeasurements+ '/file'
                    }
                    res.send(rows);
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

exports.getMetaData = function(req,res){
    db.getConnection(function(err, connection) {
        if (err) {
            console.error('DB Connection error on GET new measurement: ',err);
            res.send(503);
        } else {
            var id = db.escape(req.params.mid);
            var qry = 'SELECT refpatient,date,mimetype,filename,filesize FROM measurements where idMeasurements =' + id ;
            connection.query(qry, function(err, rows) {
                if (err) {
                    console.error('Query error on GET meta data of measurement: ',err);
                    return res.send(500);
                }
                if (rows.length > 0){
                    var real_id = id.replace(/'/g, "");
                    rows[0].link = '/users/' + rows[0].refpatient + '/daily-measurements/' + real_id + '/data';
                    
                    res.send(rows);
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

exports.getFile  = function(req,res){
    db.getConnection(function(err, connection) {
        if (err) {
            console.error('DB Connection error on GET measurement file: ',err);
            res.send(503);
        } else {
            var id = db.escape(req.params.mid);
            var qry = 'SELECT mimetype,filename,filesize,data FROM measurements where idMeasurements =' + id ;
            connection.query(qry, function(err, rows) {
                if (err) {
                    console.error('Query error on GET measurement file: ',err);
                    return res.send(500);
                }
                if (rows.length > 0){
                    var buf = new Buffer(rows[0].data, 'base64');
                    var type = rows[0].mimetype;
                    res.setHeader('Content-Type', type);
                    res.setHeader('Content-Length', rows[0].filesize);
                    res.attachment(rows[0].filename);
                    res.end(buf);
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