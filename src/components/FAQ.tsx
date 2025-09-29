'use client'

import { useState } from 'react'

interface FAQItem {
  question: string
  answer: string
}

const faqs: FAQItem[] = [
  {
    question: "How personalized is it really?",
    answer: "Every story is written from scratch by AI based on your child's unique details—not a template with name-swaps. Their personality traits, favorite things, and age are woven throughout the narrative."
  },
  {
    question: "What if my child doesn't like it?",
    answer: "You'll review the complete story before purchasing. Don't love it? Regenerate it instantly or edit the details. We want you to be thrilled with the final story."
  },
  {
    question: "How long is the story?",
    answer: "Each story is 10 age-appropriate paragraphs with accompanying illustrations—perfect for bedtime reading (about 10-15 minutes)."
  },
  {
    question: "Is my child's information secure?",
    answer: "Absolutely. We're COPPA compliant and use bank-level encryption. We never share your information and only use it to create your story."
  },
  {
    question: "Can I print the PDF?",
    answer: "Yes! The PDF is print-ready. You can print it at home, take it to a print shop for binding, or simply read it on your device."
  },
  {
    question: "What ages is this appropriate for?",
    answer: "Stories are tailored for ages 3-10, with vocabulary and themes adjusted to your child's age."
  }
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">
        Questions Parents Ask
      </h2>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full text-left px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold text-gray-800">{faq.question}</span>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${openIndex === index ? 'transform rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openIndex === index && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}