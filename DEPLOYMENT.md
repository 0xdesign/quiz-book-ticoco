# Quiz Book Deployment Guide

This guide covers deploying the Quiz Book (Ticoco) application to production environments.

## Prerequisites

Before deploying, ensure you have:

1. **API Keys and Services**:
   - OpenAI API key with GPT-4 access
   - Stripe account with API keys
   - Supabase project with database
   - Resend account for email delivery

2. **Infrastructure**:
   - Vercel account (recommended) or similar platform
   - Domain name (optional but recommended)
   - SSL certificate (handled by platform)

## Environment Setup

### 1. Supabase Database Setup

Run the database schema:

```sql
-- Copy and run the contents of database.sql in your Supabase SQL editor
```

Enable Row Level Security and create necessary policies:

```sql
-- Enable RLS on all tables
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;  
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access
CREATE POLICY "Service role can manage books" ON books FOR ALL USING (true);
CREATE POLICY "Service role can manage downloads" ON downloads FOR ALL USING (true);
CREATE POLICY "Service role can manage events" ON events FOR ALL USING (true);
```

### 2. Stripe Configuration

1. **Create Products**:
   - Create a product for "Personalized Story Book"
   - Set price to $19.99
   - Note the price ID for configuration

2. **Configure Webhooks**:
   - Add webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy webhook secret for configuration

### 3. Email Templates

Set up Resend with appropriate templates:

```typescript
// Default template - can be customized
const emailTemplate = `
<h1>Your Personalized Story is Ready!</h1>
<p>Dear Parent,</p>
<p>We're excited to share that {{childName}}'s personalized story has been created and is ready to download!</p>
<p><a href="{{downloadLink}}">Download Your Story</a></p>
<p>This link will expire in 24 hours and can be used up to 3 times.</p>
<p>Thank you for choosing Quiz Book!</p>
`
```

## Deployment Options

### Option 1: Vercel (Recommended)

1. **Connect Repository**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy from project directory
   cd quiz-book
   vercel
   ```

2. **Configure Environment Variables**:
   In Vercel dashboard, add all variables from `.env.example`:
   ```
   OPENAI_API_KEY=sk-prod-your-key
   STRIPE_SECRET_KEY=sk_live_your-key
   STRIPE_PUBLISHABLE_KEY=pk_live_your-key
   STRIPE_WEBHOOK_SECRET=whsec_your-secret
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-key
   RESEND_API_KEY=re_your-key
   NEXT_PUBLIC_BASE_URL=https://your-domain.com
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

### Option 2: Docker Deployment

1. **Build Docker Image**:
   ```bash
   docker build -t quiz-book .
   ```

2. **Run with Environment Variables**:
   ```bash
   docker run -p 3000:3000 \
     -e OPENAI_API_KEY=your-key \
     -e STRIPE_SECRET_KEY=your-key \
     -e NEXT_PUBLIC_SUPABASE_URL=your-url \
     -e SUPABASE_SERVICE_ROLE_KEY=your-key \
     -e RESEND_API_KEY=your-key \
     quiz-book
   ```

3. **Docker Compose**:
   ```yaml
   version: '3.8'
   services:
     quiz-book:
       build: .
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - OPENAI_API_KEY=${OPENAI_API_KEY}
         - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
         - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
         - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
         - RESEND_API_KEY=${RESEND_API_KEY}
   ```

## Production Configuration

### Environment Variables

**Required Production Variables**:
```bash
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://your-domain.com
OPENAI_API_KEY=sk-prod-your-openai-key
STRIPE_SECRET_KEY=sk_live_your-stripe-key
STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=re_your-resend-key
```

**Optional Production Variables**:
```bash
ENABLE_RATE_LIMITING=true
RATE_LIMIT_MAX_REQUESTS=50
RATE_LIMIT_WINDOW_MS=900000
ENABLE_ERROR_REPORTING=true
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=warn
```

### Security Checklist

- [ ] All API keys are production keys (not test keys)
- [ ] HTTPS is enabled with valid SSL certificate
- [ ] Rate limiting is enabled
- [ ] CORS is properly configured
- [ ] Environment variables are secure and not exposed
- [ ] Database has proper access controls
- [ ] Webhook endpoints are verified

### Performance Optimization

1. **Enable Compression**:
   - Gzip/Brotli compression (handled by platform)
   - Image optimization (Next.js automatic)

2. **Caching**:
   ```javascript
   // next.config.ts
   const nextConfig = {
     headers: async () => [
       {
         source: '/api/:path*',
         headers: [
           { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }
         ]
       }
     ]
   }
   ```

3. **Database Connection Pooling**:
   - Supabase handles this automatically
   - Monitor connection usage in dashboard

## Monitoring and Maintenance

### Health Checks

Create a health check endpoint:
```typescript
// pages/api/health.ts
export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  })
}
```

### Error Monitoring

1. **Set up Sentry** (optional):
   ```bash
   npm install @sentry/nextjs
   ```

2. **Monitor Key Metrics**:
   - Story generation success rate
   - Payment completion rate
   - Email delivery rate
   - API response times
   - Error rates by type

### Backup Strategy

1. **Database Backups**:
   - Supabase provides automatic backups
   - Enable point-in-time recovery
   - Test restore procedures

2. **File Backups**:
   - PDFs are temporary files
   - Consider cloud storage for permanent retention

## Testing in Production

### Smoke Tests

Run these tests after deployment:

1. **Quiz Flow**:
   ```bash
   # Test complete quiz submission
   curl -X POST https://your-domain.com/api/create-story \
     -H "Content-Type: application/json" \
     -d '{"childName":"Test","childAge":"5","childTraits":["Brave"],"favoriteThings":["Animals"],"storyType":"everyday-adventure","parentEmail":"test@example.com","parentConsent":true}'
   ```

2. **Payment Processing**:
   - Use Stripe test cards
   - Verify webhook delivery
   - Check email notifications

3. **PDF Generation**:
   - Test download links
   - Verify PDF quality
   - Check file sizes

### Load Testing

Use tools like Apache Bench or Artillery:

```bash
# Basic load test
ab -n 100 -c 10 https://your-domain.com/

# API endpoint test
ab -n 50 -c 5 -p test-data.json -T application/json https://your-domain.com/api/create-story
```

## Scaling Considerations

### Traffic Patterns

- Peak usage: Evenings and weekends
- Seasonal spikes: Holidays, back-to-school
- Geographic distribution: Consider CDN

### Scaling Strategy

1. **Horizontal Scaling**:
   - Vercel scales automatically
   - Database connection pooling
   - API rate limiting

2. **Vertical Scaling**:
   - Monitor memory usage for PDF generation
   - OpenAI API rate limits
   - Email delivery quotas

3. **Cost Optimization**:
   - Monitor OpenAI usage
   - Optimize story generation prompts
   - Cache generated content where appropriate

## Troubleshooting

### Common Issues

1. **Story Generation Timeouts**:
   - Check OpenAI API status
   - Verify API key and quotas
   - Monitor prompt length

2. **Payment Failures**:
   - Verify Stripe webhook configuration
   - Check webhook logs
   - Test with different card types

3. **Email Delivery Issues**:
   - Check Resend dashboard
   - Verify DNS records
   - Monitor bounce rates

### Debug Commands

```bash
# Check deployment logs
vercel logs

# Test database connection
curl https://your-domain.com/api/health

# Validate environment variables
vercel env ls
```

## Security Updates

### Regular Maintenance

- [ ] Update dependencies monthly
- [ ] Review security advisories
- [ ] Rotate API keys quarterly
- [ ] Monitor for unusual activity
- [ ] Test backup/restore procedures

### Security Monitoring

- Set up alerts for:
  - Failed authentication attempts
  - Unusual traffic patterns
  - Error rate spikes
  - Payment anomalies

---

## Support

For deployment issues:

1. Check application logs
2. Review environment variable configuration
3. Test individual API endpoints
4. Contact platform support if needed

Remember to test thoroughly in a staging environment before deploying to production!