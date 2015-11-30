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
    connection.query('CALL deviceAdd(?)' , [req.body.deviceId], function(err, result) {
        connection.release();
        if (err) next(err);
        else {
            res.loc = '/devices/' + req.body.deviceId;
            res.modified = result[0][0].modified;
            next();
        }
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
        connection.release();
        if (err) next(err);
        else {
            res.affectedRows = result[0][0].affected_rows > 0;
            next();
        }
    });
};


exports.addSpec = {
    summary : "Adds a DeviceId for Push Notifications (Roles: all)",
    path : "/devices",
    notes: "This Function adds a new DeviceId for the current User. The DeviceID is used to send Push Notifications from the Backend<br>This function passes its parameters to the SP deviceAdd <br><br>",
    method: "POST",
    nickname : "addDevice",
    parameters : [swagger.bodyParam("Device", "new Device", "Device")],
    responseMessages: [
        {
            code: 201,
            message: "DeviceId registered. URL in location header"
        },
        {
            code: 400,
            message: "The provided data contains errors, e.g. DeviceId is already in use ",
            responseModel : "ErrorMsg"
        },
        {
            code: 500,
            message: "Internal Server Error",
            responseModel : "ErrorMsg"
        }
    ]

};

exports.delSpec = {
    summary : "Deletes a DeviceId for Push Notifications (Roles: all)",
    notes: "This Function removes a DeviceID from the current Users Account. After removing no more Push Notifications will be send to that device. <br>This function passes its parameters to the SP deviceRemove <br><br>",
    path : "/devices/{deviceId}",
    method: "DELETE",
    nickname : "delAccount",
    parameters : [swagger.pathParam("deviceId", "Device to delete", "string")],
    responseMessages : [
        {
            code: 204,
            message: "DeviceId was deleted"
        },
        {
            code: 404,
            message: "Device not knows.",
            responseModel : "ErrorMsg"
        },
        {
            code: 500,
            message: "Internal Server Error",
            responseModel : "ErrorMsg"
        }
    ]

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