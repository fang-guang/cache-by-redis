const _ = require('lodash');
const Redis = require('ioredis');

class RedisCacher {
  /**
  * @param {object} options  数据库配置
  * @param {number} options.prefix 设置缓存的前缀
  * @param {number} options.expire 设置的失效时间, 单位s
  * @param {object} options.reids redis配置
  * @param {String} options.reids.host redis host配置
  * @param {String} options.reids.port redis port配置
  * @param {String} options.reids.db redis 存储db配置
  */
  constructor(options) {
    const opt = _.defaultsDeep(options, {
      redis: {
        host: '127.0.0.1',
        port: '6379',
        db: '12',
      },
      prefix: 'cache_',
      expire: 5,
    });
    this.client = new Redis(opt.redis);
    this.prefix = opt.prefix;
    this.expire = opt.expire;
  }

  /**
     * @param {object} payload
     * @param {string} payload.key 要查找的key
     * @param {function} payload.executor 如果未击中，要执行的方法
     * @return {Promise.<Object>} 缓存中数据(击中) 或executor返回数据(未击中)
     */
  get(payload) {
    const self = this;
    const { key } = payload;
    const cacheKey = this.prefix + key;
    let expire = payload.expire || this.expire;
    if (expire <= 0) {
      expire = this.expire;
    }
    return this.client.get(cacheKey).then((data) => {
      if (data !== null && data !== 'undefined') {
        return JSON.parse(data);
      }
      return payload.executor().then((result) => {
        if (!_.isUndefined(result)) {
          // 全部转化为json存入redis
          const value = JSON.stringify(result);
          // ex:seconds ： 将键的过期时间设置为 seconds 秒。
          // 执行 SET key value EX seconds 的效果等同于执行 SETEX key seconds value。
          // nx： 只在键不存在时， 才对键进行设置操作。 执行 SET key value NX 的效果等同于执行 SETNX key value
          self.client.set(cacheKey, value, 'ex', expire, 'nx');
        }

        return result;
      });
    });
  }

  /**
   * 删除指定缓存
   * @param {string} key 要删除key
   * @return {Promise.<number>} n 删除的key的数量, 同ioredis.del
   * */
  delete(key) {
    const saveKey = this.prefix + key;
    return this.client.del(saveKey);
  }
}
module.exports = RedisCacher;
