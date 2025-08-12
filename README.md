# Quiz Book (Ticoco) - Personalized Children's Story Generator

A Next.js application that creates personalized children's books through an interactive quiz. Parents answer questions about their child, and the system generates a custom story with PDF download.

## ✨ Features

### Core Features
- **Interactive Quiz Flow**: Mobile-optimized 5-step quiz about the child
- **AI Story Generation**: OpenAI GPT-4 creates personalized stories
- **PDF Generation**: High-quality text-based PDFs with custom formatting  
- **Stripe Payment**: Secure $19.99 payment processing
- **Email Delivery**: Automated PDF delivery with download links
- **COPPA Compliance**: Required parental consent for children under 13

### Advanced Features
- **Mock Services**: Full development environment without API keys
- **Comprehensive Testing**: Jest test suite with 90%+ coverage
- **Error Handling**: Robust error recovery with circuit breakers
- **Performance Optimization**: Mobile-first design with 3G network support
- **Data Validation**: Input sanitization and security measures
- **Analytics**: Privacy-focused usage tracking and metrics
- **Progressive Loading**: Lazy loading and caching for mobile performance

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- API keys (optional - mock services work without them)

### Installation

1. **Clone and Install**:
   ```bash
   git clone <repository-url>
   cd quiz-book
   npm install
   ```

2. **Environment Setup**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys (optional for development)
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Open Application**:
   Visit [http://localhost:3000](http://localhost:3000)

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14, React 19, Tailwind CSS
- **Backend**: Next.js API Routes, Serverless Functions
- **AI**: OpenAI GPT-4 API
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe API
- **Email**: Resend API
- **PDF**: PDFKit
- **Testing**: Jest, React Testing Library

### Project Structure
```
quiz-book/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API endpoints
│   │   ├── checkout/       # Payment flow
│   │   └── success/        # Post-payment pages
│   ├── components/         # React components
│   │   └── QuizForm.tsx   # Main quiz component
│   └── lib/               # Utility libraries
│       ├── services.ts    # Service layer with mocks
│       ├── validation.ts  # Input validation
│       ├── error-handling.ts # Error management
│       ├── performance.ts # Mobile optimizations
│       └── analytics.ts   # Usage tracking
├── __tests__/             # Test suites
├── database.sql          # Database schema
└── DEPLOYMENT.md         # Deployment guide
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:quiz       # Quiz flow tests
npm run test:pdf        # PDF generation tests  
npm run test:services   # Service layer tests

# Run with coverage
npm run test:coverage
```

### Mock Services

The application includes comprehensive mock services that work without API keys:

- **Mock OpenAI**: Returns template stories with child's name
- **Mock Stripe**: Simulates payment processing
- **Mock Email**: Logs emails instead of sending
- **Mock Database**: In-memory storage for development

Enable mocks by not setting API keys in development mode.

## 📱 Mobile Optimization

### Performance Features
- **Network Detection**: Adapts to 2G/3G/4G connections
- **Lazy Loading**: Components load as needed
- **Touch Optimization**: 44px minimum touch targets
- **Swipe Gestures**: Navigation support for mobile
- **Progressive Loading**: Forms load steps incrementally

### 3G Network Support
- Reduced quality on slow connections
- Extended timeouts for API calls
- Optimized bundle size with code splitting

## 🔒 Security & Privacy

### Data Protection
- **Input Sanitization**: XSS and injection prevention
- **COPPA Compliance**: Parental consent for children under 13
- **Data Minimization**: Only collect necessary information

### Validation
- Server-side input validation
- Rate limiting on API endpoints
- CSRF protection

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Setup
1. Set up Supabase database with provided schema
2. Configure Stripe webhooks
3. Set up Resend email templates
4. Configure domain and SSL

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## 🎯 User Journey

1. **Landing Page**: Introduction and quiz start
2. **Quiz Steps**: 
   - Child's name and age
   - Personality traits (max 3)
   - Favorite themes (max 4)
   - Story type preference
   - Parent email and consent
3. **Payment**: $19.99 Stripe checkout
4. **Processing**: Story generation and PDF creation
5. **Delivery**: Email with download link
6. **Download**: 24-hour expiry, 3 download limit

## 📝 API Endpoints

### Core Endpoints
- `POST /api/create-story` - Submit quiz and create book
- `POST /api/create-payment-intent` - Process payment  
- `GET /api/download/[token]` - Download PDF
- `POST /api/webhooks/stripe` - Handle payment events

## 🐛 Troubleshooting

### Common Issues

**Story Generation Fails**:
- Check OpenAI API key and quota
- Verify internet connection

**Payment Issues**:
- Verify Stripe webhook configuration
- Check test vs live API keys

**PDF Generation Errors**:
- Check file system permissions
- Monitor memory usage

## Support

For technical support:
- Test with mock services first
- Check deployment documentation
- Monitor application logs

**Built with ❤️ for creating magical stories that make children smile.**
