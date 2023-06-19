// const auth = (req, res, next) => {
//   const jwt = require('jsonwebtoken');
//   const token = req.headers['authorization'];
//   if (!token) {
//     return res.status(401).send({ 
//       success: false,
//       message: 'No authorization header' 
//     });
//   }

//   jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
//     if (err) {
//       return res.status(401).send({ 
//         success: false,
//         message: 'Invalid token' 
//       });
//     }

//     req.auth = decoded;
//     next();
//   });
// }

// module.exports = auth;

const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).send({ 
      success: false,
      message: 'No authorization header' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ 
        success: false,
        message: 'Invalid token' 
      });
    }

    req.user = {
      uuid: decoded.userId, // Assuming the user UUID is stored in the `userId` property of the token payload
    };

    next();
  });
};

module.exports = auth;
