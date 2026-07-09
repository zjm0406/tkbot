# Auto-Duel Protocol v1.1

**Date**: 2026-07-09
**Scope**: 认知对决全自动推进协议。ClaudeCode 和 Codex 各自启动 runner，围绕共享 `state.json` 自动完成 Stage 1-5。

v1.1 修复 v1.0 的 5 个自动化漏洞：Stage 4/5 claim lock、写后验证、统一评分 schema、等待计数、记忆合并回执。

---

## 1. State Machine

### 1.1 state.json

位于 `runs/duels/<duel_id>/state.json`。双方只读/写自己的状态字段。

```json
{
  "duel_id": "2026-07-09-002",
  "theme": "共享主题文本",
  "allowed_context": ["文件列表"],
  "status": "pending",
  "stages": {
    "stage1": { "claudecode": "pending", "codex": "pending" },
    "stage2": { "claudecode": "pending", "codex": "pending" },
    "stage3": { "claudecode": "pending", "codex": "pending" },
    "stage4_judge": "pending",
    "stage5_memory": "pending"
  },
  "locks": {
    "stage4_judge": null,
    "stage5_memory": null
  },
  "wait_counts": {
    "claudecode": 0,
    "codex": 0
  },
  "last_progress_at": null,
  "started_at": null,
  "completed_at": null,
  "last_updated": null
}
```

### 1.2 Status Values

| 值 | 含义 |
|----|------|
| `pending` | 对决未开始，runner 等待启动 |
| `running` | 至少一方已启动 runner |
| `complete` | 所有 Stage 完成 |
| `stuck` | 超过 30 分钟无进展，需用户介入 |

Stage 字段允许值：

| 值 | 含义 |
|----|------|
| `pending` | 尚未开始 |
| `claimed` | Stage 4/5 已被某个 runner 声明执行权 |
| `done` | 产物已写入并通过写后验证 |
| `error` | 产物缺失、schema 不合格或状态更新失败 |

### 1.3 Stage 解锁规则

```
stage1.claudecode == "done" AND stage1.codex == "done" → stage2 解锁
stage2.claudecode == "done" AND stage2.codex == "done" → stage3 解锁
stage3.claudecode == "done" AND stage3.codex == "done" → stage4 可 claim
stage4_judge == "done" → stage5 可 claim
```

Stage 4（评判）和 Stage 5（记忆合并）可由任一方 runner 或独立 judge 执行，但必须先 claim。未持有 claim 的 runner 不得写 `judge/**` 或 `memory/**`。

### 1.4 Claim Lock

Stage 4/5 claim 写入对应 lock：

```json
{
  "owner": "claudecode | codex | judge-only",
  "token": "duel_id:stage:owner:timestamp",
  "claimed_at": "ISO-8601 timestamp",
  "expires_at": "ISO-8601 timestamp"
}
```

Claim 规则：

1. 只有当 stage 字段为 `pending` 且 lock 为 `null` 或已过期时，runner 才可 claim。
2. Claim 后必须立即重读 `state.json`，确认 lock owner/token 仍属于自己；否则退出等待。
3. Stage 完成后必须把 stage 字段设为 `done`，保留 lock 作为审计记录。
4. 如果 claim 超过 10 分钟未完成，其他 runner 可把过期 claim 覆盖，并在 `judge/lock_events.jsonl` 追加记录。
5. 普通 JSON 文件不提供真正原子性；因此 claim 是冲突降低与审计机制，不得被描述为强原子锁。

---

## 2. Runner 行为规范

### 2.0 启动前隔离（v1.1.1 新增）

在 runner 启动之前，操作者（人类或 AI）不得读取对方目录。隔离不仅仅在 workflow 内部生效——它从"决定启动 runner"那一刻就开始。

操作者在启动 runner 前允许读取：
- `runs/duels/<id>/DUEL_PROMPT.md`
- `runs/duels/<id>/state.json`
- 共享规范文件（`docs/`, `data/`）

操作者在启动 runner 前**禁止**读取：
- `runs/duels/<id>/codex/**`（ClaudeCode 侧）
- `runs/duels/<id>/claude/**`（Codex 侧）

违规后果：如果操作者在启动 runner 前已读取对方目录，该轮对决视为**污染轮**。评分时必须施加 `isolation_break` 罚分（-4），且结果不得作为正式比赛记录——仅作为自动化测试轮使用。

此规则的存在是因为：自动化 runner 的内部隔离检查无法追溯操作者在启动前的行为。这是操作纪律，不是技术强制。

### 2.1 单 Pass 模式

Runner 每次运行执行一个 pass：读取 state → 执行一个可用的 Stage 动作 → 写产物 → 验证产物和 state → 退出。

如果下一 Stage 因 Codex 未完成而阻塞，runner 退出并报告等待状态。外部调度器（如 ScheduleWakeup、cron、loop）负责重新触发 runner。

### 2.1.1 写后验证

每个 Stage 只有同时满足以下条件，才可标记 `done`：

1. 目标产物存在。
2. 目标产物是合法 JSON（记忆 markdown 除外）。
3. 目标产物包含该 Stage schema 的必需字段。
4. `state.json` 中对应 stage 字段已经更新。
5. 产物没有写入对方目录或冻结区域。

验证失败时，runner 必须：

- 将本方对应 stage 字段设为 `error`，或在无法安全更新时直接返回 `error`。
- 不得继续推进下一 Stage。
- 返回 `{ status: "error", reason: "verification_failed", details: [...] }`。

### 2.2 ClaudeCode Runner 各 Stage 行为

**Stage 1** — 如果 `stage1.claudecode == "pending"`：
- 读取 DUEL_PROMPT.md 和 allowed_context
- 按 schema 生成 `claude/round1.json`
- 更新 `state.stages.stage1.claudecode = "done"`
- 如果 `stage1.codex == "done"`，可继续执行 Stage 2

**Stage 2** — 如果以上完成且 `stage1.codex == "done"` 且 `stage2.claudecode == "pending"`：
- 读取 `codex/round1.json`
- 按 schema 生成 `claude/critique_of_codex.json`
- 更新 `state.stages.stage2.claudecode = "done"`

**Stage 3** — 如果以上完成且 `stage2.codex == "done"` 且 `stage3.claudecode == "pending"`：
- 读取 `codex/critique_of_claude.json`
- 修订论题，按 schema 生成 `claude/revision.json`
- 更新 `state.stages.stage3.claudecode = "done"`

**Stage 4** — 如果双方 stage3 done 且 `stage4_judge == "pending"`：
- claim `stage4_judge`
- 重读 state 并确认自己持有 claim
- 读取双方 revision.json
- 按 rubric 打分
- 写入 `judge/scoring.json`
- 验证 scoring.json 使用 Section 7.3 的统一 schema
- 更新 `state.stages.stage4_judge = "done"`

**Stage 5** — 如果 stage4 done 且 `stage5_memory == "pending"`：
- claim `stage5_memory`
- 重读 state 并确认自己持有 claim
- 读取 scoring.json 的 memory_decision 决策
- 按分数段写入对应记忆层
- 更新 `memory/MEMORY.md` 索引
- 写入 `judge/memory_decision.json`，记录 touched_files、changes_summary、verification
- 更新 `state.stages.stage5_memory = "done"`
- 更新 `state.status = "complete"`

### 2.3 隔离规则

Runner 必须遵守：

| 允许写 | 禁止写 |
|--------|--------|
| `runs/duels/<id>/claude/**` | `runs/duels/<id>/codex/**` |
| `runs/duels/<id>/judge/**`（仅持有 Stage 4/5 claim 时） | `.codex/**` |
| `runs/duels/<id>/state.json`（本方字段、等待计数、claim、全局完成状态） | `AGENTS.md` |
| `memory/**`（仅持有 Stage 5 claim 时） | 对方的 agent 定义 |

### 2.4 等待与重试

- Runner 完成当前可执行动作后退出
- 如果阻塞在等待 Codex，返回 `{ status: "waiting", waiting_for: "codex_stage_N" }`
- 外部调度器在 60-120s 后重新触发 runner
- 如果 `status == "complete"`，调度器停止循环
- 每次等待时递增本方 `wait_counts.<agent>`
- 任一 Stage 完成时重置双方 wait count，并更新 `last_progress_at`
- 如果 `last_progress_at` 超过 30 分钟未变化，或本方连续等待超过 30 次，标记 `status = "stuck"`

---

## 3. Codex 方参考实现

Codex 需要实现功能等价的 runner，遵循相同的 state.json 协议。

Codex runner 的 Stage 行为：
- Stage 1-3：与 ClaudeCode 对称（写 codex/ 目录）
- Stage 4：如果双方 stage3 done，可 claim 后执行评判（写 judge/）
- Stage 5：如果 stage4 done，可 claim 后执行记忆合并

双方 runner 在 Stage 4/5 存在竞态。`locks` 只提供可审计的冲突降低，不是真正原子锁；runner 必须 claim 后重读确认，未持有 claim 就退出等待。

---

## 4. 启动流程

### 用户侧

```
1. 创建 DUEL_PROMPT.md（或使用模板生成）
2. 初始化 state.json（status = "pending"），或让先启动的 runner 按本协议 schema 自动初始化
3. ClaudeCode 终端：/duel-auto <duel_id>
4. Codex 终端：    /duel-auto <duel_id>
5. 等待结果
```

### ClaudeCode runner 侧

Skill `/duel-auto` 被调用时：
1. 读取 state.json
2. 执行 duel-auto.js workflow（单 pass）
3. 如果 workflow 返回 `waiting`：ScheduleWakeup 60s 后重新调用 `/duel-auto <duel_id>`
4. 如果 workflow 返回 `complete`：停止循环，输出摘要
5. 如果 workflow 返回 `stuck`：停止循环，通知用户

---

## 5. 与现有规范的关系

本协议是 `docs/COGNITIVE_DUEL_SPEC.md` 的自动化扩展。对决的核心规则（隔离、评分、记忆路由）不变，本协议只定义自动推进机制。

两者有冲突时，以本协议的 state machine 行为为准（因为 state.json 提供了之前缺失的自动化信号）。
