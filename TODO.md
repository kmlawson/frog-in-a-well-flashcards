# TODO - Sort Game Development

## Current Issues to Fix

### Critical Functionality Issues

1. **Fix Submit Button Logic**
   - Currently fails when only some cards are sorted
   - Should ask for user confirmation when submission is incomplete
   - Allow partial submissions with appropriate warnings

2. **Fix Reset Button on Mobile**
   - Reset functionality currently broken on mobile devices
   - Need to debug touch event handling for reset button

### Mobile UX Improvements

3. **Fix Visual Drop Indicators on Mobile**
   - Desktop shows where cards will be dropped (visual indicators work)
   - Mobile lacks this visual feedback during drag operations
   - Implement touch-friendly drop zone indicators

4. **Mobile Layout Improvements**
   - Maintain left/right split layout on mobile (currently missing)
   - Reduce font size for better mobile viewing
   - Ensure responsive design works properly on small screens

### UI/UX Polish

5. **Remove Dotted Border Lines**
   - Clean up visual design by removing dotted exterior lines
   - Maintain clear container boundaries without distracting borders

6. **Update Section Labels**
   - Remove "Cards to Sort" header (redundant)
   - Rename "Your Order" to "Events in Order" (more descriptive)

## Testing Requirements

Each fix should be tested on:
- [ ] Desktop browsers (Chrome, Firefox, Safari)
- [ ] Mobile iOS Safari
- [ ] Mobile Android Chrome
- [ ] Various screen sizes and orientations

## Files to Modify

- `sortgame.js` - Core logic fixes (submit, reset, mobile drag indicators)
- `index.css` - Mobile layout, font sizing, border styling
- Consider updates to `flashcard.js` if modal confirmations needed