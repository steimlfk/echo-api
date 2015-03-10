/**
 * Controller: Devices
 *
 * Contains Methods to POST and DELETE to /accounts/id/devices (add and remove)
 *
 * Contains swagger specs and models
 *
 */

var swagger = require('swagger-node-express');

/**
 *  POST /accounts/id/devices
 *  Steps:
 *  	1) Get DB Connection
 *  	2) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
 *  	3) create SQL Query from parameters
 *  	4) send
 */
exports.add = function(req,res,next){
    var connection = req.con;
    // 3) create SQL Query from parameters
    // ? from query will be replaced by values in [] - including escaping!
    connection.query('CALL deviceAdd(?)' , [req.body.deviceId], function(err) {
        if (err) {
            next(err);
        } else {
            // 4)
            res.statusCode = 201;
            res.location('/devices/' + req.body.deviceId);
            res.send();
        }
        connection.release();
    });
};

/**
 *  DELETE /accounts/id/devices
 *  Steps:
 *  	1) Get DB Connection
 *  	2) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
 *  	3) create and execute SQL Query from parameters
 *  	4) send
 */
exports.del =   function(req,res,next){
    var connection = req.con;
    // 3) create and execute SQL Query from parameters,
    // ? from query will be replaced by values in [] - including escaping!
    connection.query('CALL deviceRemove(?)', [req.params.deviceId], function(err, result) {
        if (err){
            // An error occured
            next(err);
        }
        else {
            // 4) Device was removed -> send
            if (result[0][0].affected_rows > 0){
                res.statusCode = 204;
                res.send();
            }
            else {
                // Device wasnt removed since it doesnt exist
                res.statusCode = 404;
                res.send();
            }
        }
        connection.release();
    });
};


exports.addSpec = {
    summary : "Adds a DeviceId for Push Notifications (Roles: all)",
    path : "/devices",
    notes: "This Function adds a new DeviceId for the current User. The DeviceID is used to send Push Notifications from the Backend<br>This function passes its parameters to the SP deviceAdd <br><br>" +
    "<b>Possible Results</b>: <br>" +
    " <b>200</b>  DeviceId was added <br>" +
    " <b>400</b>  The provided data contains errors, e.g. DeviceId is already in use <br>" +
    " <b>500</b> Internal Server Error",
    method: "POST",
    nickname : "addDevice",
    parameters : [swagger.bodyParam("Device", "new Device", "Device")]

};

exports.delSpec = {
    summary : "Deletes a DeviceId for Push Notifications (Roles: all)",
    notes: "This Function removes a DeviceID from the current Users Account. After removing no more Push Notifications will be send to that device. <br>This function passes its parameters to the SP deviceRemove <br><br>" +
    "<b>Possible Results</b>: <br>" +
    " <b>204</b>  Device was removed. <br>" +
    " <b>404</b>  Device is not known. <br>" +
    " <b>500</b> Internal Server Error",
    path : "/devices/{deviceId}",
    method: "DELETE",
    nickname : "delAccount",
    parameters : [swagger.pathParam("deviceId", "Device to delete", "string")]

};

exports.models = {
    "Device":{
        "id": "Device",
        "required":["deviceId"],
        "properties":{
            "deviceId": {
                "type":"string",
                "description": "DeviceID"
            }
        }
    }
};