exports.errorHandler = function (err, req, res, next) {
    if (err) {
        // Error Handling
        console.error('Error on ' + req.method + ' ' + req.url + ': ', err);

        /*
         *  DB ERRORS
         */
        // Error Handling for duplicate values
        if (err.code === 'ER_DUP_ENTRY') {
            res.statusCode = 400;
            res.send({error: err.message});
        }
        // Error handling for values which must not be null
        else if (err.code == 'ER_BAD_NULL_ERROR'){
            res.statusCode = 400;
            res.send({error: err.message});
        }
        // Error Handling for sql signal statements for the triggers
        else if (err.code === 'ER_SIGNAL_EXCEPTION') {
            // 22403 is equiv. to HTTP Error Code 403: Forbidden
            if (err.sqlState == '22403'){
                res.statusCode = 403;
                res.send({error: err.message});
            }
            // If Code is 22400 or something else
            // 22400 is equiv. to HTTP Error Code 400: Bad Request (has errors, should be altered and resend)
            else {
                res.statusCode = 400;
                res.send({error: err.message});
            }
        }

        /*
         *  LOGIN ERROR
         */
        else if (err.name == 'TokenError'){
            res.statusCode = 401;
            res.send({error: 'Invalid Credentials'});
        }


        /*
         *  INVALID JSON ERROR
         */
        else if (err.name == 'SyntaxError'){
            res.statusCode = 400;
            res.send({error: 'Invalid JSON'});
        }

        /*
         *  ANY OTHER ERRORS
         */
        else {
            res.statusCode = 500;
            res.send({err: 'Internal Server Error'});
        }
    }
    // shouldnt happen!
    else {
        res.statusCode = 500;
        res.send({err: 'Internal Server Error. Please Contact the Admin!'});
    }
};