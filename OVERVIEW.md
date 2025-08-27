# Frog in a Well Flashcards - Application Overview

## What This Application Does

Frog in a Well Flashcards is a web-based flashcard review application designed for studying historical dates and events. The application provides three study modes:

1. **Practice Mode**: Traditional flashcard review with immediate feedback
2. **Test Mode**: Timed testing with scoring and high score tracking
3. **Sort Game**: Chronological ordering game for timeline-based learning

The application is particularly well-suited for historical content, with built-in date parsing that handles various date formats (single years, date ranges, abbreviated years like "1850-64") and accepts alternative answers.

## Key Features

- **Multiple Study Modes**: Practice, test, and sorting game modes
- **Flexible Date Handling**: Accepts various date formats and alternative answers
- **High Score Tracking**: Saves fastest completion times for test mode
- **Mobile-Friendly**: Responsive design with touch support
- **Configurable Options**: Customizable test length and display settings
- **Server-Side Score Storage**: PHP backend for persistent high scores

## File Structure and Key Components

### Core Application Files

- **`index.html`** - Main HTML page and application entry point
- **`flashcard.js`** - Primary JavaScript containing all flashcard logic, routing, and user interface
- **`index.css`** - Complete stylesheet with responsive design and dark mode support
- **`options.js`** - Configuration file for customizable game settings

### Additional Functionality

- **`sortgame.js`** - Separate module for the chronological sorting game mode
- **`save_score.php`** - Server-side script for saving and retrieving high scores
- **`docs.md`** - Documentation for card file format and configuration options

### Content Directory

- **`cards/`** - Directory containing flashcard sets as tab-delimited text files
  - `01chinatimeline.txt` - Main timeline covering 1830s-1989 Chinese history
  - `02lateqing.txt` through `11maoistchina-small.txt` - Various historical periods and topics
  - Each file follows the format: Title, Description, Minimum Pass %, Card Data

### Data Storage

- **`scores/`** - Directory for storing high score files (created automatically)
- Score files are named `[cardset]_scores.txt` and contain top 10 fastest times

## Card File Format

Each card set is a text file with this structure:
1. **Line 1**: Title of the card set
2. **Line 2**: Description 
3. **Line 3**: Minimum percentage for test mode (0-100, use 0 to disable test mode)
4. **Lines 4+**: Card data as `Front[TAB]Back` with optional alternative answers in brackets

Example:
```
China Timeline 1830s-1989
A general purpose list of events related to modern Chinese history
100
Taiping Rebellion	1850-1864 [1851-1864]
```

## Configuration Options

The `options.js` file contains user-configurable settings:

- **`testQuestionCount`**: Number of questions in test mode (default: 10)
- **`ListFrontWrap`**: Whether front column text wraps in list view (default: true)
- **`ListBackWrap`**: Whether back column text wraps in list view (default: true)

## Navigation and Routing

The application uses hash-based client-side routing:
- `#index` or empty - Main index page
- `#cards/[filename]` - Flashcard study interface
- `#list/[filename]` - Browse mode showing all cards in a table

## Technical Requirements

- **Frontend**: Modern web browser with JavaScript enabled
- **Backend**: PHP-enabled web server (for high score functionality)
- **Permissions**: Web server must be able to write to the `scores/` directory
- **Files**: All flashcard content files must be in the `cards/` directory

## Getting Started

1. Place all files on a PHP-enabled web server
2. Ensure the `scores/` directory is writable by the web server
3. Add your flashcard content files to the `cards/` directory
4. Navigate to `index.html` to begin using the application

The application was created using Anthropic Claude Sonnet 3.5 and is designed to be a simple, effective tool for studying historical timelines and chronological information.