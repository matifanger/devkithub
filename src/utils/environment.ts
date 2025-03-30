import { app } from 'electron';

export const baseApi = app.isPackaged ? 'https://devkithub.com' : 'http://localhost:4000';
