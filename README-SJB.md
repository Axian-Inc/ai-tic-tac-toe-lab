
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
Mar 19, 2026:
* 2 hrs: Finished tweaking UI layout/styling to match the provided target screenshots (making Codex tweak it).  Having it 
  add an e2e test for a bug I spotted and fixing the bug.
* 2 hrs: Finishing Phase 1.
Mar 20, 2026:
* 2 hrs: Phase 2: Creating user stories + implementing backend stories plus tests.
Mar 23, 2026:
* 2.5 hrs: Phase 2: Finishing server stories and doing UI stories incl. automated tests.  No manual testing done.
Mar 24, 2026:
* xxx



## SCRAP

I have noticed the following bug in the app.  When I open the Game page from
the landing page and win the game, I get a nice confeti + sound effect as 
it was expected.
However, when after that I click Play Again and then win again, there is no
confeti+sound.  There is only "You Win!" message above the board game.

So, please first create a playwright test for this scenario and make sure it fails.
Then, fix the bug and rerun the test.  It should pass now.

Do all of this locally.  There is no needto deploy to AWS for now.