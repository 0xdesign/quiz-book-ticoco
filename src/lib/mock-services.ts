// Mock services for demo deployment
import { DEMO_MODE, generateStoryFromTemplate, generateDemoDownloadToken, MOCK_PAYMENT_SUCCESS } from './demo-config';

// Local storage keys
const STORAGE_KEYS = {
  books: 'demo_quiz_books',
  purchases: 'demo_purchases',
  quizProgress: 'demo_quiz_progress'
};

// Initialize demo data in localStorage
export function initializeDemoData() {
  if (typeof window === 'undefined') return;
  
  // Initialize storage if empty
  if (!localStorage.getItem(STORAGE_KEYS.books)) {
    localStorage.setItem(STORAGE_KEYS.books, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.purchases)) {
    localStorage.setItem(STORAGE_KEYS.purchases, JSON.stringify([]));
  }
}

// Mock Supabase client
export const mockSupabase = {
  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: (column: string, value: any) => ({
        single: async () => {
          if (table === 'books') {
            const books = JSON.parse(localStorage.getItem(STORAGE_KEYS.books) || '[]');
            const book = books.find((b: any) => b.id === value);
            return { data: book, error: null };
          }
          return { data: null, error: null };
        },
        data: null,
        error: null
      }),
      single: async () => ({ data: null, error: null }),
      data: null,
      error: null
    }),
    insert: (data: any) => ({
      select: () => ({
        single: async () => {
          if (table === 'books') {
            const books = JSON.parse(localStorage.getItem(STORAGE_KEYS.books) || '[]');
            const newBook = {
              ...data,
              id: `demo_book_${Date.now()}`,
              created_at: new Date().toISOString()
            };
            books.push(newBook);
            localStorage.setItem(STORAGE_KEYS.books, JSON.stringify(books));
            return { data: newBook, error: null };
          }
          if (table === 'purchases') {
            const purchases = JSON.parse(localStorage.getItem(STORAGE_KEYS.purchases) || '[]');
            const newPurchase = {
              ...data,
              id: `demo_purchase_${Date.now()}`,
              created_at: new Date().toISOString()
            };
            purchases.push(newPurchase);
            localStorage.setItem(STORAGE_KEYS.purchases, JSON.stringify(purchases));
            return { data: newPurchase, error: null };
          }
          return { data: null, error: null };
        }
      })
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        select: () => ({
          single: async () => {
            if (table === 'books') {
              const books = JSON.parse(localStorage.getItem(STORAGE_KEYS.books) || '[]');
              const index = books.findIndex((b: any) => b.id === value);
              if (index !== -1) {
                books[index] = { ...books[index], ...data };
                localStorage.setItem(STORAGE_KEYS.books, JSON.stringify(books));
                return { data: books[index], error: null };
              }
            }
            return { data: null, error: null };
          }
        })
      })
    })
  })
};

// Mock OpenAI service
export const mockOpenAI = {
  chat: {
    completions: {
      create: async (params: any) => {
        // Extract quiz data from the prompt
        const quizData = JSON.parse(params.messages[0].content.match(/Quiz Data: ({.*})/)?.[1] || '{}');
        const story = generateStoryFromTemplate(quizData);
        
        return {
          choices: [{
            message: {
              content: `Title: ${story.title}\n\n${story.content}`
            }
          }]
        };
      }
    }
  }
};

// Mock Stripe service
export const mockStripe = {
  checkout: {
    sessions: {
      create: async (params: any) => {
        const bookId = params.metadata?.bookId || 'demo_book';
        const sessionId = `cs_demo_${Date.now()}`;
        
        // Store session data for retrieval
        sessionStorage.setItem(`stripe_session_${sessionId}`, JSON.stringify({
          id: sessionId,
          metadata: { bookId },
          customer_email: params.customer_email || 'demo@parent.com',
          amount_total: 1999,
          currency: 'usd',
          payment_status: 'paid'
        }));
        
        return {
          id: sessionId,
          url: `/checkout/${bookId}?session_id=${sessionId}&demo=true`
        };
      },
      retrieve: async (sessionId: string) => {
        const sessionData = sessionStorage.getItem(`stripe_session_${sessionId}`);
        if (sessionData) {
          return JSON.parse(sessionData);
        }
        return MOCK_PAYMENT_SUCCESS;
      }
    }
  },
  paymentIntents: {
    create: async (params: any) => {
      return {
        id: `pi_demo_${Date.now()}`,
        client_secret: `pi_demo_${Date.now()}_secret`,
        amount: params.amount,
        currency: params.currency
      };
    }
  }
};

// Mock email service
export const mockResend = {
  emails: {
    send: async (params: any) => {
      console.log('📧 Demo Email Sent:', {
        to: params.to,
        subject: params.subject,
        preview: params.html?.substring(0, 100) + '...'
      });
      
      // Show email in UI as a notification
      if (typeof window !== 'undefined') {
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50';
        notification.innerHTML = `
          <div class="font-bold">Email Sent (Demo)</div>
          <div class="text-sm">To: ${params.to}</div>
          <div class="text-sm">Subject: ${params.subject}</div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
      }
      
      return { id: `demo_email_${Date.now()}` };
    }
  }
};

// Helper function to check if we're in demo mode
export function isDemoMode(): boolean {
  return DEMO_MODE || process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

// Export all services based on demo mode
export function getServices() {
  if (isDemoMode()) {
    return {
      supabase: mockSupabase,
      openai: mockOpenAI,
      stripe: mockStripe,
      resend: mockResend
    };
  }
  
  // In production, return actual services
  // This would be imported from the original service files
  return {
    supabase: null, // Would be actual supabase client
    openai: null,   // Would be actual OpenAI client
    stripe: null,   // Would be actual Stripe client
    resend: null    // Would be actual Resend client
  };
}