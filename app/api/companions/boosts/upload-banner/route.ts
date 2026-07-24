import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { getSession } from '@/lib/session'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Max file size: 5 MB
const MAX_BYTES = 5 * 1024 * 1024

function uploadToCloudinary(buffer: Buffer, folder: string): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (err, r) => {
        if (err || !r) return reject(err ?? new Error('Upload failed'))
        resolve({ url: r.secure_url, publicId: r.public_id })
      }
    )
    stream.end(buffer)
  })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  if (buffer.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large — max 5 MB' }, { status: 400 })
  }

  try {
    const { url } = await uploadToCloudinary(buffer, 'companion-boost-banners')
    return NextResponse.json({ url })
  } catch (err) {
    console.error('[upload-banner] Cloudinary error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
