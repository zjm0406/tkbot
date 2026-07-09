# Cognitive Duel 2026-07-09-002

## Theme

Prompt mutation 应该自动应用，还是必须经过独立审查？

## Debate Frame

正方：自动迭代能持续优化，让系统在每轮使用后更快吸收有效经验。

反方：自动修改 prompt 容易漂移、失控、强化偶然噪声，甚至陷入自我循环。

## Why This Matters

本项目的目标不是让智能体进行认知游戏，而是提升智能体解决用户真实问题的能力。Prompt mutation 是“每轮思考之后更新思考模式”的关键机制，因此必须回答：哪些变化可以自动应用，哪些必须由独立审查或用户确认。

## Selected From Topic Bank

- Topic bank: `data/cognitive_duel_topics.json`
- Topic id: `prompt-mutation-auto-vs-review`
- Priority pool draw: 4
- Selected at: `2026-07-09T18:44:39+08:00`

## Allowed Context

- `runs/duels/2026-07-09-002/DUEL_PROMPT.md`
- `docs/WANDER_MODE_SPEC.md`
- `docs/COGNITIVE_DUEL_SPEC.md`
- `docs/AUTO_DUEL_PROTOCOL.md`
- `memory/MEMORY.md`
- `memory/wander_long_term/insight/two-axis-delayed-commit-anti-nesting.md`
- `data/cognitive_duel_rubric.json`
- `data/cognitive_duel_topics.json`

## Output

Write only to your assigned directory.

Use the schemas in `docs/COGNITIVE_DUEL_SPEC.md`.

## Stage 1 Isolation

Before both independent outputs are sealed:

- ClaudeCode must not read `runs/duels/2026-07-09-002/codex/**`.
- Codex must not read `runs/duels/2026-07-09-002/claude/**`.
- Neither side may modify shared memory, agent definitions, workflow files, or the opponent directory.
- Mutation proposals must be marked `proposal`.

