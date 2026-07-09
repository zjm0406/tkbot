---
name: duel-auto
description: ClaudeCode 侧对决自动推进——单 pass 执行下一个待处理的 Stage
---

# /duel-auto <duel_id>

自动推进对决。围绕共享 `runs/duels/<duel_id>/state.json` 状态机，执行 ClaudeCode 在当前 Stage 的待处理动作。

## 参数

- `<duel_id>`：对决 ID，如 `2026-07-09-002`

## 执行流程

1. 运行 `duel-auto.js` workflow，执行单 pass
2. 检查 workflow 返回的 status：

| 返回 status | 动作 |
|------------|------|
| `complete` | ✅ 所有 Stage 完成。读取 `judge/scoring.json` 和 `judge/memory_decision.json` 输出摘要。**停止循环。** |
| `stage*_done_can_proceed` | Codex 已就绪，**立即**重新运行 workflow（无延迟） |
| `stage*_done_waiting` | ⏳ 等待 Codex。更新等待计数后调用 ScheduleWakeup(60s)，prompt 为 `/duel-auto <duel_id>` |
| `waiting` | ⏳ 等待 Codex 或等待 Stage4/5 claim 释放。更新等待计数后调用 ScheduleWakeup(60s)，prompt 为 `/duel-auto <duel_id>` |
| `error` | ❌ 错误。输出错误原因和验证失败细节。**停止循环。** |

3. 连续等待超过 30 次（~30 分钟），或 `last_progress_at` 超过 30 分钟未变化 → 标记 state.json status 为 "stuck"，停止循环，通知用户。

## 写后验证

每个 Stage 只有在产物存在、JSON 合法、必需字段齐全、state 字段已更新、未越权写入时，才算完成。验证失败时停止循环，不推进后续 Stage。

## 隔离规则

- 只写 `runs/duels/<id>/claude/**`
- 只写 `runs/duels/<id>/judge/**`（仅持有 Stage 4/5 claim 时）
- 只写 `runs/duels/<id>/state.json`（ClaudeCode 字段、等待计数、claim、完成状态）
- 只写 `memory/**`（仅持有 Stage 5 claim 时）
- 禁止写 `runs/duels/<id>/codex/**`
- 禁止写 `.codex/**` 或 `AGENTS.md`

## Stage 4/5 Claim

Stage 4 评判和 Stage 5 记忆合并必须先在 `state.json` 写入 claim token，并重读确认 owner/token 仍属于 ClaudeCode。未持有 claim 时，只能等待，不能写 `judge/**` 或 `memory/**`。

## 首次使用

如果 `state.json` 不存在或 status 为 "pending"：
1. 读取 `DUEL_PROMPT.md` 获取主题和允许上下文
2. 初始化 `state.json`（status 设为 "running"，stage* 全部设为 "pending"，locks 为空，wait_counts 为 0，填写 started_at/last_progress_at）
3. 继续正常执行

## 对接 Codex

Codex 需要实现功能等价的 runner（参考 `docs/AUTO_DUEL_PROTOCOL.md`）。
Codex runner 在 Stage 1-3 只写 codex/ 目录；Stage 4/5 必须持有 claim 后才能写 judge/ 或 memory/。
