# Component Library Reference

> Quick reference for shadcn/ui components with Innozverse styling

---

## Available Components

### Currently Installed

- ✅ Button (`src/components/ui/button.tsx`)
- ✅ Card (`src/components/ui/card.tsx`)

### To Install As Needed

```bash
# Install individual components
npx shadcn@latest add [component-name]

# Common components for e-commerce:
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add select
npx shadcn@latest add sheet
npx shadcn@latest add toast
npx shadcn@latest add tabs
npx shadcn@latest add badge
npx shadcn@latest add avatar
npx shadcn@latest add separator
npx shadcn@latest add skeleton
```

---

## Button Component

### Import

```tsx
import { Button } from '@/components/ui/button'
```

### Variants

```tsx
/* Primary (Default) */
<Button>Primary Action</Button>
// Moss green background, white text, colored shadow

/* Outline */
<Button variant="outline">Secondary Action</Button>
// Border, transparent background, hover accent

/* Ghost */
<Button variant="ghost">Tertiary Action</Button>
// No background, hover accent

/* Destructive */
<Button variant="destructive">Delete Item</Button>
// Red background, destructive shadow

/* Secondary */
<Button variant="secondary">Alternative</Button>
// Secondary background, subtle shadow

/* Link */
<Button variant="link">Text Link</Button>
// Underline on hover, no background
```

### Sizes

```tsx
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><IconComponent /></Button>
```

### As Link

```tsx
import Link from 'next/link'

<Button asChild>
  <Link href="/path">Navigate</Link>
</Button>
```

### Full Example

```tsx
<div className="flex gap-4">
  <Button size="lg" className="min-w-[200px]">
    Primary Action
  </Button>
  <Button variant="outline" size="lg">
    Secondary Action
  </Button>
</div>
```

---

## Card Component

### Import

```tsx
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card'
```

### Basic Card

```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Supporting description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Main content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Card with Icon

```tsx
<Card className="bg-gradient-to-br from-card to-secondary/50">
  <CardHeader className="space-y-4">
    {/* Icon Container */}
    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
      <svg className="w-6 h-6 text-primary" {/* ... */}>
        {/* Icon */}
      </svg>
    </div>

    <CardTitle className="text-xl">Feature Name</CardTitle>
    <CardDescription>Feature description</CardDescription>
  </CardHeader>
</Card>
```

### Card Patterns

**Hover Lift Card**

```tsx
<Card className="hover:-translate-y-1 transition-all duration-300">
  {/* Content */}
</Card>
```

**Gradient Background Card**

```tsx
<Card className="bg-gradient-to-br from-card to-accent/20">
  {/* Content */}
</Card>
```

**Large Feature Card (Bento Grid)**

```tsx
<Card className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-card to-secondary/50">
  <CardHeader className="space-y-4">
    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
      <Icon className="w-8 h-8 text-primary" />
    </div>
    <CardTitle className="text-3xl">Main Feature</CardTitle>
    <CardDescription className="text-base">
      Larger description for emphasis
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* Stats or content */}
  </CardContent>
</Card>
```

---

## Common Patterns

### Section Container

```tsx
<section className="py-24 bg-secondary/30">
  <div className="container px-4 sm:px-6 lg:px-8">
    <div className="max-w-7xl mx-auto">
      {/* Content */}
    </div>
  </div>
</section>
```

### Hero Section

```tsx
<section className="grain-texture relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-dot-pattern">
  {/* Gradient overlay */}
  <div className="absolute inset-0 bg-gradient-to-br from-secondary/50 via-background to-accent/30" />

  <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
    <div className="max-w-4xl mx-auto text-center space-y-8">
      <h1 className="font-serif text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight">
        Hero Headline
        <span className="block text-primary mt-2">Secondary Line</span>
      </h1>

      <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
        Supporting copy
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
        <Button asChild size="lg">
          <Link href="/action">Primary CTA</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/secondary">Secondary CTA</Link>
        </Button>
      </div>
    </div>
  </div>
</section>
```

### Bento Grid Layout

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* Large Card - 2x2 */}
  <Card className="md:col-span-2 md:row-span-2">
    <CardHeader>
      <CardTitle className="text-3xl">Large Feature</CardTitle>
    </CardHeader>
  </Card>

  {/* Small Cards - 1x1 */}
  <Card>
    <CardHeader>
      <CardTitle className="text-xl">Small Feature</CardTitle>
    </CardHeader>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle className="text-xl">Small Feature</CardTitle>
    </CardHeader>
  </Card>

  {/* Wide Card - 2x1 */}
  <Card className="md:col-span-2">
    <CardHeader>
      <CardTitle className="text-2xl">Wide Feature</CardTitle>
    </CardHeader>
  </Card>
</div>
```

### Stats Display

```tsx
<div className="grid grid-cols-2 gap-4">
  <div className="space-y-2">
    <div className="text-4xl font-bold text-primary">10-30%</div>
    <div className="text-sm text-muted-foreground">Average savings</div>
  </div>
  <div className="space-y-2">
    <div className="text-4xl font-bold text-primary">2 min</div>
    <div className="text-sm text-muted-foreground">To verify</div>
  </div>
</div>
```

### Icon Container

```tsx
{/* Small icon - 12x12 (48px) */}
<div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
  <Icon className="w-6 h-6 text-primary" />
</div>

{/* Medium icon - 16x16 (64px) */}
<div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
  <Icon className="w-8 h-8 text-primary" />
</div>
```

---

## Utility Classes

### Spacing

```tsx
// Padding
<div className="p-6">      // 24px all sides
<div className="px-4">     // 16px horizontal
<div className="py-8">     // 32px vertical

// Margin
<div className="mb-8">     // 32px bottom
<div className="mt-16">    // 64px top

// Gap
<div className="space-y-8">  // 32px between children (vertical)
<div className="space-x-4">  // 16px between children (horizontal)
<div className="gap-6">      // 24px gap in grid/flex
```

### Text Styles

```tsx
// Headings (Serif)
<h1 className="font-serif text-6xl font-bold">
<h2 className="font-serif text-4xl font-bold">
<h3 className="font-serif text-3xl font-semibold">

// Body (Sans)
<p className="text-xl text-muted-foreground">  // Large body
<p className="text-base">                       // Regular
<p className="text-sm text-muted-foreground">   // Small
```

### Colors

```tsx
// Text
<span className="text-primary">        // Moss green
<span className="text-muted-foreground"> // Muted text
<span className="text-foreground">      // Primary text

// Backgrounds
<div className="bg-background">        // Main background
<div className="bg-secondary">         // Secondary background
<div className="bg-accent">            // Accent background
<div className="bg-primary">           // Primary (moss green)
```

### Borders

```tsx
<div className="border border-border">           // Standard border
<div className="border-2 border-primary">        // Thick primary border
<div className="border-b border-border/40">      // Bottom border (subtle)
```

### Shadows

```tsx
<div className="shadow-sm">                                  // Subtle
<div className="shadow-lg">                                  // Standard
<div className="shadow-xl">                                  // Large
<div className="shadow-lg shadow-primary/20">                // Colored
<div className="hover:shadow-xl hover:shadow-primary/30">   // Hover
```

### Transitions

```tsx
<div className="transition-all duration-300">                // Standard
<div className="hover:-translate-y-1 transition-all">        // Hover lift
<button className="active:scale-95 transition-all">         // Click scale
```

---

## Responsive Design

### Breakpoints

```tsx
// sm: 640px
<div className="text-base sm:text-lg">

// md: 768px
<div className="grid-cols-1 md:grid-cols-3">

// lg: 1024px
<div className="text-6xl lg:text-8xl">

// xl: 1280px
// 2xl: 1536px
```

### Common Responsive Patterns

```tsx
// Stack on mobile, row on desktop
<div className="flex flex-col sm:flex-row gap-4">

// Hide on mobile
<div className="hidden md:flex">

// Different column counts
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Responsive text sizes
<h1 className="text-4xl sm:text-5xl lg:text-7xl">
```

---

## Accessibility

### Focus States

All components have built-in focus states:

```tsx
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-ring
focus-visible:ring-offset-2
```

### Keyboard Navigation

- Buttons are keyboard accessible by default
- Use `asChild` for semantic HTML when needed

### Screen Readers

```tsx
// Visually hidden but accessible
<span className="sr-only">Screen reader text</span>
```

---

## Performance

### Font Loading

Fonts are loaded with `display: 'swap'` to prevent FOIT (Flash of Invisible Text):

```tsx
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',  // ← Prevents layout shift
})
```

### Image Optimization

Always use Next.js Image component:

```tsx
import Image from 'next/image'

<Image
  src="/path/to/image.jpg"
  alt="Description"
  width={500}
  height={300}
  className="rounded-2xl"
/>
```

---

## Adding New Components

### Install from shadcn/ui

```bash
npx shadcn@latest add [component-name]
```

### Customize After Installation

1. Component will be in `src/components/ui/[component-name].tsx`
2. Adjust colors to match design system (use CSS variables)
3. Update border radius to match (use `rounded-xl` or `rounded-2xl`)
4. Add transitions and shadows as needed
5. Test in both light and dark mode

---

## Common Customizations

### Make a Component "Warmer"

**Before (Generic)**
```tsx
<Card className="rounded-lg shadow">
```

**After (Warm)**
```tsx
<Card className="rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 bg-gradient-to-br from-card to-secondary/50">
```

### Add Icon to Button

```tsx
import { ArrowRight } from 'lucide-react'

<Button>
  Learn More
  <ArrowRight className="ml-2 h-4 w-4" />
</Button>
```

### Create Loading State

```tsx
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Loading...
</Button>
```

---

## Troubleshooting

### Component Not Found

```bash
# Install the missing component
npx shadcn@latest add [component-name]
```

### Styles Not Applying

1. Check Tailwind config includes the component path
2. Verify CSS variables in `globals.css`
3. Ensure className is using Tailwind classes correctly

### Dark Mode Issues

Ensure HTML has `dark` class toggled:

```tsx
<html lang="en" className={darkMode ? 'dark' : ''}>
```

---

**Quick Start**: Copy patterns from this guide, adjust content, maintain design consistency.

**Remember**: Use serif for headings, sans for body, warm colors always, large radius everywhere.
