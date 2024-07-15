Sure, here is a concise `README.md` file with step-by-step instructions:

```markdown
# Spreadsheet API with Google Sheets and MongoDB Logging

This project is a Node.js application that integrates with the Google Sheets API and logs data to MongoDB using Winston.

## Prerequisites

- Node.js (v16.17.0)
- npm (v9.6.4)
- Google Cloud project with OAuth2 credentials
- MongoDB instance (Atlas or local)

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/mfarkhanpratama/SpreadSheetsAPI.git
cd SpreadSheetsAPI
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create `.env` File

Create a `.env` file in the root of your project:

```env
MONGODB_URL=your_mongodb_url
BRIDGING_SPREADSHEET_ID=your_bridging_spreadsheet_id
BRIDGING_BPJS_SPREADSHEET_ID=your_bridging_bpjs_spreadsheet_id
BRIDGING_SATU_SEHAT_SPREADSHEET_ID=your_bridging_satu_sehat_spreadsheet_id
DATABASES_HOSTS=http://localhost:3001,http://localhost:3002,http://localhost:3003
```

### 4. Configure Google Cloud

- Create a Google Cloud project.
- Go to sidebar an Select the API AND SERVICES --> +Enable Google Sheets API and Google Drive API.
- Create OAuth 2.0 credentials --> web application --> auth redirect `http://localhost:3000/oauth2callback` and download `client_id.json`.
- Go to Oauth Consent Screen and add test Users with your gmail --> Edit your App --> add Dev Contact --> next --> add scopes which is all Google Drive Api `./auth/drive.file  , ../auth/drive , .../auth/drive.readonly ` and Google Sheets API `./auth/spreadsheets` --> save
- Place `client_id.json` in the `root` directory.

### 5. MongoDB Setup

- If using MongoDB Atlas, create a cluster and get the connection string.
- For local MongoDB, ensure it is running.

### 6. Start the Server

```bash
npm start
```

### 7. Access the Application

Navigate to `http://localhost:3000` to log in with Google.

### 8. Update Spreadsheet

Navigate to `http://localhost:3000/update-spreadsheet` to update Google Sheets with data.

## Logging

Logs are stored in local files and MongoDB:
- `error.log`: Error level logs
- `combined.log`: All logs
- MongoDB: Logs stored in the `log` collection

## File Structure

```
project-root/
├── config/
│   └── google.config.ts
├── controllers/
│   └── google-sheets.controller.ts
├── services/
│   └── google-sheets.service.ts
├── util/
│   └── logger.ts
├── .env
├── package.json
├── README.md
└── tsconfig.json
```
