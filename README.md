# dynamodb-csv-export

A simple tool to export the content of a DynamoDB table into CSV (comman-separated values) file or describe the table.

## Pre-Requisites
Make sure you have the following installed:
* Node
* AWS SDK

Use the following command to install dependencies from 'package.json'
```bash
npm install
```

## Usage
> To *describe* the table, run the following command

```bash
node dynamodb-dump.js -d -t <table_name>
```

> To *export* the contents, run the following command
```bash
node dynamodb-dump.js -t <table_name> -f <filename>
```
