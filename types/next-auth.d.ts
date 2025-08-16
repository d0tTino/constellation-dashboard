import { DefaultSession } from 'next-auth'

// Extend the default session type to include the user id
declare module 'next-auth' {
  interface Session {
    user?: {
      id: string
    } & DefaultSession['user']
    groups?: string[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    groups?: string[]
  }
}
