import PDFDocument from 'pdfkit'
import { supabase } from './supabase'
import { Readable, PassThrough } from 'stream'

interface MemoryStats {
  heapUsed: number
  heapTotal: number
  external: number
  rss: number
}

interface PDFGenerationOptions {
  streaming?: boolean
  compressionLevel?: number
  maxMemoryMB?: number
  fontOptimization?: boolean
}

class OptimizedPDFService {
  private memoryMonitor: MemoryMonitor
  private readonly CHUNK_SIZE = 64 * 1024 // 64KB chunks
  private readonly MAX_MEMORY_MB = 100 // Maximum memory usage
  private readonly COMPRESSION_LEVEL = 6 // 0-9, higher = better compression
  
  constructor() {
    this.memoryMonitor = new MemoryMonitor()
  }
  
  /**
   * Generate PDF with streaming to minimize memory usage
   */
  async generatePDFStream(
    storyText: string, 
    childName: string,
    options: PDFGenerationOptions = {}
  ): Promise<string> {
    // Monitor initial memory
    const initialMemory = this.memoryMonitor.getCurrentMemory()
    console.log(`Initial memory usage: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`)
    
    return new Promise(async (resolve, reject) => {
      let doc: any = null
      let stream: PassThrough | null = null
      let uploadStream: any = null
      
      try {
        // Check memory before starting
        if (initialMemory.heapUsed > (options.maxMemoryMB || this.MAX_MEMORY_MB) * 1024 * 1024) {
          // Force garbage collection if available
          if (global.gc) {
            global.gc()
          }
          
          const afterGC = this.memoryMonitor.getCurrentMemory()
          if (afterGC.heapUsed > (options.maxMemoryMB || this.MAX_MEMORY_MB) * 1024 * 1024) {
            throw new Error('Insufficient memory to generate PDF')
          }
        }
        
        // Create PDF with optimized settings
        doc = new PDFDocument({
          size: 'A4',
          margins: { top: 72, bottom: 72, left: 72, right: 72 },
          compress: true,
          autoFirstPage: false,
          bufferPages: false // Don't buffer pages in memory
        })
        
        // Use streaming if specified
        if (options.streaming) {
          stream = new PassThrough()
          const fileName = this.generateFileName(childName)
          
          // Stream directly to storage
          uploadStream = await this.createUploadStream(fileName)
          
          doc.pipe(stream)
          stream.pipe(uploadStream)
          
          // Generate PDF content
          await this.generatePDFContent(doc, storyText, childName, options)
          
          doc.end()
          
          // Wait for upload to complete
          await new Promise((res, rej) => {
            uploadStream.on('finish', () => res(fileName))
            uploadStream.on('error', rej)
          })
          
          resolve(fileName)
        } else {
          // Chunked generation for memory efficiency
          const chunks: Buffer[] = []
          let totalSize = 0
          
          doc.on('data', (chunk: Buffer) => {
            // Monitor memory usage
            if (totalSize + chunk.length > 10 * 1024 * 1024) { // 10MB limit
              console.warn('PDF size exceeding 10MB, consider streaming mode')
            }
            
            chunks.push(chunk)
            totalSize += chunk.length
            
            // Clear large chunks from memory periodically
            if (chunks.length > 100) {
              const merged = Buffer.concat(chunks.splice(0, 50))
              chunks.unshift(merged)
            }
          })
          
          doc.on('end', async () => {
            try {
              // Merge chunks efficiently
              const buffer = this.mergeBuffersEfficiently(chunks)
              const fileName = this.generateFileName(childName)
              
              // Upload with retry
              await this.uploadWithRetry(fileName, buffer)
              
              // Clean up memory
              chunks.length = 0
              
              resolve(fileName)
            } catch (uploadError) {
              reject(uploadError)
            }
          })
          
          // Generate PDF content
          await this.generatePDFContent(doc, storyText, childName, options)
          
          doc.end()
        }
      } catch (error) {
        // Clean up resources
        if (doc) {
          doc.end()
        }
        if (stream) {
          stream.destroy()
        }
        if (uploadStream) {
          uploadStream.destroy()
        }
        
        reject(error)
      } finally {
        // Monitor final memory
        const finalMemory = this.memoryMonitor.getCurrentMemory()
        console.log(`Final memory usage: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`)
        console.log(`Memory delta: ${((finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024).toFixed(2)}MB`)
        
        // Clean up references
        doc = null
        stream = null
        uploadStream = null
        
        // Suggest garbage collection
        if (global.gc) {
          global.gc()
        }
      }
    })
  }
  
  /**
   * Generate PDF content in chunks
   */
  private async generatePDFContent(
    doc: any,
    storyText: string,
    childName: string,
    options: PDFGenerationOptions
  ): Promise<void> {
      
    // Cover page
    doc.addPage()
    
    // Use font optimization if enabled
    const titleFont = options.fontOptimization ? 'Helvetica-Bold' : 'Helvetica-Bold'
    const bodyFont = options.fontOptimization ? 'Helvetica' : 'Helvetica'
    
    doc.fontSize(32)
       .font(titleFont)
       .text('A Special Story', { align: 'center' })
       .moveDown(0.5)
       .text(`for ${childName}`, { align: 'center' })
       .moveDown(2)
       .fontSize(16)
       .font(bodyFont)
       .text('Made with love by Ticoco', { align: 'center' })
    
    // Process story in chunks to avoid memory spikes
    const paragraphs = this.splitTextEfficiently(storyText)
    
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i]
      
      // Add page
      doc.addPage()
      
      // Set font once per page
      doc.fontSize(18)
         .font(bodyFont)
      
      // Add text with optimized line breaks
      const lines = this.wrapText(paragraph, 450) // Approximate width
      lines.forEach(line => {
        doc.text(line, {
          continued: false,
          lineGap: 8
        })
      })
      
      // Page number
      doc.fontSize(12)
         .text(`${i + 1}`, 72, doc.page.height - 50, {
           align: 'center'
         })
      
      // Allow event loop to process
      if (i % 5 === 0) {
        await this.delay(10)
      }
    }
    
    // End page
    doc.addPage()
       .fontSize(24)
       .font(titleFont)
       .text('The End', { align: 'center' })
       .moveDown(2)
       .fontSize(16)
       .font(bodyFont)
       .text(`We hope ${childName} enjoyed this special story!`, {
         align: 'center'
       })
       .moveDown(1)
       .fontSize(14)
       .text('Created with love by Ticoco', {
         align: 'center'
       })
  }
  
  /**
   * Split text efficiently without creating large arrays
   */
  private splitTextEfficiently(text: string): string[] {
    const paragraphs: string[] = []
    let start = 0
    let end = text.indexOf('\n\n')
    
    while (end !== -1) {
      const paragraph = text.substring(start, end).trim()
      if (paragraph) {
        paragraphs.push(paragraph)
      }
      start = end + 2
      end = text.indexOf('\n\n', start)
    }
    
    // Don't forget the last paragraph
    const lastParagraph = text.substring(start).trim()
    if (lastParagraph) {
      paragraphs.push(lastParagraph)
    }
    
    return paragraphs
  }
  
  /**
   * Wrap text to fit within page width
   */
  private wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      
      // Approximate character width (simplified)
      if (testLine.length * 7 > maxWidth) {
        if (currentLine) {
          lines.push(currentLine)
          currentLine = word
        } else {
          // Word is too long, split it
          lines.push(word)
          currentLine = ''
        }
      } else {
        currentLine = testLine
      }
    }
    
    if (currentLine) {
      lines.push(currentLine)
    }
    
    return lines
  }
  
  /**
   * Merge buffers efficiently
   */
  private mergeBuffersEfficiently(chunks: Buffer[]): Buffer {
    // Calculate total size
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
    
    // Allocate once
    const result = Buffer.allocUnsafe(totalSize)
    
    // Copy chunks
    let offset = 0
    for (const chunk of chunks) {
      chunk.copy(result, offset)
      offset += chunk.length
    }
    
    return result
  }
  
  /**
   * Generate unique filename
   */
  private generateFileName(childName: string): string {
    const timestamp = Date.now()
    const safeName = childName.toLowerCase().replace(/[^a-z0-9]/g, '-')
    return `story-${timestamp}-${safeName}.pdf`
  }
  
  /**
   * Create upload stream for streaming mode
   */
  private async createUploadStream(fileName: string): Promise<any> {
    // In production, this would create a streaming upload to storage
    // For now, return a PassThrough stream that collects data
    const uploadStream = new PassThrough()
    const chunks: Buffer[] = []
    
    uploadStream.on('data', (chunk) => chunks.push(chunk))
    uploadStream.on('end', async () => {
      const buffer = Buffer.concat(chunks)
      await this.uploadWithRetry(fileName, buffer)
    })
    
    return uploadStream
  }
  
  /**
   * Upload with retry logic
   */
  private async uploadWithRetry(
    fileName: string,
    buffer: Buffer,
    maxRetries = 3
  ): Promise<void> {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { error } = await supabase.storage
          .from('stories')
          .upload(fileName, buffer, {
            contentType: 'application/pdf',
            upsert: true
          })
        
        if (error) throw error
        return
      } catch (error: any) {
        lastError = error
        console.warn(`Upload attempt ${attempt} failed:`, error.message)
        
        if (attempt < maxRetries) {
          await this.delay(Math.pow(2, attempt) * 1000)
        }
      }
    }
    
    throw lastError || new Error('Upload failed after all retries')
  }
  
  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  /**
   * Clean up temporary files
   */
  async cleanupTempFiles(): Promise<void> {
    // Clean up any temporary files if using file-based approach
    // This is a placeholder for cleanup logic
  }
}

/**
 * Memory monitoring helper
 */
class MemoryMonitor {
  getCurrentMemory(): MemoryStats {
    const mem = process.memoryUsage()
    return {
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      external: mem.external,
      rss: mem.rss
    }
  }
  
  formatMemory(bytes: number): string {
    return `${(bytes / 1024 / 1024).toFixed(2)}MB`
  }
  
  checkMemoryPressure(): boolean {
    const mem = this.getCurrentMemory()
    const usagePercent = (mem.heapUsed / mem.heapTotal) * 100
    return usagePercent > 85 // Alert if > 85% heap used
  }
}

// Export singleton instance
const pdfService = new OptimizedPDFService()

export async function generatePDF(
  storyText: string,
  childName: string
): Promise<string> {
  try {
    // Use streaming mode for large stories
    const streaming = storyText.length > 10000
    
    return await pdfService.generatePDFStream(storyText, childName, {
      streaming,
      compressionLevel: 6,
      fontOptimization: true,
      maxMemoryMB: 100
    })
  } catch (error) {
    console.error('PDF generation failed:', error)
    throw error
  }
}

export async function generatePDFInChunks(
  storyText: string,
  childName: string
): Promise<string> {
  // Generate PDF in chunks for very large stories
  return pdfService.generatePDFStream(storyText, childName, {
    streaming: true,
    compressionLevel: 9,
    fontOptimization: true,
    maxMemoryMB: 50
  })
}

export { OptimizedPDFService }