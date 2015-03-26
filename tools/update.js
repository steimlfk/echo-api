var exec = require('child_process').exec;
var fs = require('fs');

exec('git pull', function(err, stdout, stderr) {
    if (err || stderr) {
        console.log('ERROR: ' + (err || stderr))
    } else {
        var db = require('../config/mysql.js').db;
        exec('mysql echo -u ' + db.config.connectionConfig.user + ' -p' + db.config.connectionConfig.password + " -e \"CALL dropAllDbUsers(); DROP USER 'echo_db_usr'@'localhost'; FLUSH PRIVILEGES;\"",
                function (err, stdout, stderr) {
            if (err || stderr) console.log('ERROR: ' + (err || stderr));
            else {
                exec('mysql -u ' + db.config.connectionConfig.user + ' -p' + db.config.connectionConfig.password + ' < ../database/create.sql', function (e, sout, serr) {
                    if (e || serr) console.log('ERROR: ' + (e || serr));
                    else {
                        var pwPrefix = require('../config/config.js').db_pw_prefix;
                        var script = fs.readFileSync('./rebuild.sql', {encoding: 'utf8'});
                        script = script.replace('##%%prefix%%##', pwPrefix);
                        var users = require('./passwords.js');
                        for (var i = 0; i < 3; i++) {
                            script = script.replace('##%%user' + (i+1) + '%%##', users[i].username).replace('##%%pw' + (i+1) + '%%##', users[i].password)
                        }
                        console.log(script)
                        exec('mysql -u ' + db.config.connectionConfig.user + ' -p' + db.config.connectionConfig.password + " echo -e '" + script + "'", function (error, standOut, standErr) {
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
    }
});