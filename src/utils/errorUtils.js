function errorRes(res, message){
  res.status(200);
  res.json({
      message: message,
      status: false
  });
}

function loginError(res){
  res.status(200);
  res.json({
    loggedIn: false,
    message:'Invalid Login credentials',
    status: false
  });
}

module.exports = {
  errorRes,
  loginError
}
