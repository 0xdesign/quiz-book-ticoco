import PDFDocument from 'pdfkit'
import { supabase } from './supabase'

export async function generatePDF(
  storyText: string, 
  childName: string
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 72, bottom: 72, left: 72, right: 72 }
      })
      
      const chunks: Buffer[] = []
      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', async () => {
        try {
          // Upload PDF to Supabase storage
          const buffer = Buffer.concat(chunks)
          const fileName = `story-${Date.now()}-${childName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`
          
          const { data, error } = await supabase.storage
            .from('stories')
            .upload(fileName, buffer, {
              contentType: 'application/pdf'
            })
          
          if (error) throw error
          
          resolve(data.path)
        } catch (uploadError) {
          reject(uploadError)
        }
      })
      
      // Cover page
      doc.fontSize(32)
         .font('Helvetica-Bold')
         .text('A Special Story', { align: 'center' })
         .moveDown(0.5)
         .text(`for ${childName}`, { align: 'center' })
         .moveDown(2)
         .fontSize(16)
         .font('Helvetica')
         .text('Made with love by Ticoco', { align: 'center' })
      
      // Story pages
      const paragraphs = storyText.split('\n\n').filter(p => p.trim())
      paragraphs.forEach((paragraph, index) => {
        doc.addPage()
           .fontSize(18)
           .font('Helvetica')
           .text(paragraph.trim(), {
             align: 'left',
             lineGap: 8
           })
        
        // Page number
        doc.fontSize(12)
           .text(`${index + 1}`, 72, doc.page.height - 50, {
             align: 'center'
           })
      })
      
      // End page
      doc.addPage()
         .fontSize(24)
         .font('Helvetica-Bold')
         .text('The End', { align: 'center' })
         .moveDown(2)
         .fontSize(16)
         .font('Helvetica')
         .text(`We hope ${childName} enjoyed this special story!`, {
           align: 'center'
         })
         .moveDown(1)
         .fontSize(14)
         .text('Created with love by Ticoco', {
           align: 'center'
         })
      
      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}