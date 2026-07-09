---
name: duel-auto
description: Codex 侧认知对决自动推进——围绕 state.json 执行一个安全 pass
user-invocable: true
argument-hint: "<duel_id>"
---

# /duel-auto <duel_id>

自动推进一次认知对决 pass。Codex runner 必须遵守 `docs/AUTO_DUEL_PROTOCOL.md` v1.1 和 `docs/COGNITIVE_DUEL_SPEC.md` v0.3。

## 读取

每次 pass 先读取：

- `runs/duels/<duel_id>/state.json`
- `runs/duels/<duel_id>/DUEL_PROMPT.md`
- `docs/AUTO_DUEL_PROTOCOL.md`
- `docs/COGNITIVE_DUEL_SPEC.md`
- `data/cognitive_duel_rubric.json`

如果 `state.json` 不存在但 `DUEL_PROMPT.md` 存在，Codex 可以初始化 state：

- `status = "running"`
- Stage 1-3 双方字段均为 `pending`
- `stage4_judge = "pending"`
- `stage5_memory = "pending"`
- `locks.stage4_judge = null`
- `locks.stage5_memory = null`
- `wait_counts.claudecode = 0`
- `wait_counts.codex = 0`
- 填写 `started_at`、`last_updated`、`last_progress_at`

Stage 1 不得读取 `runs/duels/<duel_id>/claude/**`。Stage 2 之后只有在双方 `round1.json` 都完成时才可读取 Claude 输出。

## Stage 行为

### Stage 1

条件：`stages.stage1.codex == "pending"`。

动作：

1. 只读取 DUEL_PROMPT.md 和 allowed_context。
2. 写入 `runs/duels/<duel_id>/codex/round1.json`。
3. 验证 JSON 合法且包含 Section 7.1 必需字段。
4. 更新 `state.json`：`stages.stage1.codex = "done"`，更新 `last_updated`、`last_progress_at`，重置 `wait_counts.codex = 0`。

### Stage 2

条件：双方 Stage 1 done，且 `stages.stage2.codex == "pending"`。

动作：

1. 读取 `claude/round1.json`。
2. 写入 `codex/critique_of_claude.json`。
3. 验证 JSON 合法且包含 Section 7.2 必需字段。
4. 更新 `state.json`：`stages.stage2.codex = "done"`，更新进展时间，重置等待计数。

### Stage 3

条件：双方 Stage 2 done，且 `stages.stage3.codex == "pending"`。

动作：

1. 读取 `claude/critique_of_codex.json` 和 `codex/round1.json`。
2. 写入 `codex/revision.json`。
3. 验证 JSON 合法且包含修订必需字段。
4. 更新 `state.json`：`stages.stage3.codex = "done"`，更新进展时间，重置等待计数。

### Stage 4

条件：双方 Stage 3 done，`stages.stage4_judge == "pending"`，且 `locks.stage4_judge` 为空或过期。

动作：

1. 写入 Stage 4 claim：`owner = "codex"`，token 包含 duel_id/stage/owner/timestamp。
2. 立即重读 `state.json`，确认 owner/token 仍属于 Codex。
3. 如果 claim 不属于 Codex，返回等待，不写 `judge/**`。
4. 读取双方 `revision.json` 和 rubric。
5. 写入 `judge/scoring.json`，必须使用 Section 7.3 统一 schema：`winner` + `memory_decision`，不得使用 `memory_routing`。
6. 验证 scoring.json 后，更新 `stages.stage4_judge = "done"`。

### Stage 5

条件：Stage 4 done，`stages.stage5_memory == "pending"`，且 `locks.stage5_memory` 为空或过期。

动作：

1. 写入 Stage 5 claim：`owner = "codex"`。
2. 立即重读确认 owner/token。
3. 如果 claim 不属于 Codex，返回等待，不写 `memory/**`。
4. 按 `judge/scoring.json.memory_decision` 写入记忆。
5. 更新 `memory/MEMORY.md`。
6. 写入 `judge/memory_decision.json`，记录 touched_files、changes_summary、behavior_change、verification。
7. 验证回执后，更新 `stages.stage5_memory = "done"`，`status = "complete"`。

## 等待与停止

- 如果等待 ClaudeCode，递增 `wait_counts.codex`，返回 waiting。
- 如果 `last_progress_at` 超过 30 分钟未变化，或 `wait_counts.codex >= 30`，标记 `status = "stuck"` 并停止。
- 如果 `status == "complete"`，读取评分和记忆回执，向用户输出摘要后停止。

## 隔离规则

- Stage 1-3 只写 `runs/duels/<duel_id>/codex/**` 和自己的 state 字段。
- Stage 4/5 只有持有 claim 时才可写 `judge/**` 或 `memory/**`。
- 禁止写 `runs/duels/<duel_id>/claude/**`。
- 禁止写 `.claude/**`、`CLAUDE.md`。
- 不得修改对方 agent 定义或对方输出。

## 写后验证

每个 Stage 完成前必须验证：

1. 目标产物存在。
2. JSON 合法。
3. 必需字段齐全。
4. `state.json` 对应字段已经更新。
5. 没有越权写入。

验证失败时停止，不推进后续 Stage。
