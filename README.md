# ai-tic-tac-toe-lab

## Dev Container Setup Instructions

### Pre-Requisites:
This lab will takes place INSIDE a docker container using the Dev Containers Extension so you need very little on the host OS beyond Docker, Git, VS Code (and Dev Containers Extension)

- Docker Desktop
- VS Code + Dev Container Extension
- LOCAL (host OS) install of OpenAI Codex CLI (npm / brew are easiest)
<br/>Example: brew install codex or  npm install -g @openai/codex
<br/>NOTE: We’ll only be running codex to enable auth, you won’t need many of its features on the Host OS.
- Axian Github account access
- Axian AWS L&D Access Key (for AWS CLI work) 

### Prep:

- Grab/generate your AWS L&D access key (URL: Axian AWS L&D Account)

- Run codex from the terminal/command prompt and login to your local codex (follow the prompts to the web UI auth).

### Clone and Create Personal Branch

- Clone the repo to your local machine
```
git clone https://github.com/Axian-Inc/ai-tic-tac-toe-lab.git
```
- Checkout the starting lab branch
```
git checkout 00-devcontainer-starter
```
- Create a personal branch for your work (i.e. chadr-first-pass)
```
git checkout -b <firstname-last initial>-<whatever you want>
```

### Open in Dev Container
- Open the folder in VS Code
- When prompted, open in Dev Container
- Wait for the container to build and start (this may take a few minutes the first time)
- The build will run the `copy-codex-auth.sh` script to copy your local codex auth into the container

### Verify Codex Auth Copied
- Open a terminal in the Dev Container
- Run `codex` and verify you are logged in (it should not prompt you to login again)
- You can use `/status` to verify the account info

### AWS Setup
- In the Dev Container terminal, run `aws configure`
- Enter your Axian AWS L&D Access Key ID and Secret Access Key when prompted
- For default region, enter `us-west-2`
- For default output format, enter `json` or leave blank
- Verify AWS CLI is working by running `aws s3 ls` (you should see a list of S3 buckets)

### Github Setup
- In the Dev Container terminal, verify git is working by running `git ls-remote origin` 
- If prompted, enter your Github credentials (you may need to set up a personal access token)

### You are now ready to begin the lab!



