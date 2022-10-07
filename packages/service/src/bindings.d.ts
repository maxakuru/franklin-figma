declare global {
  export interface Process {
    env: {
      NODE_ENV: 'development' | 'production';
      UPSTREAM: string;
      MICROSOFT_CLIENT_ID: string;
      MICROSOFT_CLIENT_SECRET: string;
      GOOGLE_API_KEY: string;
      GOOGLE_CLIENT_ID: string;
      GOOGLE_CLIENT_SECRET: string;
      GOOGLE_DEVICECODE_CLIENT_SECRET: string;
      UI_ENDPOINT: string;
      ENDPOINT: string;
    }
  }

  export const process: Process;
}

export { };
