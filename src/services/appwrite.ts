import { Client, Storage } from 'appwrite';

const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || 'demo-project');

export const storage = new Storage(client);

export const BUCKET_ID = '6894f208002ce1ab60b5';

export default client;