import { app } from 'electron';

export const baseApi = app.isPackaged ? 'https://api.production.com' : 'http://localhost:4000';
