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

// Function to convert markdown italic formatting to HTML
function parseMarkdownItalics(text) {
    return text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
}


// Initialize flashcards
async function initializeFlashcards(filename) {
    try {
        const { title, description, category, cards, requiredPercentage: fetchedPercentage } = await fetchCardSet(filename);
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
            <button id="sortMode" class="tab">Sort Game</button>
        </div>
    ` : `
        <div id="mode-tabs">
            <button id="practiceMode" class="tab active">Practice</button>
            <button id="sortMode" class="tab">Sort Game</button>
        </div>
    `}
    <div id="timer" style="display:none;">Time: <span id="time">0</span>s</div>
    <div id="card-container">
        <div id="card"></div>
    </div>
    <div id="practiceControls">
        <p id="practiceInstructions">
            Tap to flip, then: tap right = 'correct'; tap left = 'incorrect'<br>
            <span class="keyboard-instructions">Keyboard: Spacebar to flip/mark correct, Backspace to mark incorrect.</span>
        </p>
    </div>
    ${requiredPercentage > 0 ? `
        <div id="testControls" style="display:none;">
            <button id="startTest" class="button">Start Test</button>
            <div id="activeTest" style="display:none;">
                <input type="text" id="input" placeholder="Enter your answer">
                <div class="number-pad">
                    <div class="number-row">
                        <button class="num-btn" data-num="1">1</button>
                        <button class="num-btn" data-num="2">2</button>
                        <button class="num-btn" data-num="3">3</button>
                        <button class="num-btn" data-num="4">4</button>
                        <button class="num-btn" data-num="5">5</button>
                    </div>
                    <div class="number-row">
                        <button class="num-btn" data-num="6">6</button>
                        <button class="num-btn" data-num="7">7</button>
                        <button class="num-btn" data-num="8">8</button>
                        <button class="num-btn" data-num="9">9</button>
                        <button class="num-btn" data-num="0">0</button>
                    </div>
                    <div class="number-row">
                        <button class="num-btn" data-num="-">-</button>
                        <button class="num-btn clear-btn">Clear</button>
                        <button id="submit" class="num-btn submit-btn">Submit</button>
                    </div>
                </div>
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
            <!-- Sort Game Controls -->
            <div id="sortControls" style="display:none;">
                <div id="sortGameSelection">
                    <div style="text-align: center; margin: 40px 0;">
                        <h2>Choose number of cards to sort:</h2>
                        <div id="cardCountOptions" style="margin: 20px 0;">
                            <!-- Card count buttons will be populated dynamically -->
                        </div>
                        <p style="color: #666; font-size: 14px;">Arrange the cards in chronological order from earliest to latest</p>
                    </div>
                </div>
                
                <div id="sortGameInterface" style="display:none;">
                    
                    <div id="sortGameControls" style="text-align: center; margin: 10px 0;">
                        <button id="submitSort" class="sort-button">Submit</button>
                        <button id="resetSort" class="sort-button">Reset</button>
                    </div>
                    
                    <div id="sortGameContainer" style="display: flex; height: calc(100vh - 250px); min-height: 300px; gap: 20px;">
                        <div id="leftCards" style="flex: 1; padding: 10px; overflow-y: auto;">
                            <div id="unsortedCards"></div>
                        </div>
                        <div id="rightCards" style="flex: 1; padding: 10px; overflow-y: auto;">
                            <h3 style="margin-top: 0; text-align: center;">Events in Order</h3>
                            <div id="sortedCards"></div>
                        </div>
                    </div>
                </div>
                
                <div id="sortGameResults" style="display:none;">
                    <div id="sortResultsContent">
                        <!-- Results will be populated by sort game -->
                    </div>
                    <div style="text-align: center; margin: 20px 0;">
                        <button id="playSortAgain" class="sort-button">Play Again</button>
                        <button id="goPractice" class="sort-button">Practice Mode</button>
                    </div>
                </div>
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
                category: content.category,
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
    const { title, description, requiredPercentage, category, cards, sources } = parseCardSet(content);
    return { title, description, requiredPercentage, category, cards, sources };
}


function parseCardSet(content) {
    const allLines = content.split('\n');
    
    // Find the "Sources:" line if it exists
    const sourcesIndex = allLines.findIndex(line => line.trim().startsWith('Sources:'));
    
    // Split content into main section and sources section
    let mainLines, sources = [];
    if (sourcesIndex !== -1) {
        mainLines = allLines.slice(0, sourcesIndex);
        // Get sources lines after "Sources:" line, ignoring blank lines
        const sourcesLines = allLines.slice(sourcesIndex + 1);
        sources = sourcesLines
            .map(line => line.trim())
            .filter(line => line !== ''); // Remove blank lines from sources
    } else {
        mainLines = allLines;
    }
    
    // Filter blank lines from main content
    const lines = mainLines
        .map(line => line.trim())
        .filter(line => line !== '');
    
    const title = lines.shift();
    const description = lines.shift();
    const requiredPercentage = parseFloat(lines.shift()) || 0; // Parse as float, default to 0 if not a valid number
    const category = lines.shift() || 'Uncategorized'; // Parse category from line 4
    const cards = lines.filter(line => line.includes('\t')).map(line => {
        const [front, back] = line.split('\t');
        if (!front || !back) return null; // Skip invalid lines
        const frontText = front.trim();
        const backText = back.trim();
        
        // Parse alternatives from brackets
        let displayAnswer = backText;
        let acceptableAnswers = [];
        
        // Check for bracketed alternatives
        const bracketMatch = backText.match(/^([^[]+)\s*\[([^\]]+)\]$/);
        if (bracketMatch) {
            displayAnswer = bracketMatch[1].trim();
            const alternativesStr = bracketMatch[2];
            // Split by pipe for multiple alternatives
            const alternatives = alternativesStr.split('|').map(alt => alt.trim());
            acceptableAnswers = [displayAnswer, ...alternatives];
        } else {
            acceptableAnswers = [displayAnswer];
        }
        
        // If the primary answer contains a month (e.g., "1895, Apr"), also accept year only
        if (displayAnswer.match(/^\d{4},\s+\w+$/)) {
            const yearOnly = displayAnswer.split(',')[0].trim();
            if (!acceptableAnswers.includes(yearOnly)) {
                acceptableAnswers.push(yearOnly);
            }
        }
        
        return {
            front: frontText,
            displayAnswer: displayAnswer,
            acceptableAnswers: acceptableAnswers,
            // Keep backward compatibility
            0: frontText,
            1: displayAnswer
        };
    }).filter(card => card !== null); // Remove any null cards
    return { title, description, requiredPercentage, category, cards, sources };
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
        const front = currentCard.front || currentCard[0];
        document.getElementById('card').innerHTML = `<div class="card-content">${parseMarkdownItalics(front)}</div>`;
        currentCardAnswer = currentCard.displayAnswer || currentCard[1];
        const inputElement = document.getElementById('input');
        if (inputElement) {
            // Force clear the input to prevent any "null" display
            inputElement.value = '';
            // Double-check after a tiny delay to ensure it's cleared
            setTimeout(() => {
                if (inputElement.value === 'null' || inputElement.value === 'undefined') {
                    inputElement.value = '';
                }
            }, 10);
        }
        document.getElementById('card-container').style.display = 'block';
        
        // Auto-focus on desktop only (mobile uses readonly input with number pad)
        if (window.innerWidth > 600) {
            setTimeout(() => {
                document.getElementById('input').focus();
            }, 100);
        }
        updateStats();
    } else {
        endTest();
    }
}

// Submit test answer
function submitTestAnswer() {
    const userAnswer = document.getElementById('input').value.trim();
    const checkResult = checkAnswer(userAnswer);
    const front = currentCard.front || currentCard[0];
    
    testResults.push({
        question: front,
        correctAnswer: checkResult.primaryAnswer,
        userAnswer: userAnswer,
        isCorrect: checkResult.isCorrect,
        acceptanceType: checkResult.acceptanceType,
        matchedAnswer: checkResult.matchedAnswer
    });

    if (checkResult.isCorrect) {
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

    const cardElement = document.getElementById('card');

    if (checkResult.isCorrect) {
        if (checkResult.acceptanceType === 'alternative') {
            // Show that alternative was accepted
            cardElement.innerHTML = `
                <div class="card-content" style="color: #4CAF50;">
                    ✓ ${checkResult.userAnswer}
                    <br><small style="margin-top: 5px; display: block;">Alternate years accepted</small>
                    <br><small style="margin-top: 5px; display: block;">Standard: ${checkResult.primaryAnswer}</small>
                </div>`;
            setTimeout(() => {
                testIndex++;
                if (testIndex >= testCards.length) {
                    endTest();
                } else {
                    updateTestCard();
                }
            }, 2500); // Longer delay to show alternative feedback
        } else {
            // Normal correct answer
            setTimeout(() => {
                testIndex++;
                if (testIndex >= testCards.length) {
                    endTest();
                } else {
                    updateTestCard();
                }
            }, 200); // Delay to allow green flash to be visible
        }
    } else {
        // Show correct answer briefly
        cardElement.innerHTML = `<div class="card-content">${parseMarkdownItalics(checkResult.primaryAnswer)}</div>`;
        setTimeout(() => {
            testIndex++;
            if (testIndex >= testCards.length) {
                endTest();
            } else {
                updateTestCard();
            }
        }, 1500); // Show correct answer for 1.5 seconds
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
        let resultText = result.isCorrect ? 'Correct' : 'Incorrect';
        if (result.isCorrect && result.acceptanceType === 'alternative') {
            resultText = 'Correct<br><small style="color: #666;">Alternate years accepted</small>';
        }
        tableHTML += `
            <tr>
                <td>${result.question}</td>
                <td>${result.correctAnswer}</td>
                <td>${result.userAnswer}</td>
                <td>${resultText}</td>
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
    cardElement.innerHTML = `<div class="card-content">${parseMarkdownItalics(currentCard.front || currentCard[0])}</div>`;
    currentCardAnswer = currentCard.displayAnswer || currentCard[1];

    const inputElement = document.getElementById('input');
    if (inputElement) inputElement.value = '';

    updateStats();
}

// Flip card
function flipCard() {
    if (testMode || reviewMode) return;
    showingFront = !showingFront;
    const front = currentCard.front || currentCard[0];
    const back = currentCard.displayAnswer || currentCard[1];
    document.getElementById('card').innerHTML = `<div class="card-content">${showingFront ? parseMarkdownItalics(front) : parseMarkdownItalics(back)}</div>`;
}

// Handle card click
function handleCardClick(event) {
    if (testMode || sortMode) return;

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
    userAnswer = userAnswer.trim();
    const userAnswerLower = userAnswer.toLowerCase();
    
    // Get acceptable answers from current card
    const acceptableAnswers = currentCard.acceptableAnswers || [currentCardAnswer];
    const primaryAnswer = currentCard.displayAnswer || currentCardAnswer;
    const primaryAnswerLower = primaryAnswer.trim().toLowerCase();

    // Function to normalize text by keeping only numbers and dashes
    function normalizeToNumbersAndDashes(str) {
        return str.replace(/[^\d\-–—]/g, '').trim();
    }


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

    // Normalize user answer for flexible matching
    const normalizedUserAnswer = normalizeToNumbersAndDashes(userAnswer);

    // Check against all acceptable answers
    for (let i = 0; i < acceptableAnswers.length; i++) {
        const acceptable = acceptableAnswers[i].trim();
        const acceptableLower = acceptable.toLowerCase();
        const normalizedAcceptable = normalizeToNumbersAndDashes(acceptable);
        
        // Check for exact match first (original logic)
        if (userAnswerLower === acceptableLower) {
            const isPrimary = (i === 0);
            const isMonthOmitted = primaryAnswer.includes(',') && !userAnswer.includes(',') && 
                                 extractYear(primaryAnswer) === userAnswer;
            
            return {
                isCorrect: true,
                acceptanceType: isPrimary ? 'exact' : (isMonthOmitted ? 'month-omitted' : 'alternative'),
                userAnswer: userAnswer,
                primaryAnswer: primaryAnswer,
                matchedAnswer: acceptable
            };
        }

        // Check for normalized match (numbers and dashes only)
        if (normalizedUserAnswer && normalizedAcceptable && normalizedUserAnswer === normalizedAcceptable) {
            return {
                isCorrect: true,
                acceptanceType: i === 0 ? 'normalized' : 'normalized-alternative',
                userAnswer: userAnswer,
                primaryAnswer: primaryAnswer,
                matchedAnswer: acceptable
            };
        }

        // Check for single year match (when answer has month but user provides just year)
        const acceptableYear = extractYear(acceptable);
        if (acceptableYear && !acceptable.includes('-') && !acceptableLower.includes('-')) {
            if (userAnswerLower.includes(acceptableYear)) {
                const isMonthOmitted = acceptable.includes(',') && !userAnswer.includes(',');
                return {
                    isCorrect: true,
                    acceptanceType: isMonthOmitted ? 'month-omitted' : (i === 0 ? 'exact' : 'alternative'),
                    userAnswer: userAnswer,
                    primaryAnswer: primaryAnswer,
                    matchedAnswer: acceptable
                };
            }
        }

        // Check for year range match
        const acceptableRange = normalizeYearRange(acceptableLower);
        const userRange = normalizeYearRange(userAnswerLower);

        if (acceptableRange && userRange) {
            if (acceptableRange[0] === userRange[0] && acceptableRange[1] === userRange[1]) {
                return {
                    isCorrect: true,
                    acceptanceType: i === 0 ? 'exact' : 'alternative',
                    userAnswer: userAnswer,
                    primaryAnswer: primaryAnswer,
                    matchedAnswer: acceptable
                };
            }
        }
    }

    // If we've reached this point, the answer doesn't match
    return {
        isCorrect: false,
        acceptanceType: null,
        userAnswer: userAnswer,
        primaryAnswer: primaryAnswer,
        matchedAnswer: null
    };
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
    // Only show stats if not in sort mode
    if (!sortMode) {
        statsElement.style.display = 'block';
    }
}

// Switch mode
function switchMode(mode) {
    if (requiredPercentage === 0 && mode === 'test') {
        return;
    }
    
    testMode = mode === 'test';
    reviewMode = false;
    sortMode = mode === 'sort';
    
    // Clean up sort game state if switching away from sort
    if (mode !== 'sort' && typeof cleanupSortGame === 'function') {
        cleanupSortGame();
    }

    // Clear any existing timer
    clearTimer();

    // Reset test-related variables
    testTime = 0;
    testIndex = 0;
    testResults = [];

    const practiceModeElement = document.getElementById('practiceMode');
    const testModeElement = document.getElementById('testMode');
    const sortModeElement = document.getElementById('sortMode');
    const practiceControls = document.getElementById('practiceControls');
    const testControls = document.getElementById('testControls');
    const sortControls = document.getElementById('sortControls');
    const cardContainer = document.getElementById('card-container');
    const startTest = document.getElementById('startTest');
    const activeTest = document.getElementById('activeTest');
    const finalResult = document.getElementById('finalResult');
    const timer = document.getElementById('timer');
    const statsElement = document.getElementById('stats');

    // Update tab active states
    if (practiceModeElement) practiceModeElement.classList.toggle('active', !testMode && !sortMode);
    if (testModeElement) testModeElement.classList.toggle('active', testMode);
    if (sortModeElement) sortModeElement.classList.toggle('active', sortMode);
    
    // Toggle visibility of mode-specific controls
    if (practiceControls) practiceControls.style.display = !testMode && !sortMode ? 'block' : 'none';
    if (testControls) testControls.style.display = testMode ? 'block' : 'none';
    if (sortControls) sortControls.style.display = sortMode ? 'block' : 'none';
    if (cardContainer) cardContainer.style.display = !testMode && !sortMode ? 'block' : 'none';
    if (startTest) startTest.style.display = testMode ? 'block' : 'none';
    if (activeTest) activeTest.style.display = 'none';
    if (finalResult) finalResult.style.display = 'none';
    if (timer) timer.style.display = (testMode || sortMode) ? 'block' : 'none';
    if (statsElement) statsElement.style.display = !sortMode ? 'block' : 'none';
    
    // Initialize sort game if switching to sort mode
    if (sortMode) {
        initializeSortGameInterface();
    }

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
        let reviewResultText = result.isCorrect ? 'Correct' : 'Incorrect';
        let additionalInfo = '';
        
        if (result.isCorrect && result.acceptanceType === 'alternative') {
            reviewResultText = 'Correct (alternative accepted)';
            additionalInfo = '<div class="review-alternative">Your answer accepted as alternate years</div>';
        }
        
        document.getElementById('card').innerHTML = `
            <div class="card-content">
                <div class="review-question">${result.question}</div>
                <div class="review-correct-answer">Standard Answer: ${result.correctAnswer}</div>
                <div class="review-user-answer">Your Answer: ${result.userAnswer}</div>
                <div class="review-result">${reviewResultText}</div>
                ${additionalInfo}
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
    
    // Remove sort-results class when navigating away from sort game results
    document.body.classList.remove('sort-results');
    
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
        // Group card sets by category
        const groupedSets = cardSets.reduce((groups, set) => {
            const category = set.category || 'Uncategorized';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(set);
            return groups;
        }, {});

        // Generate HTML for grouped card sets
        const categoryHTML = Object.keys(groupedSets).sort().map(category => {
            const sets = groupedSets[category];
            return `
                <div class="category-section">
                    <h2>${category}</h2>
                    <ul class="card-set-list">
                        ${sets.map(set => {
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
                            `;
                        }).join('')}
                    </ul>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <h1>Modern East Asian History Timeline Review</h1>
            ${categoryHTML}
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
    const { title, description, category, cards, sources } = await fetchCardSet(filename);
    const container = document.getElementById('container');
    
    const frontClass = gameOptions.ListFrontWrap ? 'wrap' : 'nowrap';
    const backClass = 'nowrap'; // Always no wrap for Back column
    
    // Check if any cards have bracketed alternative answers
    const hasAlternatives = cards.some(card => {
        // Re-parse the original back text to check for brackets
        const backText = (card.displayAnswer || card[1]) + (card.acceptableAnswers && card.acceptableAnswers.length > 1 ? ` [${card.acceptableAnswers.slice(1).join('|')}]` : '');
        // Actually, let's check if original parsing found bracketed alternatives
        // This is tricky - let me check the original data structure
        const acceptableAnswers = card.acceptableAnswers || [];
        const displayAnswer = card.displayAnswer || card[1];
        
        // If there are alternatives, check if any are NOT just year-only versions
        if (acceptableAnswers.length <= 1) return false;
        
        // Check if any alternatives are NOT just year-only versions of month-specific dates
        const hasRealAlternatives = acceptableAnswers.slice(1).some(alt => {
            // If the display answer has a month and this alt is just the year, it's auto-generated
            if (displayAnswer.match(/^\d{4},\s+\w+$/) && alt === displayAnswer.split(',')[0].trim()) {
                return false; // This is just an auto-generated year-only version
            }
            return true; // This is a real bracketed alternative
        });
        
        return hasRealAlternatives;
    });
    
    // Build table header
    const tableHeader = hasAlternatives 
        ? `<tr>
               <th class="${backClass}">Year</th>
               <th class="${frontClass}">Description</th>
               <th class="${backClass}">Alternatives</th>
           </tr>`
        : `<tr>
               <th class="${backClass}">Year</th>
               <th class="${frontClass}">Description</th>
           </tr>`;
    
    // Build table rows
    const tableRows = cards.map((card) => {
        const front = card.front || card[0];
        const back = card.displayAnswer || card[1];
        
        if (hasAlternatives) {
            const acceptableAnswers = card.acceptableAnswers || [back];
            const displayAnswer = card.displayAnswer || back;
            
            // Get only real bracketed alternatives (not auto-generated year-only versions)
            const realAlternatives = acceptableAnswers.slice(1).filter(alt => {
                // If the display answer has a month and this alt is just the year, it's auto-generated
                if (displayAnswer.match(/^\d{4},\s+\w+$/) && alt === displayAnswer.split(',')[0].trim()) {
                    return false; // This is just an auto-generated year-only version
                }
                return true; // This is a real bracketed alternative
            });
            
            const alternativesText = realAlternatives.length > 0 ? realAlternatives.join(', ') : '';
            
            return `<tr>
                        <td class="${backClass}">${parseMarkdownItalics(back)}</td>
                        <td class="${frontClass}">${parseMarkdownItalics(front)}</td>
                        <td class="${backClass}" style="color: #888; font-size: 0.8em;">${parseMarkdownItalics(alternativesText)}</td>
                    </tr>`;
        } else {
            return `<tr>
                        <td class="${backClass}">${parseMarkdownItalics(back)}</td>
                        <td class="${frontClass}">${parseMarkdownItalics(front)}</td>
                    </tr>`;
        }
    }).join('');
    
    // Build sources section if sources exist
    const sourcesSection = sources && sources.length > 0 
        ? `<div class="sources-section">
               <h3>Sources</h3>
               ${sources.map(source => `<div class="source-item">${parseMarkdownItalics(source)}</div>`).join('')}
           </div>`
        : '';

    container.innerHTML = `
        <h2>${title}</h2>
        <p>${description}</p>
        <table>
            ${tableHeader}
            ${tableRows}
        </table>
        ${sourcesSection}
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

// Store references to event handlers to enable cleanup
let globalClickHandler = null;
let globalKeydownHandler = null;

function initializeEventListeners() {

    // Clean up existing global event listeners before adding new ones
    if (globalClickHandler) {
        document.body.removeEventListener('click', globalClickHandler);
    }
    if (globalKeydownHandler) {
        document.removeEventListener('keydown', globalKeydownHandler);
    }

    // Create and store the click handler
    globalClickHandler = (e) => {
        if (e.target.id === 'practiceMode') {
            switchMode('practice');
        }
        if (e.target.id === 'testMode') {
            switchMode('test');
        }
        if (e.target.id === 'sortMode') {
            switchMode('sort');
        }
        if (e.target.id === 'startTest') startTest();
        if (e.target.id === 'submit') {
            e.preventDefault();
            if (testMode) {
                submitTestAnswer();
            }
        }
        
        // Handle number pad buttons
        if (e.target.classList.contains('num-btn') && !e.target.classList.contains('clear-btn')) {
            e.preventDefault();
            const input = document.getElementById('input');
            if (input) {
                const num = e.target.getAttribute('data-num');
                const currentValue = input.value || '';
                input.value = currentValue + num;
            }
        }
        
        // Handle clear button
        if (e.target.classList.contains('clear-btn')) {
            e.preventDefault();
            const input = document.getElementById('input');
            if (input) {
                input.value = '';
            }
        }
        if (e.target.id === 'startOver') startOver();
        if (e.target.id === 'reviewIncorrect') reviewIncorrect();
        
        // Handle sort game buttons
        if (e.target.id === 'submitSort') {
            e.preventDefault();
            if (typeof submitSortGame === 'function') {
                submitSortGame();
            }
        }
        if (e.target.id === 'resetSort') {
            e.preventDefault();
            if (typeof resetSortGame === 'function') {
                resetSortGame();
            }
        }
        if (e.target.id === 'playSortAgain') {
            e.preventDefault();
            if (typeof initializeSortGameInterface === 'function') {
                initializeSortGameInterface();
            }
        }
        if (e.target.id === 'goPractice') {
            e.preventDefault();
            switchMode('practice');
        }
        
        // Handle card clicking
        if (e.target.id === 'card' || e.target.closest('#card')) {
            handleCardClick(e);
        }
    };

    // Use event delegation for dynamically created elements
    document.body.addEventListener('click', globalClickHandler);


    const input = document.getElementById('input');
    if (input) {
        // Make input readonly only on mobile (width <= 600px)
        if (window.innerWidth <= 600) {
            input.setAttribute('readonly', 'true');
        }
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (testMode) {
                    submitTestAnswer();
                }
            }
        });
        
        // Handle focus for desktop (when not readonly)
        if (!input.hasAttribute('readonly')) {
            input.addEventListener('focus', () => {
                // Desktop behavior - can add focus handling here if needed
            });
        }
    }

    // Create and store the keyboard handler
    globalKeydownHandler = handleKeyboardInput;
    
    // Add keyboard event listener
    document.addEventListener('keydown', globalKeydownHandler);

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
