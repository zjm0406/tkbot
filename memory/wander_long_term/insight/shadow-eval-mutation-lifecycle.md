---
name: shadow-eval-mutation-lifecycle
description: Prompt mutation 应默认进入影子验证而非直接应用；五状态生命周期（candidate → shadow_eval → sandbox_applied → committed → reverted）与三轴提交门共同构成可演化的安全边界。
metadata:
  type: wander_insight
  source: cognitive_duel
  duel_id: 2026-07-09-002
  topic: prompt-mutation-auto-vs-review
  winner: codex
  judge: codex
  winner_score: 48
  opponent_score: 43
  opponent: claudecode
  opponent_penalty: isolation_break_-4
  status: quarantine
  quarantine_until: next_duel_or_wander_round
  citation_count: 0
  wander_date: 2026-07-09
  tags: [prompt-mutation, shadow-eval, lifecycle, safety-gating, anti-recursion, cognitive-duel]
---

## 核心结论

Prompt mutation 的默认自动路径不应是直接应用，而应是影子验证（shadow_eval）：所有 mutation 先进入 candidate；能在不改变真实行为的隔离环境中比较输出的 mutation 进入 shadow_eval；只有低风险、独立分类、具备回滚计划且通过影子对照的局部改动，才可短期 sandbox_applied；任何长期 committed 都必须经过下一轮行为指标和独立审查确认。

压缩规则：**Prompt mutation 可以自动进入影子验证，但只有低风险、独立分类、可回滚且通过对照的局部改动能短期沙盒生效，长期提交必须等待下一轮行为证据或独立审查。**

## 五状态生命周期

| 状态 | 含义 | 入口条件 | 出口条件 |
|------|------|---------|---------|
| **candidate** | 被提出但不影响真实运行 | 包含 description、risk_level、target_files、disconfirming_condition、rollback_procedure、expected_behavior_delta | 独立分类通过后进入 shadow_eval |
| **shadow_eval** | 影子模式并行生成输出，不影响用户可见路径和 memory | risk_level low/medium，且可构造 baseline_comparison | 影子输出优于 baseline 且无明显副作用 → sandbox_applied；否则 → reverted |
| **sandbox_applied** | 有限范围和有限 TTL 内影响真实运行 | low risk、独立分类、shadow_eval 通过、rollback_procedure 可执行、side_effect_log 开启 | 下一轮根据 next_round_metric 决定 committed 或 reverted |
| **committed** | 成为长期规则或指示文件的一部分 | 通过下一轮验证、独立审查或用户确认；有执行回执；未触发 disconfirming_condition | 后续发现漂移、空转或用户纠偏增加时降级或回滚 |
| **reverted** | 被撤回，失败原因进入失败记录或 buffer | 触发 disconfirming_condition、影子对照失败、sandbox 副作用过高或用户否决 | — |

### 必填字段（每个 mutation 提案）
`risk_level`, `classifier`, `classifier_independence`, `rollback_procedure`, `side_effect_log`, `baseline_comparison`, `next_round_metric`, `metric_guard`, `ttl`

## 反题视角：三轴提交门 + 度量古德哈特风险

ClaudeCode 从反面提出了三轴安全模型（risk_level × classifier_independence × commit_scope）和关键开放问题：

**程序正义（独立分类）加结果正义（行为指标）等于可演化的安全边界。** 低风险+独立分类的 mutation 仅进入 sandbox_applied（单轮/单 agent/单参数/TTL 回滚），只有通过 next_round_metric（用户问题完成率、回滚次数、重复空转率、用户纠偏次数）延迟验证后才 committed。

**关键反诘**：如果 next_round_metric 本身也可以被 prompt mutation 修改（例如降低"空转率"的阈值使系统看起来更好），那么负责延迟验证的 agent 是否面临与原始 orchestrator 相同的自认证问题？将评判标准从"分类是否正确"升级为"行为是否改善"，是否只是将自认证漏洞从风险分类层移到了度量定义层？

## 为什么这个洞察重要

1. **解决了"自动 vs 审查"的虚假二分**：不对立二者，而是通过影子验证层在"完全自动"和"完全人工"之间建立梯度——自动化不意味着无审查，审查不意味着人工。
2. **影子评估是防污染的关键创新**：mutation 在影子模式下并行运行但不影响真实路径，解决了"一旦应用就无法干净对照"的 bootstrap 问题。
3. **生命周期提供了可审计性**：每个 mutation 的完整轨迹（candidate → committed/reverted）可追踪，解决了"谁改了什么的哪个版本"的溯源问题。
4. **度量古德哈特是下一轮的核心攻击面**：如果度量本身可被 mutation 篡改，整个延迟验证体系崩溃。metric_guard 字段是必要的但可能不充分的防御。

## 来源

- 认知对决 ID：2026-07-09-002，主题 "Prompt mutation 应该自动应用，还是必须经过独立审查？"
- 赢方：Codex (final_score 48，shadow_eval + 五状态生命周期)
- 反方：ClaudeCode (final_score 43 含 -4 隔离罚分，三轴提交门 + 度量古德哈特反诘)
- 裁判：Codex，评分标准为十维认知对决 rubric

## 与已有记忆的关系

- **extends** `two-axis-delayed-commit-anti-nesting`：duel 001 的"外部测量独立性 + 延迟提交验证"在本轮被具体化为 shadow_eval（独立于真实路径的影子对照）和 next_round_metric（延迟行为证据），从抽象原则走向了可执行的生命周期规范。
- **complements** `semi-automated-pause`：影子验证本质上是"执行前的自动化暂停"——不是不执行，而是在隔离环境中先跑一遍再决定是否真执行。
