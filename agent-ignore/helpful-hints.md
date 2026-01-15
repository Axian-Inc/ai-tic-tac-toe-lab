## Codex Configuration

Codex does not currently support project level configuration from within the project folder.  However, when using Codex within a dev container you can manage configuration files within the container's home directory.

To manage Codex configuration within the dev container run:

```bash
code ~/.codex
```
This will open the Codex configuration folder in VS Code.  From here you can manage:

- Custom Prompts - Add any custom prompts you want to use within Codex. 
  - snippets - Use in codex with `/prompt:{name}`
- approval_policy - Update config.toml `approval_policy = "write,edit"`

## Context Management

- /new: Create a new context when starting a new task, this ensures:
  1. The context is focused on the current task
  2. The context does not grow too large over time, which can lead to performance issues and confusion.
  3. Correct initial context is available for future reference.  If not, update the context as needed before starting a new task.

