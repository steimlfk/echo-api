var bcrypt = require('bcryptjs');
var mysql = require('mysql');

var cfg = require('./config.js');


/**
 * Section about Database Users PW
 *
 * This prefix is used to create the password for the database user.
 * To create this password, the prefix is concatenated with the db userid.
 *
 * The Function calculate pw concatenates a given userid with the prefix
 * to "calculate" the correct pw in order to connect to the db as the given user.
 * It is used by every Webservice-Endpoint that connects to the db on the behalf
 * of a certain user.
 */
var prefix = cfg.db_pw_prefix;

exports.calculatePW = function(i){
    return prefix+i.toString();
}


/**
 * Section about Account PW
 *
 * This Functions are used to encrypt and compare the passwords of an account.
 * Used by OAuths create Token Function
 *
 * source: http://stackoverflow.com/questions/14015677/node-js-encryption-of-passwords
 */
exports.cryptPassword = function(password, callback) {
    bcrypt.genSalt(10, function(err, salt) {
        if (err)
            return callback(err);

        bcrypt.hash(password, salt, function(err, hash) {
            return callback(err, hash);
        });

    });
};

exports.comparePassword = function(password, hash, callback) {
    bcrypt.compare(password, hash, function(err, isPasswordMatch) {
        if (err)
            return callback(err);
        return callback(null, isPasswordMatch);
    });
};

exports.cryptPasswordSync = function(password){
    var salt = bcrypt.genSaltSync(10);
    var pwd = bcrypt.hashSync(password, salt);
    return pwd;
};

/**
 * Section Database
 */

var db = mysql.createPool({
    host : cfg.db.host,
    user : 'echo_db_usr',
    port : cfg.db.port,
    password : cfg.db.pwd,
    database : cfg.db.database,
    // timezone set to UTC+0 instead of local since local leads to incorrect displayed birthdays
    // since mysql Triggers use the now()-Function of MySQL the timezone may have to be adepted if the MySQL Server runs in
    // a different timezone than the backed...
    timezone : 'UTC+0'
});

exports.db = db;


/**
 * Return a unique identifier with the given `len`.
 *
 *     utils.uid(10);
 *     // => "FDaS435D2z"
 *
 * @param {Number} len
 * @return {String}
 */
exports.uid = function(len) {
    var buf = []
        , chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        , charlen = chars.length;

    for (var i = 0; i < len; ++i) {
        buf.push(chars[getRandomInt(0, charlen - 1)]);
    }

    return buf.join('');
};

/**
 * Return a random int, used by `utils.uid()`
 *
 * @param {Number} min
 * @param {Number} max
 * @return {Number}
 */

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}



var _getAllFilesFromFolder = function(dir) {

    var filesystem = require("fs");
    var results = [];

    filesystem.readdirSync(dir).forEach(function(file) {

        file = dir+'/'+file;
        var stat = filesystem.statSync(file);

        if (stat && stat.isDirectory() && file.indexOf('not_needed') == -1) {
            results = results.concat(_getAllFilesFromFolder(file))
        } else results.push(file);

    });

    return results;

};
exports.getFilesFromDir = _getAllFilesFromFolder;

exports.toTitleCase = function(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}