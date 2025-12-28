import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma, verifyPassword, logAudit } from 'db'

// IP Whitelist for Super Admin Access (optional but recommended)
const ALLOWED_IPS = process.env.SUPER_ADMIN_IP_WHITELIST?.split(',') || []

/**
 * Extract client IP address from request headers
 */
function getClientIP(req: any): string {
  const forwarded = req?.headers?.['x-forwarded-for']
  const realIP = req?.headers?.['x-real-ip']
  const ip = req?.ip || req?.connection?.remoteAddress

  if (forwarded) {
    return (typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0]).trim()
  }
  if (realIP) {
    return typeof realIP === 'string' ? realIP : realIP[0]
  }
  return ip || 'unknown'
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Extract client IP
        const clientIP = getClientIP(req)

        // CRITICAL SECURITY: Check IP whitelist if configured
        if (ALLOWED_IPS.length > 0 && !ALLOWED_IPS.includes(clientIP)) {
          console.warn(`[SECURITY] Super admin login blocked from unauthorized IP: ${clientIP}`)

          await logAudit({
            action: 'SUPER_ADMIN_LOGIN_BLOCKED',
            userId: null,
            resourceId: null,
            resourceType: 'AUTH',
            metadata: JSON.stringify({
              email: credentials.email,
              reason: 'IP not whitelisted',
              ip: clientIP,
            }),
            ipAddress: clientIP,
            userAgent: req?.headers?.['user-agent'] || 'unknown',
          })

          return null
        }

        // Find user in database
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        })

        if (!user) {
          await logAudit({
            action: 'SUPER_ADMIN_LOGIN_FAILED',
            userId: null,
            resourceId: null,
            resourceType: 'AUTH',
            metadata: JSON.stringify({
              email: credentials.email,
              reason: 'User not found',
            }),
            ipAddress: clientIP,
            userAgent: req?.headers?.['user-agent'] || 'unknown',
          })

          return null
        }

        // CRITICAL SECURITY: Enforce SUPER_ADMIN role
        if (user.role !== 'SUPER_ADMIN') {
          console.warn(`[SECURITY] Non-super-admin user attempted super-admin login: ${user.email} (role: ${user.role})`)

          await logAudit({
            action: 'SUPER_ADMIN_LOGIN_DENIED',
            userId: user.id,
            resourceId: user.id,
            resourceType: 'AUTH',
            metadata: JSON.stringify({
              email: user.email,
              role: user.role,
              reason: 'Insufficient privileges - SUPER_ADMIN role required',
            }),
            ipAddress: clientIP,
            userAgent: req?.headers?.['user-agent'] || 'unknown',
          })

          return null
        }

        // Verify password using bcrypt
        const isPasswordValid = await verifyPassword(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          await logAudit({
            action: 'SUPER_ADMIN_LOGIN_FAILED',
            userId: user.id,
            resourceId: user.id,
            resourceType: 'AUTH',
            metadata: JSON.stringify({
              email: user.email,
              reason: 'Invalid password',
            }),
            ipAddress: clientIP,
            userAgent: req?.headers?.['user-agent'] || 'unknown',
          })

          return null
        }

        // Success - log super admin access
        await logAudit({
          action: 'SUPER_ADMIN_LOGIN_SUCCESS',
          userId: user.id,
          resourceId: user.id,
          resourceType: 'AUTH',
          metadata: JSON.stringify({
            email: user.email,
            role: user.role,
          }),
          ipAddress: clientIP,
          userAgent: req?.headers?.['user-agent'] || 'unknown',
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.tenantId = (user as any).tenantId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        (session.user as any).role = token.role
        (session.user as any).tenantId = token.tenantId

        // SECURITY: Double-check role on every session access
        if (token.role !== 'SUPER_ADMIN') {
          console.error('[SECURITY] Invalid session detected - non-SUPER_ADMIN role')
          throw new Error('Unauthorized access')
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 15 * 60, // SECURITY: 15 minutes session timeout for super admin
  },
  secret: process.env.NEXTAUTH_SECRET,
}
