var cuid = require('cuid')
var { pushItemToList, getAllItemsFromList } = require('../db')
var { getReqBodyJSON } = require('../utils')
var { TARGETS_KEY } = require('../constants')
module.exports = function (req, res, opt, onError) {
  switch (req.method) {
    case 'GET': {
      getHandler(...arguments)
      break
    }
    case 'POST': {
      postHandler(...arguments)
      break
    }
    default:
      onError('Unexpected method')
      break
  }
}

function getHandler (req, res, opt, onError) {
  getAllItemsFromList(TARGETS_KEY, function (err, targets) {
    if (err) return onError(err)
    res.writeHead(200)
    res.write(JSON.stringify(targets))
    res.end()
  })
}
function postHandler (req, res, opt, onError) {
  getReqBodyJSON(req, function (err, data) {
    if (err) onError('Error while parsing request body')
    data.id = cuid()
    pushItemToList(TARGETS_KEY, data, function (err) {
      if (err) return onError(err)
      res.writeHead(200)
      res.end()
    })
  })
}
