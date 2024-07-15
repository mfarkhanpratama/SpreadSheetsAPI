import {BindingScope, injectable} from '@loopback/core';
import {google} from 'googleapis';
import {auth} from '../config/google.config';

@injectable({scope: BindingScope.TRANSIENT})
export class GoogleSheetsService {
  private sheets;

  constructor() {
    this.sheets = google.sheets({version: 'v4', auth: auth});
  }

  async createSheet(spreadsheetId: string, sheetName: string) {
    try {
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                },
              },
            },
          ],
        },
      });
    } catch (error) {
      console.error('Error creating new sheet:', error.message);
      throw error;
    }
  }

  async getNextEmptyRow(
    spreadsheetId: string,
    sheetName: string,
  ): Promise<number> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A:A`,
      });

      const numRows = response.data.values ? response.data.values.length : 0;
      return numRows + 1;
    } catch (error) {
      console.error('Error fetching next empty row:', error.message);
      throw error;
    }
  }

  async appendData(spreadsheetId: string, sheetName: string, data: any) {
    if (data.length === 0) return;
    try {
      // Prepare data with headers
      const headers = Object.keys(data[0]);
      const nextEmptyRow = await this.getNextEmptyRow(spreadsheetId, sheetName);
      const values =
        nextEmptyRow === 1
          ? [headers, ...data.map((item: any) => Object.values(item))]
          : data.map((item: any) => Object.values(item)); // menghindari duplikat data

      // nambah data baru
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A${nextEmptyRow}`,
        valueInputOption: 'RAW',
        requestBody: {values},
      });
    } catch (error) {
      console.error('Error appending data:', error.message);
      throw error;
    }
  }
}
