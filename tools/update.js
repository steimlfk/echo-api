var exec = require('child_process').exec;
var fs = require('fs');
var async = require('async');

var user = process.argv[2];
var pw = process.argv[3];
var backup = process.argv[4] || 'none';
var use_external = true;
if (!fs.existsSync(backup)) {
    use_external = false;
}

exec('mysql echo -u ' + user + ' -p' + pw + " -e \"CALL dropAllDbUsers(); DROP USER 'echo_db_usr'@'localhost'; FLUSH PRIVILEGES;\"",
    function (err, stdout, stderr) {
        var fatal = false;
        if (err || stderr) {
            fatal = true;
            if (stderr.indexOf('insecure') > -1 && !err) fatal = false;
            else console.log('ERROR: ' + (err || stderr));
        }
        if (!fatal) {
            exec('mysql -u ' + user + ' -p' + pw + ' < ../database/create.sql', function (e, sout, serr) {
                // Perform operation on file here.
                console.log('Processed file create.sql');
                var fatal1 = false;
                if (e || serr) {
                    fatal1 = true;
                    if (serr.indexOf('insecure')  > -1  && !err) fatal1 = false;
                    else console.log('ERROR: ' + (e || serr));
                }
                if (!fatal1) {
                    if (!use_external) {
                        async.series([
                            function (cb){
                                async.each(['../database/settings.sql', '../database/questions.sql', '../database/initial.sql'], function(file, callback) {
                                    // Perform operation on file here.
                                    console.log('Processing file ' + file);
                                    exec('mysql -u ' + user + ' -p' + pw + ' echo < '+ file, function (error, standOut, standErr) {
                                        var fatal2 = false;
                                        if (error || standErr) {
                                            fatal2 = true;
                                            if (standErr.indexOf('insecure') > -1 && !error) fatal2 = false;
                                        }
                                        if (!fatal2) callback();
                                        else callback(new Error(error || standErr))
                                    });
                                }, function(err){
                                    if( err ) {
                                        cb(err)
                                    } else {
                                        cb();
                                    }
                                });
                            },
                            function (cb){
                                var pwPrefix = require('../config.js').db_pw_prefix;
                                var script = fs.readFileSync('./rebuild.sql', {encoding: 'utf8'});
                                script = script.replace('##%%prefix%%##', pwPrefix);
                                var users = require('./passwords.js');
                                for (var i = 0; i < 3; i++) {
                                    script = script.replace('##%%user' + (i + 1) + '%%##', users[i].username).replace('##%%pw' + (i + 1) + '%%##', users[i].password)
                                }
                                exec('mysql -u ' + user + ' -p' + pw + " echo -e '" + script + "'", function (error, standOut, standErr) {
                                    console.log('Processing file rebuild.sql');
                                    var fatal2 = false;
                                    if (error || standErr) {
                                        fatal2 = true;
                                        if (standErr.indexOf('insecure') > -1 && !error) fatal2 = false;
                                    }
                                    if (!fatal2) cb();
                                    else cb(new Error((error || standErr)))
                                });
                            }

                        ], function (err){
                            process.exit();
                        });
                    }
                    else {
                        var script = fs.readFileSync(backup, {encoding: 'utf8'});

                        exec('mysql -u ' + user + ' -p' + pw + ' echo < '+ backup, function (error, standOut, standErr) {
                            var fatal2 = false;
                            if (error || standErr) {
                                fatal2 = true;
                                if (standErr.indexOf('insecure') > -1 && !error) fatal2 = false;
                                else console.log('ERROR: ' + (error || standErr));
                            }
                            if (!fatal2) {
                                console.log('DB successfully updated using an external script');
                            }
                            process.exit();
                        });
                    }
                }
            });
        }
    });


