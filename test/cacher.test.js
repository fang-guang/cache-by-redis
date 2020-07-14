const test = require('ava');
// const _ = require('lodash');
const Redis = require('ioredis');

const Cacher = require('../src/cache');


test.beforeEach(async () => {
  const client = new Redis();
  // flushall方法，清空整个 Redis 服务器的数据
  await client.flushall();
});

test.after(async () => {
  const client = new Redis();
  await client.flushall();
});

const getShopes = (type) => {
  let result;
  switch (type) {
    case 1:
      result = Promise.reject(new Error('bad params'));
      break;
    case 2:
      result = Promise.resolve(undefined);
      break;
    case 3:
      result = Promise.resolve(
        {
          obj1: ['shop01', 'shop02', 1, 2],
          obj2: 2,
        },
      );
      break;
    default:
      result = Promise.resolve('sucessful');
  }
  return result;
};

test('cache: should support deafeat and return sucessful', async (t) => {
  const cacher = new Cacher();
  const payload = {
    key: 'getShopes',
    executor: getShopes.bind(null, 0),
  };
  const data = await cacher.get(payload);
  t.is(data, 'sucessful');
});

test('cache: should support redis config and return sucessful', async (t) => {
  const opt1 = {
    redis: {
      db: '12',
    },
    prefix: 'testCache_',
    expire: 100,
  };
  const CacherP = new Cacher(opt1);
  const RedisP = new Redis(opt1.redis);
  const payload = {
    key: 'getShopes',
    executor: getShopes.bind(null, 0),
  };
  await CacherP.get(payload);
  const expireP = await RedisP.ttl(`testCache_${payload.key}`);
  t.true(Number(expireP) >= 5);
});

test('cache: suppose complex object', async (t) => {
  const CacherP = new Cacher();
  const RedisP = new Redis({ db: '12' });
  const payload = {
    key: 'getShopes',
    executor: getShopes.bind(null, 3),
  };
  await CacherP.get(payload);
  const data1 = await RedisP.get(`cache_${payload.key}`);
  const jsObject = JSON.parse(data1);
  t.is(jsObject.obj1[0], 'shop01');
  t.is(jsObject.obj2, 2);
});

test('cache: not cache when executor reject err.message', async (t) => {
  const CacherP = new Cacher();
  const RedisP = new Redis({ db: '12' });
  const payload = {
    key: 'getShopes',
    executor: getShopes.bind(null, 1),
  };
  try {
    const data = await CacherP.get(payload);
    t.is(data.message, 'bad params');
  } catch (err) {
    const data1 = await RedisP.get(`cache_${payload.key}`);
    t.is(data1, null);
  }
});

test('cache: use default expire when expire is less than 0', async (t) => {
  const CacherP = new Cacher();
  const RedisP = new Redis({ db: '12' });
  const payload = {
    key: 'getShopes',
    executor: getShopes.bind(null, 0),
    expire: -1,
  };
  const data = await CacherP.get(payload);
  t.is(data, 'sucessful');
  const ttl = await RedisP.ttl(`cache_${payload.key}`);
  return t.true(ttl > 0 && ttl <= 5);
});

test('cache: not cache when return an undefined by executor function', async (t) => {
  const CacherP = new Cacher();
  const RedisP = new Redis({ db: '12' });
  const payload = {
    key: 'getShopes',
    executor: getShopes.bind(null, 2),
  };
  const data = await CacherP.get(payload);
  t.is(data, undefined);
  const data1 = await RedisP.get(`cache_${payload.key}`);
  return t.is(data1, null);
});

test('cache: suppose remove the key in redis', async (t) => {
  const CacherP = new Cacher();
  const RedisP = new Redis({ db: '12' });
  const payload = {
    key: 'getShopes',
    executor: getShopes.bind(null, 3),
  };
  const data = await CacherP.get(payload);
  t.is(data.obj2, 2);
  CacherP.delete(payload.key);
  const data1 = await RedisP.get(`cache_${payload.key}`);
  return t.is(data1, null);
});
