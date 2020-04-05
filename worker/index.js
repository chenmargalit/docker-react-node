const keys = require('./keys');
const redis = require('redis');

const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  // if u loose connection, try to reconnect every 1 second
  retry_strategy: () => 1000
});

const sub = redisClient.duplicate();

function fib(index) {
  if (index < 2) return 1;
  return fib(index - 1) + fib(index - 2);
}

sub.on('message', (channel, message) => {
  // hash with keys as index (message) and calculated fib number
  redisClient.hset('values', message, fib(parseInt(message)));
});

// activate anytime someone tries to insert a new value to redis.
sub.subscribe('insert');
