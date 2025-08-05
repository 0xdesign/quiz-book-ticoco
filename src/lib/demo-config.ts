// Demo configuration for zero-cost deployment
export const DEMO_MODE = true;

// Story templates based on quiz answers
export const STORY_TEMPLATES = {
  dragon_space: {
    title: "{{name}}'s Space Dragon Adventure",
    content: `Once upon a time, there was a brave {{age}}-year-old named {{name}} who loved {{favorite_thing}} more than anything in the world.

One magical night, {{name}} discovered a friendly dragon named Sparkle who could fly through space! The dragon's scales shimmered with the colors of {{favorite_color}}.

"Would you like to visit the stars with me?" asked Sparkle. {{name}} climbed onto the dragon's back, and together they soared past the moon and into the glittering cosmos.

They visited planets made of {{favorite_thing}}, where everything was {{favorite_color}}. {{name}} even got to {{favorite_activity}} among the stars!

On the journey home, Sparkle gave {{name}} a special star that would always remind them of their incredible adventure. "Whenever you look at this star," said Sparkle, "remember that you can achieve anything you dream of!"

From that day on, {{name}} knew that with courage and imagination, even the most amazing dreams could come true.

The End.`
  },
  
  unicorn_forest: {
    title: "{{name}} and the Magical Unicorn Forest",
    content: `In a land far away, there lived a curious {{age}}-year-old named {{name}}. One sunny morning, while {{favorite_activity}}, {{name}} discovered a hidden path lined with {{favorite_color}} flowers.

Following the path, {{name}} found a magical forest where unicorns played! The most beautiful unicorn, with a mane the color of {{favorite_color}}, approached gently.

"Welcome, {{name}}!" said the unicorn. "We've been waiting for someone who loves {{favorite_thing}} as much as you do!"

The unicorn showed {{name}} around the enchanted forest, where trees grew {{favorite_thing}} instead of leaves! They spent the day {{favorite_activity}} with all the magical creatures.

Before leaving, the unicorn touched {{name}}'s hand with its horn, leaving a tiny, shimmering mark. "This will help you find us whenever you need a friend," the unicorn whispered.

{{name}} returned home with a heart full of joy and the knowledge that magic exists for those who believe.

The End.`
  },
  
  ocean_mermaid: {
    title: "{{name}}'s Underwater Mermaid Kingdom",
    content: `{{name}}, a adventurous {{age}}-year-old who loved {{favorite_activity}}, discovered something amazing at the beach one day - a {{favorite_color}} seashell that granted wishes!

"I wish I could breathe underwater!" {{name}} said, and suddenly, they could! Diving into the ocean, {{name}} met Marina, a friendly mermaid with a {{favorite_color}} tail.

"Come see my kingdom!" Marina said, taking {{name}}'s hand. They swam past schools of rainbow fish and gardens of sea flowers that looked just like {{favorite_thing}}.

In the mermaid palace, {{name}} learned to speak with dolphins, dance with seahorses, and even {{favorite_activity}} underwater! The mer-people were amazed at how well {{name}} could swim.

As the sun began to set, Marina gave {{name}} a magical pearl. "This will let you visit us whenever you miss the ocean," she said with a smile.

{{name}} swam back to shore, knowing that beneath the waves, friends were always waiting.

The End.`
  }
};

// Mock payment success page data
export const MOCK_PAYMENT_SUCCESS = {
  session_id: 'cs_demo_' + Date.now(),
  customer_email: 'parent@example.com',
  amount_total: 1999,
  currency: 'usd'
};

// Demo banner configuration
export const DEMO_BANNER = {
  show: true,
  message: "🎭 Demo Mode - All features are simulated for testing",
  backgroundColor: '#fbbf24',
  textColor: '#000000'
};

// Pre-filled demo data for quick testing
export const DEMO_QUIZ_DATA = {
  childName: 'Alex',
  childAge: 6,
  favoriteColor: 'blue',
  favoriteAnimal: 'dragon',
  favoriteActivity: 'flying kites',
  favoriteThing: 'ice cream',
  storyTheme: 'dragon_space',
  parentEmail: 'demo@parent.com',
  parentConsent: true
};

// Mock book IDs for demo
export const DEMO_BOOK_IDS = [
  'demo_book_1',
  'demo_book_2',
  'demo_book_3'
];

// Helper function to generate story from template
export function generateStoryFromTemplate(quizData: any): { title: string; content: string } {
  const template = STORY_TEMPLATES[quizData.storyTheme as keyof typeof STORY_TEMPLATES] || STORY_TEMPLATES.dragon_space;
  
  let title = template.title;
  let content = template.content;
  
  // Replace placeholders
  const replacements = {
    name: quizData.childName,
    age: quizData.childAge,
    favorite_color: quizData.favoriteColor,
    favorite_thing: quizData.favoriteThing,
    favorite_activity: quizData.favoriteActivity
  };
  
  Object.entries(replacements).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    title = title.replace(regex, value as string);
    content = content.replace(regex, value as string);
  });
  
  return { title, content };
}

// Mock download tokens
export function generateDemoDownloadToken(bookId: string): string {
  return `demo_download_${bookId}_${Date.now()}`;
}