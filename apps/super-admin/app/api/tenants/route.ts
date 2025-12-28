import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from 'db'
import { logAudit, AuditAction } from 'db/auditLog'
import { hashPassword } from 'db/password'

/**
 * Get all tenants (Super Admin only)
 * GET /api/tenants?page=1&limit=20&search=keyword
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = session.user as any

    // Only super admins can access
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { subdomain: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Fetch tenants with stats
    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        include: {
          _count: {
            select: {
              hotels: true,
              users: true,
            },
          },
          hotels: {
            select: {
              id: true,
              name: true,
              _count: {
                select: {
                  bookings: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.tenant.count({ where }),
    ])

    return NextResponse.json({
      tenants,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Get tenants error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tenants' },
      { status: 500 }
    )
  }
}

/**
 * Create new tenant (Super Admin only)
 * POST /api/tenants
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = session.user as any

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      subdomain,
      logoUrl,
      theme,
      adminEmail,
      adminName,
      adminPassword,
    } = body

    // Validate required fields
    if (!name || !subdomain || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if subdomain is already taken
    const existing = await prisma.tenant.findUnique({
      where: { subdomain },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Subdomain already taken' },
        { status: 409 }
      )
    }

    // Check if admin email is already used
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Admin email already in use' },
        { status: 409 }
      )
    }

    // Create tenant and admin user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name,
          subdomain,
          logoUrl,
          theme: theme ? JSON.stringify(theme) : null,
          isActive: true,
        },
      })

      // Hash password
      const hashedPassword = await hashPassword(adminPassword)

      // Create admin user
      const admin = await tx.user.create({
        data: {
          email: adminEmail,
          name: adminName || 'Admin',
          password: hashedPassword,
          role: 'ADMIN',
          tenantId: tenant.id,
          emailVerified: true,
        },
      })

      return { tenant, admin }
    })

    // Log audit
    await logAudit({
      action: AuditAction.TENANT_CREATE,
      userId: user.id,
      resourceId: result.tenant.id,
      resourceType: 'TENANT',
      metadata: {
        tenantName: name,
        subdomain,
        adminEmail,
      },
    })

    return NextResponse.json(
      {
        success: true,
        tenant: result.tenant,
        admin: {
          id: result.admin.id,
          email: result.admin.email,
          name: result.admin.name,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Create tenant error:', error)
    return NextResponse.json(
      { error: 'Failed to create tenant' },
      { status: 500 }
    )
  }
}
