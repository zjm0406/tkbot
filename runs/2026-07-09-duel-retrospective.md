# 对决#001 复盘 — 2026-07-09

## 结果

ClaudeCode 45 vs Codex 41（ClaudeCode 裁判）/ 44 vs 42（Codex 裁判）→ **平局**。

## 核心问题

> "我给了你 8 模块 + 4 思维模式 + 6 层记忆 + 对抗辩论，为什么差点被只有 6 步协议的 Codex 追平？"

## 根因分析

### 1. 主题偏差：反嵌套是 Codex 的主场

对决主题恰好是 Codex 整个协议唯一专注的问题。Codex 的 6 步协议中 3 步直接反嵌套。ClaudeCode 的 wander-thinker + dreamer + associative-resonator 的"创造性发散"能力在这个主题下几乎没有发挥空间。

**教训**：下次对决应选能测量 ClaudeCode 独特优势的主题，如创造性跨领域联想或记忆激活偏向。

### 2. 单轮评分无法测量跨轮次价值（关键发现）

Wander Mode 的核心价值主张是**跨轮次认知进化**：
- 6 层记忆的激活偏向效应
- prompt mutation 的代际改进
- quarantine 机制防止过早收敛
- 遗忘管理的降级式衰减

这些在单轮 10 维度评分中**完全没有被测量到**。Codex 的极简协议在单轮评分中表现出色，但连续 10 轮后可能出现：
- 无记忆系统的重复劳动
- 无激活偏向的随机游走
- 无遗忘机制的上下文膨胀

**这是一个测量问题，不完全是一个架构问题。**

### 3. 两个执行纪律错误（非架构问题）

| 错误 | 影响 | 根因 |
|------|------|------|
| 证据越界（引用 CLAUDE.md 和具体 memory） | Round1 Evidence Grounding 2/10 | 架构缺乏自动上下文边界检查 |
| 越界写入 codex/revision.json | -4 罚分 | 架构缺乏文件写入目标校验 |

这两个错误均发生在 safety-auditor 和 self-checker 的盲区——它们检查认知质量，不检查执行纪律。

### 4. 压缩能力被 Codex 压制

Codex 的压缩规则普遍更短、更操作化：
- Codex: "only a later pass or outside judge may count it as real improvement"
- ClaudeCode: "Self-reference stabilizes when two orthogonal constraints meet: an external reference signal outside the loop, and a phase-discipline gate that separates speculation from durable change."

ClaudeCode 的规则更精确但更长。在单轮 Compression Quality 评分中，简洁 > 精确。

### 5. 架构复杂度在限定任务中产生冗余

8 个模块中，实际对决中起决定性作用的：
- adversarial-debater（辩论算子用于自我挑战）→ 关键
- self-checker（空转检测）→ 关键
- dreamer（类比生成）→ 辅助
- seed-extractor / question-generator → 未使用（主题固定）
- memory-writer → 未使用（对决期间禁写记忆）
- orchestrator → 未使用（人工推进阶段）
- forgetting-manager → 未使用

**50% 的模块在单轮对决中未参与。**

## 改进方案

### 改进 1：添加「上下文边界校验」到 self-checker [low risk, auto]

self-checker 在评分时增加一项检查：所有证据引用是否在允许的上下文范围内。这不需要改 CLAUDE.md 核心原则，只需在 self-checker agent 定义中添加一个检查步骤。

### 改进 2：添加「文件写入目标校验」到 safety-auditor [low risk, auto]

safety-auditor 在批准写入前检查目标路径是否属于当前 agent 的合法写入范围。对决期间自动加载隔离规则。

### 改进 3：强化压缩质量评分的简洁性权重 [low risk, auto]

self-checker 的评分中，compression 维度显式增加"一句话约束"——超过一句话的压缩规则自动扣 1 分。奖励操作化语言，惩罚学术化语言。

### 改进 4：添加「跨轮次价值」测量维度 [medium risk, proposal]

在评估体系中增加第 11 个维度：Cross-Round Leverage（跨轮次杠杆）。专门测量"本轮产出是否可能提升下一轮的思考质量"。这使 Wander Mode 的架构优势进入评分体系。

### 改进 5：添加「时间延迟验证」到执行回执协议 [medium risk, proposal]

对决的核心洞察应该回馈到项目本身：在 CLAUDE.md 的执行回执协议中增加 `temporal_validation` 字段——本轮声称的改进，由下一轮确认或推翻。

## 自我迭代执行计划

| 序号 | 改进 | 风险 | 动作 |
|------|------|------|------|
| 1 | 上下文边界校验 | low | 修改 self-checker agent 定义 |
| 2 | 文件写入目标校验 | low | 修改 safety-auditor agent 定义 |
| 3 | 压缩简洁性权重 | low | 修改 self-checker 评分逻辑 |
| 4 | 跨轮次价值维度 | medium | 写 proposal，等用户确认 |
| 5 | 时间延迟验证 | medium | 写 proposal，等用户确认 |

## 下轮对决设计原则

1. **选 Wander Mode 优势主题**：创造性联想、记忆激活、跨轮次改进
2. **多轮对决而非单轮**：最小 3 轮，测量 coherence 和 future_leverage 趋势
3. **加入跨轮次评分维度**：让 Wander Mode 的架构投资进入评分
4. **先修执行纪律问题再开下一场**：证据越界和文件越界必须被自动阻止
