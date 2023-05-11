const UserStore = require('./users-store');
const LogsStore = require('../logs/logs-store');

class UserService {
  constructor(userStore) {
  }

// Login User
  async loginUser(req, res) {
    const userStore = new UserStore(req.db);    
    const logsStore = new LogsStore(req.db);
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).send({ 
        message: 'Username and password are required' 
      });
    }
    //get User
    const user = await userStore.getUsername(username);
    if (!user) {
      return res.status(400).send({
        message: 'Username not found'
      });
    }
    // Validate password
    try {
      if (password !== user.password) {
        return res.status(401).send({
          valid: false,
          message: 'Invalid login credentials'
        });
      }
    } catch (error) {
      return res.status(500).send({
        success: false, 
        message: 'Error checking password',
        error: error
      });
    }
    // Create logs
    await logsStore.loginLogs(user.uuid);
    return res.status(200).send({
      valid: true,
      message: 'Login successful',
      data: user
    });
  }


// Get user by ID
async getUser(req, res) {
  const userStore = new UserStore(req.db);
  const uuid = req.params.uuid;
  const user = await userStore.getUserByUUID(uuid);
  if (!user) {
    return res.status(404).send({
      success: false,
      message: 'User not found'
    });
  }
  return res.status(200).send({
    success: true,
    data: user
  });
}


// Get all users
  async getUsers(req, res) {
    const userStore = new UserStore(req.db);
    try{
      const users = await userStore.getAllUsers();
      return res.status(200).send({
        success: true,
        data: users
      });
    } catch (error) {
      return res.status(500).send({ 
        success: false,
        message: 'Error fetching users',
        error: error
      });
    }
  }


  // Update user info
  async updateUser(req, res) {
    const userStore = new UserStore(req.db);
    const logsStore = new LogsStore(req.db);
    const uuid = req.params.uuid;
    const user = req.body;
    const id = await userStore.getUserByUUID(uuid);
    if (!id){
      return res.status(404).send({
        success: false,
        message: 'User not found'
      });
    }
    try{
      const result = userStore.updateUser(uuid, user);
      if (result === 0) {
        return res.status(404).send({
          success: false,
          message: 'User not found'
        });
      }
      // Create logs
      await logsStore.userUpdateLogs(uuid);
    } catch (error) {
      return res.status(500).send({ 
        success: false,
        message: 'Error updating user',
        error: error
      });
    }
    return res.status(200).send({
      success: true,
      data: {
        uuid, ...user
      }
    });
  }


  // Delete a user
  async deleteUser(req, res) {
    const userStore = new UserStore(req.db);
    const uuid = req.params.uuid;
    try {
      const result = await userStore.deleteUser(uuid);
      if (result === 0) {
        return res.status(404).send({
          success: false,
          message: 'User not found'
        });
      }
    } catch (error) {
      return res.status(500).send({ 
        success: false,
        message: 'Error deleting user',
        error: error
      });
    }
    return res.status(202).send({
      success: true,
      message: 'User has been deleted'
    });
  }
}


module.exports = UserService;