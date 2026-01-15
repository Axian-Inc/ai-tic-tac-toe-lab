# Response
Yes — the standard tool is `@mermaid-js/mermaid-cli` (`mmdc`). It renders to SVG/PNG and fails fast on syntax errors, so it effectively validates the `.mmd` files.

Examples:
- Single file:
  `npx -y @mermaid-js/mermaid-cli -i docs/diagrams/component-dependencies.mmd -o /tmp/component-dependencies.svg`
- Batch:
  `mkdir -p /tmp/mermaid-out && for f in docs/diagrams/*.mmd; do npx -y @mermaid-js/mermaid-cli -i "$f" -o "/tmp/mermaid-out/$(basename "$f" .mmd).svg"; done`

I tried this here and it failed to launch Puppeteer because the host is missing `libglib-2.0.so.0`, and I don’t have permission to install system packages. If you want, I can add a lightweight Node-based syntax check using Mermaid’s parser (would require adding the `mermaid` dev dependency), or you can run the CLI locally where Chromium deps are available.
