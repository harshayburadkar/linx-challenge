var redis = require('./redis')

var getAllItemsFromList = function (key, cb) {
  // startIndex 0 and lasIndex -1 i.e. is first from right
  redis.LRANGE(key, 0, -1, function (err, items) {
    items = items.map(i => JSON.parse(i))
    cb(err, items)
  })
}

var pushItemToList = function (key, item, cb) {
  const itemString = JSON.stringify(item)
  redis.LPUSH(key, itemString, function (err) {
    return cb(err)
  })
}

var getItemAtIndex = function (key, index, cb) {
  redis.LINDEX(key, index, function (err, items) {
    cb(err, items)
  })
}

var setItemAtIndex = function (key, index, item, cb) {
  const itemString = JSON.stringify(item)
  redis.LSET(key, index, itemString, function (err) {
    cb(err)
  })
}

var removeAllItems = function (key, cb) {
  redis.DEL(key, function (err) {
    if (err) console.error('err: ', err)
    cb(err)
  })
}

module.exports = {
  getAllItemsFromList,
  pushItemToList,
  getItemAtIndex,
  setItemAtIndex,
  removeAllItems
}
