module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: ['class'],
  theme: { extend: {
    colors: Object.fromEntries(['background','foreground','border','input','ring','primary','secondary','muted','accent','destructive','popover','card'].map(k => [k, { DEFAULT: `hsl(var(--${k}))`, foreground: `hsl(var(--${k}-foreground))` }])),
    borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 2px)', sm: 'calc(var(--radius) - 4px)' }
  }},
  plugins: [require('tailwindcss-animate')]
};
