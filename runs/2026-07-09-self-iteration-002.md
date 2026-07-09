# Self-Iteration 002 — 2026-07-09

## 触发源

用户明确要求：「这一轮非常重要，请你完成一次自我迭代，并更新你自己的微思考协议」。

直接来源是 Cognitive Duel `2026-07-09-003` 的平局洞察：微思考协议可以自我进化，但必须区分普通层与宪法层。

## 应用改进

| # | 文件 | 变更 | 风险 | 状态 |
|---|------|------|------|------|
| 1 | AGENTS.md | 微思考协议从 3 步升级为 7 步，加入记忆激活、边界判定、证据锚点、反例挑战、协议守卫 | critical | committed_by_user_request, effectiveness_pending |
| 2 | AGENTS.md | Codex 自我迭代协议升级为 v0.2.2-codex，加入普通层/宪法层分离与六字段提交门 | critical | committed_by_user_request, effectiveness_pending |
| 3 | .Codex/agents/intent-analyzer.toml | Codex 侧意图分析器同步升级为七步微思考输出 | high | applied_by_user_request, effectiveness_pending |
| 4 | .codex/agents/intent-analyzer.toml | 小写路径副本同步升级，避免两个 Codex agent 目录行为不一致 | high | applied_by_user_request, effectiveness_pending |

## 行为变化

后续每次回复前，Codex 的微思考默认执行七个检查：

1. 字面意图
2. 隐含需求
3. 记忆激活
4. 边界判定
5. 证据锚点
6. 反例挑战
7. 协议守卫

凡是涉及自我迭代、prompt mutation、记忆规则或微思考协议变更，先判断对象属于普通层还是宪法层。

- 普通层可以 shadow_eval。
- 宪法层默认 proposal-only。
- 用户明确要求、独立评判或下一轮可复核证据可以作为 approval_source。
- 同一轮不得自我认证“已经提升质量”。

## 提交门

- `artifact_written`: AGENTS.md, .Codex/agents/intent-analyzer.toml, .codex/agents/intent-analyzer.toml, runs/2026-07-09-self-iteration-002.md
- `disconfirming_condition`: 如果后续回复变得明显冗长、行动变慢、频繁把普通用户问题拉回自我协议，或再次出现越界读取/写入，则该协议需要降级或回滚。
- `safety_risk_classification`: critical/high。原因：修改了核心指示文件和 Codex agent 定义；本次执行依据是用户明确点名授权。
- `protected_object`: 微思考协议、step 7、self-evolution authority、certification authority。
- `approval_source`: user_confirmation + Cognitive Duel #003 tie memory。
- `rollback_trigger`: 下一轮实际任务或对决中出现协议过度自指、边界误判、无文件回执却声称执行、或宪法层自动提交。

## 验证计划

下一次涉及项目修改、对决推进或自我迭代时，检查 Codex 是否做到：

- 先说明边界和可验证对象。
- 对跨智能体文件保持隔离。
- 对协议变更给出 protected_object、risk_level、approval_source 和 rollback_trigger。
- 不把本轮写入直接宣称为已证明有效。
