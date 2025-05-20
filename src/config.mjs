import dotenv from 'dotenv';

dotenv.config();

export default {
  development: {
    type: 'development',
    port: process.env.PORT,
    mongodb: process.env.MONGODB_URI
  },
  production: {
    type: 'production',
    port: process.env.PORT,
    mongodb: process.env.MONGODB_URI
  }
};
