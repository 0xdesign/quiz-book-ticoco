# Quiz Book (Ticoco) Deployment Checklist

## 🚀 Pre-Deployment Requirements

### Required Accounts
- [ ] OpenAI account with API access - https://platform.openai.com/
- [ ] Stripe account - https://stripe.com/
- [ ] Supabase account - https://supabase.com/
- [ ] Resend account for emails - https://resend.com/

### Required Tools
- [ ] Node.js 18+ installed
- [ ] npm or yarn installed
- [ ] Git installed

### Budget Considerations
- OpenAI API: ~$0.02 per story generated
- Stripe: 2.9% + $0.30 per transaction
- Supabase: Free tier supports 500MB database
- Resend: 100 free emails/day

## 📋 Step-by-Step Deployment

### 1. Clone and Setup Repository
```bash
# Clone the repository
git clone [your-repo-url]
cd quiz-book

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### 2. Configure OpenAI
```bash
# 1. Get API key from https://platform.openai.com/api-keys
# 2. Add billing method to OpenAI account
# 3. Update .env.local:
#    OPENAI_API_KEY=sk-proj-...
```

### 3. Set Up Stripe
```bash
# 1. Get API keys from https://dashboard.stripe.com/apikeys

# 2. Create products in Stripe Dashboard:
#    - Product: "Personalized Children's Book"
#    - Price: $19.99 (one-time)

# 3. Create webhook endpoint:
#    - URL: https://your-domain.com/api/webhook
#    - Events: checkout.session.completed

# 4. Update .env.local with all Stripe keys
```

### 4. Set Up Supabase
```bash
# 1. Create new project at https://app.supabase.com/

# 2. Run database setup:
#    - Go to SQL Editor in Supabase
#    - Paste contents of database.sql
#    - Execute to create tables

# 3. Enable Row Level Security:
#    - Go to Authentication > Policies
#    - Enable RLS on all tables

# 4. Create storage buckets:
#    - Go to Storage
#    - Create "stories" bucket (public)
#    - Create "story-photos" bucket (public)

# 5. Update .env.local with credentials
```

### 5. Configure Resend Email
```bash
# 1. Sign up at https://resend.com/
# 2. Verify your domain or use their subdomain
# 3. Get API key from dashboard
# 4. Update .env.local:
#    RESEND_API_KEY=re_...
```

### 6. Test Locally with Mocks
```bash
# Run with mock services (no API keys needed)
npm run dev:mock

# Test complete flow:
# 1. Complete quiz
# 2. See generated story preview
# 3. Complete payment (test card: 4242 4242 4242 4242)
# 4. Receive email
# 5. Download PDF
```

### 7. Test with Real Services
```bash
# Ensure all API keys are configured
npm run dev

# Test with real services:
# 1. Story generation (costs ~$0.02)
# 2. Stripe test mode payment
# 3. Real email delivery
# 4. PDF generation and storage
```

### 8. Build for Production
```bash
# Run production build
npm run build

# Test production build locally
npm start

# Check for any errors or warnings
```

### 9. Deploy to Production

#### Option A: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Add all environment variables in Vercel dashboard
# Enable automatic deployments from Git
```

#### Option B: Other Platforms
- Netlify: Use netlify.toml config
- Railway: Direct GitHub integration
- AWS: Use Amplify or EC2
- Google Cloud: Use App Engine

## ✅ Post-Deployment Verification

### Core Functionality
- [ ] Quiz loads on mobile devices
- [ ] All 5 quiz steps work smoothly
- [ ] Story generates in < 10 seconds
- [ ] Payment processes successfully
- [ ] Email arrives within 1 minute
- [ ] PDF downloads correctly
- [ ] Download link expires after 7 days

### Mobile Testing
- [ ] Test on iPhone Safari
- [ ] Test on Android Chrome
- [ ] Verify touch targets are 44px+
- [ ] Check loading on 3G speed
- [ ] Ensure smooth animations

### COPPA Compliance
- [ ] Parent consent checkbox required
- [ ] No data collected from children
- [ ] Privacy policy accessible
- [ ] Terms of service visible

## 🔧 Troubleshooting

### Story Generation Issues
- Check OpenAI API key is valid
- Verify API has credits
- Review OpenAI rate limits
- Check error logs for details
- Test with shorter prompts

### Payment Problems
- Verify Stripe webhook URL
- Check webhook signature
- Review Stripe logs
- Test webhook with Stripe CLI
- Ensure products are active

### Email Delivery Failures
- Check Resend API key
- Verify domain settings
- Review spam scores
- Check email templates
- Monitor Resend dashboard

### PDF Generation Errors
- Verify Supabase storage setup
- Check bucket permissions
- Review file size limits
- Test with simple PDFs
- Monitor storage usage

## 📊 Analytics & Monitoring

### Key Metrics
- Quiz completion rate
- Time to complete quiz
- Payment conversion rate
- Story generation time
- Email open rate
- Download completion rate

### Monitoring Tools
- Vercel Analytics (built-in)
- Stripe Dashboard
- Supabase Dashboard
- Resend Analytics
- Custom event tracking

### Alert Thresholds
- Story generation > 15 seconds
- Payment failure rate > 5%
- Email bounce rate > 2%
- Error rate > 1%

## 🚨 Emergency Procedures

### If OpenAI Goes Down
1. Enable cached story mode
2. Show friendly error message
3. Offer email notification when fixed
4. Consider backup AI provider

### If Payments Fail
1. Log all failed attempts
2. Enable Stripe test mode
3. Collect emails for retry
4. Send status updates

### If Email Service Fails
1. Queue emails locally
2. Retry with exponential backoff
3. Provide direct download option
4. Log all failures

## 📈 Scaling Preparation

### At 100 orders/day
- Monitor OpenAI costs
- Review story caching
- Optimize PDF generation

### At 1,000 orders/day
- Implement CDN for assets
- Add Redis caching
- Upgrade Supabase plan
- Consider dedicated email

### At 10,000 orders/day
- Separate API servers
- Implement queue system
- Add load balancing
- 24/7 monitoring

## 🎯 Launch Day Checklist

Morning of Launch:
- [ ] All systems operational
- [ ] Test complete user flow
- [ ] Support team briefed
- [ ] Monitoring active
- [ ] Backup plans ready

During Launch:
- [ ] Monitor error rates
- [ ] Watch conversion funnel
- [ ] Respond to issues quickly
- [ ] Collect user feedback
- [ ] Track system performance

Post-Launch:
- [ ] Review analytics
- [ ] Address any issues
- [ ] Plan improvements
- [ ] Celebrate success!

## 📞 Support Contacts

- Technical Issues: [your-email]
- Payment Problems: Stripe Support
- Email Issues: Resend Support
- Urgent: [your-phone]

---

**Success Criteria**: 95%+ quiz completion, <2% error rate, <5s story generation, 98%+ email delivery