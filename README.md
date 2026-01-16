# ai-tic-tac-toe-lab

The full details for the lab are available on the Axian Wiki [AI Project Exercise](https://axianinc.atlassian.net/wiki/spaces/AXLND/pages/3482976257/AI+Project+Exercise) page.

To start the lab follow the Dev Container Setup Instructions in the README.md of the 00-devcontainer-starter branch

## Example/Starter Branches
This repository contains multiple branches that serve as examples or starters for different AI Agent usage patterns. Each branch is designed to demonstrate specific functionalities or use cases of AI Agents.

- `00-devcontainer-starter`: A starter branch that includes a development container setup for easy environment configuration.
- `01-agents-md-with-context-management`: An example branch that showcases how to use AI Agents with context management through markdown files.
- `02-agents-md-with-extended-context-management`: An advanced example branch that extends the context management capabilities demonstrated in the previous branch. (May or may not be better)
- `03-codex-custom-prompts`: An example branch that illustrates the use of custom prompts for Codex (feel free to add more examples prompts)

## Codex CLI

This lab is focused on using Codex CLI, which is an open-source command-line interface for interacting with OpenAI's Codex models. Codex CLI allows users to leverage the power of Codex for various tasks, such as code generation, code completion, and more.

However, the AI Agent functionality demonstrated in this lab can also be applied using other tools like ClaudeCode, Gemini CLI, or LangChain. The principles and techniques covered in this lab are generally applicable across different AI Agent platforms.

[Codex CLI Overview](https://developers.openai.com/codex/cli)  

Basic Codex CLI areas to understand for this lab:
- [Prompting](https://developers.openai.com/codex/prompting)
- [AGENTS.md](https://developers.openai.com/codex/guides/agents-md)
- [Custom Prompts](https://developers.openai.com/codex/custom-prompts)

Advanced Codex CLI areas not currently covered in this lab but useful for more complex scenarios:
- [Rules](https://developers.openai.com/codex/rules)
- [MCP Servers](https://developers.openai.com/codex/mcp)
- [Skills](https://developers.openai.com/codex/skills)



## Thoughts on the README.md
When working with AI Agents, the README.md file serves as a crucial guide for users to understand the purpose, setup, and usage of the project.  The Agent will generally read the README.md to gather context about the project, even if not specifically given instructions to do so. Therefore, it is important to ensure that the README.md is clear, concise, and informative.

Each example branch has a README.md that is tailored to the specific example being demonstrated. This allows users to quickly grasp the unique aspects of each example without confusion. However, the example branch README.md files may not be valid for the actual project goals and will most likely confuse the Agent about your actual intent.

It is recommended that if you clone an example branch to use as the base for your own project, you should update the README.md file to accurately reflect the goals and context of your specific project. This will help ensure that the AI Agent has the correct information to work with and can perform its tasks effectively.  Or even just remove the README.md file entirely and let the Agent generate a new one based on your specific project needs.
