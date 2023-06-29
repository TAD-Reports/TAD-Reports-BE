require("dotenv").config();
const Store = require("./users-store");
const Logs = require("../logs/logs-store");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const jwtSecret = process.env.ACCESS_TOKEN_SECRET;
const userId = 1;

const {
  NotFoundError,
  BadRequestError,
  errorHandler,
} = require("../../middlewares/errors");
const moduleName = "Authentication";

class UserService {
  constructor(db) {
    this.db = db;
  }

  // Login User
  async login(req, res, next) {
    try {
      const store = new Store(req.db);
      const logs = new Logs(req.db);
      // const { username, password } = req.body;
      const body = req.body;
      if (!body.username || !body.password) {
        throw new BadRequestError("Username and password are required");
      }
      const user = await store.getUsername(body.username);
      if (!user) {
        throw new NotFoundError("Username not found");
      }
      const validPassword = await bcrypt.compare(body.password, user.password);
      if (!validPassword) {
        throw new BadRequestError("Invalid login credentials");
      }
      // Create a JWT token
      const accessToken = jwt.sign({ id: user.uuid }, jwtSecret, {
        expiresIn: "30s",
      });
      const refreshToken = jwt.sign({ id: user.uuid }, jwtSecret, {
        expiresIn: "30s",
      });
      logs.add({
        uuid: user.uuid,
        module: moduleName,
        action: "signed in",
        ...body,
      });
      return res
        .status(200)
        .cookie("jwt", refreshToken, {
          httpOnly: true,
          maxAge: 30 * 1000,
        })
        .send({
          valid: true,
          message: "Login successful",
          data: user,
          accessToken: accessToken,
        });
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      const cookies = req.cookies;
      if (!cookies?.jwt) return res.sendStatus(204);
      const refreshToken = cookies.jwt;

      console.log(this.db);
      const foundUser = this.db.users.find(
        (person) => person.refreshToken === refreshToken
      );

      if (!foundUser) {
        console.log("NO USER FOUND NA MAY REFRESH TOKEN");
        return res.sendStatus(204);
      }

      // Clear the refresh token cookie
      return res
        .clearCookie("jwt", { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
        .status(200)
        .send({
          message: "Logout successful",
        });
    } catch (err) {
      next(err);
    }
  }

  async password(req, res, next) {
    try {
      const store = new Store(req.db);
      const body = req.body;
      const result = await store.getUserByUUID(body.uuid);
      if (!result) {
        throw new NotFoundError("User not found");
      }
      const validPassword = await bcrypt.compare(
        result.password,
        body.password
      );
      if (!validPassword) {
        throw new BadRequestError("Invalid password please try again");
      }

      return res.status(200).send({
        success: true,
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
      //const userId = req.auth.id; // Get user ID using auth
      // Hash the password
      const hash = await bcrypt.hash(body.password, 10);
      // Validate input
      if (!body.username || !body.password) {
        throw new BadRequestError("Username and password are required");
      }
      // Check if the user already exists
      const hasUser = await store.getUsername(body.username);
      if (hasUser) {
        throw new BadRequestError("Username already exists");
      }
      // Insert the new user into the database
      const result = await store.registerUser(body, hash);
      const uuid = result[0];
      // Create a new object without the "password" property
      const userData = { ...body };
      delete userData.password;
      logs.add({
        uuid: userId,
        module: moduleName,
        data: userData,
        action: "registered an account",
        ...body,
      });
      return res.status(201).send({
        success: true,
        message: "Registration Complete",
        data: {
          uuid: uuid,
          ...userData,
          password: hash,
        },
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
      //const userId = req.auth.id; // Get user ID using auth
      // Hash the password
      const hash = await bcrypt.hash(body.password, 10);
      const result = store.updateUser(uuid, body, hash);
      if (result === 0) {
        throw new NotFoundError("User not found");
      }
      const userData = { ...body };
      delete userData.password;
      logs.add({
        uuid: userId,
        module: moduleName,
        data: userData,
        action: "updadted an account",
        ...body,
      });
      return res.status(200).send({
        success: true,
        data: {
          uuid,
          ...userData,
          password: hash,
        },
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
        throw new NotFoundError("User not found");
      }
      return res.status(200).send({
        success: true,
        data: user,
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
        throw new NotFoundError("No Data found");
      }
      return res.status(200).send({
        success: true,
        data: users,
      });
    } catch (err) {
      next(err);
    }
  }

  // Delete a user
  // async delete(req, res, next) {
  //   try {
  //     const store = new Store(req.db);
  //     const uuid = req.params.uuid;
  //     const result = await store.deleteUser(uuid);
  //     if (result === 0) {
  //       throw new NotFoundError('User not found');
  //     }
  //     logs.add({
  //       uuid: user.uuid,
  //       module: moduleName,
  //       action: "deleted an account",
  //       ...body
  //     })
  //     return res.status(202).send({
  //       success: true,
  //       message: 'User has been deleted'
  //     });
  //   } catch (err) {
  //     next(err);
  //   }
  // }
}

module.exports = UserService;
