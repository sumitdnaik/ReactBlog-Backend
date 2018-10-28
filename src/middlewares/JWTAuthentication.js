var jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  let token = null;
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    token = req.headers.authorization.split(' ')[1];
  }
  console.log(token);
  if (!token) return res.status(401).send({ status: false, message: 'No token provided.' });
  jwt.verify(token, process.env.AUTH_SECRET_KEY, function(err, decoded) {
    if (err)
    return res.status(401).send({ status: false, message: 'Failed to authenticate token.' });
    // if everything good, save to request for use in other routes
    req.decodedUserInfo = { ...decoded };
    next();
  });
}
module.exports = verifyToken;
