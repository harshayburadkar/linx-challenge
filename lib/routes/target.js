var { getAllItemsFromList, setItemAtIndex } = require('../db')
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
  const id = opt?.params?.id
  if (!id) return onError('id is required')
  getAllItemsFromList(TARGETS_KEY, function (err, targets) {
    if (err) return onError(err)
    const result = targets.find(i => i.id === id) || null
    const status = result ? 200 : 404
    res.writeHead(status)
    res.write(JSON.stringify(result))
    res.end()
  })
}
function postHandler (req, res, opt, onError) {
  const id = opt?.params?.id
  if (!id) return onError('id is required')
  getReqBodyJSON(req, function (err, data) {
    if (err) onError('Error while parsing request body')
    getAllItemsFromList(TARGETS_KEY, function (err, targets) {
      if (err) onError('Error while getting items')
      const indexToChange = targets.findIndex(i => i.id === id)
      setItemAtIndex(TARGETS_KEY, indexToChange, data, function (err) {
        if (err) return onError(err)
        res.writeHead(200)
        res.end()
      })
    })
  })
}
