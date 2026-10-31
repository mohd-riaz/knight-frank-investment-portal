module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        ...Object.fromEntries(
          [
            "background",
            "foreground",
            "border",
            "input",
            "ring",
            "primary",
            "secondary",
            "muted",
            "accent",
            "destructive",
            "popover",
            "card",
          ].map((k) => [
            k,
            {
              DEFAULT: `hsl(var(--${k}))`,
              foreground: `hsl(var(--${k}-foreground))`,
            },
          ]),
        ),
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
