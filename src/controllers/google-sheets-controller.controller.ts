import {inject} from '@loopback/core';
import {get, Request, Response, RestBindings} from '@loopback/rest';
import axios from 'axios';
import {format, subDays} from 'date-fns';
import {enUS} from 'date-fns/locale';
import {oauth2Client, SCOPES} from '../config/google.config';
import {GoogleSheetsService} from '../services/google-sheets.service';
import logger from '../util/logger';

// Define the types
type BridgingDataItem = {
  ICARE: boolean;
  'Bridging PCARE': boolean;
  VCLAIM: boolean;
  ANTROL: boolean;
  'Isian Wizzard BPJS': string;
  'Metode Bayar BPJS': boolean;
  'Kode Faskes': string;
  'Nama Faskes': string;
  Server: string;
  Variant: string;
  'Status Subs': string;
};

type WeeklyBpjsData = {
  'Nama Faskes': string;
  'Kode Faskes': string;
  ConsId: string;
  'Tanggal Dibuat': string;
  'Tanggal Diperbaharui': string;
  Server: string;
};

type AlltimeBpjsData = WeeklyBpjsData;

type BridgingBpjsData = {
  Weekly: WeeklyBpjsData[];
  Alltime: AlltimeBpjsData[];
};

type WeeklySatuSehatData = {
  'Nama Faskes': string;
  'Kode Faskes': string;
  'Organization ID': string;
  'Tanggal Dibuat': string;
  Server: string;
};

type AlltimeSatuSehatData = WeeklySatuSehatData;

type BridgingSatuSehatData = {
  Weekly: WeeklySatuSehatData[];
  Alltime: AlltimeSatuSehatData[];
};

let authed = false;

export class GoogleSheetsController {
  constructor(
    @inject('services.GoogleSheetsService')
    private googleSheetsService: GoogleSheetsService,
  ) {}

  @get('/')
  async main(@inject(RestBindings.Http.RESPONSE) res: Response) {
    if (!authed) {
      const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
      });
      res.send(
        `<h1>Google Sheets API with OAuth2</h1><a href="${url}">Login with Google</a>`,
      );
    } else {
      res.send(
        `<h1>Authenticated</h1><a href="/update-spreadsheet">Update Spreadsheet</a>`,
      );
    }
  }

  @get('/oauth2callback')
  async oauth2callback(
    @inject(RestBindings.Http.REQUEST) req: Request,
    @inject(RestBindings.Http.RESPONSE) res: Response,
  ) {
    const code = req.query.code as string;
    if (code) {
      try {
        const {tokens} = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        authed = true;
        res.redirect('/');
        logger.info('User authenticated successfully.');
      } catch (err) {
        logger.error('Error getting oAuth tokens: %s', err.message);
        res.send('Error during authentication');
      }
    }
  }

  @get('/update-spreadsheet')
  async updateSpreadsheet(@inject(RestBindings.Http.RESPONSE) res: Response) {
    if (!authed) {
      res.redirect('/');
      return;
    }

    try {
      // Define your spreadsheet IDs
      const bridgingSpreadsheetId =
        '1u_hydYPTe9adrXJIC8E1Ww8MWmbzaLmnEl2_hvz0Qns';
      const bridgingBpjsSpreadsheetId =
        '1QHRrKX1XnzdFnG1jrbSqgRdLdxpXKexQKstO5xKoysQ';
      const bridgingSatuSehatSpreadsheetId =
        '1KRh_T3K8wlivws7vFycaqjn3o4sXyzPkvCBqb5OYOI8';

      // Define the database URLs
      const databases = [
        {host: 'http://localhost:3001', name: 'app'},
        {host: 'http://localhost:3002', name: 'denta'},
        {host: 'http://localhost:3003', name: 'clinica'},
      ];
      const endpoints = ['bridging', 'bpjs', 'sehat'];

      // Initialize data containers
      const bridgingData: BridgingDataItem[] = [];
      const bridgingBpjsData: BridgingBpjsData = {Weekly: [], Alltime: []};
      const bridgingSatuSehatData: BridgingSatuSehatData = {
        Weekly: [],
        Alltime: [],
      };

      // Fetch data from each endpoint of each database
      for (const db of databases) {
        for (const endpoint of endpoints) {
          const response = await axios.get(`${db.host}/api/${endpoint}`);
          const data = response.data;
          switch (endpoint) {
            case 'bridging':
              bridgingData.push(...(data as BridgingDataItem[])); // Cast to BridgingDataItem[]
              break;
            case 'bpjs':
              bridgingBpjsData.Weekly.push(
                ...(data.Weekly as WeeklyBpjsData[]),
              );
              bridgingBpjsData.Alltime.push(
                ...(data.Alltime as AlltimeBpjsData[]),
              );
              break;
            case 'sehat':
              bridgingSatuSehatData.Weekly.push(
                ...(data.Weekly as WeeklySatuSehatData[]),
              );
              bridgingSatuSehatData.Alltime.push(
                ...(data.Alltime as AlltimeSatuSehatData[]),
              );
              break;
          }
        }
      }

      // 7 hari sebelum api di call
      const today = new Date();
      const sevenDaysAgo = subDays(today, 7);
      const sheetName = `${format(sevenDaysAgo, 'd')} - ${format(today, 'd MMMM yyyy', {locale: enUS})}`;

      // membuat new sheet baru untuk weekly
      await this.googleSheetsService.createSheet(
        bridgingBpjsSpreadsheetId,
        sheetName,
      );
      await this.googleSheetsService.createSheet(
        bridgingSatuSehatSpreadsheetId,
        sheetName,
      );

      // Update different spreadsheets with respective data
      await this.googleSheetsService.appendData(
        bridgingSpreadsheetId,
        'Bridging',
        bridgingData,
      );
      await this.googleSheetsService.appendData(
        bridgingBpjsSpreadsheetId,
        sheetName,
        bridgingBpjsData.Weekly,
      );
      await this.googleSheetsService.appendData(
        bridgingBpjsSpreadsheetId,
        'Alltime',
        bridgingBpjsData.Alltime,
      );
      await this.googleSheetsService.appendData(
        bridgingSatuSehatSpreadsheetId,
        sheetName,
        bridgingSatuSehatData.Weekly,
      );
      await this.googleSheetsService.appendData(
        bridgingSatuSehatSpreadsheetId,
        'Alltime',
        bridgingSatuSehatData.Alltime,
      );

      res.send('Data has been added to the spreadsheets.');
      logger.info('Data has been added to the sheets.');
    } catch (err) {
      logger.error('Error updating spreadsheets: %s', err.message);
      res.send('Error updating spreadsheets');
    }
  }
}
