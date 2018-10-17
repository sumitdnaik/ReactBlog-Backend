var jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  var token = req.headers['x-access-token'];
  if (!token) return res.status(403).send({ status: false, message: 'No token provided.' });
  jwt.verify(token, process.env.AUTH_SECRET_KEY, function(err, decoded) {
    if (err)
    return res.status(500).send({ status: false, message: 'Failed to authenticate token.' });
    // if everything good, save to request for use in other routes
    req.decodedUserInfo = { ...decoded };
    next();
  });
}
module.exports = verifyToken;
