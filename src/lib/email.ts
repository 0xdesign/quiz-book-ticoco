import { Resend } from 'resend'

// Create resend instance only if API key is available
let resend: Resend | null = null

if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'demo_resend_key') {
  resend = new Resend(process.env.RESEND_API_KEY)
}

export async function sendEmail(options: {
  to: string
  subject: string
  html: string
  attachments?: Array<{
    filename: string
    content: string
  }>
}) {
  if (!resend) {
    console.log('📧 Email (demo mode):', { to: options.to, subject: options.subject })
    return { id: 'demo_email_' + Date.now() }
  }
  
  return resend.emails.send({
    from: 'Ticoco <stories@ticoco.app>',
    to: options.to,
    subject: options.subject,
    html: options.html
  })
}

export async function sendStoryEmail({
  to,
  childName,
  downloadToken
}: {
  to: string
  childName: string
  downloadToken: string
}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const downloadUrl = `${baseUrl}/download/${downloadToken}`
  
  if (!resend) {
    console.log('📧 Story email (demo mode):', { to, childName, downloadUrl })
    return { id: 'demo_story_email_' + Date.now() }
  }
  
  await resend.emails.send({
    from: 'Ticoco <stories@ticoco.app>',
    to,
    subject: `${childName}'s personalized story is ready! 📚`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${childName}'s Story is Ready!</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f9fafb; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .title { color: #3b82f6; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .subtitle { color: #6b7280; font-size: 16px; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 20px 0; }
          .button:hover { background: #2563eb; }
          .info { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="title">🎉 ${childName}'s Story is Ready!</div>
            <div class="subtitle">Your personalized children's book has been created</div>
          </div>
          
          <p>Dear Parent,</p>
          
          <p>Thank you for creating a personalized story with Ticoco! We're excited to share that <strong>${childName}'s special adventure</strong> is now ready for download.</p>
          
          <div style="text-align: center;">
            <a href="${downloadUrl}" class="button">📱 Download ${childName}'s Story</a>
          </div>
          
          <div class="info">
            <h3>📖 What's Inside:</h3>
            <ul>
              <li>A personalized story featuring ${childName} as the hero</li>
              <li>10+ pages of engaging, age-appropriate content</li>
              <li>High-quality PDF perfect for reading on any device</li>
              <li>A story that ${childName} will want to hear again and again</li>
            </ul>
          </div>
          
          <div class="info">
            <h3>💡 Reading Tips:</h3>
            <ul>
              <li>Save the PDF to your device for offline reading</li>
              <li>Read aloud with ${childName} for the best experience</li>
              <li>This download link expires in 7 days</li>
              <li>You can download the story multiple times</li>
            </ul>
          </div>
          
          <p>We hope ${childName} absolutely loves their personalized adventure! If you have any questions, just reply to this email.</p>
          
          <p>Happy reading! 📚✨</p>
          
          <div class="footer">
            <p><strong>The Ticoco Team</strong></p>
            <p>Creating magical stories, one child at a time</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
}