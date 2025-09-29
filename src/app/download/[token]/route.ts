import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { MAX_DOWNLOADS } from '@/lib/config'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Get download record with book data
    const { data: download, error: downloadError } = await supabase
      .from('downloads')
      .select(`
        *,
        books (
          id,
          quiz_data,
          pdf_url,
          payment_status
        )
      `)
      .eq('token', token)
      .single()

    if (downloadError || !download) {
      return new NextResponse('Download link not found', { status: 404 })
    }

    // Check if token is expired
    if (new Date(download.expires_at) < new Date()) {
      return new NextResponse('Download link has expired', { status: 410 })
    }

    // Check if payment is completed
    if (download.books.payment_status !== 'completed') {
      return new NextResponse('Payment required', { status: 402 })
    }

    // Enforce maximum number of downloads
    if (typeof download.downloads_count === 'number' && download.downloads_count >= MAX_DOWNLOADS) {
      return new NextResponse('Download limit reached', { status: 429 })
    }

    // Check if PDF exists
    if (!download.books.pdf_url) {
      return new NextResponse('Story is still being generated. Please try again in a few minutes.', { status: 202 })
    }

    // Increment download count
    await supabase
      .from('downloads')
      .update({ 
        downloads_count: download.downloads_count + 1 
      })
      .eq('token', token)

    // Track download event
    await supabase
      .from('events')
      .insert({
        event_type: 'download_accessed',
        book_id: download.book_id,
        metadata: {
          token,
          download_count: download.downloads_count + 1
        }
      })

    // Get PDF from Supabase storage
    const { data: pdfData, error: storageError } = await supabase.storage
      .from('stories')
      .download(download.books.pdf_url)

    if (storageError || !pdfData) {
      console.error('Storage error:', storageError)
      return new NextResponse('PDF file not found', { status: 404 })
    }

    // Convert blob to buffer
    const buffer = Buffer.from(await pdfData.arrayBuffer())

    // Return PDF with proper headers
    const childName = download.books.quiz_data.childName
    const filename = `${childName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-story.pdf`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'private, no-cache'
      }
    })
  } catch (error) {
    console.error('Download error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
