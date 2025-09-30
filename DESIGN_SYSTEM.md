# Design System Documentation - Quiz Book (Ticoco)

> **For Figma-to-Code Integration via MCP**
> This document provides comprehensive guidelines for converting Figma designs into code that aligns with our existing design system.

---

## Table of Contents
1. [Design Tokens](#1-design-tokens)
2. [Component Architecture](#2-component-architecture)
3. [Styling Approach](#3-styling-approach)
4. [Typography System](#4-typography-system)
5. [Color System](#5-color-system)
6. [Spacing & Layout](#6-spacing--layout)
7. [Component Library](#7-component-library)
8. [Icon System](#8-icon-system)
9. [Asset Management](#9-asset-management)
10. [Animation & Motion](#10-animation--motion)
11. [Project Structure](#11-project-structure)
12. [Figma Integration Guidelines](#12-figma-integration-guidelines)

---

## 1. Design Tokens

### Token Location
All design tokens are centrally defined in:
```
./src/lib/design-tokens.ts
```

### Token Structure
```typescript
// Spacing (8px base system)
export const spacing = {
  xs: '4px',    // 0.25rem
  sm: '8px',    // 0.5rem
  md: '16px',   // 1rem
  lg: '24px',   // 1.5rem
  xl: '32px',   // 2rem
  '2xl': '48px', // 3rem
  '3xl': '64px', // 4rem
}

// Typography
export const typography = {
  fontSize: {
    xs: '12px',   // Small labels
    sm: '14px',   // Secondary text
    base: '16px', // Body text
    lg: '18px',   // Large body
    xl: '20px',   // Small headings
    '2xl': '24px', // Section headings
    '3xl': '32px', // Page headings
    '4xl': '48px', // Hero text
  }
}

// Border Radius
export const borderRadius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  full: '9999px', // Pills, badges
}
```

### Using Tokens
Import tokens when needed:
```typescript
import { spacing, colors, typography } from '@/lib/design-tokens'
```

---

## 2. Component Architecture

### Framework Stack
- **Framework**: Next.js 15 (App Router)
- **React Version**: 19.1.0
- **Language**: TypeScript 5
- **Build Tool**: Next.js built-in bundler
- **Package Manager**: npm

### Component Pattern
```typescript
// Example component structure
'use client' // Use for interactive components

import { useState } from 'react'
import { cn } from '@/lib/utils' // Utility for merging classes

interface ComponentProps {
  // Always use TypeScript interfaces
  title: string
  onAction?: () => void
}

export default function Component({ title, onAction }: ComponentProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Component content */}
    </div>
  )
}
```

### Server vs Client Components
- **Server Components** (default): Static content, data fetching
- **Client Components** (`'use client'`): Interactive UI, state management, event handlers

---

## 3. Styling Approach

### Primary Method: Tailwind CSS v4
Configuration:
```javascript
// postcss.config.mjs
const config = {
  plugins: ["@tailwindcss/postcss"],
};
```

### Class Name Utility
Use the `cn()` helper for conditional classes:
```typescript
// ./src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Usage Example:**
```typescript
<button
  className={cn(
    "px-4 py-3 rounded-full",
    isSelected ? "bg-white text-[#1E2939]" : "border-[#D1D5DC] text-white"
  )}
>
  Button
</button>
```

### Global Styles
```css
/* ./src/app/globals.css */
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-nunito-sans);
  --font-mono: var(--font-geist-mono);
}
```

### CSS Methodology
- **Primary**: Tailwind utility classes
- **Inline Styles**: Only for dynamic values (animations, computed styles)
- **CSS Modules**: Not used
- **Styled Components**: Not used

---

## 4. Typography System

### Font Configuration
```typescript
// ./src/app/layout.tsx
import { Nunito, Geist_Mono } from "next/font/google";

const nunitoSans = Nunito({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
```

### Font Usage Patterns

#### Headings (Nunito Sans Bold/Semibold)
```tsx
// Large page heading
<h1 className="text-[24px] leading-7 font-bold text-white">
  Page Title
</h1>

// Section heading
<h2 className="text-[18px] font-medium leading-7 text-white">
  Section Title
</h2>
```

#### Body Text
```tsx
// Primary body text
<p className="text-[14px] leading-5 text-[#99A1AF]">
  Description text
</p>

// Helper/secondary text
<p className="text-[12px] leading-4 text-[#99A1AF]">
  Helper text
</p>
```

#### Form Labels
```tsx
<label className="text-[18px] font-medium leading-7 text-white">
  Input Label
</label>
```

### Typography Scale
```
Font Sizes (with line heights):
- 12px / 16px - Small labels, helper text
- 14px / 18px - Body text, descriptions (INCREASED FROM FIGMA 12px)
- 16px / 20px - Buttons
- 18px / 28px - Form labels, subheadings
- 24px / 28px - Section headings
- 80px / 1   - Large counter displays
```

---

## 5. Color System

### Dark Theme Palette (Primary)

#### Background Colors
```css
--bg-primary: #0A0A0A     /* Input backgrounds, dark surfaces */
--bg-secondary: #1F2023   /* Card backgrounds, main container */
--bg-gradient-start: #0A0A0A /* Gradient origin */
```

#### Text Colors
```css
--text-primary: #FFFFFF    /* Headings, labels */
--text-secondary: #99A1AF  /* Descriptions, helper text */
--text-muted: #4A5565      /* Muted labels (on light bg) */
--text-dark: #1E2939       /* Dark text (on light bg) */
--text-shark: #1C1C1E      /* Summary pill values */
```

#### Border Colors
```css
--border-default: #444444   /* Input borders, card borders */
--border-light: #D1D5DC     /* Button borders (unselected) */
--border-glass: rgba(255,255,255,0.3) /* Glass effect borders */
```

#### Accent Colors
```css
--accent-white: #FFFFFF     /* Selected states, CTAs */
--accent-glass: rgba(255,255,255,0.2) /* Glass backgrounds */
```

### Color Usage Examples
```tsx
// Dark container (main quiz card)
<div className="bg-[#1F2023] border border-[#444444] rounded-[24px] p-6">

// Input field
<input className="bg-[#0A0A0A] border-2 border-[#444444] text-white placeholder:text-[#99A1AF]" />

// Glass effect (summary pills)
<div className="backdrop-blur-sm bg-white/20 border border-white/30 rounded-full">

// Selected button
<button className="bg-white text-[#1E2939] border-white">
```

---

## 6. Spacing & Layout

### Spacing System
Based on **gap-based layouts** rather than margin/padding:

```tsx
// Primary pattern: flex with gap
<div className="flex flex-col gap-6">  {/* 24px gap */}
  <div className="flex flex-col gap-3">  {/* 12px gap */}
    <h2>Heading</h2>
    <p>Description</p>
  </div>
  <div>Content</div>
</div>
```

### Common Spacing Values
```
gap-3  → 12px  (tight grouping: label + description)
gap-6  → 24px  (section spacing)
gap-10 → 40px  (large section breaks)
gap-[12px] → 12px (exact pixel values)
p-6    → 24px  (card padding)
px-[12px] py-[8px] → pill padding
p-[18px] → input padding
```

### Container Widths
```tsx
// Main quiz container
<div className="max-w-[672px] mx-auto">

// Button widths
<button className="w-[330px] h-[56px]">

// Full width elements
<div className="w-full">
```

### Responsive Breakpoints
```
sm:  640px  - large phones
md:  768px  - tablets
lg:  1024px - laptops
xl:  1280px - desktops
2xl: 1536px - large desktops
```

---

## 7. Component Library

### Location
```
./src/components/          - Page-level components
./src/components/ui/       - Reusable UI components
```

### Key UI Components

#### 1. GradientBackground
**File**: `./src/components/ui/noisy-gradient-backgrounds.tsx`

```tsx
import { GradientBackground } from '@/components/ui/noisy-gradient-backgrounds'

<GradientBackground
  gradientOrigin="bottom-middle"
  noiseIntensity={0.15}
  noisePatternSize={90}
  noisePatternRefreshInterval={2}
/>
```

**Props**:
- `gradientType`: 'radial-gradient' | 'linear-gradient' | 'conic-gradient'
- `gradientOrigin`: Position of gradient center
- `colors`: Array of color stops
- `enableNoise`: Boolean for noise overlay
- `noiseIntensity`: 0-1 noise strength

#### 2. Counter
**File**: `./src/components/ui/counter.tsx`

```tsx
import { Component as Counter } from '@/components/ui/counter'

<Counter
  initialValue={5}
  min={3}
  max={10}
  step={1}
  onChange={(value) => handleChange(value)}
  places={[10, 1]}
  fontSize={80}
  padding={5}
  fontWeight={900}
/>
```

**Features**:
- Animated number rolling effect
- Increment/decrement buttons
- Min/max constraints
- Customizable styling

#### 3. QuizForm
**File**: `./src/components/QuizForm.tsx`

Multi-step form with progressive summaries. Uses consistent patterns:

```tsx
// Step structure pattern
function StepComponent({ data, updateData }: StepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h2 className="text-[24px] leading-7 font-bold text-white text-center">
          Question
        </h2>
        <p className="text-[14px] leading-5 text-[#99A1AF] text-center">
          Description
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {/* Form content */}
      </div>
    </div>
  )
}
```

### Component Patterns

#### Button States
```tsx
// Default button
<button className="border-2 border-[#D1D5DC] text-white hover:bg-white/10">

// Selected button
<button className="bg-white text-[#1E2939] border-white">

// Primary CTA
<button className="bg-white text-[#1E2939] rounded-full w-[330px] h-[56px]">
```

#### Input Fields
```tsx
<input
  type="text"
  className="w-full p-[18px] bg-[#0A0A0A] border-2 border-[#444444] rounded-xl text-[18px] text-white placeholder:text-[#99A1AF] focus:border-blue-500 focus:outline-none"
  placeholder="Enter text"
/>
```

#### Summary Pills
```tsx
// Full-width pill (Story Prompt)
<div className="backdrop-blur-sm bg-white/20 border border-white/30 rounded-full w-full px-[12px] py-[8px]">
  <div className="flex gap-[12px] items-center">
    <span className="text-[14px] font-sans font-semibold leading-[18px] text-[#1f2023]/50">
      Label
    </span>
    <p className="text-[14px] font-sans font-semibold leading-[18px] text-[#1c1c1e]">
      Value
    </p>
  </div>
</div>

// Auto-width pills
<div className="backdrop-blur-sm bg-white/20 border border-white/30 rounded-full px-[12px] py-[8px]">
  <div className="flex gap-[4px] items-center whitespace-nowrap">
    <span className="text-[14px] font-sans font-semibold leading-[18px] text-[#1f2023]/50">
      Label
    </span>
    <span className="text-[14px] font-sans font-semibold leading-[18px] text-[#1c1c1e]">
      Value
    </span>
  </div>
</div>
```

---

## 8. Icon System

### Icon Libraries
```json
{
  "@heroicons/react": "^2.2.0",
  "lucide-react": "^0.544.0"
}
```

### Usage Patterns

#### Lucide React (Primary)
```tsx
import { ArrowRight, Check, X } from 'lucide-react'

<ArrowRight className="w-5 h-5 text-white" />
```

#### Heroicons (Secondary)
```tsx
import { ChevronRightIcon } from '@heroicons/react/24/outline'

<ChevronRightIcon className="h-6 w-6 text-white" />
```

### Icon Sizing
```
w-4 h-4  → 16px (small icons)
w-5 h-5  → 20px (default)
w-6 h-6  → 24px (large icons)
w-8 h-8  → 32px (XL icons)
```

---

## 9. Asset Management

### Directory Structure
```
./src/app/favicon.ico      - Favicon
No public/ directory        - Assets are imported or external
```

### Image Optimization
```typescript
// next.config.ts
export default {
  images: {
    unoptimized: true,  // Disabled for static export
  }
}
```

### Asset Usage
- **External Images**: Loaded via URLs (OpenAI generated images)
- **Icons**: Component-based (Lucide, Heroicons)
- **No static assets**: No local image files in public/

---

## 10. Animation & Motion

### Library
```json
{
  "framer-motion": "^12.23.22"
}
```

### Animation Patterns

#### Counter Animation
```tsx
import { motion, useSpring, useTransform } from "framer-motion"

const animatedValue = useSpring(value)
<motion.span style={{ y: animatedValue }}>
```

#### Transition Utilities
```tsx
// Hover states
<button className="transition-colors duration-200 hover:bg-white/10">

// Scale on press
<button className="transition-all duration-200 hover:scale-105">
```

### Animation Tokens
```typescript
// From design-tokens.ts
export const animation = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    medium: '300ms',
    slow: '500ms',
  },
  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  }
}
```

---

## 11. Project Structure

### Directory Layout
```
./src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── quiz/              # Quiz page
│   ├── checkout/          # Checkout flow
│   ├── success/           # Success page
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   │   ├── counter.tsx
│   │   ├── noisy-gradient-backgrounds.tsx
│   │   └── ai-prompt-box.tsx
│   ├── QuizForm.tsx      # Main quiz component
│   ├── StoryReview.tsx   # Story review
│   └── FAQ.tsx           # FAQ component
└── lib/                   # Utility libraries
    ├── design-tokens.ts  # Design tokens
    ├── utils.ts          # Helper utilities
    ├── services.ts       # Service layer
    ├── supabase.ts       # Database client
    ├── stripe.ts         # Payment integration
    └── openai.ts         # AI integration
```

### Path Aliases
```json
// tsconfig.json
{
  "paths": {
    "@/*": ["./src/*"]
  }
}
```

**Usage**:
```typescript
import { cn } from '@/lib/utils'
import { GradientBackground } from '@/components/ui/noisy-gradient-backgrounds'
```

---

## 12. Figma Integration Guidelines

### Converting Figma to Code

#### Step 1: Extract Design Tokens
```typescript
// Match Figma values to existing tokens
Figma: 12px gap → Code: gap-3 (12px)
Figma: #1F2023 → Code: bg-[#1F2023]
Figma: Nunito/SemiBold/12px → Code: text-[12px] font-sans font-semibold
```

#### Step 2: Use Consistent Patterns
```tsx
// Always use flex + gap for layouts
<div className="flex flex-col gap-6">  // NOT space-y-6
  <div className="flex gap-[12px]">    // NOT space-x-3
```

#### Step 3: Match Typography Scale
```tsx
// Figma 12px → Code 14px (adjusted for readability)
Figma: font-size: 12px, line-height: 16px
Code:  text-[14px] leading-[18px]

// Figma 18px → Code 18px (exact match)
Figma: font-size: 18px, line-height: 28px
Code:  text-[18px] leading-7
```

#### Step 4: Glass/Blur Effects
```tsx
// Figma: backdrop-filter: blur()
<div className="backdrop-blur-sm bg-white/20 border border-white/30">
```

#### Step 5: Component Mapping

| Figma Component | Code Pattern |
|----------------|--------------|
| Auto Layout (Vertical, gap: 24) | `flex flex-col gap-6` |
| Auto Layout (Horizontal, gap: 12) | `flex gap-3` |
| Frame (rounded: 999px) | `rounded-full` |
| Frame (rounded: 24px) | `rounded-[24px]` |
| Text (Nunito/SemiBold/14) | `text-[14px] font-sans font-semibold` |
| Fill (color with opacity) | `bg-white/20` or `bg-[#1f2023]/50` |

### MCP Tool Usage

#### get_screenshot
Use to visualize Figma designs:
```typescript
fileKey: "Z5BRMUqnGBCreLLjpDa6Th"
nodeId: "20:199"
```

#### get_code
Use to extract implementation patterns:
```typescript
fileKey: "Z5BRMUqnGBCreLLjpDa6Th"
nodeId: "20:199"
clientLanguages: "typescript"
clientFrameworks: "react,nextjs"
```

#### get_metadata
Use for structure overview (use sparingly, prefer get_code):
```typescript
fileKey: "Z5BRMUqnGBCreLLjpDa6Th"
nodeId: "0:1"  // Page level
```

### Key Adjustments from Figma

1. **Text Size**: Figma 12px → Code 14px (for better readability)
2. **Line Heights**: Adjusted for optical balance
3. **Spacing**: Prefer gap over margin/padding
4. **Colors**: Use exact hex values, not Tailwind named colors
5. **Font Weights**: Map Figma weights to Tailwind utilities

### Quality Checklist

When integrating Figma designs:

- [ ] Use `cn()` for conditional classes
- [ ] Apply consistent `gap-*` spacing
- [ ] Use exact color hex values `bg-[#1F2023]`
- [ ] Match typography patterns (14px/18px for body)
- [ ] Use `rounded-[24px]` for exact radius values
- [ ] Apply `backdrop-blur-sm` for glass effects
- [ ] Use `font-sans` to reference Nunito
- [ ] Ensure proper TypeScript interfaces
- [ ] Add `'use client'` for interactive components
- [ ] Test responsive behavior (sm:, md:, lg:)

---

## Quick Reference

### Most Common Patterns

```tsx
// Container
<div className="bg-[#1F2023] border border-[#444444] rounded-[24px] p-6 w-full">

// Section spacing
<div className="flex flex-col gap-6">

// Heading + description
<div className="flex flex-col gap-3">
  <h2 className="text-[24px] leading-7 font-bold text-white text-center">
  <p className="text-[14px] leading-5 text-[#99A1AF] text-center">
</div>

// Input
<input className="w-full p-[18px] bg-[#0A0A0A] border-2 border-[#444444] rounded-xl text-[18px] text-white placeholder:text-[#99A1AF]" />

// Button (unselected)
<button className="border-2 border-[#D1D5DC] text-white hover:bg-white/10">

// Button (selected)
<button className="bg-white text-[#1E2939] border-white">

// Pill (glass effect)
<div className="backdrop-blur-sm bg-white/20 border border-white/30 rounded-full px-[12px] py-[8px]">
```

---

## Need Help?

- **Design Tokens**: `./src/lib/design-tokens.ts`
- **Utilities**: `./src/lib/utils.ts`
- **Example Components**: `./src/components/QuizForm.tsx`
- **Figma File**: `Z5BRMUqnGBCreLLjpDa6Th`
