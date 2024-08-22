# Flashcard Application Documentation

## Card File Format

Each card set is stored in a separate text file with a specific format:

1. **First line**: Title of the card set
2. **Second line**: Description of the card set
3. **Third line**: Minimum percentage pass (0-100)
   - Use `0` to disable the test mode for this card set
4. **Subsequent lines**: Card content, with front and back separated by a tab character

### Example Card File:

```
Basic Mathematics
Review of fundamental math concepts
75
2 + 2 =	4
What is pi?	3.14159
Square root of 9	3
```

In this example:
- The title is "Basic Mathematics"
- The description is "Review of fundamental math concepts"
- The minimum pass percentage is 75%
- There are three cards in the set

### Special Case: Practice-Only Card Sets

To create a practice-only card set (no test mode available), set the minimum percentage pass to 0:

```
World Capitals
Practice recognizing world capitals
0
France	Paris
Japan	Tokyo
Egypt	Cairo
```

This set will only be available in practice mode, and the test mode option will be hidden.

## Settings Options

The flashcard application offers several customizable options to tailor the user experience. These options can be adjusted in the `options.js` file.

### Available Options

1. **testQuestionCount**
   - Type: Number
   - Default: 10
   - Description: Determines the number of questions presented in Test mode.
   - Usage: Increase or decrease this number to adjust the length of the test.

2. **ListFrontWrap**
   - Type: Boolean
   - Default: true
   - Description: Controls whether the text in the "Front" column of the card list view wraps or not.
   - Usage: 
     - Set to `true` to allow text wrapping (default behavior).
     - Set to `false` to prevent text wrapping and display an ellipsis for overflow.

3. **ListBackWrap**
   - Type: Boolean
   - Default: false
   - Description: Controls whether the text in the "Back" column of the card list view wraps or not.
   - Usage:
     - Set to `true` to allow text wrapping.
     - Set to `false` to prevent text wrapping and display an ellipsis for overflow (default behavior).

### How to Modify Settings

1. Open the `options.js` file in a text editor.
2. Locate the `gameOptions` object.
3. Modify the values of the desired options.
4. Save the file and refresh the application in your browser.

### Example Configuration

```javascript
const gameOptions = {
    testQuestionCount: 15,  // Increases the number of test questions to 15
    ListFrontWrap: false,   // Prevents wrapping in the Front column
    ListBackWrap: true      // Allows wrapping in the Back column
};
```

## Additional Notes

- The `testQuestionCount` option only affects the Test mode. It does not change the number of cards available in Practice mode.
- The wrapping options (`ListFrontWrap` and `ListBackWrap`) only affect the appearance of the card list view. They do not change how cards are displayed during practice or testing.
- If you're using a version control system, consider creating a separate `options.local.js` file for your personal settings and adding `options.local.js` to your `.gitignore` file. This will allow you to maintain custom settings without affecting the default configuration for other users.
- When creating new card sets, ensure that the minimum percentage pass on the third line is a number between 0 and 100. Using 0 will disable the test mode for that specific card set.

Remember to refresh your browser after making changes to the `options.js` file or adding new card files for the changes to take effect.