'use strict';

var pkg = require('./package.json');

var Promise = require('bluebird');
var program = require('commander');

var csv = require('fast-csv');
var json2csv = require('json2csv');

var AWS = require('aws-sdk');
AWS.config.loadFromPath('./config.json');
var DynamoDb = new AWS.DynamoDB();
var unmarshalItem = require('dynamodb-marshaler').unmarshalItem;

var dynamoTblDescribe = Promise.promisify(DynamoDb.describeTable, { context: DynamoDb });
var dynamoTblScan = Promise.promisify(DynamoDb.scan, { context: DynamoDb });
var writeFile = Promise.promisify(require('fs').writeFile);

var log = require('./log');

program.version(pkg.version)
    .option('-t, --table [tableName]', 'Table to be exported to CSV format')
    .option('-d, --describe', 'Describe DynamoDb table')
    .option('-f, --file [File]', 'File to dump the data to')
    .parse(process.argv);

/*
Displays information about the specified table
*/
var describeTable = function() {
    log.info('Processing describe table request...');

    var params = {
        TableName: program.table
    };

    dynamoTblDescribe(params)
        .then(function _success(data) {
            if (data && data.Table) {
                console.dir(data.Table);
                log.info("Completed processing describe table request...\n\n");
            } else {
                log.info("Failed to retrieve table description\n\n");
            }
        })
        .catch(function _error(error) {
            log.error(error);
            log.error("Completed processing describe table request...\n\n");
        });
}

/*
Exports specified table date to specified file
*/
var exportDynamoDbDataToCSV = function() {
    log.info('\nProcessing export to CSV format request...');

    var query = {
        "TableName": program.table,
        "Limit": 50
    };

    return getItems(query)
        .then(function _data(data) {
            return writeToFile(data);
        })
        .then(function _success() {
            log.info("Completed processing table export to CSV format request...\n");
        })
        .catch(function _error(error) {
            log.error(error);
        });
}

/*
Recursively retrieves all data from table
@param query the query to retrieve the data
@param results the items from Dynamodb table
*/
var getItems = function(query, results) {
    return new Promise(function _getItems(resolve, reject) {
        dynamoTblScan(query)
            .then(function _scan(data) {
                if (data && data.Items) {
                    var unmarshalItems = data && data.Items && data.Items.map(unmarshalItem);
                    var items = (results || []).concat(unmarshalItems);

                    log.info("Successfully processed " + items.length);

                    if (data.LastEvaluatedKey) {
                        query.ExclusiveStartKey = data.LastEvaluatedKey;
                        return getItems(query , items)
                            .then(resolve)
                            .catch(reject);
                    } else {
                        resolve(items);
                    }
                } else {
                    resolve(results);
                }
            })
            .catch(function _error(error) {
                reject(error);
            });
    });
}

/*
Writes to specified file aftering converting json items to csv format
*/
function writeToFile(results) {
    var result = json2csv({ data: results });

    return writeFile(program.file, result);
}

// Make sure the required options are specified
if (!program.table) {
    log.info('Please specify DynamoDb table');

    program.outputHelp();
    process.exit(1);
}

// if describe option is specified don't export the data to the file
// and instead only describe the table
if (program.describe) {
    describeTable();
} else {
    if (!program.file) {
        log.info('Please specify File to export the data to');

        program.outputHelp();
        process.exit(1);
    }
    exportDynamoDbDataToCSV();
}
