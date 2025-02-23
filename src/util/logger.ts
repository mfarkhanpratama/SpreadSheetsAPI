import dotenv from 'dotenv';
import {createLogger, format, transports} from 'winston';
import 'winston-mongodb';

dotenv.config();

// Ensure mongoDbUrl is defined
const mongoDbUrl = process.env.MONGODB_URL || '';

if (!mongoDbUrl) {
  throw new Error('MONGODB_URL is not defined in environment variables');
}

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({stack: true}),
    format.splat(),
    format.json(),
  ),
  defaultMeta: {service: 'spreadsheet-api'},
  transports: [
    new transports.File({filename: 'error.log', level: 'error'}),
    new transports.File({filename: 'combined.log'}),
    new transports.MongoDB({
      level: 'info',
      db: mongoDbUrl,
      options: {useUnifiedTopology: true},
      collection: 'log',
      format: format.combine(format.timestamp(), format.json()),
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
  );
}

export default logger;
