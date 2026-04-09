# UI/UX Pro Max - Design Intelligence

Comprehensive design guide for web and mobile applications. Contains 50+ styles, 161 color palettes, 57 font pairings, 161 product types with reasoning rules, 99 UX guidelines, and 25 chart types across 10 technology stacks.

## When to Apply

This guide should be used when the task involves UI structure, visual design decisions, interaction patterns, or user experience quality control.

### Must Use
- Designing new pages (Landing Page, Dashboard, Admin, SaaS, Mobile App)
- Creating or refactoring UI components (buttons, modals, forms, tables, charts, etc.)
- Choosing color schemes, typography systems, spacing standards, or layout systems
- Reviewing UI code for user experience, accessibility, or visual consistency
- Implementing navigation structures, animations, or responsive behavior
- Making product-level design decisions (style, information hierarchy, brand expression)
- Improving perceived quality, clarity, or usability of interfaces

### Skip
- Pure backend logic development
- Only involving API or database design
- Performance optimization unrelated to the interface
- Infrastructure or DevOps work

## Rule Categories by Priority

Priority | Category | Impact | Key Checks | Anti-Patterns
1 | Accessibility | CRITICAL | Contrast 4.5:1, Alt text, Keyboard nav, Aria-labels | Removing focus rings, Icon-only buttons without labels
2 | Touch & Interaction | CRITICAL | Min size 44x44px, 8px+ spacing, Loading feedback | Reliance on hover only, Instant state changes (0ms)
3 | Performance | HIGH | WebP/AVIF, Lazy loading, Reserve space (CLS < 0.1) | Layout thrashing, Cumulative Layout Shift
4 | Style Selection | HIGH | Match product type, Consistency, SVG icons (no emoji) | Mixing flat & skeuomorphic randomly, Emoji as icons
5 | Layout & Responsive | HIGH | Mobile-first breakpoints, Viewport meta, No horizontal scroll | Horizontal scroll, Fixed px container widths, Disable zoom
6 | Typography & Color | MEDIUM | Base 16px, Line-height 1.5, Semantic color tokens | Text < 12px body, Gray-on-gray, Raw hex in components
7 | Animation | MEDIUM | Duration 150-300ms, Motion conveys meaning, Spatial continuity | Decorative-only animation, Animating width/height, No reduced-motion
8 | Forms & Feedback | MEDIUM | Visible labels, Error near field, Helper text, Progressive disclosure | Placeholder-only label, Errors only at top, Overwhelm upfront
9 | Navigation Patterns | HIGH | Predictable back, Bottom nav <=5, Deep linking | Overloaded nav, Broken back behavior, No deep links
10 | Charts & Data | LOW | Legends, Tooltips, Accessible colors | Relying on color alone to convey meaning

## Quick Reference

### 1. Accessibility (CRITICAL)
- **color-contrast** - Minimum 4.5:1 ratio for normal text (large text 3:1)
- **focus-states** - Visible focus rings on interactive elements (2-4px)
- **alt-text** - Descriptive alt text for meaningful images
- **aria-labels** - aria-label for icon-only buttons
- **keyboard-nav** - Tab order matches visual order; full keyboard support
- **form-labels** - Use label with for attribute
- **skip-links** - Skip to main content for keyboard users
- **heading-hierarchy** - Sequential h1->h6, no level skip
- **color-not-only** - Don't convey info by color alone (add icon/text)
- **reduced-motion** - Respect prefers-reduced-motion
- **escape-routes** - Provide cancel/back in modals and multi-step flows

### 2. Touch & Interaction (CRITICAL)
- **touch-target-size** - Min 44x44pt (Apple) / 48x48dp (Material)
- **touch-spacing** - Minimum 8px gap between touch targets
- **hover-vs-tap** - Use click/tap for primary interactions; don't rely on hover alone
- **loading-buttons** - Disable button during async operations; show spinner
- **error-feedback** - Clear error messages near problem
- **cursor-pointer** - Add cursor-pointer to clickable elements (Web)
- **gesture-conflicts** - Avoid horizontal swipe on main content
- **press-feedback** - Visual feedback on press (ripple/highlight)
- **safe-area-awareness** - Keep primary touch targets away from notch, Dynamic Island, gesture bar

### 3. Performance (HIGH)
- **image-optimization** - Use WebP/AVIF, responsive images, lazy load non-critical
- **image-dimension** - Declare width/height or use aspect-ratio to prevent layout shift
- **font-loading** - Use font-display: swap/optional
- **critical-css** - Prioritize above-the-fold CSS
- **lazy-loading** - Lazy load non-hero components via dynamic import
- **bundle-splitting** - Split code by route/feature
- **reduce-reflows** - Avoid frequent layout reads/writes
- **content-jumping** - Reserve space for async content
- **virtualize-lists** - Virtualize lists with 50+ items
- **progressive-loading** - Use skeleton screens instead of long blocking spinners
- **debounce-throttle** - Use debounce/throttle for high-frequency events

### 4. Style Selection (HIGH)
- **style-match** - Match style to product type
- **consistency** - Use same style across all pages
- **no-emoji-icons** - Use SVG icons (Heroicons, Lucide), not emojis
- **color-palette-from-product** - Choose palette from product/industry
- **effects-match-style** - Shadows, blur, radius aligned with chosen style
- **elevation-consistent** - Use a consistent elevation/shadow scale
- **dark-mode-pairing** - Design light/dark variants together
- **icon-style-consistent** - Use one icon set/visual language across the product
- **primary-action** - Each screen should have only one primary CTA

### 5. Layout & Responsive (HIGH)
- **viewport-meta** - width=device-width initial-scale=1 (never disable zoom)
- **mobile-first** - Design mobile-first, then scale up
- **breakpoint-consistency** - Use systematic breakpoints (375 / 768 / 1024 / 1440)
- **readable-font-size** - Minimum 16px body text on mobile
- **line-length-control** - Mobile 35-60 chars; desktop 60-75 chars
- **horizontal-scroll** - No horizontal scroll on mobile
- **spacing-scale** - Use 4pt/8dp incremental spacing system
- **container-width** - Consistent max-width on desktop
- **z-index-management** - Define layered z-index scale
- **viewport-units** - Prefer min-h-dvh over 100vh on mobile
- **visual-hierarchy** - Establish hierarchy via size, spacing, contrast

### 6. Typography & Color (MEDIUM)
- **line-height** - Use 1.5-1.75 for body text
- **line-length** - Limit to 65-75 characters per line
- **font-pairing** - Match heading/body font personalities
- **font-scale** - Consistent type scale (12 14 16 18 24 32)
- **contrast-readability** - Darker text on light backgrounds
- **weight-hierarchy** - Bold headings (600-700), Regular body (400), Medium labels (500)
- **color-semantic** - Define semantic color tokens (primary, secondary, error, surface)
- **color-dark-mode** - Dark mode uses desaturated/lighter tonal variants
- **color-accessible-pairs** - Foreground/background pairs must meet 4.5:1 (AA)
- **truncation-strategy** - Prefer wrapping over truncation
- **whitespace-balance** - Use whitespace intentionally to group related items

### 7. Animation (MEDIUM)
- **duration-timing** - Use 150-300ms for micro-interactions; complex <=400ms; avoid >500ms
- **transform-performance** - Use transform/opacity only; avoid animating width/height
- **loading-states** - Show skeleton or progress indicator when loading exceeds 300ms
- **excessive-motion** - Animate 1-2 key elements per view max
- **easing** - Use ease-out for entering, ease-in for exiting; avoid linear
- **motion-meaning** - Every animation must express a cause-effect relationship
- **state-transition** - State changes should animate smoothly, not snap
- **spring-physics** - Prefer spring/physics-based curves for natural feel
- **exit-faster-than-enter** - Exit animations shorter than enter (~60-70%)
- **interruptible** - Animations must be interruptible
- **no-blocking-animation** - Never block user input during an animation
- **scale-feedback** - Subtle scale (0.95-1.05) on press for tappable cards/buttons

### 8. Forms & Feedback (MEDIUM)
- **input-labels** - Visible label per input (not placeholder-only)
- **error-placement** - Show error below the related field
- **submit-feedback** - Loading then success/error state on submit
- **required-indicators** - Mark required fields (asterisk)
- **empty-states** - Helpful message and action when no content
- **toast-dismiss** - Auto-dismiss toasts in 3-5s
- **confirmation-dialogs** - Confirm before destructive actions
- **disabled-states** - Disabled elements use reduced opacity (0.38-0.5)
- **progressive-disclosure** - Reveal complex options progressively
- **inline-validation** - Validate on blur (not keystroke)
- **input-type-keyboard** - Use semantic input types (email, tel, number)
- **undo-support** - Allow undo for destructive or bulk actions
- **error-recovery** - Error messages must include a clear recovery path
- **multi-step-progress** - Multi-step flows show step indicator
- **destructive-emphasis** - Destructive actions use danger color and are visually separated

### 9. Navigation Patterns (HIGH)
- **bottom-nav-limit** - Bottom navigation max 5 items; use labels with icons
- **back-behavior** - Back navigation must be predictable and consistent
- **deep-linking** - All key screens must be reachable via deep link/URL
- **nav-label-icon** - Navigation items must have both icon and text label
- **nav-state-active** - Current location must be visually highlighted
- **modal-escape** - Modals must offer a clear close/dismiss affordance
- **search-accessible** - Search must be easily reachable
- **state-preservation** - Navigating back must restore previous scroll/filter/input state
- **overflow-menu** - When actions exceed available space, use overflow menu
- **adaptive-navigation** - Large screens prefer sidebar; small screens use bottom/top nav
- **navigation-consistency** - Navigation placement must stay the same across all pages
- **persistent-nav** - Core navigation must remain reachable from deep pages

### 10. Charts & Data (LOW)
- **chart-type** - Match chart type to data type (trend->line, comparison->bar, proportion->pie)
- **color-guidance** - Use accessible color palettes; avoid red/green only pairs
- **legend-visible** - Always show legend near the chart
- **tooltip-on-interact** - Provide tooltips on hover/tap showing exact values
- **axis-labels** - Label axes with units and readable scale
- **responsive-chart** - Charts must reflow or simplify on small screens
- **empty-data-state** - Show meaningful empty state when no data
- **number-formatting** - Use locale-aware formatting
- **no-pie-overuse** - Avoid pie/donut for >5 categories; switch to bar chart
- **contrast-data** - Data lines/bars vs background >=3:1

## Common Rules for Professional UI

### Icons & Visual Elements
- Use vector-based icons (Lucide, Heroicons), NOT emojis
- Use SVG or platform vector icons that scale cleanly
- Use official brand assets with correct proportions
- Define icon sizes as design tokens (icon-sm, icon-md=24pt, icon-lg)
- Consistent stroke width within the same visual layer
- One icon style per hierarchy level (filled vs outline)
- Minimum 44x44pt interactive area
- Icons aligned to text baseline with consistent padding
- Follow WCAG contrast standards for icons

### Interaction
- Provide clear pressed feedback within 80-150ms
- Keep micro-interactions around 150-300ms
- Screen reader focus order matches visual order
- Disabled states visually clear and non-interactive
- Touch targets >=44x44pt (iOS) / >=48x48dp (Android)
- Avoid nested tap/drag conflicts

### Light/Dark Mode Contrast
- Cards/surfaces clearly separated from background
- Body text contrast >=4.5:1
- Dividers/borders visible in both themes
- Modal/drawer scrim 40-60% black
- Both themes tested before delivery

### Layout & Spacing
- Respect top/bottom safe areas for fixed headers/tab bars
- Add spacing for status/navigation bars
- Use consistent 4/8dp spacing system
- Readable text measure on large devices
- Clear vertical rhythm tiers (16/24/32/48)
- Scroll content not hidden behind fixed bars

## Pre-Delivery Checklist

### Visual Quality
- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon family and style
- [ ] Official brand assets with correct proportions
- [ ] Pressed-state visuals don't shift layout
- [ ] Semantic theme tokens used consistently

### Interaction
- [ ] All tappable elements provide pressed feedback
- [ ] Touch targets meet minimum size (>=44x44pt)
- [ ] Micro-interaction timing 150-300ms
- [ ] Disabled states visually clear
- [ ] Screen reader focus order matches visual order

### Light/Dark Mode
- [ ] Primary text contrast >=4.5:1 in both modes
- [ ] Secondary text contrast >=3:1 in both modes
- [ ] Dividers/borders distinguishable in both modes
- [ ] Modal scrim opacity 40-60% black

### Layout
- [ ] Safe areas respected for headers and CTAs
- [ ] Scroll content not hidden behind fixed bars
- [ ] Verified on small phone, large phone, tablet
- [ ] 4/8dp spacing rhythm maintained
- [ ] Long-form text readable on larger devices

### Accessibility
- [ ] All meaningful images/icons have accessibility labels
- [ ] Form fields have labels, hints, clear error messages
- [ ] Color is not the only indicator
- [ ] Reduced motion supported
- [ ] Accessibility traits/roles/states announced correctly
