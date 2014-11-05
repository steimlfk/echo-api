/**
 * Mysql Config
 */
var mysql = require('mysql');

//192.168.209.198
//openstack

var db_host = 'localhost';
var db_user = 'root';
var db_port = 3306;
var db_pwd = 'root';
var db_database ='echo';
var state = 'openstack'
	
//	local
if (process.env.NODE_ENV == 'eclipse'){
	state = 'dev';
	db_user = 'root';
	db_pwd = '';
}

//bluemix
if (process.env.VCAP_SERVICES) {
	var services = JSON.parse(process.env.VCAP_SERVICES);

	// look for a service starting with 'mysql'
	for (var svcName in services) {
		if (svcName.match(/^mysql/)) {
			var mysqlCreds = services[svcName][0]['credentials'];
			db_host = mysqlCreds.host;
			db_port = mysqlCreds.port;
			db_user = mysqlCreds.user;
			db_pwd = mysqlCreds.password;
			db_database = mysqlCreds.name;
			state = 'bluemix';
		}
	}
}
var db = mysql.createPool({
	host : db_host,
	user : db_user,
	port : db_port,
	password : db_pwd,
	database : db_database
});
exports.db = db;
exports.state = state;
