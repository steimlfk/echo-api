/**
 * Controller: Analysers
 *
 * Contains Methods to GET and POST to /analyser (list, listOne, delete and add)
 *
 * Contains swagger specs and models
 */
var swagger = require('swagger-node-express');
var request = require('request');
var ssl = require('../config.js').ssl.useSsl;
var flowEngine = require('../config.js').flowEngine;
var commons = require('./../controller/controller_commons.js');



/**
 *  GET /analyser
 *
 *  Steps:
 *  	1) Get DB Connection
 *  	2) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
 *  	3) create SQL Query from parameters
 *  	4) add links to result
 *  	5) send
 */
exports.list = function(req, res, next){
    var connection = req.con;
    // 3) create SQL Query from parameters
    // set base statement

	var qry = 'call analyserList(?, ?)';
    var pagination = commons.getPaginationInfos(req.query.page, req.query.pageSize);

    //query db
    connection.query(qry, [pagination.page, pagination.pageSize], function(err, rows) {
        if (err) next(err);
        else {
            var fullResult = {
                analysers : []
            };
			
			// Get primary node red host
			var hostArr = [];
			
			var qry = 'SELECT * FROM analyserHost_view';
		    connection.query(qry, function(err, rows1) {
		        if(err) {
					connection.release();
					next(err);
		        } else { 
					// is there any result?
		            if(rows1.length > 0){
		                hostArr = rows1;	
						
			            // is there any result?
			            if (rows[0].length > 0){
				
							var result = [];				
							for (var i in rows[0]){
					
								var host = {};
								for(var l in hostArr) {
									if(hostArr[l].hostId == rows[0][i].hostId) {
										host = hostArr[l];
									}
								}
								
	                			rows[0][i]._links = {};
	                			// create self link
	                			rows[0][i]._links.self = {};
	                			rows[0][i]._links.self.href = '/analyse/analyser/'+req.params.id;
	                			// create corresponding patients link
	                			rows[0][i]._links.accountId = {};
	                			rows[0][i]._links.accountId.href = '/account/'+rows[0][i].accountId;				
								
								result.push(rows[0][i]);
					
							}
							
							console.log(result);
			                fullResult.analysers = result;

			                var links = commons.generateCollectionLinks(req.originalUrl.split('?')[0], pagination.page, pagination.pageSize, rows.length);

			                fullResult._links = links;

				            res.result = fullResult;
				            next();
            
						} else {
				            res.result = fullResult;
				            next();
			            }
						
		            } else {
						connection.release();
		            	next(new Error('SERVER_NOT_FOUND_ERROR'));
		            }
				}
			});
        }
    });
};

/**
 *  GET /analyser/id
 *    Steps:
 *      1) Validate Role
 *  	2) Get DB Connection
 *  	3) Change connected user to currently logged in user (found via req.user, which was populated by passport)
 *  	4) create SQL Query from parameters
 *  	5) add links to result
 *  	6) send
 */
exports.listOne = function(req,res,next){
    var connection = req.con;
    var id = req.params.id;
    var qry = 'call analyserListOne(?)';
    // query db
    // ? from query will be replaced by values in [] - including escaping!
    connection.query(qry,[id], function(err, rows) {
        if (err) next(err);
        else {
            var fullResult = {};
            // is there any result?
            if (rows[0].length > 0){
				
				var o  = rows[0][0];
								
				// Get primary node red host
				var hostArr = {};
	
				var qry = 'SELECT * FROM analyserHost_view WHERE `hostId` = '+o.hostId;
			    connection.query(qry, function(err, rows) {
			        if(err) {
						connection.release();
						next(err);
			        } else { 
						// is there any result?
			            if(rows.length > 0){
			                hostArr = rows[0];
				
							// Get all analyser for status
							request.get({url:'http://'+hostArr.hostname+':'+hostArr.hostport+''+hostArr.hostpath}, function(err,httpResponse,body){ 
								if(err || httpResponse.statusCode != 200) {
									next(new Error('NODE_RED_COMMUNICATION_ERROR'));
								} else {
									var resp = JSON.parse(body);
						
									var isActive = false;
									for(var k in resp) {
										if(resp[k].id == o.flowId) {
											isActive = true;
											break;
										}
									}
												
									o.flowState = isActive;
		                			o._links = {};
		                			// create self link
		                			o._links.self = {};
		                			o._links.self.href = '/analyse/analyser/'+req.params.id;
		                			// create corresponding patients link
		                			o._links.accountId = {};
		                			o._links.accountId.href = '/account/'+o.accountId;
		                			fullResult = o;
						
			            			res.result = fullResult;
			            			next();
								}
								
								
							});
							
			            } else {
							connection.release();
			            	next(new Error('SERVER_NOT_FOUND_ERROR'));
			            }
					}
				});
            } else {
            	res.result = fullResult;
            	next();
        	}
        }
		connection.release(); 
    });
};

/**
 *  DELETE /analyser/id
 *    Steps:
 *      1) Validate Role
 *  	2) Get DB Connection
 *  	3) Change connected user to currently logged in user (found via req.user, which was populated by passport)
 *  	4) create SQL Query from parameters
 *  	5) add links to result
 *  	6) send
 */
exports.del = function(req, res, next){
    var connection = req.con;
    // 3) create SQL Query from parameters
    var id = parseInt(req.params.id);
    // query db
    // ? from query will be replaced by values in [] - including escaping!
	var qry = 'call analyserListOne(?)';
    connection.query(qry, [id], function(err, rows) {
        if(err) {
        	connection.release();
			next(err);
        } else {
            // is there any result?
            if(rows[0].length > 0) {
				var o  = rows[0][0];
				
				// Get primary node red host
				var hostArr = {};
	
				var qry = 'SELECT * FROM analyserHost_view WHERE `hostId` = '+o.hostId;
			    connection.query(qry, function(err, rows) {
			        if(err) {
						connection.release();
						next(err);
			        } else {
			            
						// is there any result?
						// Primary host found if it is ture
			            if(rows.length > 0){
			                hostArr = rows[0];
							
							// Delete analyser from node red host
							request.del({url:'http://'+hostArr.hostname+':'+hostArr.hostport+''+hostArr.hostpath+'/'+o.flowId}, function(err1,httpResponse,body){ 
								if(err1 || httpResponse.statusCode != 200 && httpResponse.statusCode != 404) {
									connection.release();
									next(new Error('NODE_RED_COMMUNICATION_ERROR'));
								} else {
									// Parse response from node red
									var resp = JSON.parse(body);
									if(resp.status.toLowerCase() == 'ok' || resp.status.toLowerCase() == 'not found') {
										// Delete analyser from database
						    			connection.query('call analyserDelete(?)', [id], function(err2, result) {
						        			connection.release();
						        			if(err2) next(err2);
						        			else {
						            			res.affectedRows = result[0][0].affected_rows > 0;
						            			next();
						        			}
						    			});
									} else {
										connection.release();
				            			next(new Error('DELETE_ERROR'));
									}
								}
							});
							
			            } else {
							connection.release();
			            	next(new Error('SERVER_NOT_FOUND_ERROR'));
			            }
					}
				});
            } else {
				connection.release();
            	next(new Error('NOT_FOUND'));
            }
        } 
    });
};

/**
 *  POST /analyser
 *  Steps:
 *  	1) Validate Role!
 *  	2) Get DB Connection
 *  	3) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
 *		4) Deploy analyser flow in node red
 *  	5) create SQL Query from parameters and response from flow engine
 *  	6) add links to result
 *  	7) send
 */
exports.add = function(req,res,next){
    var connection = req.con;
	var analyserId = -1;
    var i = req.body;
	var flowId = '';
	var flowUrl = '';
	var rowsAnalyser = [];
	
    // set date to null if not set
    var date = i.date || null;
		
	// Get primary node red host
	var hostArr = {};
	
	var qry = 'SELECT * FROM analyserHost_view WHERE `primary` = 1 LIMIT 1';
    connection.query(qry, function(err, rows) {
        if (err) {
			connection.release();
			next(err);
        } else {
            // is there any result?
			// Primary host found if it is ture
            if (rows.length > 0){
                hostArr = rows[0];
				
				// Deploy flow in node-red.
				// Send analyser templates to primary node-red instance.
				// Node-red validates template and response with analyser id if it is possible to deploy.
					
				request.post({url:'http://'+hostArr.hostname+':'+hostArr.hostport+''+hostArr.hostpath, json: i}, function(err1,httpResponse,body){ 
					if(err1) {
						connection.release();
						next(new Error('NODE_RED_COMMUNICATION_ERROR'));
					} else if (!err && httpResponse.statusCode == 200) {
												
						// Analyser have been activated on node red
						if(body.status.toLowerCase() == 'ok') {
							// Extract ids from node-red response
							flowId = body.ids.analyzerId;
				
							// Add analyser to database
							// Use analyserId for rules
							connection.query('call analyserCreate(?,?,?,?,?,?)',
						    	[i.event.type, i.action.type, flowId, flowId, body.serverid, i.action.parm.message], function(err2, result) {
									if (err2) {
										connection.release();
										next(err2);
									} else {
										analyserId = result[0][0].insertId;
										res.loc = '/analyser/'+result[0][0].insertId;
										res.modified = result[0][0].modified;
										
										if('event' in i && 'type' in i.event) {
											
											// Data Mining Analyses
											// Parser must be switched to data mining structure
											if(i.event.type.indexOf("dataMining") > -1) {
												
												for(var k in i.structure) {
													
													// Normal object structure is required	
													if(typeof i.structure[k] === 'object') {
														// Object is a analyser node
														if((k % 2) === 0 && i.structure[k] !== undefined && 'type' in i.structure[k] && i.structure[k].type == "node") {
							
															// Boolesch values must be converted
															var value = i.structure[k].value;
															
															// Parse expression type for data mining
															// Standard is between for range analysis
															var exp = i.structure[k].exp;
															
															var range = "";
															
															if(exp.toUpperCase() == 'BETWEEN') {
																var tmp = i.structure[k].range.toLowerCase().split("to");
																var num1 = tmp[0].replace(" ", "");
																var num2 = tmp[1].replace(" ", "");
																
																// Check is number
																if(isNaN(num1) || isNaN(num2)) {
																	connection.release();
														            next(new Error('WRONG_EXPRESSION_RANGE'));
																}
															} else {
																range = i.structure[k].range;
															}
							
															// Parse classification type and attribute
															var dataEndpoints = {};
															dataEndpoints.table = i.structure[k].field.split(".")[0];
															dataEndpoints.field = i.structure[k].field.split(".")[1];
	
															// Check if operator is available for analyser.
															// Validates operators and expressions between template and database.
															var kk = parseInt(k) + 1;
															if((i.structure.length-1) >= kk && i.structure[kk] !== undefined && 'type' in i.structure[kk] && i.structure[kk].type == "operator") {
								
																// Add analyser rule to database when another rule is available.
																connection.query('call analyserRulesCreate(?,?,?,?,?,?,?)',
												    				[analyserId, i.structure[kk].op, i.structure[k].exp, dataEndpoints.table, dataEndpoints.field, value, i.structure[k].range], function(err4, result) {
																		if (err4) {
																			// Failure, rollback
																			// Delete analyser from node red host
																			request.del({url:'http://'+flowEngine.host+':'+flowEngine.port+''+flowEngine.path+'/'+flowId}, function(err5,httpResponse,body){ 
																				if(err5 || httpResponse.statusCode != 200) {
																					connection.release();
																					next(new Error('NODE_RED_COMMUNICATION_ERROR'));
																				} else {
																					// Parse response from node red
																					var resp = JSON.parse(body);
																					if(resp.status.toLowerCase() == 'ok') {
																						// Delete analyser from database
																					    connection.query('call analyserDelete(?)', [analyserId], function(err5, result) {
																					        connection.release();
																					        if (err5) {
																								next(err5);
																					        } else {
																					            res.affectedRows = result[0][0].affected_rows > 0;
																					        }
																					    });
																					} else {
																						connection.release();
																			            next(new Error('NOT_FOUND'));
																					}
																				}
																			});
																			next(err4);
												        				} else {
																			rowsAnalyser.push(result[0][0].insertId);
												        				}
												    			});
							
															} else {
								
																// Add analyser rule to database when rule is last one.
																connection.query('call analyserRulesCreate(?,?,?,?,?,?,?)',
												    				[analyserId, "NULL", i.structure[k].exp, dataEndpoints.table, dataEndpoints.field, value, i.structure[k].range], function(err4, result) {
																		if (err4) {
																			// Failure, rollback
																			// Delete analyser from node red host
																			request.del({url:'http://'+flowEngine.host+':'+flowEngine.port+''+flowEngine.path+'/'+flowId}, function(err5,httpResponse,body){ 
																				if(err5 || httpResponse.statusCode != 200) {
																					connection.release();
																					next(new Error('NODE_RED_COMMUNICATION_ERROR'));
																				} else {
																					// Parse response from node red
																					var resp = JSON.parse(body);
																					if(resp.status.toLowerCase() == 'ok') {
																						// Delete analyser from database
																					    connection.query('call analyserDelete(?)', [analyserId], function(err5, result) {
																					        connection.release();
																					        if (err5) next(err5);
																					        else {
																					            res.affectedRows = result[0][0].affected_rows > 0;
																					        }
																					    });
																					} else {
																						connection.release();
																			            next(new Error('NOT_FOUND'));
																					}
																				}
																			});
																			next(err4);
												        				} else {
																			rowsAnalyser.push(result[0][0].insertId);
												        				}
												    			});
							
															}
			
														// Object is a operator	
														} else if((k % 2) === 1 && i.structure[k] !== undefined && 'type' in i.structure[k] && i.structure[k].type == "operator") {
															// Ignore, not required for echo platform.
															// Operators/Expressions will be directly added on rule creation section.
														}
													}
													
												}
												
												// Add filter rules
												if('filter' in i && 'field' in i.filter && 'value' in i.filter) {
											
													// Extract data point from filter
													var dataEndpoints = {};
													if(i.filter.field.split(".").length == 2) {
														dataEndpoints.table = i.filter.field.split(".")[0];
														dataEndpoints.field = i.filter.field.split(".")[1];
													}
											
													// Convert boolesch values
													if(i.filter.value === true) {
														i.filter.value = 'true';
													} else if(i.filter.value === false) {
														i.filter.value = 'false';
													}
											
												    connection.query('call analyserFilterCreate(?,?,?,?)', [analyserId, dataEndpoints.table, dataEndpoints.field, i.filter.value], function(err5, result) {
												    	if (err5) { 
															// Delete analyser from node red host
															request.del({url:'http://'+flowEngine.host+':'+flowEngine.port+''+flowEngine.path+'/'+flowId}, function(err6,httpResponse,body){ 
																if(err6) {
																	connection.release();
																	next(new Error('NODE_RED_COMMUNICATION_ERROR'));
																} else if(!err6 && httpResponse.statusCode != 200) {
																	// Delete analyser from database
																    connection.query('call analyserDelete(?)', [analyserId], function(err7, result) {
																        if (err7) {
																			connection.release();
																			next(err7);
																        } else {
																			connection.release();
																            next(new Error('FLOW_CREATION_ERROR'));
																        }
																    });
																} else {
																	// Parse response from node red
																	var resp = JSON.parse(body);
																	if(resp.status.toLowerCase() == 'ok') {
																		// Delete analyser from database
																	    connection.query('call analyserDelete(?)', [analyserId], function(err7, result) {
																	        if (err7) {
																				connection.release();
																				next(err7);
																	        } else {
																				connection.release();
																	            next(new Error('FLOW_CREATION_ERROR'));
																	        }
																	    });
																	} else {
																		connection.release();
															            next(new Error('NOT_FOUND'));
																	}
																}
															});
												        } else {
															// Complete filter added
															connection.release();
															next(); 
												        }
												    });
												} else {
													connection.release();
													next();
												}
												
											} else {
												
												// Analyser was created, requires to save rules now.
												// Analyser template parser: Add analyser rules to database.
												for(var k in i.structure) {
		
													// Normal object structure is required	
													if(typeof i.structure[k] === 'object') {
														// Object is a analyser node
														if((k % 2) === 0 && i.structure[k] !== undefined && 'type' in i.structure[k] && i.structure[k].type == "node") {
							
															// Boolesch values must be converted
															var value = "";
															if(i.structure[k].value == true) {
																value = 'true';
															} else if(i.structure[k].value == false) {
																value = 'false';
															} else {
																value = i.structure[k].value;
															}
							
															// Required for timebased templates for analyse which use complete table.
															// Complete_table for timeBased analysis which using the complete data set.
															var dataEndpoints = {};
															if(i.structure[k].field.split(".").length < 2 && 'type' in i.event && i.event.type == 'timeBased') {
																dataEndpoints.table = i.structure[k].field;
																dataEndpoints.field = 'COMPLETE_TABLE';
															} else {
																dataEndpoints.table = i.structure[k].field.split(".")[0];
																dataEndpoints.field = i.structure[k].field.split(".")[1];
															}
	
															// Check if operator is available for analyser.
															// Validates operators and expressions between template and database.
															var kk = parseInt(k) + 1;
															if((i.structure.length-1) >= kk && i.structure[kk] !== undefined && 'type' in i.structure[kk] && i.structure[kk].type == "operator") {
								
																// Add analyser rule to database when another rule is available.
																connection.query('call analyserRulesCreate(?,?,?,?,?,?,?)',
												    				[analyserId, i.structure[kk].op, i.structure[k].exp, dataEndpoints.table, dataEndpoints.field, value, i.structure[k].range], function(err4, result) {
																		if (err4) {
																			// Failure, rollback
																			// Delete analyser from node red host
																			request.del({url:'http://'+flowEngine.host+':'+flowEngine.port+''+flowEngine.path+'/'+flowId}, function(err5,httpResponse,body){ 
																				if(err5 || httpResponse.statusCode != 200) {
																					connection.release();
																					next(new Error('NODE_RED_COMMUNICATION_ERROR'));
																				} else {
																					// Parse response from node red
																					var resp = JSON.parse(body);
																					if(resp.status.toLowerCase() == 'ok') {
																						// Delete analyser from database
																					    connection.query('call analyserDelete(?)', [analyserId], function(err5, result) {
																					        connection.release();
																					        if (err5) next(err5);
																					        else {
																					            res.affectedRows = result[0][0].affected_rows > 0;
																					        }
																					    });
																					} else {
																						connection.release();
																			            next(new Error('NOT_FOUND'));
																					}
																				}
																			});
																			next(err4);
												        				} else {
																			rowsAnalyser.push(result[0][0].insertId);
												        				}
												    			});
							
															} else {
								
																// Add analyser rule to database when rule is last one.
																connection.query('call analyserRulesCreate(?,?,?,?,?,?,?)',
												    				[analyserId, "NULL", i.structure[k].exp, dataEndpoints.table, dataEndpoints.field, value, i.structure[k].range], function(err4, result) {
																		if (err4) {
																			// Failure, rollback
																			// Delete analyser from node red host
																			request.del({url:'http://'+flowEngine.host+':'+flowEngine.port+''+flowEngine.path+'/'+flowId}, function(err5,httpResponse,body){ 
																				if(err5 || httpResponse.statusCode != 200) {
																					connection.release();
																					next(new Error('NODE_RED_COMMUNICATION_ERROR'));
																				} else {
																					// Parse response from node red
																					var resp = JSON.parse(body);
																					if(resp.status.toLowerCase() == 'ok') {
																						// Delete analyser from database
																					    connection.query('call analyserDelete(?)', [analyserId], function(err5, result) {
																					        connection.release();
																					        if (err5) next(err5);
																					        else {
																					            res.affectedRows = result[0][0].affected_rows > 0;
																					        }
																					    });
																					} else {
																						connection.release();
																			            next(new Error('NOT_FOUND'));
																					}
																				}
																			});
																			next(err4);
												        				} else {
																			rowsAnalyser.push(result[0][0].insertId);
												        				}
												    			});
							
															}
			
														// Object is a operator	
														} else if((k % 2) === 1 && i.structure[k] !== undefined && 'type' in i.structure[k] && i.structure[k].type == "operator") {
															// Ignore, not required for echo platform.
															// Operators/Expressions will be directly added on rule creation section.
														}
													}
												}
										
												// Add filter rules
												if('filter' in i && 'field' in i.filter && 'value' in i.filter) {
											
													// Extract data point from filter
													var dataEndpoints = {};
													if(i.filter.field.split(".").length == 2) {
														dataEndpoints.table = i.filter.field.split(".")[0];
														dataEndpoints.field = i.filter.field.split(".")[1];
													}
											
													// Convert boolesch values
													if(i.filter.value === true) {
														i.filter.value = 'true';
													} else if(i.filter.value === false) {
														i.filter.value = 'false';
													}
											
												    connection.query('call analyserFilterCreate(?,?,?,?)', [analyserId, dataEndpoints.table, dataEndpoints.field, i.filter.value], function(err5, result) {
												    	if (err5) { 
															// Delete analyser from node red host
															request.del({url:'http://'+flowEngine.host+':'+flowEngine.port+''+flowEngine.path+'/'+flowId}, function(err6,httpResponse,body){ 
																if(err6) {
																	connection.release();
																	next(new Error('NODE_RED_COMMUNICATION_ERROR'));
																} else if(!err6 && httpResponse.statusCode != 200) {
																	// Delete analyser from database
																    connection.query('call analyserDelete(?)', [analyserId], function(err7, result) {
																        if (err7) {
																			connection.release();
																			next(err7);
																        } else {
																			connection.release();
																            next(new Error('FLOW_CREATION_ERROR'));
																        }
																    });
																} else {
																	// Parse response from node red
																	var resp = JSON.parse(body);
																	if(resp.status.toLowerCase() == 'ok') {
																		// Delete analyser from database
																	    connection.query('call analyserDelete(?)', [analyserId], function(err7, result) {
																	        if (err7) {
																				connection.release();
																				next(err7);
																	        } else {
																				connection.release();
																	            next(new Error('FLOW_CREATION_ERROR'));
																	        }
																	    });
																	} else {
																		connection.release();
															            next(new Error('NOT_FOUND'));
																	}
																}
															});
												        } else {
															// Complete filter added
															connection.release();
															next(); 
												        }
												    });
												} else {
													connection.release();
													next();
												}
											}
											
										}
											
						        	}
						    });
						} else {
							connection.release();
							next(new Error('NODE_RED_FLOW_CREATION_ERROR'));
						}
			    	} else {
						connection.release();
						next(new Error('NODE_RED_FLOW_CREATION_ERROR'));
			    	}
				});
				
            } else {
				connection.release();
            	next(new Error('SERVER_NOT_FOUND_ERROR'));
            }
        }
    });
};

var respMessages = commons.respMsg("Analyser");
exports.listSpec = {
    summary : "Get All Analysers of the logged-in User",
    notes: "This Function lists all Analysers for the current user. <br> <br><br>" +

    "<b>Pagination</b>: If you provide a page and a pageSize, the result is only the requested part of the list. If the value of page is too big, an empty list is returned. If you provide a Pagecount without Pagesize, Pagesize is 20. <br> " ,
    path : "/analyse/analyser",
    method: "GET",
    type : "ListAnalyser",
    nickname : "listAnalysers",
    parameters : [
        swagger.queryParam("page", "Page Count for Pagination", "string", false, null, "1"),
        swagger.queryParam("pageSize", "Page Size for Pagination. Default is 20", "string", false, null, "20")
    ],
    responseMessages : respMessages.list
};

exports.listOneSpec = {
    summary : "Get specific Analyser of this Account (Roles: admin, doctor and patient)",
    path : "/analyse/analyser/{id}",
    notes: "This Function returns the requested analyser, if it exists and is visible to the current user. <br>This function passes the parameters to the SP analyserListOne. <br><br>" ,
    method: "GET",
    type : "Analyser",
    nickname : "listOneAnalyser",
    parameters : [swagger.pathParam("id", "ID of the Analyser", "string")],
    responseMessages : respMessages.listOne
};

exports.addSpec = {
    summary : "Add new Analyser (Roles: admin, doctor and patient)",
    notes: "This Function creates an new data analyser. If the Body contains patientId, its ignored and the id from the url is taken. Also it will set the date if date is null. <br>This function passes its parameters to the SP reportCreate. <br><br>" ,
    path : "/analyse/analyser",
    method: "POST",
    nickname : "addAnalyser",
    parameters : [swagger.bodyParam("NewAnalyser", "new analyser template", "NewAnalyser")],
    responseMessages: respMessages.add
};

exports.delSpec = {
    summary : "Delete specific Analyser of this ID (Roles: admin, doctor and patient)",
    notes: "This Function deletes a analyser, which is specified by the url. (if the Body contains ids, theyre ignored) <br>This function passes its parameters to the SP analyserDelete <br><br>" ,
    path : "/analyse/analyser/{id}",
    method: "DELETE",
    nickname : "delAnalyser",
    parameters : [swagger.pathParam("id", "ID of the Patient", "string")],
    responseMessages: respMessages.del
};


exports.models = {
    "NewAnalyser":{
		  "id": "NewAnalyser",
		  "type": "object",
		  "properties": {
		    "structure": {
		      "id": "structure",
		      "type": "array",
		      "items": {
		        "id": "structure",
		        "type": "array",
		        "items": {
		          "id": "structure",
		          "type": "object",
		          "properties": {
		            "type": {
		              "id": "type",
		              "type": "string"
		            },
		            "field": {
		              "id": "field",
		              "type": "string"
		            },
		            "exp": {
		              "id": "exp",
		              "type": "string"
		            },
		            "value": {
		              "id": "value",
		              "type": "boolean"
		            },
		            "range": {
		              "id": "range",
		              "type": "string"
		            }
		          },
		          "required": [
		            "type",
		            "field",
		            "exp",
		            "value",
		            "range"
		          ]
		        },
		        "required": [
		          "4"
		        ]
		      },
		      "required": [
		        "0"
		      ]
		    },
		    "event": {
		      "id": "event",
		      "type": "object",
		      "properties": {
		        "type": {
		          "id": "type",
		          "type": "string"
		        },
		        "parm": {
		          "id": "parm",
		          "type": "object",
		          "properties": {}
		        }
		      }
		    },
		    "action": {
		      "id": "action",
		      "type": "object",
		      "properties": {
		        "type": {
		          "id": "type",
		          "type": "string"
		        },
		        "parm": {
		          "id": "parm",
		          "type": "object",
		          "properties": {
		            "message": {
		              "id": "message",
		              "type": "string"
		            }
		          }
		        }
		      }
		    },
		    "filter": {
		      "id": "filter",
		      "type": "object",
		      "properties": {
		        "field": {
		          "id": "field",
		          "type": "string"
		        },
		        "value": {
		          "id": "value",
		          "type": "integer"
		        }
		      }
		    }
		  },
		  "required": [
		    "structure",
		    "event",
		    "action",
		    "filter"
		  ]
    },
    "Analyser":{
        "id" : "Analyser",
        "required": ["analyserId","accountId","eventId","notifyId","flowId","flowUrl","hostId","date","modified"],
        "properties":{
            "analyserId": {"type":"integer", "format": "int32", "description": "Identifier of the analyser"},
            "accountId":{"type":"integer","format": "int32","description": "Identifier of the Analyser Owner"},
			"eventId":{"type":"integer","format": "int32","description": "Identifier of the used event type"},
			"notifyId":{"type":"integer","format": "int32","description": "Identifier of the used notify type"},
			"minimalData":{"type":"integer","format": "int32","description": "Amount/range of records which should be analyzed"},
			"flowId":{"type":"string","description": "Identifier of the flow on flow engine"},
			"flowUrl":{"type":"string","description": "Url to the flow engine"},
			"hostId":{"type":"integer","format": "int32","description": "Identifier of the flow engine server"},
            "date":{"type":"string","format": "Date", "description": "Date and Time of Analyser"},
			"flowState":{"type":"string","format": "Date", "description": "Node-red state of flow"},
			"modified":{"type":"string","format": "Date", "description": "Date and Time of last change"}
        }
    },
    "ListAnalyser":{
        "id":"ListAnalyser",
        "required": ["Analyser"],
        "properties": { _links : { "$ref" : "CollectionLinks"}, Analyser : {"type" : "array", items : { "$ref" : "Analyser"}}}

    }
};