# cache-redis-fg

A simple interface cacher based on ioredis.

# Getting Start

## NPM

Installation

```shell
npm i -S cache-redis-fg
```

## Usage

### Table of Contents

-   [get](#get)
-   [delete](#delete)

## constructor

**Parameters**
__1. 参数opt, redis配置__ 
  * @param {object} opt  数据库配置
  * @param {number} opt.prefix 设置缓存的前缀
  * @param {number} opt.expire 设置的失效时间, 单位s
  * @param {object} opt.reids redis配置
  * @param {String} opt.reids.host redis host配置
  * @param {String} opt.reids.port redis port配置
  * @param {String} opt.reids.db redis 存储db配置
        new Cacher(opt);

__2. 参数payload, 缓存参数__ 
  * @param {object} payload
  * @param {string} payload.key 要查找的key
  * @param {number} payload.expire 失效时间, 单位s
  * @param {function} payload.executor 如果未击中，要执行的

  返回
  * @return {Promise.<Object>} 缓存中数据(击中) 或executor返回数据(未击中)

## Usage

### get

#### example that result of Promise instance
```
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
```
#### support deafeat cache in redis 12
```
const cacher = new Cacher();
  const payload = {
    key: 'getShopes',
    executor: getShopes.bind(null, 0),
  };
await cacher.get(payload);
```
#### support redis config
```
const opt1 = {
    redis: {
      db: '12',
    },
    prefix: 'testCache_',
    expire: 100,
  };
const CacherP = new Cacher(opt1);
  const payload = {
    key: 'getShopes',
    executor: getShopes.bind(null, 0),
  };
await CacherP.get(payload);
```
#### suppose complex object
```
  const CacherP = new Cacher();
  const payload = {
    key: 'getShopes',
    executor: getShopes.bind(null, 3),
  };
  await CacherP.get(payload);
```
###  delete
suppose remove the key in redis
```
const CacherP = new Cacher();
CacherP.delete(key);
```

### attention 
1. if you Promise instance return result is undefined, the result would not to cache.
2. if you expire time config < 0, would config expire time is 5s. 