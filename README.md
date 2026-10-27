# agent-skills

Personal skills shared by every agent CLI (Claude Code, Codex, OpenCode) and
so by T3 Code, which runs those CLIs. This repo holds the only copy you edit;
`./link.sh` symlinks each skill into `~/.claude/skills/`, `~/.codex/skills/`
and `~/.config/opencode/skills/`.

## Layout

```
<skill-name>/
  SKILL.md        # required: frontmatter with name + description
  scripts/        # optional: deterministic steps, called by relative path
  references/     # optional: details loaded only when SKILL.md points to them
  agents/openai.yaml  # optional: display name shown in Codex and T3 Code
```

Copy `_template/` to start a new skill (folders starting with `_` are not
linked), then run `./link.sh`.

## Writing skills that work on every model

- The `description` decides when the skill is used: say what it does and when.
- Describe actions ("read the file", "run `scripts/check.sh`"), not one CLI's
  tool names ("use the Read tool").
- `name` and `description` are required in the frontmatter; anything else is
  optional and may be ignored by some CLIs.
- Keep `SKILL.md` short and move detail into `references/`.
- Project-only skills belong in that project's repo (`.claude/skills/`, with
  `.agents/skills` symlinked to it), not here.

Do not put files in `~/.claude/skills/synced/` or `~/.codex/skills/.system/`;
the apps manage those folders.
