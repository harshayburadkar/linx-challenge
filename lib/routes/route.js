var { getAllItemsFromList, setItemAtIndex } = require('../db')
var { getReqBodyJSON } = require('../utils')
var { TARGETS_KEY } = require('../constants')

module.exports = function (req, res, opt, onError) {
  switch (req.method) {
    case 'POST': {
      handlePost(...arguments)
      break
    }
    default:
      onError('Unexpected method')
      break
  }
}

function handlePost (req, res, opt, onError) {
  getReqBodyJSON(req, function (err, data) {
    if (err) onError('Error while parsing request body')
    const { geoState, timestamp } = data
    if (!geoState || !timestamp) return onError('Check visitor info parameters')
    getAllItemsFromList(TARGETS_KEY, function (err, targets) {
      if (err) return onError('Error getting targets')
      const result = { decision: 'reject' }
      res.setHeader('Content-Type', 'application/json')
      const selectedTargetId = selectTarget(targets, geoState, timestamp)
      if (!selectedTargetId) {
        res.writeHead(200)
        res.end(JSON.stringify(result))
        return
      }
      const selectedIndex = targets.findIndex(t => t.id === selectedTargetId)
      const itemCopy = { ...targets[selectedIndex] }
      itemCopy.maxAcceptsPerDay = itemCopy.maxAcceptsPerDay - 1
      itemCopy.maxAcceptsPerDay = itemCopy.maxAcceptsPerDay.toString()
      setItemAtIndex(TARGETS_KEY, selectedIndex, itemCopy, function (err) {
        if (err) return onError('Error while updating selected target\'s accepts')
        result.decision = itemCopy.url
        res.writeHead(200)
        res.end(JSON.stringify(result))
      })
    })
  })
}

function selectTarget (targets, geoState, timestamp) {
  const visitorHour = new Date(timestamp).getUTCHours().toString()
  let availableTargets = targets.filter(({ maxAcceptsPerDay }) => maxAcceptsPerDay > 0)
  availableTargets = availableTargets.filter(target => {
    const states = target?.accept?.geoState?.$in || []
    const hours = target?.accept?.hour?.$in || []
    return states.includes(geoState) && hours.includes(visitorHour)
  })
  availableTargets = availableTargets.sort((a, b) => b.value - a.value)
  return availableTargets.length === 0 ? null : availableTargets[0].id
}
