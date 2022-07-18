
module.exports = {
  getReqBodyJSON
}
function getReqBodyJSON (req, cb) {
  let data = ''
  req.on('data', chunk => {
    data += chunk
  })
  req.on('end', () => {
    cb(null, JSON.parse(data))
  })
}
