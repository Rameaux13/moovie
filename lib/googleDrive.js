// lib/googleDrive.js
import { google } from 'googleapis';

export async function getGoogleDriveService() {
  const credentials = {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

  const drive = google.drive({ version: 'v3', auth });
  return drive;
}

export function getDirectDownloadUrl(fileId) {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

export function getStreamingUrl(fileId) {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}