import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getSupabaseAdmin, ATTACHMENTS_BUCKET } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET all attachments for a report
export async function GET(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId } = await params;

    const attachments = await prisma.attachment.findMany({
      where: { reportId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(attachments);
  } catch (error) {
    console.error('[Attachments GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE an attachment by id (passed as query param ?id=xxx)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId } = await params;
    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get('id');

    if (!attachmentId) {
      return NextResponse.json({ error: 'Attachment id is required' }, { status: 400 });
    }

    // Find the attachment
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment || attachment.reportId !== reportId) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    // Extract storage path from URL to delete from Supabase
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const url = new URL(attachment.url);
      // URL pattern: .../storage/v1/object/public/attachments/<path>
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/attachments\/(.+)/);
      if (pathMatch) {
        const storagePath = decodeURIComponent(pathMatch[1]);
        await supabaseAdmin.storage.from(ATTACHMENTS_BUCKET).remove([storagePath]);
      }
    } catch (storageError) {
      console.error('[Attachments DELETE] Storage cleanup error (continuing):', storageError);
      // Continue to delete DB record even if storage cleanup fails
    }

    // Delete from DB
    await prisma.attachment.delete({
      where: { id: attachmentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Attachments DELETE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
