import NextAuth, { DefaultSession } from 'next-auth'

// Extend the default session type to include the user id
declare module 'next-auth' {
  interface Session {
    user?: {
      id: string
    } & DefaultSession['user']
  }
}
