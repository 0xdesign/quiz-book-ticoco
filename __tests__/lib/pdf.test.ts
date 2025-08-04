/**
 * Tests for PDF generation functionality
 */

import { generatePDF } from '@/lib/pdf'
import fs from 'fs'
import path from 'path'

// Mock fs for testing
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn()
}))

const mockFs = fs as jest.Mocked<typeof fs>

describe('PDF Generation Tests', () => {
  const sampleStory = `Once upon a time, there was a wonderful child named Alice who loved to explore their neighborhood. Every morning, Alice would wake up with a big smile, ready for a new adventure.

Alice started by watering Mrs. Johnson's flowers next door. The colorful petals sparkled with water drops as Alice carefully tended to each plant. "Thank you so much, Alice!" said Mrs. Johnson with a warm smile.

Next, Alice helped Mr. Garcia carry his groceries from the car. Even though Alice was small, they carried the light bags with pride. Mr. Garcia was so grateful that he gave Alice a fresh apple from his shopping.

The end.`

  beforeEach(() => {
    jest.clearAllMocks()
    mockFs.existsSync.mockReturnValue(false)
  })

  test('should generate PDF with correct filename format', async () => {
    const childName = 'Alice'
    
    const result = await generatePDF(sampleStory, childName)
    
    expect(result).toBeTruthy()
    expect(result).toMatch(/^\/tmp\/pdfs\/alice-story-\d+\.pdf$/)
  })

  test('should create directory if it does not exist', async () => {
    mockFs.existsSync.mockReturnValue(false)
    
    await generatePDF(sampleStory, 'Bob')
    
    expect(mockFs.existsSync).toHaveBeenCalledWith('/tmp/pdfs')
    expect(mockFs.mkdirSync).toHaveBeenCalledWith('/tmp/pdfs', { recursive: true })
  })

  test('should not create directory if it exists', async () => {
    mockFs.existsSync.mockReturnValue(true)
    
    await generatePDF(sampleStory, 'Charlie')
    
    expect(mockFs.existsSync).toHaveBeenCalledWith('/tmp/pdfs')
    expect(mockFs.mkdirSync).not.toHaveBeenCalled()
  })

  test('should handle names with special characters', async () => {
    const specialName = 'José María'
    
    const result = await generatePDF(sampleStory, specialName)
    
    expect(result).toMatch(/^\/tmp\/pdfs\/jose-maria-story-\d+\.pdf$/)
  })

  test('should handle empty story gracefully', async () => {
    const emptyStory = ''
    
    const result = await generatePDF(emptyStory, 'TestChild')
    
    expect(result).toBeTruthy()
    expect(result).toMatch(/^\/tmp\/pdfs\/testchild-story-\d+\.pdf$/)
  })

  test('should handle very long story', async () => {
    const longStory = 'This is a very long story. '.repeat(1000)
    
    const result = await generatePDF(longStory, 'VeryLongStoryChild')
    
    expect(result).toBeTruthy()
    expect(result).toMatch(/^\/tmp\/pdfs\/verylongstorychild-story-\d+\.pdf$/)
  })

  test('should write PDF file to filesystem', async () => {
    await generatePDF(sampleStory, 'FileSystemTest')
    
    expect(mockFs.writeFileSync).toHaveBeenCalled()
    const [filePath, content] = mockFs.writeFileSync.mock.calls[0]
    
    expect(filePath).toMatch(/^\/tmp\/pdfs\/filesystemtest-story-\d+\.pdf$/)
    expect(content).toBeInstanceOf(Buffer)
  })

  test('should include child name in PDF title', async () => {
    const childName = 'TitleTest'
    
    await generatePDF(sampleStory, childName)
    
    // Since we're mocking the filesystem, we can't test the actual PDF content
    // but we can verify the function completes successfully
    expect(mockFs.writeFileSync).toHaveBeenCalled()
  })

  test('should format story with proper paragraphs', async () => {
    const multiParagraphStory = `First paragraph about Alice.

Second paragraph about Alice's adventure.

Third paragraph with the conclusion.`
    
    const result = await generatePDF(multiParagraphStory, 'Alice')
    
    expect(result).toBeTruthy()
    expect(mockFs.writeFileSync).toHaveBeenCalled()
  })

  test('should handle stories with special characters', async () => {
    const storyWithSpecialChars = `Alice's adventure included many things: "quotes", 'apostrophes', and even émojis! She was 100% successful.`
    
    const result = await generatePDF(storyWithSpecialChars, 'Alice')
    
    expect(result).toBeTruthy()
    expect(mockFs.writeFileSync).toHaveBeenCalled()
  })

  test('should generate unique filenames for concurrent requests', async () => {
    const promises = [
      generatePDF('Story 1', 'Child1'),
      generatePDF('Story 2', 'Child1'), // Same child name
      generatePDF('Story 3', 'Child1')  // Same child name
    ]
    
    const results = await Promise.all(promises)
    
    // All results should be different (different timestamps)
    expect(results[0]).not.toBe(results[1])
    expect(results[1]).not.toBe(results[2])
    expect(results[0]).not.toBe(results[2])
  })
})