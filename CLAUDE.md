# Claude Development Notes

## Current Focus

We are currently working on the **Sort Game** feature - a chronological ordering game that allows users to drag and drop flashcards into the correct timeline order.

## Before Starting Work

Please read `OVERVIEW.md` first to understand the application structure, key files, and how the flashcard system works.

## Task Management

Keep track of all development tasks in `TODO.md`. Update this file regularly to maintain visibility into progress and remaining work.

## Cross-Platform Requirements

**Critical**: Ensure all features work smoothly on both:
- **Desktop browsers** (mouse/keyboard interaction)
- **Mobile devices** (touch interaction, responsive design)

**IMPORTANT**: Whenever making any changes or fixes, make sure that your change will function both for desktop browsers (that use click) and for mobile touch interfaces (touch).

The Sort Game in particular requires careful attention to:
- Touch drag-and-drop functionality
- Mobile-friendly card sizing and positioning
- Responsive layout for different screen sizes
- Touch event handling vs mouse event handling
- Button/tab interactions that work with both click and touch events

## Key Files for Sort Game Development

- `sortgame.js` - Main sort game logic and drag-and-drop implementation
- `index.css` - Styling for sort game UI components (lines 682-876)
- `flashcard.js` - Integration with main application routing and modes

## Testing Checklist

When working on features, always test:
- [ ] Desktop Chrome/Firefox/Safari
- [ ] Mobile iOS Safari
- [ ] Mobile Android Chrome
- [ ] Touch interactions work smoothly
- [ ] Responsive design adapts properly
- [ ] No layout breaking on small screens