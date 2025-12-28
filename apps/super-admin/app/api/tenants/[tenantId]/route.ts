import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from 'db'
import { logAudit, AuditAction } from 'db/auditLog'

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = session.user as any
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const tenant = await prisma.tenant.findUnique({
      where: { id: params.tenantId },
      include: {
        _count: { select: { hotels: true, users: true } },
        hotels: {
          include: {
            _count: { select: { rooms: true, bookings: true, reviews: true } }
          }
        },
        users: {
          where: { role: 'ADMIN' },
          select: { id: true, name: true, email: true, createdAt: true }
        }
      }
    })
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }
    return NextResponse.json({ tenant })
  } catch (error: any) {
    console.error('Get tenant error:', error)
    return NextResponse.json({ error: 'Failed to fetch tenant' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = session.user as any
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const body = await request.json()
    const { name, logoUrl, theme, isActive } = body
    const existing = await prisma.tenant.findUnique({
      where: { id: params.tenantId }
    })
    if (!existing) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl
    if (theme !== undefined) updateData.theme = JSON.stringify(theme)
    if (isActive !== undefined) updateData.isActive = isActive
    const tenant = await prisma.tenant.update({
      where: { id: params.tenantId },
      data: updateData
    })
    await logAudit({
      action: AuditAction.TENANT_UPDATE,
      userId: user.id,
      resourceId: params.tenantId,
      resourceType: 'TENANT',
      metadata: { changes: updateData }
    })
    return NextResponse.json({ success: true, tenant })
  } catch (error: any) {
    console.error('Update tenant error:', error)
    return NextResponse.json({ error: 'Failed to update tenant' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = session.user as any
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const tenant = await prisma.tenant.findUnique({
      where: { id: params.tenantId }
    })
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }
    await prisma.tenant.update({
      where: { id: params.tenantId },
      data: { isActive: false }
    })
    await logAudit({
      action: AuditAction.TENANT_DELETE,
      userId: user.id,
      resourceId: params.tenantId,
      resourceType: 'TENANT',
      metadata: { tenantName: tenant.name, subdomain: tenant.subdomain }
    })
    return NextResponse.json({ success: true, message: 'Tenant deactivated successfully' })
  } catch (error: any) {
    console.error('Delete tenant error:', error)
    return NextResponse.json({ error: 'Failed to delete tenant' }, { status: 500 })
  }
}
