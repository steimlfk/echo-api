/**
 * Redis Config
 *
 */

var port = 6379;
var host = '127.0.0.1';
var pwd = 's3cur3';

var redis = require("redis"),
redis_db = redis.createClient(port, host);

var dbAuth = function() { redis_db.auth(pwd); }
redis_db.addListener('connected', dbAuth);
redis_db.addListener('reconnected', dbAuth);
dbAuth();

redis_db.on("error", function (err) {
	console.log("Redis " + err);
});

exports.redis = redis_db;