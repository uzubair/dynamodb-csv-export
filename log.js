'use strict';

var winston = require('winston');

var logger = new (winston.Logger) ({
    transports: [
        new (winston.transports.Console)({ json: false, timestamp: true }),
        new winston.transports.File({ filename: __dirname + '/dynamodb-csv-export.log', json: true })
    ],
    exceptionHandlers: [
        new (winston.transports.Console)({ json: false, timestamp: true }),
        new winston.transports.File({ filename: __dirname + '/dynamodb-csv-export-exceptions.log', json: true })
    ],
    exitOnError: false
});

module.exports = logger;
