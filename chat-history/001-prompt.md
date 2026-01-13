# Prompt
I need to setup this directory to host a new project, the project needs to be fully run inside a docker dev container, have the codex cli installed, with the codex authenitcation json copied from the local machine into the dev container, and the aws cli tools need to be installed. Capture this prompt as well as your response into a chat-history folder using md files. Only generate a plan file, save into the planning directory as md file. Ask any clarifying questions as needed.

The technolgy has not been decided yet, so do not scafold any of the project, we are just setting up the container. These are the example instructions for the auth file: Codex Auth - Codex CLI can authorize via Web browser, BUT it cannot do so in container so you will need to login locally and then copy the auth.json file into the container.

On Mac and Windows find and copy ~/.codex/auth.json (host OS) to ~/.codex/auth.json in your running container. Latest AWS CLI version is good. Yes standard VS Code devcontainer
