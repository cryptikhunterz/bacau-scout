import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getSupabaseAdmin, ATTACHMENTS_BUCKET } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = [
  'application/pdf',
  'video/mp4',
  'video/quicktime',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const ALLOWED_EXTENSIONS = ['pdf', 'mp4', 'mov', 'jpg', 'jpeg', 'png', 'webp'];

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const reportId = formData.get('reportId') as string | null;
    const label = formData.get('label') as string | null;

    if (!file || !reportId) {
      return NextResponse.json({ error: 'File and reportId are required' }, { status: 400 });
    }

    // Validate file extension
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `File type .${ext} not allowed. Accepted: ${ALLOWED_EXTENSIONS.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `MIME type ${file.type} not allowed` },
        { status: 400 }
      );
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `File too large. Max size: 50MB` },
        { status: 400 }
      );
    }

    // Verify the report exists
    const report = await prisma.scoutingReport.findUnique({
      where: { id: reportId },
    });
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Upload to Supabase Storage
    const supabaseAdmin = getSupabaseAdmin();
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${reportId}/${timestamp}-${sanitizedName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from(ATTACHMENTS_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('[Upload] Supabase upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file to storage' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(ATTACHMENTS_BUCKET)
      .getPublicUrl(storagePath);

    // Save attachment record in DB
    const attachment = await prisma.attachment.create({
      data: {
        reportId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        url: urlData.publicUrl,
        label: label || null,
      },
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error('[Upload] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
