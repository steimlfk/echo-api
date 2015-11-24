module.exports = {
    url : 'http://localhost:3000',
    admin_username : 'nimda',
    admin_pwd : 'nimda',
    alertPercentage : 0.2,
    runOptions : {
        limit: 50,         // concurrent connections
        iterations: 10,  // number of iterations to perform
        prealloc: 100      // only preallocate up to 100 before starting
    }
};