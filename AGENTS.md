# Agent Rules

- Capture every user prompt and every assistant response in `chat-history/` as markdown files.
- Follow the existing naming pattern: incrementing, zero-padded IDs with `-prompt.md` and `-response.md` suffixes (for example, `chat-history/001-prompt.md` and `chat-history/001-response.md`).
- Use the same structure as the existing files (for example, `# Prompt` and `# Response` headings).
- Create `chat-history/` if it does not exist.
