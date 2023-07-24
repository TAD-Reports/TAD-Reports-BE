const Store = require("./users-store");
const Logs = require("../logs/logs-store");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userId = 1;
require("dotenv").config();

const {
  NotFoundError,
  BadRequestError,
  errorHandler,
  AuthenticationError,
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
        throw new AuthenticationError("Invalid login credentials");
      }
      // Create a JWT token
      const accessToken = jwt.sign(
        {
          UserInfo: {
            username: user.username,
            role: user.role,
          },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "30s" }
      );
      const refreshToken = jwt.sign(
        { username: user.username },
        process.env.REFRESH_TOKEN_SECRET,
        {
          expiresIn: "30s",
        }
      );

      store.updateRefreshToken(user.uuid, user, refreshToken);

      const updatedUser = await store.getUsername(body.username);

      logs.add({
        uuid: user.uuid,
        module: moduleName,
        action: "signed in",
        ...body,
      });

      return res
        .cookie("jwt", refreshToken, {
          httpOnly: true,
          sameSite: "None",
          secure: true,
          maxAge: 30 * 1000,
        })
        .send({
          valid: true,
          message: "Login successful",
          data: updatedUser,
          accessToken: accessToken,
        });
    } catch (err) {
      next(err);
      if (err instanceof AuthenticationError) {
        return res
          .status(401)
          .send({ success: false, error: "Invalid login credentials" });
      } else if (err instanceof NotFoundError) {
        return res
          .status(404)
          .send({ success: false, error: "Username not found" });
      } else {
        return res
          .status(500)
          .send({ success: false, error: "Internal Server Error" });
      }
    }
  }

  async logout(req, res, next) {
    try {
      const store = new Store(req.db);
      const users = await store.getAllUsers();

      const cookies = req.cookies;
      if (!cookies?.jwt) return res.sendStatus(204);
      const refreshToken = cookies.jwt;

      const foundUser = await users.find(
        (user) => user.refresh_token === refreshToken
      );

      if (!foundUser) {
        res.clearCookie("jwt", {
          httpOnly: true,
          sameSite: "None",
          secure: true,
        });
        return res.sendStatus(204);
      }

      store.updateRefreshToken(foundUser.uuid, foundUser, null);

      res.clearCookie("jwt", {
        httpOnly: true,
        sameSite: "None",
        secure: true,
      });
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  }

  async refresh(req, res, next) {
    try {
      const store = new Store(req.db);
      const users = await store.getAllUsers();

      const cookies = req.cookies;
      if (!cookies?.jwt)
        return res.status(401).json({ message: "Unauthorized" });
      const refreshToken = cookies.jwt;

      const foundUser = await users.find(
        (user) => user.refresh_token === refreshToken
      );

      if (!foundUser) return res.sendStatus(403); // Forbidden

      jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err, decoded) => {
          if (err || foundUser.username !== decoded?.username) {
            console.log(err);
            return res.sendStatus(403);
          }
          const accessToken = jwt.sign(
            {
              username: decoded.username,
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "30s" }
          );
          return res.json({ accessToken });
        }
      );
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
      if (err instanceof BadRequestError) {
        return res.status(400).send({ success: false, error: err.message });
      } else {
        // Handle other errors with a generic error response
        return res
          .status(500)
          .send({ success: false, error: "Internal Server Error" });
      }
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
  async getData(req, res, next) {
    try {
      const store = new Store(req.db);
      const search = req.query.search;

      let users = [];

      const hasData = await store.getAll();

      if (hasData.length > 0) {
        users = await store.search(search);
      } else {
        users = await store.getAll();
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
