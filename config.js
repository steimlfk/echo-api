/**
 * Config File for ECHO Backend
 * Created by steimlfk on 10.03.15.
 */

/**
 *  Host and Port Config
 */

var host = 'localhost';
var port = 3000;
var url_port = 3000;

/**
 * Section about Database Users PW
 *
 * This prefix is used to create the password for the database user.
 * To create this password, the prefix is concatenated with the db userid.
 *
 */
var prefix = "secret_";

/**
 * Section Token Security
 *
 * The provided secret is used to sign the tokens
 */

var tokensecret = "14m4v3rY5p3c1aL53cr37";

/**
 * Section Database Config
 *
 */

var db = {
    host : 'localhost',
    user : 'echo_db_usr',  //dont change this!!
    port : 3306,
    pwd : '123abc456',
    database : 'echo'
};

/**
 * Section SSL
 *
 */

var ssl = {
    useSsl: false,
    password: "",
    privateKey: "",
    certificate: ""
};

exports.host = host;
exports.port = port;
exports.url_port = url_port;
exports.db_pw_prefix = prefix;
exports.tokensecret = tokensecret;
exports.db = db;
exports.ssl = ssl;
