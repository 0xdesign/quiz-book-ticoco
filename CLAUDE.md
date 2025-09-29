# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a Next.js 15 application that creates personalized children's books through an interactive quiz. Parents answer questions about their child, and the system generates a custom story with images and PDF download capabilities.

## Development Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev                  # Start development server on http://localhost:3000

# Build and production
npm run build               # Build for production
npm run start               # Start production server

# Linting
npm run lint                # Run Next.js linting

# Testing
npm run test                # Run all tests
npm run test:quiz           # Test quiz flow specifically
npm run test:pdf            # Test PDF generation specifically
npm run test:services       # Test service layer specifically
```

## Architecture

### Core Stack
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS
- **AI**: OpenAI GPT-5 via Responses API for story and image generation
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe ($19.99 fixed price)
- **Email**: Resend API
- **PDF Generation**: PDFKit

### Key Service Layer Pattern
The application uses a service layer pattern in `src/lib/services.ts` that provides:
- `openaiService`: Story generation using GPT-5
- `stripeService`: Payment intent creation and retrieval
- `emailService`: Email delivery with attachments
- `databaseService`: Supabase operations for books, downloads, and events

### GPT-5 Integration
The application uses GPT-5's new Responses API (`openai.responses.create`) with:
- Story generation at 2000 max output tokens
- Image generation using the `image_generation` tool
- Fallback handling for various response formats from GPT-5

### User Flow
1. **Quiz** (`src/components/QuizForm.tsx`): 5-step mobile-optimized form
2. **Story Generation** (`/api/generate-story`): GPT-5 creates story and images
3. **Review** (`src/components/StoryReview.tsx`): User reviews generated story
4. **Payment** (`/checkout/[bookId]`): Stripe payment processing
5. **Webhook** (`/api/webhooks/stripe`): PDF generation and email delivery
6. **Download** (`/api/download/[token]`): Secure PDF download with limits

### Database Schema
Three main tables in Supabase:
- `books`: Stores quiz data, story text, and payment status
- `downloads`: Secure tokens with 7-day expiry and 3-download limit
- `events`: Analytics tracking for user journey

### Environment Variables
Required keys in `.env.local`:
- `OPENAI_API_KEY`: For GPT-5 story/image generation
- `STRIPE_SECRET_KEY` & `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Payment processing
- `STRIPE_WEBHOOK_SECRET`: Webhook signature verification
- `NEXT_PUBLIC_SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY`: Database access
- `RESEND_API_KEY`: Email delivery
- `NEXT_PUBLIC_BASE_URL`: Used in email links

## Key Implementation Details

### Story Generation
- Uses GPT-5 Responses API with custom prompts based on child's personality, age, and preferences
- Generates exactly 10 paragraphs of age-appropriate content
- Creates images for each page using GPT-5's image_generation tool
- Handles various GPT-5 response formats (aggregated text vs output array)

### Payment Flow
- Creates Stripe payment intent with book ID in metadata
- Webhook handler generates PDF and sends email after successful payment
- Uses download tokens with expiry and count limits for security

### Mobile Optimization
- Progressive loading for 3G networks
- Touch-optimized UI with 44px minimum targets
- Responsive design with mobile-first approach
- Performance features in `src/lib/performance.ts`

### Error Handling
- Circuit breakers for external services
- Validation layer in `src/lib/validation.ts`
- Error recovery in `src/lib/error-handling.ts`
- Analytics tracking via `src/lib/analytics.ts`

## Testing Approach

The codebase targets live service integration. Jest is configured with React Testing Library. Test files should be placed alongside components or in `__tests__` directory.

## Important Notes

- Always sanitize user inputs using the validation layer
- COPPA compliance is enforced via parent consent checkbox
- PDFs are text-only (no image embedding in PDFs currently)
- Download tokens expire after 7 days with 3-download limit
- Fixed price of $19.99 (1999 cents) configured in `src/lib/config.ts`