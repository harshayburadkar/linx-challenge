var redis = require('./redis')

module.exports = {
  getAllItemsFromList,
  pushItemToList,
  setItemAtIndex,
  removeAllItems
}

function getAllItemsFromList (key, cb) {
  // startIndex 0 and lasIndex -1 i.e. is first from right
  redis.LRANGE(key, 0, -1, function (err, items) {
    items = items.map(i => JSON.parse(i))
    cb(err, items)
  })
}

function pushItemToList (key, item, cb) {
  const itemString = JSON.stringify(item)
  redis.LPUSH(key, itemString, function (err) {
    return cb(err)
  })
}

function setItemAtIndex (key, index, item, cb) {
  const itemString = JSON.stringify(item)
  redis.LSET(key, index, itemString, function (err) {
    cb(err)
  })
}

function removeAllItems (key, cb) {
  redis.DEL(key, function (err) {
    if (err) console.error('err: ', err)
    cb(err)
  })
}
