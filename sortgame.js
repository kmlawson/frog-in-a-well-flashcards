// Sort Game Module
// Handles the sorting/chronological ordering game functionality

// Sort game variables
let sortMode = false;
let sortCards = [];
let sortStartTime = null;
let sortEndTime = null;
let sortTimerInterval = null;
let draggedCard = null;
let sortSelectedCount = 10;

// Touch drag variables
let touchDragCard = null;
let touchStartPos = { x: 0, y: 0 };
let touchDragClone = null;
let initialTouchContainer = null;

// Click vs drag tracking
let isDragging = false;
let dragStarted = false;

// Legacy function - now handled by startSortGame
function initializeSortGame(cardCount) {
    startSortGame(cardCount);
}

// Start accurate timer that tracks real clock time
function startSortTimer() {
    sortStartTime = Date.now();
    sortEndTime = null;
    
    // Update display timer every second using the main timer element
    sortTimerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - sortStartTime) / 1000);
        const timerElement = document.getElementById('time');
        if (timerElement) {
            timerElement.textContent = elapsed;
        }
    }, 1000);
}

// Stop timer and return accurate elapsed time
function stopSortTimer() {
    if (sortTimerInterval) {
        clearInterval(sortTimerInterval);
        sortTimerInterval = null;
    }
    sortEndTime = Date.now();
    return Math.floor((sortEndTime - sortStartTime) / 1000);
}

// Legacy function - no longer needed with unified interface
function createSortGameInterface() {
    console.log('createSortGameInterface called - redirecting to startSortGame');
    // This function is no longer needed since we use unified interface
}

// Legacy function - no longer needed with unified interface
function createSortGameSelection() {
    console.log('createSortGameSelection called - functionality moved to unified interface');
    // This function is no longer needed since we use unified interface
}

// Populate the unsorted cards area
function populateUnsortedCards() {
    const unsortedContainer = document.getElementById('unsortedCards');
    unsortedContainer.innerHTML = '';
    
    sortCards.forEach((card, index) => {
        const cardElement = createDraggableCard(card, index);
        unsortedContainer.appendChild(cardElement);
    });
}

// Add event listeners to a card
function addCardEventListeners(cardElement) {
    // Add drag event listeners (desktop)
    cardElement.addEventListener('dragstart', handleDragStart);
    cardElement.addEventListener('dragend', handleDragEnd);
    
    // Add touch event listeners (mobile)
    cardElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    cardElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    cardElement.addEventListener('touchend', handleTouchEnd, { passive: false });
    cardElement.addEventListener('touchcancel', handleTouchCancel, { passive: false });
    
    // Add click-to-move functionality (desktop and mobile)
    cardElement.addEventListener('click', handleSortCardClick);
}

// Create a draggable card element
function createDraggableCard(card, index) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'sort-card';
    cardDiv.draggable = true;
    cardDiv.dataset.cardIndex = index;
    cardDiv.innerHTML = `
        <div class="sort-card-content">
            ${parseMarkdownItalics(card.front || card[0])}
        </div>
    `;
    
    addCardEventListeners(cardDiv);
    
    return cardDiv;
}

// Handle card click (non-drag) to move to bottom of sorted list
function handleSortCardClick(e) {
    // Only handle click if no dragging occurred
    if (!isDragging && !dragStarted) {
        const cardElement = e.currentTarget;
        const unsortedContainer = document.getElementById('unsortedCards');
        const sortedContainer = document.getElementById('sortedCards');
        
        // Only move cards from unsorted to sorted (left to right)
        if (cardElement.parentElement === unsortedContainer) {
            e.preventDefault();
            
            // Clone the card and add to bottom of sorted list
            const newCard = cardElement.cloneNode(true);
            // Ensure proper styling is applied
            newCard.style.color = '#333';
            newCard.style.opacity = '';
            newCard.style.transform = '';
            newCard.style.zIndex = '';
            newCard.style.boxShadow = '';
            addCardEventListeners(newCard);
            sortedContainer.appendChild(newCard);
            
            // Remove from unsorted list
            cardElement.remove();
        }
    }
    
    // Reset drag tracking
    isDragging = false;
    dragStarted = false;
}

// Handle drag start
function handleDragStart(e) {
    dragStarted = true;
    isDragging = true;
    
    draggedCard = this;
    this.style.opacity = '0.5';
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);
}

// Handle drag end
function handleDragEnd(e) {
    this.style.opacity = '';
    this.classList.remove('dragging');
    
    // Remove drag over effects from all containers
    document.querySelectorAll('#leftCards, #rightCards, #sortedCards, #unsortedCards').forEach(container => {
        container.style.backgroundColor = '';
        container.classList.remove('drop-zone-active');
    });
    
    // Remove insertion indicators
    removeInsertionIndicators();
    
    draggedCard = null;
}

// Touch event handlers for mobile drag and drop
function handleTouchStart(e) {
    e.preventDefault();
    touchDragCard = this;
    initialTouchContainer = this.parentElement;
    
    const touch = e.touches[0];
    touchStartPos = { x: touch.clientX, y: touch.clientY };
    
    // Reset drag tracking
    isDragging = false;
    dragStarted = false;
    
    // Create visual feedback (no rotation on mobile)
    this.style.opacity = '0.7';
    this.style.transform = 'scale(1.05)'; // Remove rotation as requested
    this.style.zIndex = '1000';
    this.style.boxShadow = '0 8px 16px rgba(0,0,0,0.3)'; // Add shadow for better visibility
}

function handleTouchMove(e) {
    e.preventDefault();
    
    if (!touchDragCard) return;
    
    const touch = e.touches[0];
    const currentPos = { x: touch.clientX, y: touch.clientY };
    
    // Detect if user has moved significantly (started dragging)
    const deltaX = Math.abs(currentPos.x - touchStartPos.x);
    const deltaY = Math.abs(currentPos.y - touchStartPos.y);
    const dragThreshold = 10; // pixels
    
    if (deltaX > dragThreshold || deltaY > dragThreshold) {
        isDragging = true;
        dragStarted = true;
    }
    
    // Create a clone for dragging if not exists
    if (!touchDragClone) {
        touchDragClone = touchDragCard.cloneNode(true);
        touchDragClone.style.position = 'fixed';
        touchDragClone.style.pointerEvents = 'none';
        touchDragClone.style.opacity = '0.8';
        touchDragClone.style.transform = 'scale(0.95)';
        touchDragClone.style.zIndex = '2000';
        document.body.appendChild(touchDragClone);
    }
    
    // Position the clone
    touchDragClone.style.left = (currentPos.x - 50) + 'px';
    touchDragClone.style.top = (currentPos.y - 25) + 'px';
    
    // Highlight drop zones
    const elementBelow = document.elementFromPoint(currentPos.x, currentPos.y);
    const dropZone = elementBelow ? elementBelow.closest('#leftCards, #rightCards') : null;
    
    // Remove previous highlights
    document.querySelectorAll('#leftCards, #rightCards').forEach(zone => {
        zone.classList.remove('drop-zone-active');
    });
    
    // Add highlight to current drop zone
    if (dropZone) {
        dropZone.classList.add('drop-zone-active');
        
        // Show insertion indicator for touch
        showTouchInsertionIndicator(dropZone, currentPos.y);
    } else {
        removeInsertionIndicators();
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    
    // Immediately remove all insertion indicators before doing anything else
    removeInsertionIndicators();
    
    if (!touchDragCard) return;
    
    // Check if this was a tap (no significant movement) for mobile click-to-move
    if (!isDragging && !dragStarted) {
        const unsortedContainer = document.getElementById('unsortedCards');
        const sortedContainer = document.getElementById('sortedCards');
        
        // Only move cards from unsorted to sorted (left to right)
        if (touchDragCard.parentElement === unsortedContainer) {
            console.log('Mobile tap detected - moving card to sorted list');
            
            // Clone the card and add to bottom of sorted list
            const newCard = touchDragCard.cloneNode(true);
            // Ensure proper styling is applied
            newCard.style.color = '#333';
            newCard.style.opacity = '';
            newCard.style.transform = '';
            newCard.style.zIndex = '';
            newCard.style.boxShadow = '';
            addCardEventListeners(newCard);
            sortedContainer.appendChild(newCard);
            
            // Remove from unsorted list
            touchDragCard.remove();
            
            // Reset variables and return early
            touchDragCard = null;
            initialTouchContainer = null;
            isDragging = false;
            dragStarted = false;
            return;
        }
    }
    
    const touch = e.changedTouches[0];
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropZone = elementBelow ? elementBelow.closest('#leftCards, #rightCards') : null;
    
    // Reset visual styles
    touchDragCard.style.opacity = '';
    touchDragCard.style.transform = '';
    touchDragCard.style.zIndex = '';
    touchDragCard.style.boxShadow = '';
    
    // Remove clone
    if (touchDragClone) {
        touchDragClone.remove();
        touchDragClone = null;
    }
    
    // Remove highlights and insertion indicators (second time to be sure)
    document.querySelectorAll('#leftCards, #rightCards').forEach(zone => {
        zone.classList.remove('drop-zone-active');
    });
    removeInsertionIndicators();
    
    // Handle drop
    if (dropZone) {
        // Determine target container
        let targetContainer = null;
        if (dropZone.id === 'sortedCards' || dropZone.id === 'unsortedCards') {
            targetContainer = dropZone;
        } else if (dropZone.id === 'leftCards') {
            targetContainer = document.getElementById('unsortedCards');
        } else if (dropZone.id === 'rightCards') {
            targetContainer = document.getElementById('sortedCards');
        }
        
        if (targetContainer && targetContainer !== initialTouchContainer) {
            // Find insertion point
            const afterElement = getTouchDropAfterElement(targetContainer, touch.clientY);
            
            // Move the actual card (don't clone)
            if (afterElement == null) {
                targetContainer.appendChild(touchDragCard);
            } else {
                targetContainer.insertBefore(touchDragCard, afterElement);
            }
        } else if (targetContainer === initialTouchContainer) {
            // Reordering within same container
            const afterElement = getTouchDropAfterElement(targetContainer, touch.clientY);
            if (afterElement && afterElement !== touchDragCard && afterElement !== touchDragCard.nextSibling) {
                targetContainer.insertBefore(touchDragCard, afterElement);
            }
        }
    }
    
    // Reset touch drag variables
    touchDragCard = null;
    initialTouchContainer = null;
    
    // Final cleanup - ensure all indicators are removed
    setTimeout(() => {
        removeInsertionIndicators();
    }, 50);
}

// Handle touch cancel (when touch is interrupted)
function handleTouchCancel(e) {
    e.preventDefault();
    
    // Immediately clean up everything
    removeInsertionIndicators();
    
    if (touchDragCard) {
        // Reset visual styles
        touchDragCard.style.opacity = '';
        touchDragCard.style.transform = '';
        touchDragCard.style.zIndex = '';
        touchDragCard.style.boxShadow = '';
    }
    
    // Remove clone
    if (touchDragClone) {
        touchDragClone.remove();
        touchDragClone = null;
    }
    
    // Remove highlights
    document.querySelectorAll('#leftCards, #rightCards').forEach(zone => {
        zone.classList.remove('drop-zone-active');
    });
    
    // Reset variables
    touchDragCard = null;
    initialTouchContainer = null;
}

// Get insertion point for touch drop
function getTouchDropAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.sort-card')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Setup event listeners for sort game
function setupSortGameListeners() {
    const sortedContainer = document.getElementById('sortedCards');
    const unsortedContainer = document.getElementById('unsortedCards');
    const leftCards = document.getElementById('leftCards');
    const rightCards = document.getElementById('rightCards');
    
    console.log('Setting up sort game listeners', { sortedContainer, unsortedContainer, leftCards, rightCards });
    
    // Make ALL containers drop zones to catch drops anywhere
    [sortedContainer, unsortedContainer, leftCards, rightCards].forEach(container => {
        if (container) {
            console.log('Adding listeners to:', container.id);
            container.addEventListener('dragover', handleDragOver);
            container.addEventListener('drop', handleDropRobust);
            container.addEventListener('dragenter', handleDragEnter);
            container.addEventListener('dragleave', handleDragLeave);
        }
    });
    
    // Mode tab switching and sort button handling will be handled by main application's event delegation
}

// Sort button handling now done by main application event delegation

// Handle drag enter
function handleDragEnter(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drop-zone-active');
}

// Handle drag leave
function handleDragLeave(e) {
    e.preventDefault();
    // Only remove highlight if we're actually leaving the container
    if (!e.currentTarget.contains(e.relatedTarget)) {
        e.currentTarget.classList.remove('drop-zone-active');
    }
}

// Handle drag over
function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Show visual feedback
    const container = e.currentTarget;
    container.classList.add('drop-zone-active');
    
    // Show insertion indicator
    showInsertionIndicator(e);
}

// Show where the card will be inserted
function showInsertionIndicator(e) {
    // Remove any existing indicators
    removeInsertionIndicators();
    
    // Find the target container
    let targetContainer = null;
    const dropTarget = e.currentTarget;
    
    if (dropTarget.id === 'sortedCards' || dropTarget.id === 'unsortedCards') {
        targetContainer = dropTarget;
    } else if (dropTarget.id === 'leftCards') {
        targetContainer = document.getElementById('unsortedCards');
    } else if (dropTarget.id === 'rightCards') {
        targetContainer = document.getElementById('sortedCards');
    }
    
    if (!targetContainer) return;
    
    const cards = [...targetContainer.querySelectorAll('.sort-card:not(.dragging)')];
    const mouseY = e.clientY;
    
    let insertAfter = null;
    let showAbove = false;
    
    for (const card of cards) {
        const rect = card.getBoundingClientRect();
        const cardCenterY = rect.top + rect.height / 2;
        
        if (mouseY < cardCenterY) {
            // Insert before this card
            showAbove = true;
            break;
        }
        insertAfter = card;
    }
    
    // Create insertion indicator
    const indicator = document.createElement('div');
    indicator.className = 'insertion-indicator';
    indicator.innerHTML = '<div class="insertion-line"></div>';
    
    if (showAbove && cards.length > 0) {
        // Insert before first card where mouse is above center
        const targetCard = showAbove ? cards.find(card => {
            const rect = card.getBoundingClientRect();
            return mouseY < rect.top + rect.height / 2;
        }) : null;
        
        if (targetCard) {
            targetContainer.insertBefore(indicator, targetCard);
        } else {
            targetContainer.appendChild(indicator);
        }
    } else if (insertAfter) {
        // Insert after the card
        insertAfter.insertAdjacentElement('afterend', indicator);
    } else {
        // Insert at the beginning or end
        if (cards.length === 0 || mouseY < cards[0].getBoundingClientRect().top) {
            targetContainer.insertBefore(indicator, targetContainer.firstChild);
        } else {
            targetContainer.appendChild(indicator);
        }
    }
}

// Remove insertion indicators
function removeInsertionIndicators() {
    document.querySelectorAll('.insertion-indicator').forEach(indicator => {
        indicator.remove();
    });
}

// Show insertion indicator for touch events
function showTouchInsertionIndicator(dropZone, touchY) {
    removeInsertionIndicators();
    
    console.log('Touch insertion indicator', { dropZone: dropZone.id, touchY });
    
    let targetContainer = null;
    if (dropZone.id === 'sortedCards' || dropZone.id === 'unsortedCards') {
        targetContainer = dropZone;
    } else if (dropZone.id === 'leftCards') {
        targetContainer = document.getElementById('unsortedCards');
    } else if (dropZone.id === 'rightCards') {
        targetContainer = document.getElementById('sortedCards');
    }
    
    console.log('Target container:', targetContainer?.id);
    if (!targetContainer) return;
    
    const cards = [...targetContainer.querySelectorAll('.sort-card')];
    let insertAfter = null;
    let showAbove = false;
    
    for (const card of cards) {
        const rect = card.getBoundingClientRect();
        const cardCenterY = rect.top + rect.height / 2;
        
        if (touchY < cardCenterY) {
            showAbove = true;
            break;
        }
        insertAfter = card;
    }
    
    // Create insertion indicator
    const indicator = document.createElement('div');
    indicator.className = 'insertion-indicator';
    indicator.innerHTML = '<div class="insertion-line"></div>';
    
    if (showAbove && cards.length > 0) {
        const targetCard = cards.find(card => {
            const rect = card.getBoundingClientRect();
            return touchY < rect.top + rect.height / 2;
        });
        
        if (targetCard) {
            targetContainer.insertBefore(indicator, targetCard);
        } else {
            targetContainer.appendChild(indicator);
        }
    } else if (insertAfter) {
        insertAfter.insertAdjacentElement('afterend', indicator);
    } else {
        if (cards.length === 0 || touchY < cards[0].getBoundingClientRect().top) {
            targetContainer.insertBefore(indicator, targetContainer.firstChild);
        } else {
            targetContainer.appendChild(indicator);
        }
    }
}

// Robust drop handler that works with any container
function handleDropRobust(e) {
    e.preventDefault();
    console.log('Drop event fired on:', e.currentTarget.id, 'draggedCard:', draggedCard);
    
    // Remove insertion indicators
    removeInsertionIndicators();
    
    // Remove visual feedback from all containers
    document.querySelectorAll('#leftCards, #rightCards, #sortedCards, #unsortedCards').forEach(container => {
        container.classList.remove('drop-zone-active');
    });
    
    if (!draggedCard) {
        console.log('No dragged card found');
        return;
    }
    
    // Check if we're dropping in the same container as the source
    const sourceContainer = draggedCard.parentElement;
    
    // Determine the actual target container
    let targetContainer = null;
    const dropTarget = e.currentTarget;
    
    if (dropTarget.id === 'sortedCards' || dropTarget.id === 'unsortedCards') {
        targetContainer = dropTarget;
    } else if (dropTarget.id === 'leftCards') {
        targetContainer = document.getElementById('unsortedCards');
    } else if (dropTarget.id === 'rightCards') {
        targetContainer = document.getElementById('sortedCards');
    }
    
    if (!targetContainer) {
        console.log('No valid target container found');
        return;
    }
    
    console.log('Dropping on:', targetContainer.id, 'from:', sourceContainer?.id);
    
    // Find the insertion point based on mouse position
    const afterElement = getDragAfterElement(targetContainer, e.clientY);
    
    // Reset dragged card styling
    draggedCard.style.opacity = '';
    draggedCard.style.transform = '';
    draggedCard.style.zIndex = '';
    draggedCard.classList.remove('dragging');
    
    // If we're moving within the same container, just reposition
    if (sourceContainer === targetContainer) {
        console.log('Moving within same container');
        if (afterElement == null) {
            targetContainer.appendChild(draggedCard);
        } else if (afterElement !== draggedCard && afterElement !== draggedCard.nextSibling) {
            targetContainer.insertBefore(draggedCard, afterElement);
        }
    } else {
        // Moving to different container - move the actual element
        console.log('Moving to different container');
        if (afterElement == null) {
            targetContainer.appendChild(draggedCard);
        } else {
            targetContainer.insertBefore(draggedCard, afterElement);
        }
    }
    
    console.log('Card moved successfully');
}

// Keep the old handler for compatibility
function handleDrop(e) {
    return handleDropRobust(e);
}

// Get the element that should come after the dragged element
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.sort-card:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Submit sort game
function submitSortGame() {
    const sortedContainer = document.getElementById('sortedCards');
    const sortedCardElements = sortedContainer.querySelectorAll('.sort-card');
    
    console.log('Submit check:', {
        sortedCount: sortedCardElements.length,
        totalCards: sortCards.length,
        sortedCards: Array.from(sortedCardElements).map(el => el.dataset.cardIndex)
    });
    
    if (sortedCardElements.length !== sortCards.length) {
        const missingCount = sortCards.length - sortedCardElements.length;
        const confirmMessage = `You have only sorted ${sortedCardElements.length} out of ${sortCards.length} cards. ${missingCount} cards are still unsorted.\n\nDo you want to submit anyway? Your score will be based only on the cards you've sorted.`;
        
        if (!confirm(confirmMessage)) {
            return;
        }
    }
    
    // Get user's order (only for cards that were actually sorted)
    const userOrder = Array.from(sortedCardElements).map(el => {
        return parseInt(el.dataset.cardIndex);
    });
    
    // Stop timer
    const finalTime = stopSortTimer();
    
    // Check correctness and show results
    showSortResults(userOrder, finalTime);
}

// Reset sort game
function resetSortGame() {
    console.log('Reset button clicked');
    
    // Move all cards back to left side
    const sortedCards = document.querySelectorAll('#sortedCards .sort-card');
    const unsortedContainer = document.getElementById('unsortedCards');
    
    console.log('Found sorted cards:', sortedCards.length);
    console.log('Unsorted container:', unsortedContainer);
    
    if (!unsortedContainer) {
        console.error('Unsorted container not found');
        return;
    }
    
    sortedCards.forEach(card => {
        const newCard = card.cloneNode(true);
        // Ensure proper styling is applied
        newCard.style.color = '#333';
        newCard.style.opacity = '';
        newCard.style.transform = '';
        newCard.style.zIndex = '';
        newCard.style.boxShadow = '';
        addCardEventListeners(newCard);
        unsortedContainer.appendChild(newCard);
        card.remove();
    });
    
    console.log('Reset complete. Cards moved back to unsorted area.');
}

// Helper function to find longest increasing subsequence
// This tells us how many cards are already in correct relative order
// Modified to treat same-year events as equivalent (non-decreasing sequence)
function findLongestIncreasingSubsequence(arr) {
    if (arr.length === 0) return 0;
    
    const dp = new Array(arr.length).fill(1);
    
    for (let i = 1; i < arr.length; i++) {
        for (let j = 0; j < i; j++) {
            // Allow same values (same-year events) - use <= instead of <
            if (arr[j] <= arr[i]) {
                dp[i] = Math.max(dp[i], dp[j] + 1);
            }
        }
    }
    
    return Math.max(...dp);
}

// Find which indices are part of the longest increasing subsequence
function findLongestIncreasingSubsequenceIndices(arr) {
    if (arr.length === 0) return [];
    
    const dp = new Array(arr.length).fill(1);
    const prev = new Array(arr.length).fill(-1);
    
    for (let i = 1; i < arr.length; i++) {
        for (let j = 0; j < i; j++) {
            if (arr[j] <= arr[i] && dp[j] + 1 > dp[i]) {
                dp[i] = dp[j] + 1;
                prev[i] = j;
            }
        }
    }
    
    // Find the ending index of the LIS
    let maxLength = Math.max(...dp);
    let endIndex = dp.indexOf(maxLength);
    
    // Reconstruct the LIS indices
    const lisIndices = [];
    let current = endIndex;
    while (current !== -1) {
        lisIndices.unshift(current);
        current = prev[current];
    }
    
    return lisIndices;
}

// Analyze each card's position status for visual feedback
// This identifies which cards actually need to be moved vs those already in correct relative order
function analyzeCardPositions(userOrder, correctOrder) {
    const analysis = {};
    
    // First, assume all cards are correct
    userOrder.forEach(cardIdx => {
        analysis[cardIdx] = { status: 'correct', reason: 'In correct chronological order' };
    });
    
    // Use the same LIS logic to find cards that are already in correct relative order
    const correctPositionMap = {};
    let currentPosition = 0;
    let lastYear = null;
    
    for (let i = 0; i < correctOrder.length; i++) {
        const cardIndex = correctOrder[i];
        const card = sortCards[cardIndex];
        const dateInfo = getCardDateInfo(card);
        
        // If this is a different year than the last card, advance position
        if (lastYear !== null && dateInfo.startYear !== lastYear) {
            currentPosition = i;
        }
        
        correctPositionMap[cardIndex] = currentPosition;
        lastYear = dateInfo.startYear;
    }
    
    // Find the longest increasing subsequence - these cards don't need to move
    const userCorrectPositions = userOrder.map(cardIdx => correctPositionMap[cardIdx]);
    const lisCards = findLongestIncreasingSubsequenceIndices(userCorrectPositions);
    
    // Mark cards that are NOT in the LIS as needing to move
    userOrder.forEach((cardIdx, userPos) => {
        if (!lisCards.includes(userPos)) {
            // This card needs to move
            const userDateInfo = getCardDateInfo(sortCards[cardIdx]);
            const correctPos = correctOrder.indexOf(cardIdx);
            
            if (correctPos !== -1) {
                // Check if it's just a same-year reordering issue
                const surroundingCards = userOrder.slice(Math.max(0, userPos - 1), userPos + 2);
                const hasSameYearNeighbor = surroundingCards.some(neighborIdx => {
                    if (neighborIdx === cardIdx) return false;
                    const neighborDateInfo = getCardDateInfo(sortCards[neighborIdx]);
                    return neighborDateInfo.startYear === userDateInfo.startYear;
                });
                
                if (hasSameYearNeighbor) {
                    analysis[cardIdx] = { 
                        status: 'same_year_wrong', 
                        reason: `Same-year ordering issue with ${userDateInfo.startYear} events`
                    };
                } else {
                    analysis[cardIdx] = { 
                        status: 'wrong_year', 
                        reason: `Needs to be moved to correct chronological position`
                    };
                }
            } else {
                analysis[cardIdx] = { status: 'wrong_year', reason: 'Needs to be moved' };
            }
        }
    });
    
    return analysis;
}

// Show sort game results
function showSortResults(userOrder, finalTime) {
    // Get the correct chronological order
    const correctOrder = getCorrectChronologicalOrder();
    
    // Handle empty submission
    if (userOrder.length === 0) {
        const sortResultsContent = document.getElementById('sortResultsContent');
        if (sortResultsContent) {
            sortResultsContent.innerHTML = `
                <div style="text-align: center; margin: 40px;">
                    <h2>No cards were sorted!</h2>
                    <p>Try again and drag some cards to the "Events in Order" section.</p>
                </div>
            `;
        }
        showSortGameResults();
        return;
    }
    
    // Calculate the minimum number of cards that need to be moved
    // We do this by finding the longest subsequence that's already in correct relative order
    
    // Create a mapping of card index to its correct position
    // But treat same-year events as having the same position for scoring purposes
    const correctPositionMap = {};
    let currentPosition = 0;
    let lastYear = null;
    
    for (let i = 0; i < correctOrder.length; i++) {
        const cardIndex = correctOrder[i];
        const card = sortCards[cardIndex];
        const dateInfo = getCardDateInfo(card);
        
        // If this is a different year than the last card, advance position
        if (lastYear !== null && dateInfo.startYear !== lastYear) {
            currentPosition = i;
        }
        
        correctPositionMap[cardIndex] = currentPosition;
        lastYear = dateInfo.startYear;
    }
    
    // Find the longest increasing subsequence based on correct positions
    // Cards in this subsequence don't need to be moved
    const userCorrectPositions = userOrder.map(cardIdx => correctPositionMap[cardIdx]);
    const lisLength = findLongestIncreasingSubsequence(userCorrectPositions);
    
    // Cards that are already in correct relative order don't need to be moved
    const cardsInCorrectPosition = lisLength;
    const cardsOutOfPlace = userOrder.length - lisLength;
    
    // Analyze each card to determine its status for visual feedback
    const cardAnalysis = analyzeCardPositions(userOrder, correctOrder);
    
    console.log('Scoring:', {
        userOrder,
        correctOrder,
        userCorrectPositions,
        lisLength,
        cardsInCorrectPosition,
        cardsOutOfPlace,
        cardAnalysis
    });
    
    const totalCards = userOrder.length;
    const percentage = totalCards > 0 ? Math.round((cardsInCorrectPosition / totalCards) * 100) : 0;
    const isPartial = userOrder.length < sortCards.length;
    
    // Add class to body to allow scrolling on mobile
    document.body.classList.add('sort-results');
    
    // Show results
    const sortResultsContent = document.getElementById('sortResultsContent');
    if (sortResultsContent) {
        sortResultsContent.innerHTML = `
        
        <div style="text-align: center; margin: 20px;">
            <h2>Your Score: ${percentage}%</h2>
            <p><strong>Time:</strong> ${finalTime} seconds</p>
            <p><strong>Cards in correct relative order:</strong> ${cardsInCorrectPosition} / ${totalCards}</p>
            ${cardsOutOfPlace > 0 ? `<p style="color: #f44336;"><strong>${cardsOutOfPlace} card${cardsOutOfPlace > 1 ? 's need' : ' needs'} to be moved</strong></p>` : '<p style="color: #4CAF50;"><strong>Perfect chronological order!</strong></p>'}
            ${isPartial ? `<p style="color: #ff9800;"><strong>Partial submission:</strong> ${userOrder.length} of ${sortCards.length} cards sorted</p>` : ''}
        </div>
        
        <div style="display: flex; gap: 20px; margin: 20px 0;">
            <div style="flex: 1;">
                <h3>Events in Your Order:</h3>
                ${userOrder.map(i => {
                    const analysis = cardAnalysis[i] || { status: 'unknown' };
                    let backgroundColor = '#fff';
                    let borderColor = '#ddd';
                    
                    if (analysis.status === 'wrong_year') {
                        backgroundColor = '#ffebee'; // Light red for penalized cards
                        borderColor = '#f44336';
                    } else if (analysis.status === 'same_year_wrong') {
                        backgroundColor = '#f5f5f5'; // Light grey for same-year issues
                        borderColor = '#999';
                    }
                    
                    return `<div style="padding: 5px; border: 1px solid ${borderColor}; margin: 2px; background-color: ${backgroundColor};" title="${analysis.reason || ''}">${parseMarkdownItalics(sortCards[i].front || sortCards[i][0])} - ${parseMarkdownItalics(sortCards[i].displayAnswer || sortCards[i][1])}</div>`;
                }).join('')}
            </div>
            <div style="flex: 1;">
                <h3>Correct Chronological Order:</h3>
                ${correctOrder.map(i => `<div style="padding: 5px; border: 1px solid #ddd; margin: 2px;">${parseMarkdownItalics(sortCards[i].front || sortCards[i][0])} - ${parseMarkdownItalics(sortCards[i].displayAnswer || sortCards[i][1])}</div>`).join('')}
            </div>
        </div>
        
        ${(() => {
            // Check if there are any highlighted cards to show legend
            const hasWrongYear = Object.values(cardAnalysis).some(analysis => analysis.status === 'wrong_year');
            const hasSameYearWrong = Object.values(cardAnalysis).some(analysis => analysis.status === 'same_year_wrong');
            
            if (hasWrongYear || hasSameYearWrong) {
                return `<div style="text-align: center; margin: 20px 0 10px 0; font-size: 12px; color: #666;">
                    ${hasWrongYear ? '<span style="background: #ffebee; padding: 2px 6px; border: 1px solid #f44336; margin: 0 5px;">Wrong year (penalized)</span>' : ''}
                    ${hasSameYearWrong ? '<span style="background: #f5f5f5; padding: 2px 6px; border: 1px solid #999; margin: 0 5px;">Same year, wrong order (not penalized)</span>' : ''}
                </div>`;
            }
            return '';
        })()}
        
        `;
    }
    
    // Show the results screen
    showSortGameResults();
}

// Get correct chronological order of selected cards
function getCorrectChronologicalOrder() {
    // Create array of indices with their corresponding dates
    const cardIndices = sortCards.map((card, index) => ({ index, card }));
    
    // Sort by extracting and comparing dates
    cardIndices.sort((a, b) => {
        return compareCardDates(a.card, b.card);
    });
    
    return cardIndices.map(item => item.index);
}

// Check if chronological order of two cards is acceptable
function isChronologicalOrderAcceptable(card1, card2) {
    const dateInfo1 = getCardDateInfo(card1);
    const dateInfo2 = getCardDateInfo(card2);
    
    // If either card has no date, accept any order
    if (!dateInfo1.hasDate || !dateInfo2.hasDate) {
        return { isCorrect: true, reason: "No date information" };
    }
    
    // Check if the ranges overlap or are ambiguous
    const overlap = checkDateOverlap(dateInfo1, dateInfo2);
    
    if (overlap.hasOverlap) {
        // Overlapping dates - both orders are acceptable
        return { isCorrect: true, reason: "Overlapping date ranges" };
    }
    
    // Non-overlapping dates - check strict chronological order
    if (dateInfo1.endYear <= dateInfo2.startYear) {
        // card1 should come before card2
        return { isCorrect: true, reason: "Correct chronological order" };
    } else if (dateInfo2.endYear <= dateInfo1.startYear) {
        // card1 should come after card2
        return { isCorrect: false, reason: `${dateInfo1.displayDate} should come after ${dateInfo2.displayDate}` };
    } else {
        // Should not happen if overlap detection works correctly
        return { isCorrect: true, reason: "Ambiguous date relationship" };
    }
}

// Get comprehensive date information from a card
function getCardDateInfo(card) {
    const dateStr = (card.displayAnswer || card[1]).trim();
    let startYear = null;
    let endYear = null;
    let hasDate = false;
    
    // Try to extract year range (e.g., "1850-1864", "1850-64")
    const rangeMatch = dateStr.match(/(\d{4})[-–](\d{1,4})/);
    if (rangeMatch) {
        startYear = parseInt(rangeMatch[1]);
        let rawEndYear = parseInt(rangeMatch[2]);
        
        // Handle abbreviated years (e.g., "64" instead of "1864")
        if (rangeMatch[2].length < 4) {
            const prefix = rangeMatch[1].slice(0, -rangeMatch[2].length);
            endYear = parseInt(prefix + rangeMatch[2]);
        } else {
            endYear = rawEndYear;
        }
        hasDate = true;
    } else {
        // Try to extract single year
        const yearMatch = dateStr.match(/(\d{4})/);
        if (yearMatch) {
            startYear = endYear = parseInt(yearMatch[1]);
            hasDate = true;
        }
    }
    
    return {
        startYear: startYear,
        endYear: endYear,
        hasDate: hasDate,
        displayDate: dateStr,
        isRange: startYear !== endYear
    };
}

// Check if two date ranges overlap
function checkDateOverlap(dateInfo1, dateInfo2) {
    if (!dateInfo1.hasDate || !dateInfo2.hasDate) {
        return { hasOverlap: false, reason: "Missing date information" };
    }
    
    // Check for any overlap between the ranges
    const overlap = !(dateInfo1.endYear < dateInfo2.startYear || dateInfo2.endYear < dateInfo1.startYear);
    
    if (overlap) {
        return {
            hasOverlap: true,
            reason: `Ranges ${dateInfo1.displayDate} and ${dateInfo2.displayDate} overlap`
        };
    } else {
        return {
            hasOverlap: false,
            reason: `No overlap between ${dateInfo1.displayDate} and ${dateInfo2.displayDate}`
        };
    }
}

// Compare two cards chronologically (used for creating suggested order)
function compareCardDates(card1, card2) {
    const dateInfo1 = getCardDateInfo(card1);
    const dateInfo2 = getCardDateInfo(card2);
    
    if (!dateInfo1.hasDate && !dateInfo2.hasDate) return 0;
    if (!dateInfo1.hasDate) return 1;
    if (!dateInfo2.hasDate) return -1;
    
    // Compare start years primarily
    if (dateInfo1.startYear !== dateInfo2.startYear) {
        return dateInfo1.startYear - dateInfo2.startYear;
    }
    
    // If start years are equal, compare end years
    return dateInfo1.endYear - dateInfo2.endYear;
}

// Initialize sort game interface (called by main app)
function initializeSortGameInterface() {
    console.log('=== initializeSortGameInterface() called ===');
    
    sortMode = true;
    
    // Populate card count options
    setupCardCountSelection();
    
    // Show the selection interface by default
    showSortGameSelection();
    
    console.log('=== Sort game interface initialized ===');
}

// Setup card count selection buttons
function setupCardCountSelection() {
    const cardCountOptions = document.getElementById('cardCountOptions');
    if (!cardCountOptions) {
        console.error('cardCountOptions element not found');
        return;
    }
    
    const totalCards = cards.length;
    console.log('Setting up card count options for', totalCards, 'total cards');
    
    // Determine available card count options
    let cardOptions = [];
    if (totalCards >= 30) {
        cardOptions = [10, 20, 30];
    } else if (totalCards >= 20) {
        cardOptions = [10, 20, totalCards];
    } else if (totalCards >= 10) {
        cardOptions = [10, totalCards];
    } else {
        cardOptions = [totalCards];
    }
    
    // Create buttons
    cardCountOptions.innerHTML = cardOptions.map(count => 
        `<button class="card-count-btn" data-count="${count}">${count} Cards</button>`
    ).join('');
    
    // Add click listeners for card count buttons
    document.querySelectorAll('.card-count-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const count = parseInt(e.target.dataset.count);
            console.log('Starting sort game with', count, 'cards');
            startSortGame(count);
        });
    });
}

// Show the sort game selection screen
function showSortGameSelection() {
    const sortGameSelection = document.getElementById('sortGameSelection');
    const sortGameInterface = document.getElementById('sortGameInterface');
    const sortGameResults = document.getElementById('sortGameResults');
    
    if (sortGameSelection) sortGameSelection.style.display = 'block';
    if (sortGameInterface) sortGameInterface.style.display = 'none';
    if (sortGameResults) sortGameResults.style.display = 'none';
    
    console.log('Sort game selection screen shown');
}

// Start the actual sort game with specified card count
function startSortGame(cardCount) {
    console.log('=== startSortGame() called with', cardCount, 'cards ===');
    
    sortSelectedCount = cardCount;
    
    // Select random cards
    const shuffled = [...cards];
    shuffleArray(shuffled);
    sortCards = shuffled.slice(0, cardCount);
    
    // Start timer
    startSortTimer();
    
    // Show game interface
    showSortGameInterface();
    
    // Populate cards
    populateUnsortedCards();
    
    // Setup drag and drop
    setupSortGameListeners();
    
    console.log('=== Sort game started ===');
}

// Show the sort game interface
function showSortGameInterface() {
    const sortGameSelection = document.getElementById('sortGameSelection');
    const sortGameInterface = document.getElementById('sortGameInterface');
    const sortGameResults = document.getElementById('sortGameResults');
    
    if (sortGameSelection) sortGameSelection.style.display = 'none';
    if (sortGameInterface) sortGameInterface.style.display = 'block';
    if (sortGameResults) sortGameResults.style.display = 'none';
    
    console.log('Sort game interface shown');
}

// Show the sort game results
function showSortGameResults() {
    const sortGameSelection = document.getElementById('sortGameSelection');
    const sortGameInterface = document.getElementById('sortGameInterface');
    const sortGameResults = document.getElementById('sortGameResults');
    
    if (sortGameSelection) sortGameSelection.style.display = 'none';
    if (sortGameInterface) sortGameInterface.style.display = 'none';
    if (sortGameResults) sortGameResults.style.display = 'block';
    
    console.log('Sort game results shown');
}

// Function for main application to clean up sort game state
function cleanupSortGame() {
    console.log('Cleaning up sort game state');
    
    // Stop timer
    if (sortTimerInterval) {
        clearInterval(sortTimerInterval);
        sortTimerInterval = null;
    }
    
    // Reset timer display to 0
    const timerElement = document.getElementById('time');
    if (timerElement) {
        timerElement.textContent = '0';
    }
    
    // Reset sort game variables
    sortCards = [];
    sortStartTime = null;
    sortEndTime = null;
    draggedCard = null;
    
    // Reset touch drag variables
    touchDragCard = null;
    touchStartPos = { x: 0, y: 0 };
    touchDragClone = null;
    initialTouchContainer = null;
    
    // Reset drag tracking
    isDragging = false;
    dragStarted = false;
    
    console.log('Sort game cleanup complete');
}

