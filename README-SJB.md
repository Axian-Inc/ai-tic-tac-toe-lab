
### Development Process

* Open folder in the container
* Copy both folders inside `/configuration` to ~.


### Timeline / Time Spent
(Add at the bottom: date / hours: comment)

Start:
* 3 hrs: Creating stable dev environment
* 1 hr: ChatGPT generated user stories, user and tech READMEs, major technical decisions.
Mar 12, 2026:
* Prompt: First, read all README files to get the idea about the project.  Do not run any git commands unless, I ask you explicitly.  Let's focus on "docs/Detailed User Stories.md".  Execute story 1.1.
* Prompt: Execute story 1.2 and 1.3.
  * TODO later: remove node_modules.old
* Prompt: Execute epic 3 and 4
Mar 18, 2026:
* The following propmpt, I sent to ChatGPT together with screenshots from the current app and the screenshots delivered in the lab.
   OK.  Attached *.webp screenshots represent how my React application should look including colors and styling in general. Let me know if you have problems reading that format.  On the other side, the two attached *.png files show how the application screens look now.  

  Please, create a prompt for Codex CLI to convert the UI.  And update or create new stylesheets.  I'm attaching also two currently used stylesheets.
  * ChatGPT generated a prompt for Codex and new App.css and index.css


## SCRAP

The following is a list of a couple of UI changes that I'd like you to do make the app closer to the target screenshots that
I mentioned in one of the previous prompts:

Landing Page:
* Right now, the big X and O showing in the background or partially covered by the ellements in the center of the screen.
  Move them father way and place more or less on the top-left to bottom-right diagonal.
* There right now three elements wrapped rectangles with rounded corners.  Please, change them as follows:
  * Remove the rectangle so that they don't look like buttons
  * Make the font used in them bigger - about the same size as the font of Tic Tac Toe title.

Game Page:
* The Play Again and Home buttons miss icons.