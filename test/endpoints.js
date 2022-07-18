process.env.NODE_ENV = 'test'

var test = require('ava')
var servertest = require('servertest')

var server = require('../lib/server')
var db = require('../lib/db')
var { TARGETS_KEY } = require('../lib/constants')

var sampleTarget = {
  id: '1',
  url: 'http://example.com',
  value: '0.50',
  maxAcceptsPerDay: '10',
  accept: {
    geoState: {
      $in: ['ca', 'ny']
    },
    hour: {
      $in: ['13', '14', '15']
    }
  }
}

test.beforeEach.cb(function (t) {
  db.removeAllItems(TARGETS_KEY, function (err) {
    if (err) console.log('Error initializing tests')
    t.end()
  })
})

test.serial.cb('healthcheck', function (t) {
  var url = '/health'
  servertest(server(), url, { encoding: 'json' }, function (err, res) {
    t.falsy(err, 'no error')
    t.is(res.statusCode, 200, 'correct statusCode')
    t.is(res.body.status, 'OK', 'status is ok')
    t.end()
  })
})

test.serial.cb('get targets when targets is empty', function (t) {
  var url = '/targets'
  servertest(server(), url, { encoding: 'json' }, function (err, res) {
    const targets = res.body
    t.falsy(err, 'no error')
    t.deepEqual(targets.length, 0, 'response should be empty')
    t.is(res.statusCode, 200, 'correct statusCode')
    t.end()
  })
})

test.serial.cb('get targets with targets is non empty', function (t) {
  db.pushItemToList(TARGETS_KEY, sampleTarget, function (err) {
    if (err) console.log('Error adding sample item')
    var url = '/targets'
    servertest(server(), url, { encoding: 'json' }, function (err, res) {
      const targets = res.body
      t.falsy(err, 'no error')
      t.deepEqual(targets.length, 1, 'response should have one item')
      t.is(res.statusCode, 200, 'correct statusCode')
      t.end()
    })
  })
})

test.serial.cb('post targets', function (t) {
  var url = '/targets'
  var req = servertest(server(), url, { method: 'POST' }, function (err, res) {
    t.falsy(err, 'no error')
    db.getAllItemsFromList(TARGETS_KEY, function (err, targets) {
      t.falsy(err, 'no error')
      t.deepEqual(targets.length, 1, 'response should have one item')
      t.is(res.statusCode, 200, 'correct statusCode')
      t.end()
    })
  })
  req.write(JSON.stringify(sampleTarget))
  req.end()
})

test.serial.cb('get a particular target', function (t) {
  db.pushItemToList(TARGETS_KEY, sampleTarget, function (err) {
    if (err) console.log('Error adding sample item')
    var url = '/target/1'
    servertest(server(), url, { encoding: 'json' }, function (err, res) {
      const target = res.body
      t.falsy(err, 'no error')
      t.truthy(target, 'some response is present')
      t.deepEqual(sampleTarget.id, target?.id, 'item returned should be correct')
      t.is(res.statusCode, 200, 'correct statusCode')
      t.end()
    })
  })
})

test.serial.cb('not exisiting object should return not found', function (t) {
  db.pushItemToList(TARGETS_KEY, sampleTarget, function (err) {
    if (err) console.log('Error adding sample item')
    var url = '/target/101'
    servertest(server(), url, { encoding: 'json' }, function (err, res) {
      t.falsy(err, 'no error')
      t.is(res.statusCode, 404, 'correct statusCode')
      t.end()
    })
  })
})

test.serial.cb('modify target with a specific id', function (t) {
  db.pushItemToList(TARGETS_KEY, sampleTarget, function (err) {
    if (err) console.log('Error adding sample item')
    const id = '1'
    var url = `/target/${id}`
    var req = servertest(server(), url, { method: 'POST' }, function (err, res) {
      t.falsy(err, 'no error')
      db.getAllItemsFromList(TARGETS_KEY, function (err, targets) {
        const editedItem = targets.find(i => i.id === id)
        t.falsy(err, 'no error')
        t.deepEqual(editedItem.value, 0.01, 'response should have edited value')
        t.is(res.statusCode, 200, 'correct statusCode')
        t.end()
      })
    })
    const editedSampleTarget = { ...sampleTarget }
    editedSampleTarget.value = 0.01
    req.write(JSON.stringify(editedSampleTarget))
    req.end()
  })
})

test.serial.cb('test route with no match case', function (t) {
  db.pushItemToList(TARGETS_KEY, sampleTarget, function (err) {
    if (err) console.log('Error adding sample item')
    var url = '/route'
    var params = {
      geoState: 'ca',
      publisher: 'abc',
      timestamp: '2018-07-19T23:28:59.513Z'
    }
    var req = servertest(server(), url, { method: 'POST', encoding: 'json' }, function (err, res) {
      t.falsy(err, 'no error')
      t.is(res.body?.decision, 'reject', 'should get reject as result')
      t.end()
    })
    req.write(JSON.stringify(params))
    req.end()
  })
})

test.serial.cb('test route with simple match case', function (t) {
  db.pushItemToList(TARGETS_KEY, sampleTarget, function (err) {
    if (err) console.log('Error adding sample item')
    var url = '/route'
    var params = {
      geoState: 'ca',
      publisher: 'abc',
      timestamp: '2018-07-19T13:28:59.513Z'
    }
    var req = servertest(server(), url, { method: 'POST', encoding: 'json' }, function (err, res) {
      t.falsy(err, 'no error')
      t.falsy(res.body?.decision === 'reject', 'should NOT get reject as result')
      t.end()
    })
    req.write(JSON.stringify(params))
    req.end()
  })
})

test.serial.cb('test route with multiple match', function (t) {
  db.pushItemToList(TARGETS_KEY, sampleTarget, function (err) {
    if (err) console.log('Error adding sample item')
    const highValueUrl = 'http://highvalue.com'
    const highValueId = 2
    const copySample = Object.assign({}, sampleTarget, { id: highValueId, value: '0.75', url: highValueUrl })
    db.pushItemToList(TARGETS_KEY, copySample, function (err) {
      if (err) console.log('Error adding sample item')
      var url = '/route'
      var params = {
        geoState: 'ca',
        publisher: 'abc',
        timestamp: '2018-07-19T13:28:59.513Z'
      }
      var req = servertest(server(), url, { method: 'POST', encoding: 'json' }, function (err, res) {
        t.falsy(err, 'no error')
        const decision = res.body?.decision
        t.deepEqual(highValueUrl, decision, 'result with higher value should be chosen')
        db.getAllItemsFromList(TARGETS_KEY, function (err, targets) {
          if (err) console.log('Error getting all items')
          const item = targets.find(t => t.id === highValueId)
          const expected = copySample.maxAcceptsPerDay - 1
          const actual = item.maxAcceptsPerDay
          t.deepEqual(actual, expected, 'accepts should reduce by one')
          t.end()
        })
      })
      req.write(JSON.stringify(params))
      req.end()
    })
  })
})
