const keys = require('./keys');

// Express App Setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Postgres Client Setup
const { Pool } = require('pg');
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort
});
pgClient.on('error', () => console.log('Lost PG connection'));

pgClient
  .query('CREATE TABLE IF NOT EXISTS values (number INT)')
  .catch(err => console.log(err));

// Redis Client Setup
const redis = require('redis');
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000
});
const redisPublisher = redisClient.duplicate();

// Express route handlers

app.get('/', (req, res) => {
  res.send('Hi');
});

app.get('/values/all', async (req, res) => {
  const values = await pgClient.query('SELECT * from values');

  res.send(values.rows);
});

app.get('/values/current', async (req, res) => {
  redisClient.hgetall('values', (err, values) => {
    res.send(values);
  });
});

app.post('/values', async (req, res) => {
  console.log('reached values');
  const index = req.body.index;

  if (parseInt(index) > 40) {
    return res.status(422).send('Index too high');
  }

  redisClient.hset('values', index, 'Nothing yet!');
  redisPublisher.publish('insert', index);
  pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);

  res.send({ working: true });
});

app.listen(5000, err => {
  console.log('Listening');
});

// const keys = require('./keys');

// const redis = require('redis');

// const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');

// const app = express();
// app.use(cors());
// app.use(bodyParser.json());

// // Postgres
// const { Pool } = require('pg');
// const pgClient = new Pool({
//   user: keys.pgUser,
//   host: keys.pgHost,
//   database: keys.pgDatabase,
//   password: keys.pgPassword,
//   port: keys.pgPort
// });

// pgClient.on('error', () => console.log('Lost PG connection'));

// pgClient
//   .query('CREATE TABLE IF NOT EXISTS values (number INT)')
//   .catch(err => console.log(err));

// // redis client setup
// const redisClient = redis.createClient({
//   host: keys.redisHost,
//   port: keys.redisPort,
//   retry_strategy: () => 1000
// });
// // we need to duplicate the connection as the previous connection can only do one job, which is to connect.
// const redisPublisher = redisClient.duplicate();

// // routes
// app.get('/', (req, res) => {
//   res.send('Hi');
// });

// app.get('/values/all', async (req, res) => {
//   const values = await pgClient.query('SELECT * FROM values');
//   // rows is the part with the relevant data, without the meta data
//   res.send(values.rows);
// });

// app.get('/values/current', async (req, res) => {
//   // this is an async function but unfortunatley redis does not support promises, so we have to use this callback form rather than async await
//   redisClient.hgetall('values', (err, values) => {
//     res.send(values);
//   });
// });

// app.post('/values/input', async (req, res) => {
//   const index = req.body.index;
//   if (parseInt(index) > 40) {
//     return res.status(422).send('Index too high');
//   }
//   // in the values table or what ever, put a key of index and a value of Nothing yet
//   redisClient.hset('values', index, 'Nothing yet');
//   redisPublisher.publish('insert', index);
//   pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);
//   res.send({ working: true });
// });

// app.listen(5000, err => console.log('listening on port 5000'));
