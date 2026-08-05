const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, TABLE_NAME } = require('./db');
const crypto = require('crypto');

const MIN_DAYS_AHEAD = 2;

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
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

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return respond(400, { error: 'Corpo da requisição inválido.' });
  }

  const { name, date, disclaimerAccepted } = body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return respond(400, { error: 'Nome do responsável é obrigatório.' });
  }

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return respond(400, { error: 'Data inválida.' });
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const minDate = new Date(today);
  minDate.setUTCDate(minDate.getUTCDate() + MIN_DAYS_AHEAD);

  const requestedDate = new Date(date + 'T00:00:00Z');
  if (requestedDate < minDate) {
    return respond(400, {
      error: `A data deve ser com pelo menos ${MIN_DAYS_AHEAD} dias de antecedência.`,
    });
  }

  if (disclaimerAccepted !== true) {
    return respond(400, { error: 'É necessário aceitar os termos para concluir a reserva.' });
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const trimmedName = name.trim();

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: 'RESERVATION',
        SK: `DATE#${date}#${id}`,
        name: trimmedName,
        date,
        disclaimerAccepted: true,
        createdAt,
      },
    })
  );

  return respond(201, { id, name: trimmedName, date });
};
