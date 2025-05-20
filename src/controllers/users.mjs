import UserModel from '../models/user.mjs';

const Users = class Users {
  constructor(app, connect, authToken) {
    this.app = app;
    this.UserModel = connect.model('User', UserModel);
    this.authToken = authToken;

    this.run();
  }

  deleteById() {
    this.app.delete('/user/:id', this.authToken, (req, res) => {
      try {
        if (req.auth.role !== 'admin') {
          res.status(401).json({
            code: 401,
            message: 'You are member you need to be admin'
          });

          return;
        }

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
    this.app.get('/user/:id', this.authToken, (req, res) => {
      try {
        if (req.auth.role !== 'admin') {
          res.status(401).json({
            code: 401,
            message: 'You are member you need to be admin'
          });

          return;
        }

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

  show() {
    this.app.get('/users/', this.authToken, (req, res) => {
      try {
        if (req.auth.role !== 'admin') {
          res.status(401).json({
            code: 401,
            message: 'You are member you need to be admin'
          });

          return;
        }

        this.UserModel.find({}).then((users) => {
          res.status(200).json(users || []);
        }).catch(() => {
          res.status(500).json({
            code: 500,
            message: 'Internal server error'
          });
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

  run() {
    this.show();
    this.showById();
    this.deleteById();
  }
};

export default Users;
