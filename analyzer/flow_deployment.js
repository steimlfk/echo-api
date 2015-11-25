/**
 * Controller: Flow Deployment
 *
 * Contains Methods to GET and POST to /analyser (list, listOne, delete and add)
 *
 * Contains swagger specs and models
 */
var swagger = require('swagger-node-express');
var request = require('request');
var ssl = require('../config.js').ssl.useSsl;
var flowEngine = require('../config.js').flowEngine;
var async = require('async');
var commons = require('./../controller/controller_commons.js');
var lockFile = require('lockfile');

// Lock file config
var opts = {
	wait: 1000
};


/**
 *  Post /reDeployAll
 *
 *  Steps:
 *  	1) Get DB Connection
 *  	2) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
 *  	3) create SQL Query from parameters
 *  	4) add links to result
 *  	5) send
 */
exports.reDeployAll = function(req, res, next){
    var connection = req.con;
    // 3) create SQL Query from parameters
    // set base statement
	
	
	async.waterfall(
		[
	    function(callback){
			connection.query('call analyserListAll()', function(err, rows) {
		        if(err) {
					console.log("Select analyser");
					callback(err);
		        } else {
					callback(null, rows[0]);
				}		
			});
	    },
	    function(arg1, callback){
			connection.query('SELECT * FROM analyserHost_view', function(err, rows) {
		        if(err) {
					console.log("Select server");
					callback(err);
		        } else {
					callback(null, arg1, rows);
				}
			});
	    },
	    function(arg1, arg2, callback){
			
			if(arg1.length > 0) {
				for (k in arg1) {
				
					console.log(k+" Update Analyser");
			
					function passData(arg1, arg2, callback) {
						// Locks analyser update
						callback(null, arg1, arg2);
					}
			
					async.waterfall(
					[
						async.apply(passData, arg1[k], arg2),
						function(analyser, serverlist, callback){
							console.log("Redeploy Analser: "+analyser.analyserId);
					
							// Search server
							var s = undefined;
							for(i in serverlist) {
								if(serverlist[i].hostId == analyser.hostId) {
									s = serverlist[i];
									break;
								}
							}
											
							// Check status
							if(s != undefined) {
								request.get({url:'http://'+s.hostname+':'+s.hostport+''+flowEngine.path}, function(err, httpResponse, body){ 
									if(err || httpResponse.statusCode != 200) {
										callback(new Error('NODE_RED_COMMUNICATION_ERROR'));
									} else {
										// Parse flow status repsonse
										var resp = JSON.parse(body);
								
										var isActive = false;
										for(j in resp) {
											//console.log(resp[j].id+" == "+analyser.flowId);
											if(resp[j].id == analyser.flowId) {
												isActive = true;
											}
										}
									
										console.log("Check status");
										callback(null, analyser, s, isActive);
								
									}
								});
							} else {
								callback(new Error('SERVER_NOT_FOUND'));
							}
						},
						function(analyser, server, isActive, callback){
							if(isActive) {
								console.log("Delete old flow..");
								request.del({url:'http://'+server.hostname+':'+server.hostport+''+flowEngine.path+'/'+analyser.flowId}, function(err, httpResponse, body){ 
									if(err || httpResponse.statusCode != 200) {
										callback(new Error('NODE_RED_COMMUNICATION_ERROR'));
									} else {
										// Parse response from node red
										var resp2 = JSON.parse(body);
										if(resp2.status.toLowerCase() == 'ok') {
											callback(null, analyser, server);
										} else {
											callback(null, analyser, server);
											//callback(new Error('FLOW_DELETE_ERROR'));
										}
									}
								});
							} else {
								callback(null, analyser, server);
							}
						},
						function(analyser, server, callback){
																	
							connection.query('call analyserRulesListOneAll(?)', [analyser.analyserId], function(err, rows) {
						        if(err) {
									callback(err);
						        } else {
									var structure = [];
															
						            if (rows[0].length > 0){
						                var result = [];
						                for (var i = 0; i < rows[0].length; i++){
						                    var o  = rows[0][i];
									
											// Choose correct data type conversation.
											// Analyser template requires a correct data type
											// because it checks the given data model.
											var value = o.searchValue;
											if(!isNaN(value) && value != 'true' && value != 'false' && value != true && value != false) {
												// is number, check if it is float or int
												if(parseFloat(value) == parseInt(value, 10)) {
													// Int
													value = parseInt(value);
												} else {
													// Float
													value = parseFloat(value);
												}
										
											} else {
												// Value is a string, no transformation is required
												// Check if string is boolesch.
												if(value == 'true') {
													value = true;
												} else if(value == 'false') {
													value = false;
												} else if(value == 'null' && value !== false) {
													value = null;
												} else if(value == 'undefined') {
													value = undefined;
												}
											}
									
											// Timebased analyser does not have a field
											if(o.dataField == 'COMPLETE_TABLE') {
												structure.push({
													type: "node", 
													field: o.dataTable,
													exp: o.expression,
													value: value,
													range: o.rangeValue
												});
											} else {
												structure.push({
													type: "node", 
													field: o.dataTable+'.'+o.dataField,
													exp: o.expression,
													value: value,
													range: o.rangeValue
												});
											}
									
											// Operator is set, push operator to array
											if(o.operator != 'null' && o.operator != 'NULL') {
							                    structure.push({
													type: "operator", 
													op: o.operator
												});
											}
						                }
						            }
							
									if(structure.length > 0) {
										console.log("Build Rules");
										callback(null, analyser, server, structure);
									} else {
										callback(new Error('NO_ANALYSER_RULES_FOUND'));
									}								
						        }
							});
						},
						function(analyser, server, structure, callback){
							var aText = {};
							aText.structure = structure;
											
							//// Select Events
							var event = {
								type: analyser.eventFunction,
								parm: {}
							};
					
							//// Select Actions
							var action = {
								type: analyser.actionFunction,
								parm: {
									message: analyser.message
								}
							};
					
							//// Select Filter
							var filter = {
								field: undefined,
								value: undefined
							}
					
							aText.event = event;
							aText.action = action;
					
						    connection.query('call analyserFilterListOne(?)', [analyser.analyserId], function(err, rows) {
						        if(err) {
									callback(err);
						        } else {
						            if (rows[0].length > 0){
						                var result = [];
						                for (var i = 0; i < rows[0].length; i++){
						                    var o  = rows[0][i];
									
											var value = o.value;
											if(!isNaN(value) && value != 'true' && value != 'false' && value != true && value != false) {
												// is number, check if it is float or int
												if(parseFloat(value) == parseInt(value, 10)) {
													// Int
													value = parseInt(value);
												} else {
													// Float
													value = parseFloat(value);
												}
										
											} else {
												// Value is a string, no transformation is required
												// Check if string is boolesch.
												if(value == 'true') {
													value = true;
												} else if(value == 'false') {
													value = false;
												} else if(value == 'null' && value !== false) {
													value = null;
												} else if(value == 'undefined') {
													value = undefined;
												}
											}
									
						                    result.push({
												field: o.table+'.'+o.name, 
												value: value
											});
						                }
										if(result.length == 1) {
											filter = result[0];
										} else {
											filter = result;
										}
								
										aText.filter = filter;
						            }
									console.log("Build template");
									callback(null, analyser, server, structure, aText);
						        }
						    });
					
						},
						function(analyser, server, structure, aText, callback){
					
							// Analyser template to flow engine and deploy analyser flow
							request.post({url:'http://'+flowEngine.host+':'+flowEngine.port+''+flowEngine.path, json: aText}, function(err, httpResponse, body){ 
								if(err || httpResponse.statusCode != 200) {
									callback(new Error('NODE_RED_COMMUNICATION_ERROR'));
								} else if (!err && httpResponse.statusCode == 200) {
									// Analyser have been activated on node red
									if(body.status.toLowerCase() == 'ok') {
										callback(null, analyser, server, structure, aText, {flowId: body.ids.analyzerId, flowUrl: body.analyzerUrl, hostname: body.host});
									} else {
										callback(new Error('NODE_RED_FLOW_CREATION_ERROR'));
									}
								} else {
									callback(new Error('NODE_RED_FLOW_CREATION_ERROR'));
								}
							});
						},
						function(analyser, server, structure, aText, response, callback){

							// Update analyser with new host and flowids.
							console.log("AnalyserId: "+analyser.analyserId);
							console.log("FlowId: "+response.flowId);
							console.log("FlowUrl: "+response.flowUrl);
							console.log("FlowHost: "+response.hostname);
					
							connection.query('call analyserUpdate(?,?,?,?)',
		    					[analyser.analyserId, response.flowId, response.flowUrl, response.hostname], function(err, result) {
									if(err) {
										// er means that an error happened, and is probably bad.
										callback(err);
		        					} else {
										// Analyser updated
										// er means that an error happened, and is probably bad.
										callback(null);
		        					}
		    				});
						},
						function(callback) {
							callback(null);
						}
					],
					function (err) {
						if(!err) {
							callback(null);
						} else {
					    	callback(err);
					    }
					});
			
				}
			} else {
				callback(null);
			}
	    }
	], function (err) {
		if(err) {
			next(err);
		} else {
			res.loc = '/reDeployAll'
			res.modified = 1;
			next();
		}
	});
};

/**
 *  Post /reDeployAll
 *
 *  Steps:
 *  	1) Get DB Connection
 *  	2) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
 *  	3) create SQL Query from parameters
 *  	4) add links to result
 *  	5) send
 */
exports.reDeploy = function(req, res, next){
    var connection = req.con;
    // 3) create SQL Query from parameters
    // set base statement
	
	function passData1(id, callback) {
		// Locks analyser update
		callback(null, id);
	}
	
	async.waterfall(
		[
		async.apply(passData1, req.params.id),
	    function(id, callback){
			connection.query('call analyserListOne(?)', [id], function(err, rows) {
		        if(err) {
					callback(err);
		        } else {
					if(rows[0].length > 0) {
						callback(null, rows[0]);
					} else {
						res.loc = '/reDeploy'
						res.modified = 0;
						res.affectedRows = 0;
						next();
					}
				}		
			});
	    },
	    function(arg1, callback){
			connection.query('SELECT * FROM analyserHost_view', function(err, rows) {
		        if(err) {
					callback(err);
		        } else {
					callback(null, arg1, rows);
				}
			});
	    },
	    function(arg1, arg2, callback){

			for (k in arg1) {
			
				function passData2(arg1, arg2, callback) {
					// Locks analyser update
					callback(null, arg1, arg2);
				}
			
				async.waterfall(
				[
					async.apply(passData2, arg1[k], arg2),
					function(analyser, serverlist, callback){
						console.log("Redeploy Analser: "+analyser.analyserId);
					
						// Search server
						var s = undefined;
						for(i in serverlist) {
							if(serverlist[i].hostId == analyser.hostId) {
								s = serverlist[i];
								break;
							}
						}
											
						// Check status
						if(s != undefined) {
							request.get({url:'http://'+s.hostname+':'+s.hostport+''+flowEngine.path}, function(err, httpResponse, body){ 
								if(err || httpResponse.statusCode != 200) {
									callback(new Error('NODE_RED_COMMUNICATION_ERROR'));
								} else {
									// Parse flow status repsonse
									var resp = JSON.parse(body);
								
									var isActive = false;
									for(j in resp) {
										//console.log(resp[j].id+" == "+analyser.flowId);
										if(resp[j].id == analyser.flowId) {
											isActive = true;
										}
									}
								
									callback(null, analyser, s, isActive);
								
								}
							});
						} else {
							callback(new Error('SERVER_NOT_FOUND'));
						}
					},
					function(analyser, server, isActive, callback){
						if(isActive) {
							console.log("Delete old flow..");
							request.del({url:'http://'+server.hostname+':'+server.hostport+''+flowEngine.path+'/'+analyser.flowId}, function(err, httpResponse, body){ 
								if(err || httpResponse.statusCode != 200) {
									console.log(httpResponse);
									callback(new Error('NODE_RED_COMMUNICATION_ERROR'));
								} else {
									// Parse response from node red
									var resp2 = JSON.parse(body);
									if(resp2.status.toLowerCase() == 'ok') {
										console.log("Flow deleted..");
										callback(null, analyser, server);
									} else {
										//callback(null, analyser, server);
										callback(new Error('FLOW_DELETE_ERROR'));
									}
								}
							});
						} else {
							callback(null, analyser, server);
						}
					},
					function(analyser, server, callback){
																	
						connection.query('call analyserRulesListOneAll(?)', [analyser.analyserId], function(err, rows) {
					        if(err) {
								callback(err);
					        } else {
								var structure = [];
															
					            if (rows[0].length > 0){
					                var result = [];
					                for (var i = 0; i < rows[0].length; i++){
					                    var o  = rows[0][i];
									
										// Choose correct data type conversation.
										// Analyser template requires a correct data type
										// because it checks the given data model.
										var value = o.searchValue;
										if(!isNaN(value) && value != 'true' && value != 'false' && value != true && value != false) {
											// is number, check if it is float or int
											if(parseFloat(value) == parseInt(value, 10)) {
												// Int
												value = parseInt(value);
											} else {
												// Float
												value = parseFloat(value);
											}
										
										} else {
											// Value is a string, no transformation is required
											// Check if string is boolesch.
											if(value == 'true') {
												value = true;
											} else if(value == 'false') {
												value = false;
											} else if(value == 'null' && value !== false) {
												value = null;
											} else if(value == 'undefined') {
												value = undefined;
											}
										}
									
										// Timebased analyser does not have a field
										if(o.dataField == 'COMPLETE_TABLE') {
											structure.push({
												type: "node", 
												field: o.dataTable,
												exp: o.expression,
												value: value,
												range: o.rangeValue
											});
										} else {
											structure.push({
												type: "node", 
												field: o.dataTable+'.'+o.dataField,
												exp: o.expression,
												value: value,
												range: o.rangeValue
											});
										}
									
										// Operator is set, push operator to array
										if(o.operator != 'null' && o.operator != 'NULL') {
						                    structure.push({
												type: "operator", 
												op: o.operator
											});
										}
					                }
					            }
							
								if(structure.length > 0) {
									callback(null, analyser, server, structure);
								} else {
									callback(new Error('NO_ANALYSER_RULES_FOUND'));
								}								
					        }
						});
					},
					function(analyser, server, structure, callback){
						var aText = {};
						aText.structure = structure;
											
						//// Select Events
						var event = {
							type: analyser.eventFunction,
							parm: {}
						};
					
						//// Select Actions
						var action = {
							type: analyser.actionFunction,
							parm: {
								message: analyser.message
							}
						};
					
						//// Select Filter
						var filter = {
							field: undefined,
							value: undefined
						}
					
						aText.event = event;
						aText.action = action;
					
					    connection.query('call analyserFilterListOne(?)', [analyser.analyserId], function(err, rows) {
					        if(err) {
								callback(err);
					        } else {
					            if (rows[0].length > 0){
					                var result = [];
					                for (var i = 0; i < rows[0].length; i++){
					                    var o  = rows[0][i];
									
										var value = o.value;
										if(!isNaN(value) && value != 'true' && value != 'false' && value != true && value != false) {
											// is number, check if it is float or int
											if(parseFloat(value) == parseInt(value, 10)) {
												// Int
												value = parseInt(value);
											} else {
												// Float
												value = parseFloat(value);
											}
										
										} else {
											// Value is a string, no transformation is required
											// Check if string is boolesch.
											if(value == 'true') {
												value = true;
											} else if(value == 'false') {
												value = false;
											} else if(value == 'null' && value !== false) {
												value = null;
											} else if(value == 'undefined') {
												value = undefined;
											}
										}
									
					                    result.push({
											field: o.table+'.'+o.name, 
											value: value
										});
					                }
									if(result.length == 1) {
										filter = result[0];
									} else {
										filter = result;
									}
								
									aText.filter = filter;
					            }
								callback(null, analyser, server, structure, aText);
					        }
					    });
					
					},
					function(analyser, server, structure, aText, callback){
					
						// Analyser template to flow engine and deploy analyser flow
						request.post({url:'http://'+flowEngine.host+':'+flowEngine.port+''+flowEngine.path, json: aText}, function(err, httpResponse, body){ 
							if(err || httpResponse.statusCode != 200) {
								callback(new Error('NODE_RED_COMMUNICATION_ERROR'));
							} else if (!err && httpResponse.statusCode == 200) {
								// Analyser have been activated on node red
								if(body.status.toLowerCase() == 'ok') {
									callback(null, analyser, server, structure, aText, {flowId: body.ids.analyzerId, flowUrl: body.analyzerUrl, hostname: body.host});
								} else {
									callback(new Error('NODE_RED_FLOW_CREATION_ERROR'));
								}
							} else {
								callback(new Error('NODE_RED_FLOW_CREATION_ERROR'));
							}
						});
					},
					function(analyser, server, structure, aText, response, callback){

						// Update analyser with new host and flowids.
						console.log("AnalyserId: "+analyser.analyserId);
						console.log("FlowId: "+response.flowId);
						console.log("FlowUrl: "+response.flowUrl);
						console.log("FlowHost: "+response.hostname);
					
						connection.query('call analyserUpdate(?,?,?,?)',
	    					[analyser.analyserId, response.flowId, response.flowUrl, response.hostname], function(err, result) {
								if(err) {
									// er means that an error happened, and is probably bad.
									callback(err);
	        					} else {
									// Analyser updated
									// er means that an error happened, and is probably bad.
									callback(null);
	        					}
	    				});
					}
				],
				function (err) {
					// Test
					//callback(err);
					callback(err);
				});
			
			}
	    }
	], function (err) {
		if(err) {
			next(err);
		} else {
			res.loc = '/reDeploy'
			res.modified = 1;
			next();
		}
	});
};

var respMessages = commons.respMsg("AnalyserRedeployment");
exports.reDeployAllSpec = {
    summary : "Redeploy all Analysers of the logged-in User",
    notes: "This Function lists all Analysers for the current user. <br> <br><br>" +

    "<b>Pagination</b>: If you provide a page and a pageSize, the result is only the requested part of the list. If the value of page is too big, an empty list is returned. If you provide a Pagecount without Pagesize, Pagesize is 20. <br> " ,
    path : "/analyse/reDeployAnalyser",
    method: "POST",
    nickname : "reDeployAll",
    parameters : [],
    responseMessages : respMessages.add
};
exports.reDeploySpec = {
    summary : "Redeploy given analyser of the logged-in User",
    notes: "This Function lists all Analysers for the current user. <br> <br><br>" +

    "<b>Pagination</b>: If you provide a page and a pageSize, the result is only the requested part of the list. If the value of page is too big, an empty list is returned. If you provide a Pagecount without Pagesize, Pagesize is 20. <br> " ,
    path : "/analyse/reDeployAnalyser/{id}",
    method: "PUT",
    nickname : "reDeployAll",
    parameters : [swagger.pathParam("id", "Analyser to update", "string")],
    responseMessages : respMessages.update
};

exports.models = {
};