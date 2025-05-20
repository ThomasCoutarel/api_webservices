// Dependencies
import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import redis from 'redis';
import rateLimit from 'express-limiter';

// Core
import config from './config.mjs';
import routes from './controllers/routes.mjs';

dotenv.config();

const Server = class Server {
  constructor() {
    this.app = express();
    this.config = config[process.argv[2]] || config.development;
  }

  async dbConnect() {
    try {
      const host = this.config.mongodb;

      this.connect = await mongoose.createConnection(host, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });

      const close = () => {
        this.connect.close((error) => {
          if (error) {
            console.error('[ERROR] api dbConnect() close() -> mongodb error', error);
          } else {
            console.log('[CLOSE] api dbConnect() -> mongodb closed');
          }
        });
      };

      this.connect.on('error', (err) => {
        setTimeout(() => {
          console.log('[ERROR] api dbConnect() -> mongodb error');
          this.connect = this.dbConnect(host);
        }, 5000);

        console.error(`[ERROR] api dbConnect() -> ${err}`);
      });

      this.connect.on('disconnected', () => {
        setTimeout(() => {
          console.log('[DISCONNECTED] api dbConnect() -> mongodb disconnected');
          this.connect = this.dbConnect(host);
        }, 5000);
      });

      process.on('SIGINT', () => {
        close();
        console.log('[API END PROCESS] api dbConnect() -> close mongodb connection');
        process.exit(0);
      });
    } catch (err) {
      console.error(`[ERROR] api dbConnect() -> ${err}`);
    }
  }

  middleware() {
    this.app.use(compression());

    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
      : [];

    this.app.use(cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        } else {
          return callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
      }
    }));

    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(bodyParser.json());

    // Ajout du rate limiter ici
    this.rateLimiter();
  }

  rateLimiter() {
    // Initialiser Redis
    const client = redis.createClient({ legacyMode: true });
    client.connect().catch(console.error);

    const limiter = rateLimit(this.app, client);

    limiter({
      path: '*',
      method: 'all',
      lookup: ['connection.remoteAddress'],
      total: 100,
      expire: 1000 * 60 * 60, // 1 heure
      onRateLimited: (req, res) => {
        res.status(429).json({
          code: 429,
          message: "Trop de requêtes"
        });
      }
    });
  }

  routes() {
    new routes.Photos(this.app, this.connect, this.authToken);
    new routes.Albums(this.app, this.connect, this.authToken);
    new routes.Users(this.app, this.connect, this.authToken);
    new routes.pipeline(this.app);
    new routes.Auth(this.app);

    this.app.use((req, res) => {
      res.status(404).json({
        code: 404,
        message: 'Not Found'
      });
    });
  }

  security() {
    this.app.use(helmet());
    this.app.disable('x-powered-by');
  }

  authToken(req, res, next) {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(403).json({
        code: 403,
        message: 'Token manquant'
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, data) => {
      if (err) {
        return res.status(401).json({
          code: 401,
          message: 'Token invalide'
        });
      }

      req.auth = data;
      next();
    });
  }

  async run() {
    try {
      await this.dbConnect();
      this.security();
      this.middleware(); // inclut maintenant le rateLimiter
      this.routes();
      this.app.listen(this.config.port);
    } catch (err) {
      console.error(`[ERROR] Server -> ${err}`);
    }
  }
};

export default Server;
