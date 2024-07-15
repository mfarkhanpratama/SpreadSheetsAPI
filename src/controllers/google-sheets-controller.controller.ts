import {inject} from '@loopback/core';
import {get, Response, RestBindings} from '@loopback/rest';
import axios from 'axios';
import {format, subDays} from 'date-fns';
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

export class GoogleSheetsController {
  constructor(
    @inject('services.GoogleSheetsService')
    private googleSheetsService: GoogleSheetsService,
  ) {}

  @get('/spreadsheet')
  async updateSpreadsheet(@inject(RestBindings.Http.RESPONSE) res: Response) {
    try {
      // Define your spreadsheet IDs
      const bridgingSpreadsheetId = process.env.BRIDGING_SPREADSHEET_ID!;
      const bridgingBpjsSpreadsheetId =
        process.env.BRIDGING_BPJS_SPREADSHEET_ID!;
      const bridgingSatuSehatSpreadsheetId =
        process.env.BRIDGING_SATU_SEHAT_SPREADSHEET_ID!;

      // Define the database URLs
      const databases = process.env
        .DATABASES_HOSTS!.split(',')
        .map(host => ({host, name: host.split('//')[1].split(':')[0]}));
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
          try {
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
          } catch (err) {
            logger.error(
              `Error fetching data from ${db.host}/api/${endpoint}: ${err.message}`,
            );
            throw err;
          }
        }
      }

      // Get current date and date 7 days ago for weekly sheet name
      const today = new Date();
      const sevenDaysAgo = subDays(today, 7);
      const sheetNameWeekly = `${format(sevenDaysAgo, 'd')} - ${format(today, 'd MMMM yyyy')}`;
      const sheetNameAlltime = `All Time (${format(today, 'd MMMM yyyy')})`;
      const sheetNameBridging = `Bridging (${format(today, 'd MMMM yyyy')})`;

      // Create new sheet for weekly data with validation
      await this.googleSheetsService.createSheet(
        bridgingBpjsSpreadsheetId,
        sheetNameWeekly,
      );
      await this.googleSheetsService.createSheet(
        bridgingSatuSehatSpreadsheetId,
        sheetNameWeekly,
      );
      await this.googleSheetsService.createSheet(
        bridgingSpreadsheetId,
        sheetNameBridging,
      );
      await this.googleSheetsService.createSheet(
        bridgingBpjsSpreadsheetId,
        sheetNameAlltime,
      );
      await this.googleSheetsService.createSheet(
        bridgingSatuSehatSpreadsheetId,
        sheetNameAlltime,
      );

      // Update different spreadsheets with respective data
      await this.googleSheetsService.appendData(
        bridgingSpreadsheetId,
        sheetNameBridging,
        bridgingData,
      );
      await this.googleSheetsService.appendData(
        bridgingBpjsSpreadsheetId,
        sheetNameWeekly,
        bridgingBpjsData.Weekly,
      );
      await this.googleSheetsService.appendData(
        bridgingBpjsSpreadsheetId,
        sheetNameAlltime,
        bridgingBpjsData.Alltime,
      );
      await this.googleSheetsService.appendData(
        bridgingSatuSehatSpreadsheetId,
        sheetNameWeekly,
        bridgingSatuSehatData.Weekly,
      );
      await this.googleSheetsService.appendData(
        bridgingSatuSehatSpreadsheetId,
        sheetNameAlltime,
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
