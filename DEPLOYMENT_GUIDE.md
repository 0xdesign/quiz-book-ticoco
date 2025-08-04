# Quiz Book (Ticoco) - Deployment Guide

## Prerequisites

- Node.js 18+
- Supabase account
- Stripe account
- OpenAI API key
- Resend account for emails

## Deploy to Vercel (Recommended)

### 1. Prepare Environment

```bash
# Create environment file
cp .env.example .env.local

# Add your API keys:
# OPENAI_API_KEY=sk-...
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...
# NEXT_PUBLIC_SUPABASE_URL=https://...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
# SUPABASE_SERVICE_ROLE_KEY=eyJ...
# RESEND_API_KEY=re_...
```

### 2. Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set Production Environment Variables**
   - Go to Vercel Dashboard > Settings > Environment Variables
   - Add all variables from .env.local
   - Redeploy to apply changes

### 3. Configure Stripe Webhook

1. Go to Stripe Dashboard > Webhooks
2. Add endpoint: `https://your-app.vercel.app/api/webhooks/stripe`
3. Select events:
   - `payment_intent.succeeded`
   - `checkout.session.completed`
4. Copy webhook secret to Vercel env vars

## Alternative: Deploy to Netlify

1. **Build Configuration**
   ```toml
   # netlify.toml
   [build]
   command = "npm run build"
   publish = ".next"
   
   [[plugins]]
   package = "@netlify/plugin-nextjs"
   ```

2. **Deploy**
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify deploy --prod
   ```

## Database Setup

1. **Create Supabase Project**
   - Go to supabase.com
   - Create new project
   - Copy URL and keys

2. **Run Database Migration**
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Login and link
   supabase login
   supabase link --project-ref your-project-ref
   
   # Push schema
   supabase db push
   ```

3. **Verify Tables Created**
   - books
   - purchases

## Testing Deployment

1. **Test Quiz Flow**
   - Complete all quiz questions
   - Verify story generation

2. **Test Payment**
   - Use Stripe test card: 4242 4242 4242 4242
   - Verify success page
   - Check email delivery

3. **Test PDF Download**
   - Access download link from email
   - Verify PDF generation

## Monitoring

- **Vercel Analytics**: Enable in dashboard
- **Stripe Dashboard**: Monitor payments
- **Supabase Dashboard**: Check database activity
- **OpenAI Usage**: Monitor API usage

## Staging URLs

After deployment:
- Vercel: `https://quiz-book-ticoco.vercel.app`
- Netlify: `https://quiz-book-ticoco.netlify.app`

## Performance Optimization

1. **Enable ISR for Landing Page**
   ```typescript
   export const revalidate = 3600; // 1 hour
   ```

2. **Optimize Images**
   - Use next/image for all images
   - Compress assets before upload

3. **Monitor Core Web Vitals**
   - Check Vercel Analytics
   - Aim for LCP < 2.5s on mobile

## Production Checklist

- [ ] Update to production Stripe keys
- [ ] Configure custom domain
- [ ] Set up error monitoring (Sentry)
- [ ] Enable Vercel Analytics
- [ ] Test on various devices
- [ ] Review COPPA compliance