import {google} from 'googleapis';
import * as path from 'path';

const keyFilePath = path.join(__dirname, '../../service-account-key.json');

export const auth = new google.auth.GoogleAuth({
  keyFile: keyFilePath,
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive',
  ],
});
