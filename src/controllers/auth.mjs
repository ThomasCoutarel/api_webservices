import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import Schema from '../models/user.mjs';
import generalLimiter from '../middleware/limiter.mjs';

dotenv.config();

const Auth = class Auth {
  constructor(app, connect) {
    this.app = app;
    this.Schema = connect.model('User', Schema);
    this.run();
  }

  login() {
    this.app.post('/login/', generalLimiter, (req, res) => {
      try {
        const { email, password } = req.body;

        this.Schema.findOne({ email })
          .then((user) => {
            if (!user || user.password !== password) {
              return res.status(401).json({ message: 'wrong credentials !' });
            }

            const payload = { id: user._id, email: user.email };
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

            return res.status(200).json({ token });
          })
          .catch((err) => {
            console.error(`[ERROR] login/findUser -> ${err}`);
            res.status(500).json({ message: 'internal error' });
          });
      } catch (err) {
        console.error(`[ERROR] login (global catch) -> ${err}`);
        res.status(500).json({ message: 'server down' });
      }
    });
  }

  run() {
    this.login();
  }
};

export default Auth;
