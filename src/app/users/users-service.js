const Store = require('./users-store');
const Logs = require('../logs/logs-store');
const bcrypt = require('bcrypt');
const {
  NotFoundError,
  BadRequestError,
  errorHandler,
} = require("../../middlewares/errors");

class UserService {
  constructor(store) {
  }

  // Login User
  // Login User
  async login(req, res, next) {
    try {
      const store = new Store(req.db);
      const logs = new Logs(req.db);
      const { username, password } = req.body;
      if (!username || !password) {
        throw new BadRequestError('Username and password are required');
      }
      const user = await store.getUsername(username);
      if (!user) {
        throw new NotFoundError('Username not found');
      }
      console.log({ password: password, storedPassword: user.password });
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        throw new BadRequestError('Invalid login credentials');
      }
      // Create a JWT token
      // const token = jwt.sign({ id: user.uuid }, process.env.JWT_SECRET, {
      //   expiresIn: 86400 // expires in 24 hours
      // });
      return res.status(200).send({
        valid: true,
        message: 'Login successful',
        data: user,
        // token: token
      });
    } catch (err) {
      next(err);
    }
  }


  // Register new user
  async register(req, res, next) {
    try {
      const store = new Store(req.db);
      const logs = new Logs(req.db);
      const body = req.body;
      // Hash the password
      const hash = await bcrypt.hash(body.password, 10);
      // Validate input
      if (!body.username || !body.password) {
        throw new BadRequestError('Username and password are required');
      }
      // Check if the user already exists
      const hasUser = await store.getUsername(body.username);
      if (hasUser) {
        throw new BadRequestError('Username already exists');
      }
      // Insert the new user into the database
      const result = await store.registerUser(body, hash);
      const userId = result[0];
      // Create a JWT token (optional if directly logged in after registration)
      // const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      //   expiresIn: 86400 // expires in 24 hours
      // });

      // Create a new object without the "password" property
      const userData = { ...body };
      delete userData.password;
      return res.status(201).send({
        success: true,
        message: 'Registration Complete',
        data: {
          uuid: userId,
          ...userData, 
          password: hash
        },
        // token: token
      });
    } catch (err) {
      next(err);
    }
  }


  // Update user info
  async update(req, res, next) {
    try {
      const store = new Store(req.db);
      const logs = new Logs(req.db);
      const uuid = req.params.uuid;
      const body = req.body;
      // Hash the password
      const hash = await bcrypt.hash(body.password, 10);
      const result = store.updateUser(uuid, body, hash);
      if (result === 0) {
        throw new NotFoundError('User not found');
      }
      const userData = { ...body};
      delete userData.password;
      return res.status(200).send({
        success: true,
        data: {
          uuid, ...userData,
          password: hash
        }
      });
    } catch (err) {
      next(err);
    }
  }


  // Get user by ID
  async user(req, res, next) {
    try {
      const store = new Store(req.db);
      const uuid = req.params.uuid;
      const user = await store.getUserByUUID(uuid);
      if (!user) {
        throw new NotFoundError('User not found');
      }
      return res.status(200).send({
        success: true,
        data: user
      });
    } catch (err) {
      next(err);
    }
  }


// Get all users
  async users(req, res, next) {
    try {
      const store = new Store(req.db);
      const users = await store.getAllUsers();
      if (!users) {
        throw new NotFoundError('No Data found');
      }
      return res.status(200).send({
        success: true,
        data: users
      });
    } catch (err) {
      next(err);
    }
  }


  // Delete a user
  async delete(req, res, next) {
    try {
      const store = new Store(req.db);
      const uuid = req.params.uuid;
      const result = await store.deleteUser(uuid);
      if (result === 0) {
        throw new NotFoundError('User not found');
      }
      return res.status(202).send({
        success: true,
        message: 'User has been deleted'
      });
    } catch (err) {
      next(err);
    }
  }


}


module.exports = UserService;