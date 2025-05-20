/* eslint-disable consistent-return */
import UserModel from '../models/user.mjs';
import authenticateToken from '../middleware/jwt.mjs';
import generalLimiter from '../middleware/limiter.mjs';

const Users = class Users {
  constructor(app, connect) {
    this.app = app;
    this.UserModel = connect.model('User', UserModel);

    this.run();
  }

  deleteById() {
    this.app.delete('/user/:id', generalLimiter, authenticateToken, (req, res) => {
      try {
        this.UserModel.findByIdAndDelete(req.params.id).then((user) => {
          res.status(200).json(user || {});
        }).catch(() => {
          res.status(500).json({
            code: 500,
            message: 'Internal Server error'
          });
        });
      } catch (err) {
        console.error(`[ERROR] users/:id -> ${err}`);

        res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  showById() {
    this.app.get('/user/:id', generalLimiter, authenticateToken, (req, res) => {
      try {
        this.UserModel.findById(req.params.id).then((user) => {
          res.status(200).json(user || {});
        }).catch(() => {
          res.status(500).json({
            code: 500,
            message: 'Internal Server error'
          });
        });
      } catch (err) {
        console.error(`[ERROR] users/:id -> ${err}`);

        res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  create() {
    this.app.post('/user/', generalLimiter, (req, res) => {
      try {
        const userModel = new this.UserModel(req.body);

        userModel.save().then((user) => {
          res.status(200).json(user || {});
        }).catch(() => {
          res.status(200).json({});
        });
      } catch (err) {
        console.error(`[ERROR] users/create -> ${err}`);

        res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  updateById() {
    this.app.put('/user/:id', generalLimiter, authenticateToken, (req, res) => {
      try {
        this.UserModel.findByIdAndUpdate(
          req.params.id,
          req.body,
          { new: true }
        ).then((user) => {
          if (!user) {
            return res.status(404).json({
              code: 404,
              message: 'No user found'
            });
          }
          res.status(200).json(user);
        }).catch((err) => {
          res.status(500).json({
            code: 500,
            message: 'internal server error',
            error: err.message,
            stack: err.stack
          });
        });
      } catch (err) {
        console.error(`[ERROR] users/:id -> ${err}`);

        res.status(400).json({
          code: 400,
          message: 'bad request'
        });
      }
    });
  }

  run() {
    this.create();
    this.showById();
    this.deleteById();
    this.updateById();
  }
};

export default Users;
