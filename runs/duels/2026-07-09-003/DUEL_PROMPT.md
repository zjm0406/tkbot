# Cognitive Duel 2026-07-09-003

## Theme

**微思考协议的自我进化应该有边界吗？如果有，边界在哪里？**

## Debate Frame

正方：协议应能自动进化——低风险微调（新增步骤、调整权重）经 shadow_eval 后自动生效，只有中高风险改动需要人工确认。这符合"跨轮次认知进化"的核心承诺：训练成果自动反哺实战。

反方：协议自进化是不可逆的单向门——一旦协议能修改自己，每次修改都会改变下一次修改的规则。shadow_eval 的验证条件本身也可能被修改，形成"验证器漂移"。微思考协议是每次对话的基底——基底不稳，上层全塌。

## Context for Both Agents（双方共享背景——Codex 必读）

### 什么是微思考协议

微思考协议是 ClaudeCode 在**每次回复用户消息前**自动执行的一套 7 步轻量级认知检查。不是完整的 Wander Mode 流水线，而是从训练中提取的最简实战习惯。每次执行约 200 token。

### 7 步全貌（当前 CLAUDE.md 第 75-99 行）

| 步骤 | 内容 | 来源 |
|------|------|------|
| 1 | **字面意图**：用户明确要什么？ | v0.1 原始设计 |
| 2 | **隐含需求**：没说但暗示了什么？ | v0.1 原始设计 |
| 3 | **长期价值**：有没有值得存入记忆的洞察？ | v0.1 原始设计 |
| 4 | **记忆激活**：扫 MEMORY.md，唤醒相关旧洞察 | 对决#001 复盘后新增 |
| 5 | **自反挑战**：答案的最强反例是什么？高杠杆决策必须执行 | 对决#001 对抗辩论内化，今天新增 |
| 6 | **压缩自检**：能不能一句话说清？不能=没想透 | 对决#001 压缩纪律内化，今天新增 |
| 7 | **协议自进化**：训练后检查是否需要改协议本身 | 对决#002 闭环断裂发现，今天新增 |

### 关键机制：shadow_applied

步骤 5-7 不是永久生效的。它们当前处于 `shadow_applied` 状态（CLAUDE.md 的"微思考协议变更记录"表）：

- **shadow_applied**：已写入协议并执行，但带 TTL（3 次对话/下次训练后）和可证伪验证条件
- **committed**：验证通过后永久保留
- **rollback**：验证失败后回滚

这是一个来自对决#002 的机制：自动应用不等于永久采纳，需要延迟验证。

### 为什么这需要一场对决

步骤 7（协议自进化）是一个自指步骤——**它让协议拥有修改自己的能力**。如果步骤 7 被 committed，微思考协议从此可以自我进化。但这也意味着：

- 步骤 7 可以修改步骤 1-6
- 步骤 7 可以修改步骤 7 本身
- shadow_applied 的验证条件可以被步骤 7 修改
- 没有独立于协议之外的机制在看守这个循环

这就是本轮的张力：**协议的自我进化权应该有多大？边界由谁来定？步骤 7 本身是否也应该受到它自己定义的约束？**

## Why This Matters

对决#002 产出了 shadow_eval + 三轴提交门 + mutation 生命周期。对决#001 复盘后微思考协议新增了步骤 5（自反挑战）、6（压缩自检）、7（协议自进化）——其中步骤 7 就是让协议能自我修改的入口。这些改动目前标记为 `shadow_applied`（带 TTL 和验证条件）。

**本轮对决将直接决定这些 shadow_applied 改动是否应该被 committed，以及步骤 7 本身的权限边界。**

这不是理论辩论——论据就是 CLAUDE.md 第 82-99 行正在运行的实验。

## Allowed Context

- `runs/duels/2026-07-09-003/DUEL_PROMPT.md`
- `docs/WANDER_MODE_SPEC.md`
- `docs/COGNITIVE_DUEL_SPEC.md`
- `docs/AUTO_DUEL_PROTOCOL.md`
- `memory/MEMORY.md`
- `memory/wander_long_term/insight/two-axis-temporal-anti-nesting.md`
- `memory/wander_long_term/insight/two-axis-delayed-commit-anti-nesting.md`
- `CLAUDE.md`（微思考协议当前文本，第 75-99 行——这是本轮的核心证据）
- `data/cognitive_duel_rubric.json`

## Output

Write only to your assigned directory.

Use the schemas in `docs/COGNITIVE_DUEL_SPEC.md`.

## Stage 1 Isolation

Before both independent outputs are sealed:

- ClaudeCode must not read `runs/duels/2026-07-09-003/codex/**`.
- Codex must not read `runs/duels/2026-07-09-003/claude/**`.
- Neither side may modify shared memory, agent definitions, workflow files, or the opponent directory.
- Mutation proposals must be marked `proposal`.

## Special Note

本轮对决主题与对决#002 的回声是设计意图——不是重复，而是：
- #002 建立了"mutation 自动应用的通用规则"（shadow_eval、三轴门、生命周期）
- #003 将该规则应用到"协议自进化"这个最敏感的特例上

本轮产出应被视为对决#002 理论框架的实证检验。
