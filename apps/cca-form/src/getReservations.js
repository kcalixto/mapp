const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, TABLE_NAME } = require('./db');

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
};

const respond = (statusCode, body) => ({
  statusCode,
  headers,
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return respond(200, {});
  }

  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': 'RESERVATION',
      },
    })
  );

  const reservations = (result.Items || []).map((item) => ({
    name: item.name,
    date: item.date,
    createdAt: item.createdAt,
  }));

  return respond(200, reservations);
};
