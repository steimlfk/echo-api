var exec = require('child_process').exec;
exec('git pull', function(err, stdout, stderr) {
    if (err || stderr) {
        console.log('ERROR: ' + (err || stderr))
    } else {
        var db = require('../config/mysql.js').db;
        exec('mysql echo -u ' + db.config.connectionConfig.user + ' -p' + db.config.connectionConfig.password + " -e \"CALL dropAllDbUsers(); DROP USER 'echo_db_usr'@'localhost';\"",
                function (err, stdout, stderr) {
            if (err || stderr) console.log('ERROR: ' + (err || stderr));
            else {
                exec('mysql -u ' + db.config.connectionConfig.user + ' -p' + db.config.connectionConfig.password + ' < ../database/create.sql', function (e, sout, serr) {
                    if (e || serr) console.log('ERROR: ' + (e || serr));
                    else {
                        exec('mysql -u ' + db.config.connectionConfig.user + ' -p' + db.config.connectionConfig.password + ' < \'CALL rebuildDb();\'', function (error, standOut, standErr) {
                            if (error || standErr) {
                                console.log('ERROR: ' + (error || standErr));
                            }
                            else {
                                console.log(new Date().format('D Y-m-d: ') + 'DB successfully updated');
                                process.exit();
                            }
                        });
                    }
                });
            }
        });
    }
});