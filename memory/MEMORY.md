# tkbot 记忆索引

## 引用统计（来自"问题价值概率乘数"，24分）
记录各记忆被后续 wander session 引用的次数。被引用次数高的记忆在种子提取时获得更高权重。

| 记忆 | 引用次数 | 最近引用 |
|------|---------|---------|
| entropy-compression-balance | 1 | 2026-07-09 |
| question-value-probability-multiplier | 1 | 2026-07-09 |
| extension-grammar-not-nouns | 1 | 2026-07-09 |
| emergence-postdictable | 1 | 2026-07-09 |
| extension-mechanism-mapping | 1 | 2026-07-09 |
| socratic-wander | 1 | 2026-07-09 |
| micro-wander-protocol | 0 | — |
| ant-colony-association-reinforcement | 0 | — |
| lorentz-attractor-wander | 0 | — |

## 项目记忆
- [Wander Mode 设计原则](wander-mode-design-principles.md) — 有限运行、低约束生成+高约束筛选

## Wander 洞察 (wander_insight)
- [熵增-压缩平衡](wander_long_term/insight/entropy-compression-balance.md) — Wander Mode 本质是发散（熵增）与收敛（压缩）的动态平衡
- [问题价值概率乘数](wander_long_term/insight/question-value-probability-multiplier.md) — 好问题的价值 = 上下文 × 激发行动的概率乘数
- [扩展机制即语法](wander_long_term/insight/extension-grammar-not-nouns.md) — 好的扩展系统设计的是"语法"而非"名词"
- [涌现事后可解释](wander_long_term/insight/emergence-postdictable.md) — 涌现悖论定义 Wander Mode 价值定位
- [微思考协议](wander_long_term/insight/micro-wander-protocol.md) — Wander Mode 的元应用：每次用户消息触发轻量级意图分析

## Wander 开放问题 (wander_open_question)
- [扩展机制映射](wander_long_term/open_question/extension-mechanism-mapping.md) — 4阶段如何映射4种扩展机制？
- [苏格拉底式追问](wander_long_term/open_question/socratic-wander.md) — 如何让系统成为"追问的机器"？

## Wander 缓冲 (wander_buffer)
- [蚁群联想强化](wander_buffer/ant-colony-association.md) — 从蚁群信息素借鉴"联想强化"算法（17分）
- [洛伦兹吸引子](wander_buffer/lorentz-attractor-wander.md) — 发散思考是否也有"奇异吸引子"结构？（17分）

## 用户偏好
- 中文沟通
- 每次消息触发微思考（短发散意图分析）
