import {createLogger, format, transports} from 'winston';
import 'winston-mongodb';

// Konfigurasi URL koneksi MongoDB Atlas Anda
const mongoDbUrl =
  'mongodb+srv://farkhan3123:cjSNvpVY1PxRx4mz@cluster0.qa2yr8q.mongodb.net/logging?retryWrites=true&w=majority&appName=Cluster0';

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
