var exec = require('child_process').exec;
var fs = require('fs');

var user = process.argv[2];
var pw = process.argv[3];
exec('mysql echo -u ' + user + ' -p' + pw + " -e \"CALL dropAllDbUsers(); DROP USER 'echo_db_usr'@'localhost'; FLUSH PRIVILEGES;\"",
    function (err, stdout, stderr) {
        if (err || stderr) console.log('ERROR: ' + (err || stderr));
        else {
            exec('mysql -u ' + user + ' -p' + pw + ' < ../database/create.sql', function (e, sout, serr) {
                if (e || serr) console.log('ERROR: ' + (e || serr));
                else {
                    var pwPrefix = require('../config.js').db_pw_prefix;
                    var script = fs.readFileSync('./rebuild.sql', {encoding: 'utf8'});
                    script = script.replace('##%%prefix%%##', pwPrefix);
                    var users = require('./passwords.js');
                    for (var i = 0; i < 3; i++) {
                        script = script.replace('##%%user' + (i+1) + '%%##', users[i].username).replace('##%%pw' + (i+1) + '%%##', users[i].password)
                    }
                    exec('mysql -u ' + user + ' -p' + pw + " echo -e '" + script + "'", function (error, standOut, standErr) {
                        if (error || standErr) {
                            console.log('ERROR: ' + (error || standErr));
                        }
                        else {
                            console.log('DB successfully updated');
                            process.exit();
                        }
                    });
                }
            });
        }
    });