import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

/**
 * Upload image files
 * POST /api/upload
 *
 * This is a basic file upload implementation.
 * For production, use cloud storage like AWS S3, Cloudinary, or Uploadthing.
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

    // Only admins can upload
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'hotel' or 'room'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      )
    }

    // Create unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `${type || 'upload'}-${timestamp}.${extension}`

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', type || 'general')

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Save file
    const buffer = Buffer.from(await file.arrayBuffer())
    const filepath = join(uploadDir, filename)
    await writeFile(filepath, buffer)

    // Return URL
    const url = `/uploads/${type || 'general'}/${filename}`

    return NextResponse.json({
      success: true,
      url,
      filename,
      size: file.size,
      type: file.type,
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      {
        error: 'Failed to upload file',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * Upload multiple images
 * POST /api/upload/multiple
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = session.user as any

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const type = formData.get('type') as string

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    const uploadedFiles: any[] = []
    const maxSize = 5 * 1024 * 1024 // 5MB
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

    for (const file of files) {
      // Validate each file
      if (!validTypes.includes(file.type)) {
        continue // Skip invalid files
      }

      if (file.size > maxSize) {
        continue // Skip files that are too large
      }

      // Create filename
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(7)
      const extension = file.name.split('.').pop()
      const filename = `${type || 'upload'}-${timestamp}-${randomId}.${extension}`

      // Create directory
      const uploadDir = join(process.cwd(), 'public', 'uploads', type || 'general')

      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true })
      }

      // Save file
      const buffer = Buffer.from(await file.arrayBuffer())
      const filepath = join(uploadDir, filename)
      await writeFile(filepath, buffer)

      uploadedFiles.push({
        url: `/uploads/${type || 'general'}/${filename}`,
        filename,
        size: file.size,
        type: file.type,
      })
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      count: uploadedFiles.length,
    })
  } catch (error: any) {
    console.error('Multiple upload error:', error)
    return NextResponse.json(
      {
        error: 'Failed to upload files',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
