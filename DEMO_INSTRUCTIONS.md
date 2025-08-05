# Quiz Book Demo - Zero-Cost Testing Instructions

## Quick Start (Local Demo)

The Quiz Book demo is configured to run without any API keys or backend services. Everything is mocked for testing purposes.

### 1. Clone and Install

```bash
git clone https://github.com/0xdesign/quiz-book-ticoco.git
cd quiz-book-ticoco
npm install
```

### 2. Run Demo Mode

```bash
# Copy demo environment
cp .env.demo .env.local

# Start development server
npm run dev
```

### 3. Access Demo

Open http://localhost:3000 in your browser

## Demo Features

✅ **Complete Quiz Flow**
- 5-step personalized quiz
- All form validations work
- Progress tracking

✅ **Story Generation**
- Template-based stories using child's name and preferences
- Instant generation (no API calls)
- Multiple story templates

✅ **Payment Simulation**
- Mock Stripe checkout
- Test card: 4242 4242 4242 4242
- Instant "payment success"

✅ **Story Delivery**
- Download story as text file
- Email notifications shown on screen
- No actual emails sent

## Test Scenarios

### Scenario 1: Complete Journey
1. Click "Create Your Child's Story"
2. Fill quiz with test data:
   - Name: Emma
   - Age: 6
   - Traits: Creative, Curious, Kind
   - Favorite Things: Rainbows, Unicorns
   - Story Type: Magical Journey
3. Complete mock payment
4. Download story from success page

### Scenario 2: Quick Test
- Use pre-filled demo data (click "Use Demo Data" if available)
- Skip directly to payment
- Verify story download works

## Demo Limitations

- No real AI story generation (uses templates)
- No actual payment processing
- No email delivery (shown on screen instead)
- Stories download as .txt files (not PDF)
- Data stored in browser only (localStorage)

## Deployment Options

### Option 1: Local Development
Best for quick demos - just run `npm run dev`

### Option 2: Deploy Your Own
1. Fork the repository
2. Deploy to Vercel/Netlify (free tier)
3. Set environment variable: `NEXT_PUBLIC_DEMO_MODE=true`

### Option 3: Static Export (Advanced)
```bash
npm run build
npm run export
# Host the 'out' directory anywhere
```

## Troubleshooting

**Build errors?**
- Make sure `.env.local` exists with demo values
- Run `npm install` to get all dependencies

**API errors?**
- Check that `NEXT_PUBLIC_DEMO_MODE=true` is set
- All API calls should be mocked automatically

**Can't see demo banner?**
- Clear browser cache
- Check console for any errors

## Share This Demo

Share this URL with clients:
```
https://github.com/0xdesign/quiz-book-ticoco
```

They can follow these same instructions to test locally.