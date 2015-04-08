/**
 * Common Functions for Catscales, CCQs, Charlsons, Treatments, Readings
 *
 * These are the exam-subresources (with collection-resources) of patients, which only can be used by doctors.
 *
 * Valid Values for exam parameter are: cats, ccqs, charlsons, treatments, readings
 * (Those values are supported by the stored procedures!)
 */

var swagger = require('swagger-node-express');
var ssl = require('../config.js').ssl.useSsl;

/**
 * GET lists from CATs, CCQs, Charlsons, Treatments, Readings
 *
 * Valid Values for exam parameter are: cats, ccqs, charlsons, treatments, readings
 * (Those values are supported by the stored procedures!)
 *
 * Steps:
 * 		1) Role Validation
 * 		2) Get DB Connection
 *  	3) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
 *  	4) create SQL Query from parameters
 *  	5) add links to result
 *  	6) send
 */
exports.list = function(req, res, nextOp, exam){
    var connection = req.con;
    // 3) create SQL Query from parameters
    var qry = "call listExams(?,?,?,?)";
    //extending statement if pagination is required (/accounts?page=<page>&pageSize=<pageSize>)
    // default value for page parameter - zero means no pagination
    var page = 0;
    // if no pageSize is given, use default which is 20
    var pageSize = 20;
    // is page parameter present in url? if not ignore pageSize!
    if (req.query.page){
        // parsing given parameter to int to avoid sql injection
        page = parseInt(req.query.page);
        // if parsing failed assume pagination is wanted anyway - use 1
        if (isNaN(page)) page = 1;
        // pageSize given?
        if (req.query.pageSize){
            // parsing given parameter to int to avoid sql injection
            pageSize = parseInt(req.query.pageSize);
            // if parsing failed assume pagination is wanted anyway - use 20
            if (isNaN(pageSize)) pageSize = 20;
        }
    }
    connection.query(qry, [exam, req.params.id, page, pageSize], function(err, rows) {
        connection.release();
        if (err) nextOp(err);
        else {
            var fullResult = {};
            fullResult[exam] = []
            // is there any result?
            if (rows[0].length > 0){
                var host = ((ssl)?'https://':'http://')+req.headers.host;
                var result = [];
                for (var i = 0; i < rows[0].length; i++){
                    var o  = rows[0][i];
                    o._links = {};
                    // create self link
                    o._links.self = {};
                    o._links.self.href = host+'/patients/'+req.params.id+'/'+exam+'/'+rows[0][i].recordId;
                    o._links.patient = {};
                    // create link to patient
                    o._links.patient.href = host+'/patients/'+req.params.id;
                    result.push(o);
                }
                fullResult[exam] = result;

               // add pagination links to result set if pagination was used
                if(page != 0){
                    var links = {};
                    // create first link
                    var first = host+'/patients/'+req.params.id+'/'+exam+'?page=1&pageSize='+pageSize;
                    links.first = first;
                    if (rows[0].length == pageSize) {
                        // create "next" link
                        var next = host+'/patients/'+req.params.id+'/'+exam+'?page='+(page+1)+'&pageSize='+pageSize;
                        links.next = next
                    }
                    if (page != 1){
                        // create back link
                        var back = host+'/patients/'+req.params.id+'/'+exam+'?page='+(page-1)+'&pageSize='+pageSize;
                        links.back = back
                    }
                    fullResult._links = links;
                }
            }
            res.result = fullResult;
            nextOp();
        }
    });
};

/**
 * GET single record from CATs, CCQs, Charlsons, Treatments, Readings
 *
 * Valid Values for exam parameter are: cats, ccqs, charlsons, treatments, readings
 * (Those values are supported by the stored procedures!)
 *
 * Steps:
 * 		1) Role Validation
 * 		2) Get DB Connection
 *  	3) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
 *  	4) create SQL Query from parameters
 *  	5) add links to result
 *  	6) send
 */
exports.listOne = function(req,res,next, exam) {
    var connection = req.con;
    // 3) create SQL Query from parameters
    var id = req.params.id;
    var rid = req.params.rid;
    var qry = 'call listSingleExam(?,?,?)';
    connection.query(qry, [exam, id, rid], function (err, rows) {
        connection.release();
        if (err) next(err);
        else {
            var fullResult = {};
            // was there any result?
            if (rows[0].length > 0) {
                var host = ((ssl)?'https://':'http://')+req.headers.host;
                var o = rows[0][0];
                o._links = {};
                o._links.self = {};
                // create self link
                o._links.self.href = host + '/patients/' + req.params.id + '/' + exam + '/' + rows[0][0].recordId;
                o._links.patient = {};
                // create link to corresponding patient
                o._links.patient.href = host + '/patients/' + req.params.id;
                fullResult = o;
            }
            res.result = fullResult;
            next();
        }
    });
};
/**
 * DELETE single record from CATs, CCQs, Charlsons, Treatments, Readings
 *
 * Valid Values for exam parameter are: cats, ccqs, charlsons, treatments, readings
 * (Those values are supported by the stored procedures!)
 *
 * Steps:
 * 		1) Role Validation
 * 		2) Get DB Connection
 *  	3) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
 *  	4) create SQL Query from parameters
 *  	5) add links to result
 *  	6) send
 */
exports.del = function(req, res, next, exam){
    var connection = req.con;
    // 3) create SQL Query from parameters
    var id = parseInt(req.params.id);
    var rid = parseInt(req.params.rid);
    // query db
    connection.query('call deleteExamRecord(?, ?, ?)', [exam, id, rid], function(err, result) {
        connection.release();
        if (err) next(err);
        else {
            res.affectedRows = result[0][0].affected_rows > 0;
            next();
        }
    });
};
