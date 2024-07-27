# Frog in a Well Flashcards

- Assumes you have a server which can use PHP
- Drop the flashcard files in the "cards" directory
- Needs to be able to write the "scores" directory to save high scores
- The cards are tab-delimited front/back style two sided cards, and has logic in it which assumes dates for the back which is tolerant of various formats for date ranges (e.g. 1950-1953 and 1950-3 etc.) and does not test the month values, merely the year values.
- The cards files have 3 lines of metadata at the top: first line is title, second line is description, and third line is the percentage for the minimum pass on test mode. 
- High scores will keep the top ten scores and will rank them not by how many were correct, but how quickly the student answered (since they can cheat and look on the list, faster scores more likely to be memorized answers)
- The code was mostly created by a large language model. Each time it fixed bugs, the code often got messier and less efficient. I think it works, mostly, but probably is far from decent code. I welcome pull requests to improve it.


Future versions:

- I'd like to add an option to indicate whether exact answers are required (either for timelines or other cards)