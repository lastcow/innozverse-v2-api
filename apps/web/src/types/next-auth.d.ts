import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      role: string;
      oauthProvider?: string;
    };
    accessToken: string;
  }

  interface User {
    id: string;
    email: string;
    role?: string;
    accessToken?: string;
    oauthProvider?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    role?: string;
    oauthProvider?: string;
  }
}
