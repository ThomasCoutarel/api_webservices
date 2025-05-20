import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const Auth = class Auth {
  constructor(app) {
    this.app = app;
    this.run();
  }

  login() {
    // POST /auth
    this.app.post('/auth', (req, res) => {
      try {
        const { name, role } = req.body;
        if (!name || !role) {
          return res.status(400).json({ message: 'name et role requis' });
        }

        // Génération du token
        const token = jwt.sign({ name, role }, process.env.JWT_SECRET, { expiresIn: '24h' });

        // On renvoie le token au client
        return res.status(200).json({ accessToken: token });
      } catch (err) {
        console.error(`[ERROR] POST /auth -> ${err}`);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
    });
  }

  run() {
    this.login();
  }
};

export default Auth;
