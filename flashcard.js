// Global variables
let originalCards = [];
let cards = [];
let currentCard;
let currentCardFile;
let currentCardAnswer = '';
let showingFront = true;
let testMode = false;
let reviewMode = false;
let testCards = [];
let testIndex = 0;
let testResults = [];
let timerInterval;
let testTime = 0;
let longestStreak = 0;
let currentStreak = 0;
let incorrectCards = [];
let currentCardSet;
let reviewIndex = 0;
let requiredPercentage = 100; // Default to 100%
let stats = {
    correct: 0,
    incorrect: 0,
    remaining: 0,
    total: 0,
    streak: 0
};


// Initialize flashcards
async function initializeFlashcards(filename) {
    try {
        const { title, description, cards, requiredPercentage: fetchedPercentage } = await fetchCardSet(filename);
        requiredPercentage = fetchedPercentage; // Store the fetched percentage
        clearTimer();
        originalCards = cards;
        currentCardFile = filename;
        currentCardSet = filename;

        // Create the flashcard view
        const container = document.getElementById('container');
        if (!container) {
            console.error('Container element not found');
            return;
        }

        container.innerHTML = `
    <div class="flashcard-title">${title}</div>
    ${requiredPercentage > 0 ? `
        <div id="mode-tabs">
            <button id="practiceMode" class="tab active">Practice</button>
            <button id="testMode" class="tab">Test</button>
        </div>
    ` : ''}
    <div id="timer" style="display:none;">Time: <span id="time">0</span>s</div>
    <div id="card-container">
        <div id="card"></div>
    </div>
    <div id="practiceControls">
        <p id="practiceInstructions">
            Tap to flip, then tap on right for correct or on left for incorrect.<br>
            Keyboard: Spacebar to flip/mark correct, Backspace to mark incorrect.
        </p>
    </div>
    ${requiredPercentage > 0 ? `
        <div id="testControls" style="display:none;">
            <button id="startTest" class="button">Start Test</button>
            <div id="activeTest" style="display:none;">
                <input type="text" id="input" placeholder="Enter your answer">
                <button id="submit">Submit</button>
            </div>
        </div>
    ` : ''}
            <div id="stats"></div>
            <div id="finalResult" style="display:none;">
                <h2>Final Result</h2>
                <div id="resultSummary"></div>
                <table id="resultTable"></table>
            </div>
            <div id="reviewControls" style="display:none;">
                <button id="previousReview" class="review-button">Previous</button>
                <button id="nextReview" class="review-button">Next</button>
                <button id="endReview" class="review-button">End Review</button>
            </div>
            <div class="button-container">
            <button id="startOver" style="display:none;">Start Over</button>
            <button id="reviewIncorrect" style="display:none;">Review Incorrect Answers</button>
            </div>
            
            <div class="button-container">
                <button id="startOver" style="display:none;">Start Over</button>
                <button id="reviewIncorrect" style="display:none;">Review Incorrect Answers</button>
            </div>
            <div class="bottom-buttons">
                <a href="#index" class="button">Return to Index</a>
                <a href="#list/${filename}" class="button" id="browseList">Browse List</a>
            </div>
        `;

        // Reinitialize event listeners for the new elements
        initializeEventListeners();

        resetCards();
    } catch (error) {
        console.error('Error initializing flashcards:', error);
        // Handle the error appropriately, e.g., show an error message to the user
    }
}

// Find all the card sets in the cards directory

function clearTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

async function fetchAllCardSets() {
    try {
        const response = await fetch('cards/');
        const files = await response.text();
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(files, 'text/html');
        const fileLinks = Array.from(htmlDoc.querySelectorAll('a'))
            .filter(a => a.href.endsWith('.txt'))
            .map(a => a.href.split('/').pop());

        const cardSets = await Promise.all(fileLinks.map(async filename => {
            const content = await fetchCardSet(filename);
            const hasHighScores = await checkHighScoresExist(filename);
            return {
                filename,
                title: content.title,
                description: content.description,
                cardCount: content.cards.length,
                requiredPercentage: content.requiredPercentage,
                hasHighScores
            };
        }));

        return cardSets;
    } catch (error) {
        console.error('Error fetching card sets:', error);
        throw error;
    }
}


async function checkHighScoresExist(filename) {
    const baseFilename = filename.replace('.txt', '');
    try {
        const response = await fetch(`scores/${baseFilename}_scores.txt?date=${Date.now()}`);
        return response.ok;
    } catch (error) {
        return false;
    }
}

// Fetch and parse card set
// Update the fetchCardSet function to parse the requiredPercentage
async function fetchCardSet(filename) {
    const response = await fetch(`cards/${filename}`);
    if (!response.ok) throw new Error('Failed to fetch card set');
    const content = await response.text();
    const { title, description, requiredPercentage, cards } = parseCardSet(content);
    return { title, description, requiredPercentage, cards };
}


function parseCardSet(content) {
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const title = lines.shift();
    const description = lines.shift();
    const requiredPercentage = parseFloat(lines.shift()) || 0; // Parse as float, default to 0 if not a valid number
    const cards = lines.map(line => {
        const [front, back] = line.split('\t');
        return [front.trim(), back.trim()];
    });
    return { title, description, requiredPercentage, cards };
}


// Reset cards
function resetCards() {
    cards = [...originalCards];
    shuffleArray(cards);
    incorrectCards = []; 
    stats = {
        correct: 0,
        incorrect: 0,
        remaining: cards.length,
        total: cards.length,
        streak: 0
    };
    if (document.getElementById('card')) {
        updateCard();
        updateStats();
    }
}

// Shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Start test
function startTest() {
    let shuffledCards = [...cards];
    shuffleArray(shuffledCards);
    testCards = shuffledCards.slice(0, gameOptions.testQuestionCount);
    
    testIndex = 0;
    testResults = [];

    clearTimer();
    testTime = 0;

    longestStreak = 0;
    currentStreak = 0;
    
    const requiredCorrect = Math.ceil(gameOptions.testQuestionCount * (requiredPercentage / 100));

    stats = {
        correct: 0,
        incorrect: 0,
        remaining: gameOptions.testQuestionCount,
        total: gameOptions.testQuestionCount,
        streak: 0,
        requiredCorrect: requiredCorrect
    };
    
    document.getElementById('startTest').style.display = 'none';
    document.getElementById('activeTest').style.display = 'block';
    document.getElementById('card-container').style.display = 'block';
    document.getElementById('timer').style.display = 'block';
    document.getElementById('time').textContent = testTime;
    document.getElementById('stats').style.display = 'block';
    
    // Clear any previous results
    const finalResult = document.getElementById('finalResult');
    if (finalResult) finalResult.style.display = 'none';
    
    // Reset the buttonsContainer
    const buttonsContainer = document.getElementById('buttonsContainer');
    if (buttonsContainer) {
        buttonsContainer.innerHTML = '';
    }

    timerInterval = setInterval(() => {
        testTime++;
        document.getElementById('time').textContent = testTime;
    }, 1000);

    updateTestCard();

}

// Update test card
function updateTestCard() {
    if (testIndex < testCards.length) {
        currentCard = testCards[testIndex];
        document.getElementById('card').innerHTML = `<div class="card-content">${currentCard[0]}</div>`;
        currentCardAnswer = currentCard[1];
        document.getElementById('input').value = '';
        document.getElementById('card-container').style.display = 'block';
        document.getElementById('input').focus();
        updateStats();
    } else {
        endTest();
    }
}

// Submit test answer
function submitTestAnswer() {
    const userAnswer = document.getElementById('input').value.trim();
    const isCorrect = checkAnswer(userAnswer);
    testResults.push({
        question: currentCard[0],
        correctAnswer: currentCardAnswer,
        userAnswer: userAnswer,
        isCorrect: isCorrect
    });

    if (isCorrect) {
        stats.correct++;
        currentStreak++;
        stats.streak = currentStreak;
        longestStreak = Math.max(longestStreak, currentStreak);
        flashCard(true);
    } else {
        stats.incorrect++;
        currentStreak = 0;
        stats.streak = 0;
        flashCard(false);
    }

    stats.remaining--;
    updateStats();

    if (isCorrect) {
        setTimeout(() => {
            testIndex++;
            if (testIndex >= testCards.length) {
                endTest();
            } else {
                updateTestCard();
            }
        }, 200); // Delay to allow green flash to be visible
    } else {
        // Show correct answer briefly
        const cardElement = document.getElementById('card');
        cardElement.innerHTML = `<div class="card-content">${currentCardAnswer}</div>`;
        setTimeout(() => {
            testIndex++;
            if (testIndex >= testCards.length) {
                endTest();
            } else {
                updateTestCard();
            }
        }, 1000); // Show correct answer for 1 second
    }
}


// End test
function endTest() {
    clearTimer();
    document.getElementById('card-container').style.display = 'none';
    document.getElementById('activeTest').style.display = 'none';
    document.getElementById('timer').style.display = 'none';
    document.getElementById('stats').style.display = 'none';
    document.getElementById('finalResult').style.display = 'block';
    displayFinalResults();
}

// Display final results
function displayFinalResults() {
    const totalQuestions = testResults.length;
    const correctAnswers = testResults.filter(result => result.isCorrect).length;
    const percentage = ((correctAnswers / totalQuestions) * 100).toFixed(1);
    const passed = correctAnswers >= stats.requiredCorrect;

    let summaryHTML = `
        <div class="final-stats">
            <p><strong>Correct Answers:</strong> ${correctAnswers} out of ${totalQuestions} (${percentage}%)</p>
            <p><strong>Minimum Pass:</strong> ${stats.requiredCorrect} (${requiredPercentage}%)</p>
            <p><strong>Result:</strong> ${passed ? 'Passed' : 'Failed'}</p>
            <p><strong>Time Taken:</strong> ${testTime} seconds</p>
            <p><strong>Longest Streak:</strong> ${longestStreak}</p>
        </div>
    `;
    document.getElementById('resultSummary').innerHTML = summaryHTML;

    let tableHTML = `
        <tr>
            <th>Question</th>
            <th>Correct Answer</th>
            <th>Your Answer</th>
            <th>Result</th>
        </tr>
    `;
    testResults.forEach(result => {
        tableHTML += `
            <tr>
                <td>${result.question}</td>
                <td>${result.correctAnswer}</td>
                <td>${result.userAnswer}</td>
                <td>${result.isCorrect ? 'Correct' : 'Incorrect'}</td>
            </tr>
        `;
    });
    document.getElementById('resultTable').innerHTML = tableHTML;

    // Always remove the existing buttonsContainer if it exists
    const existingButtonsContainer = document.getElementById('buttonsContainer');
    if (existingButtonsContainer) {
        existingButtonsContainer.remove();
    }

    // Create a new buttonsContainer
    const finalResultContainer = document.getElementById('finalResult');
    const buttonsHTML = `
        <div id="buttonsContainer">
            <button id="reviewTest" class="green-button">Review</button>
            ${passed ? `
                <div id="saveScoreContainer">
                    <button id="saveScore" class="green-button">Save Score</button>
                    <div id="saveScoreForm" style="display:none;">
                        <input type="text" id="playerName" placeholder="Enter your name">
                        <button id="submitScore" class="green-button">Submit</button>
                    </div>
                    <div id="saveScoreMessage"></div>
                </div>
            ` : ''}
        </div>
    `;
    finalResultContainer.insertAdjacentHTML('beforeend', buttonsHTML);

    // Set up the review button event listener
    setupReviewButton();

    // Set up the save score button event listener if it exists
    const saveScoreButton = document.getElementById('saveScore');
    if (saveScoreButton) {
        saveScoreButton.addEventListener('click', showSaveScoreForm);
    }

    const submitScoreButton = document.getElementById('submitScore');
    if (submitScoreButton) {
        submitScoreButton.addEventListener('click', handleSaveScore);
    }
}

function showSaveScoreForm() {
    document.getElementById('saveScore').style.display = 'none';
    document.getElementById('saveScoreForm').style.display = 'block';
}


function handleSaveScore() {
    const nameInput = document.getElementById('playerName');
    const name = nameInput.value.trim();
    const messageElement = document.getElementById('saveScoreMessage');

    if (name && /^\w+$/.test(name)) {
        const currentDate = new Date();
        const formattedDate = `${currentDate.getFullYear()}.${String(currentDate.getMonth() + 1).padStart(2, '0')}.${String(currentDate.getDate()).padStart(2, '0')}`;
        const score = {
            name: name,
            time: testTime,
            date: formattedDate,
            cardFile: currentCardFile
        };
        
        // Send score to PHP script
        fetch('save_score.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(score),
        })
        .then(response => response.text())
        .then(text => {
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse JSON:', text);
                throw new Error('Server returned invalid JSON');
            }
            
            if (data.unexpected_output) {
                console.warn('Unexpected output from server:', data.unexpected_output);
            }
            
            if (data.success) {
                messageElement.textContent = 'Score saved successfully!';
                messageElement.style.color = 'green';
                document.getElementById('saveScoreForm').style.display = 'none';
            } else {
                let errorMessage = data.message || 'Failed to save score. Please try again.';
                if (data.debug) {
                    errorMessage += ' Debug info: ' + JSON.stringify(data.debug);
                }
                messageElement.textContent = errorMessage;
                messageElement.style.color = 'red';
                console.error('Score save error:', data);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            messageElement.textContent = 'An error occurred while saving the score. Please check the console for more information.';
            messageElement.style.color = 'red';
        });
    } else {
        messageElement.textContent = "Invalid name. Please enter a single word with no spaces.";
        messageElement.style.color = 'red';
    }
}


function setupReviewButton() {
    const reviewButton = document.getElementById('reviewTest');
    if (reviewButton) {
        reviewButton.addEventListener('click', startReview);
    }
}

// Get random card
function getRandomCard() {
    return cards.length > 0 ? cards[Math.floor(Math.random() * cards.length)] : null;
}


// Update card
function updateCard() {
    currentCard = getRandomCard();
    const cardElement = document.getElementById('card');
    const startOverButton = document.getElementById('startOver');
    const reviewIncorrectButton = document.getElementById('reviewIncorrect');

    if (!cardElement) {
        console.warn('Card element not found. Might be in a different view.');
        return;
    }

    if (!currentCard) {
        cardElement.innerHTML = '<div class="card-content">No cards remaining</div>';
        if (startOverButton) startOverButton.style.display = 'inline-block';
        if (reviewIncorrectButton) {
            reviewIncorrectButton.style.display = incorrectCards.length > 0 ? 'inline-block' : 'none';
        }
        // Update stats to show final state
        stats.remaining = 0;
        updateStats();
        return;
    }

    showingFront = true;
    cardElement.innerHTML = `<div class="card-content">${currentCard[0]}</div>`;
    currentCardAnswer = currentCard[1];

    const inputElement = document.getElementById('input');
    if (inputElement) inputElement.value = '';

    updateStats();
}

// Flip card
function flipCard() {
    if (testMode || reviewMode) return;
    showingFront = !showingFront;
    document.getElementById('card').innerHTML = `<div class="card-content">${showingFront ? currentCard[0] : currentCard[1]}</div>`;
}

// Handle card click
function handleCardClick(event) {
    if (testMode) return;

    const pageWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    const clickX = event.clientX || (event.changedTouches && event.changedTouches[0].clientX);

    if (reviewMode) {
        if (clickX < pageWidth * 0.5) {
            handleIncorrect();
        } else {
            handleCorrect();
        }
        return;
    }

    if (showingFront) {
        flipCard();
    } else {
        if (clickX < pageWidth * 0.5) {
            handleIncorrect();
        } else {
            handleCorrect();
        }
    }
}

// Check answer
function checkAnswer(userAnswer) {
    const correctAnswer = currentCardAnswer.trim().toLowerCase();
    userAnswer = userAnswer.trim().toLowerCase();

    // Function to extract year from a string
    function extractYear(str) {
        const yearMatch = str.match(/\b(\d{4})\b/);
        return yearMatch ? yearMatch[1] : null;
    }

    // Function to normalize year range
    function normalizeYearRange(str) {
        const rangeMatch = str.match(/(\d{4})[-–](\d{1,4})/);
        if (rangeMatch) {
            const startYear = parseInt(rangeMatch[1]);
            let endYear = parseInt(rangeMatch[2]);
            if (rangeMatch[2].length < 4) {
                endYear = parseInt(rangeMatch[1].slice(0, -rangeMatch[2].length) + rangeMatch[2]);
            }
            return [startYear, endYear];
        }
        return null;
    }

    // Check for exact match first
    if (userAnswer === correctAnswer) {
        return true;
    }

    // Check for single year match
    const correctYear = extractYear(correctAnswer);
    if (correctYear && !correctAnswer.includes('-')) {
        return userAnswer.includes(correctYear);
    }

    // Check for year range match
    const correctRange = normalizeYearRange(correctAnswer);
    const userRange = normalizeYearRange(userAnswer);

    if (correctRange && userRange) {
        return correctRange[0] === userRange[0] && correctRange[1] === userRange[1];
    }

    // If we've reached this point, the answers don't match
    return false;
}

// Handle correct answer
function handleCorrect() {
    if (reviewMode) {
        nextReviewCard();
        return;
    }
    
    flashCard(true);
    stats.correct++;
    stats.streak++;
    stats.remaining--;
    cards = cards.filter(card => card !== currentCard);
    setTimeout(updateCard, 200);
    updateStats();
}

// Handle incorrect answer
function handleIncorrect() {
    if (reviewMode) {
        nextReviewCard();
        return;
    }
    
    flashCard(false);
    stats.incorrect++;
    stats.streak = 0;
    if (currentCard && !incorrectCards.includes(currentCard)) {
        incorrectCards.push(currentCard);
    }
    setTimeout(updateCard, 200);
    updateStats();
}

// Flash card
function flashCard(isCorrect) {
    const card = document.getElementById('card');
    card.style.backgroundColor = isCorrect ? '#4CAF50' : '#f44336';
    card.style.color = 'white';
    
    setTimeout(() => {
        card.style.backgroundColor = '';
        card.style.color = '';
    }, 500);
}

// Update stats
function updateStats() {
    const statsElement = document.getElementById('stats');
    if (!statsElement) return; // Exit if stats element doesn't exist

    if (stats.total === 0) {
        statsElement.innerHTML = 'No cards to review';
        return;
    }
    statsElement.innerHTML = `
        Correct: ${stats.correct} | Incorrect: ${stats.incorrect}<br>
        Remaining: ${stats.remaining}/${stats.total} | Streak: ${stats.streak}
    `;
    statsElement.style.display = 'block'; // Ensure stats are visible
}

// Switch mode
function switchMode(mode) {
    if (requiredPercentage === 0 && mode === 'test') {
        // console.log('Test mode is not available for this card set');
        return;
    }
    testMode = mode === 'test';
    reviewMode = false;

    // Clear any existing timer
    clearTimer();

    // Reset test-related variables
    testTime = 0;
    testIndex = 0;
    testResults = [];

    const practiceModeElement = document.getElementById('practiceMode');
    const testModeElement = document.getElementById('testMode');
    const practiceControls = document.getElementById('practiceControls');
    const testControls = document.getElementById('testControls');
    const cardContainer = document.getElementById('card-container');
    const startTest = document.getElementById('startTest');
    const activeTest = document.getElementById('activeTest');
    const finalResult = document.getElementById('finalResult');
    const timer = document.getElementById('timer');
    const statsElement = document.getElementById('stats');

    if (practiceModeElement) practiceModeElement.classList.toggle('active', !testMode);
    if (testModeElement) testModeElement.classList.toggle('active', testMode);
    if (practiceControls) practiceControls.style.display = testMode ? 'none' : 'block';
    if (testControls) testControls.style.display = testMode ? 'block' : 'none';
    if (cardContainer) cardContainer.style.display = testMode ? 'none' : 'block';
    if (startTest) startTest.style.display = testMode ? 'block' : 'none';
    if (activeTest) activeTest.style.display = 'none';
    if (finalResult) finalResult.style.display = 'none';
    if (timer) timer.style.display = 'none';
    if (statsElement) statsElement.style.display = 'block';

    // Always remove the existing buttonsContainer if it exists
    const existingButtonsContainer = document.getElementById('buttonsContainer');
    if (existingButtonsContainer) {
        existingButtonsContainer.remove();
    }

    if (!testMode) {
        resetCards();
    } else {
        // Calculate requiredCorrect for test mode
        const requiredCorrect = Math.ceil(gameOptions.testQuestionCount * (requiredPercentage / 100));

        // Reset stats for test mode
        stats = {
            correct: 0,
            incorrect: 0,
            remaining: gameOptions.testQuestionCount,
            total: gameOptions.testQuestionCount,
            streak: 0,
            requiredCorrect: requiredCorrect
        };
        updateStats(); // Update stats display for test mode
    }

    if (testMode) {
        const inputElement = document.getElementById('input');
        if (inputElement) {
            inputElement.value = ''; // Clear any previous input
            setTimeout(() => {
                inputElement.focus();
            }, 0);
        }
        // Reset and hide the timer display
        if (timer) {
            timer.style.display = 'none';
            document.getElementById('time').textContent = '0';
        }
    }
}



// Start over
function startOver() {
    resetCards();
    document.getElementById('startOver').style.display = 'none';
    document.getElementById('reviewIncorrect').style.display = 'none';
}

// Review incorrect
function reviewIncorrect() {
    cards = [...incorrectCards];
    stats = {
        correct: 0,
        incorrect: 0,
        remaining: incorrectCards.length,
        total: incorrectCards.length,
        streak: 0
    };
    incorrectCards = []; // Clear the incorrect cards array
    updateCard();
    updateStats();
    document.getElementById('startOver').style.display = 'none';
    document.getElementById('reviewIncorrect').style.display = 'none';
}

// Start review
function startReview() {
    reviewMode = true;
    reviewIndex = 0;
    document.getElementById('finalResult').style.display = 'none';
    document.getElementById('card-container').style.display = 'block';
    document.getElementById('reviewControls').style.display = 'block';
    updateReviewCard();
}

// Update review card
function updateReviewCard() {
    if (reviewIndex < testResults.length) {
        const result = testResults[reviewIndex];
        document.getElementById('card').innerHTML = `
            <div class="card-content">
                <div class="review-question">${result.question}</div>
                <div class="review-correct-answer">Correct Answer: ${result.correctAnswer}</div>
                <div class="review-user-answer">Your Answer: ${result.userAnswer}</div>
                <div class="review-result">${result.isCorrect ? 'Correct' : 'Incorrect'}</div>
            </div>
        `;
    } else {
        endReview();
    }
}

// Next review card
function nextReviewCard() {
    reviewIndex++;
    updateReviewCard();
}

// Previous review card
function previousReviewCard() {
    if (reviewIndex > 0) {
        reviewIndex--;
        updateReviewCard();
    }
}

// End review
function endReview() {
    reviewMode = false;
    document.getElementById('card-container').style.display = 'none';
    document.getElementById('reviewControls').style.display = 'none';
    document.getElementById('finalResult').style.display = 'block';
}

function handleKeyboardInput(event) {
    if (testMode || reviewMode) return; // Only handle keyboard input in Practice mode

    if (event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault(); // Prevent page scrolling
        if (showingFront) {
            flipCard();
        } else {
            handleCorrect();
        }
    } else if (event.key === 'Backspace') {
        event.preventDefault(); // Prevent navigation
        if (!showingFront) {
            handleIncorrect();
        }
    }
}


// Router function for client-side routing
function router() {
    const path = window.location.hash.slice(1);
    clearTimer();
    if (path.startsWith('cards/')) {
        initializeFlashcards(path.slice(6));
    } else if (path === 'index' || path === '') {
        showIndex();
    } else if (path.startsWith('list/')) {
        showList(path.slice(5));
    }
}

// Show index page
async function showIndex() {
    // Reset all relevant variables
    originalCards = [];
    cards = [];
    currentCard = null;
    currentCardAnswer = '';
    showingFront = true;
    testMode = false;
    reviewMode = false;
    testCards = [];
    testIndex = 0;
    testResults = [];
    testTime = 0;
    longestStreak = 0;
    currentStreak = 0;
    incorrectCards = [];
    currentCardSet = null;
    reviewIndex = 0;
    stats = {
        correct: 0,
        incorrect: 0,
        remaining: 0,
        total: 0,
        streak: 0
    };

    // Clear any intervals that might be running
    clearTimer();

 // Fetch and display card sets
    try {
        const cardSets = await fetchAllCardSets();
        const container = document.getElementById('container');
        if (!container) {
            console.error('Container element not found');
            return;
        }
        container.innerHTML = `
            <h1>Flashcard Review</h1>
            <h2>Available Card Sets:</h2>
            <ul class="card-set-list">
                ${cardSets.map(set => {
                    const baseFilename = set.filename.replace('.txt', '');
                    return `
                    <li class="card-set-item">
                        <div class="card-set-title"><a href="#cards/${set.filename}">${set.title}</a></div>
                        <div class="card-set-description">${set.description}</div>
                        <div class="card-set-actions">
                            <span class="card-count">Items: ${set.cardCount}</span>
                            ${set.requiredPercentage > 0 
                                ? `<span class="required-percentage">Minimum Pass: ${set.requiredPercentage}%</span>`
                                : '<span class="practice-only">Practice Only</span>'}
                            <a href="#list/${set.filename}">Browse List</a>  
                            <a href="cards/${set.filename}" download>Download</a>
                            ${set.hasHighScores ? `<a href="#" class="high-scores-toggle" data-filename="${baseFilename}">High Scores</a>` : ''}
                        </div>
                        ${set.hasHighScores ? `<div class="high-scores-container" id="highScores_${baseFilename}" style="display:none;"></div>` : ''}
                    </li>
                `}).join('')}
            </ul>
            <footer class="index-footer">This game was created with Anthropic Claude Sonnet 3.5 with Konrad Lawson at the prompt.</footer>
        `;

        // Add event listeners for high scores toggles
        document.querySelectorAll('.high-scores-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                const filename = e.target.dataset.filename;
                toggleHighScores(filename);
            });
        });
    } catch (error) {
        console.error('Error fetching or displaying card sets:', error);
    }

    // Clear any intervals that might be running
    if (timerInterval) {
        clearInterval(timerInterval);
    }
}


// Show list view
async function showList(filename) {
    const { title, description, cards } = await fetchCardSet(filename);
    const container = document.getElementById('container');
    
    const frontClass = gameOptions.ListFrontWrap ? 'wrap' : 'nowrap';
    const backClass = gameOptions.ListBackWrap ? 'wrap' : 'nowrap';
    
    container.innerHTML = `
        <h2>${title}</h2>
        <p>${description}</p>
        <table>
            <tr>
                <th class="${frontClass}">Front</th>
                <th class="${backClass}">Back</th>
            </tr>
            ${cards.map(([front, back]) => `
                <tr><td class="${frontClass}">${front}</td><td class="${backClass}">${back}</td></tr>
            `).join('')}
        </table>
        <div class="bottom-buttons">
            <a href="#index" class="button">Return to Index</a>
            <a href="#cards/${filename}" class="button">Review</a>
        </div>
    `;
}


/* HIGH SCORES HANDLING */

async function toggleHighScores(filename) {
    const baseFilename = filename.replace('.txt', '');
    const container = document.getElementById(`highScores_${baseFilename}`);
    if (container.style.display === 'none') {
        container.style.display = 'block';
        try {
            const scores = await fetchHighScores(baseFilename);
            if (scores.length > 0) {
                container.innerHTML = `
                    <table class="high-scores-table">
                        <tr><th>Name</th><th>Time</th><th>Date</th></tr>
                        ${scores.map(score => `
                            <tr><td>${score.name}</td><td>${score.time}s</td><td>${score.date}</td></tr>
                        `).join('')}
                    </table>
                `;
            } else {
                container.innerHTML = '<p>No high scores available.</p>';
            }
        } catch (error) {
            console.error('Error fetching high scores:', error);
            container.innerHTML = '<p>Error loading high scores.</p>';
        }
    } else {
        container.style.display = 'none';
    }
}


async function fetchHighScores(baseFilename) {
    const response = await fetch(`scores/${baseFilename}_scores.txt?date=${Date.now()}`);
    if (!response.ok) {
        if (response.status === 404) {
            return []; // No scores file exists
        }
        throw new Error('Failed to fetch high scores');
    }
    const text = await response.text();
    return text.split('\n')
        .filter(line => line.trim() !== '')
        .map(line => {
            const [name, time, date] = line.split('\t');
            return { name, time: parseInt(time, 10), date };
        })
        .sort((a, b) => a.time - b.time)
        .slice(0, 10); // Top 10 scores
}



// Event listeners
window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM content loaded.');
    router(); // This will call the appropriate function based on the current URL
});

function initializeEventListeners() {
    const card = document.getElementById('card');
    if (card) {
        // Use touchend for mobile devices
        // card.addEventListener('touchend', (e) => {
        //    e.preventDefault(); // Prevent default touch behavior
        //    handleCardClick(e);
        // });

        // Use click for desktop devices
        card.addEventListener('click', handleCardClick);
    }

    // Use event delegation for dynamically created elements
    document.body.addEventListener('click', (e) => {
        if (e.target.id === 'practiceMode') switchMode('practice');
        if (e.target.id === 'testMode') switchMode('test');
        if (e.target.id === 'startTest') startTest();
        if (e.target.id === 'submit') {
            e.preventDefault();
            if (testMode) {
                submitTestAnswer();
            } else {
                submitAnswer();
            }
        }
        if (e.target.id === 'startOver') startOver();
        if (e.target.id === 'reviewIncorrect') reviewIncorrect();
    });


    const input = document.getElementById('input');
    if (input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (testMode) {
                    submitTestAnswer();
                } else {
                    submitAnswer();
                }
            }
        });
    }

    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyboardInput);

    // Review controls
    document.getElementById('reviewTest')?.addEventListener('click', startReview);
    document.getElementById('nextReview')?.addEventListener('click', nextReviewCard);
    document.getElementById('previousReview')?.addEventListener('click', previousReviewCard);
    document.getElementById('endReview')?.addEventListener('click', endReview);

    const browseListButton = document.getElementById('browseList');
    if (browseListButton) {
        browseListButton.addEventListener('click', () => {
            window.location.hash = `#list/${currentCardSet}`;
        });
    }

    console.log('Event listeners initialized.');
}
