-- Ticoco Database Schema
-- Run this in your Supabase SQL editor

-- Books table - stores quiz data, stories, and payment info
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_data JSONB NOT NULL, -- Complete quiz response data
  story_text TEXT, -- Generated story
  pdf_url TEXT, -- Storage URL for PDF
  email TEXT, -- For delivery
  payment_status TEXT DEFAULT 'pending', -- pending, completed, failed
  stripe_payment_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Download tokens for secure PDF access
CREATE TABLE downloads (
  token TEXT PRIMARY KEY,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  downloads_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Simple analytics tracking
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL, -- quiz_started, quiz_completed, purchase_completed, download_accessed
  book_id UUID REFERENCES books(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_books_payment_status ON books(payment_status);
CREATE INDEX idx_books_created_at ON books(created_at);
CREATE INDEX idx_downloads_expires_at ON downloads(expires_at);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_created_at ON events(created_at);

-- Create storage buckets (run these commands in Supabase Storage)
-- 1. Create 'stories' bucket for PDFs (public read access)
-- 2. Create 'story-photos' bucket for character photos (public read access)

-- RLS Policies (optional for MVP but good practice)
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Allow public read for completed books only (for download verification)
CREATE POLICY "Allow download access for completed books" ON books
  FOR SELECT USING (payment_status = 'completed');

-- Allow public read for valid download tokens
CREATE POLICY "Allow access to valid download tokens" ON downloads
  FOR SELECT USING (expires_at > NOW());

-- Allow public insert for analytics events
CREATE POLICY "Allow public event tracking" ON events
  FOR INSERT WITH CHECK (true);