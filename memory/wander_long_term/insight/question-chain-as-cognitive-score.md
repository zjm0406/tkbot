---
name: question-chain-as-cognitive-score
description: 用户的追问链不是需要"提取"的数据，而是"认知乐谱"——同一个追问模式在不同上下文中产生不同洞察，应实时影响系统行为
metadata:
  type: wander_insight
  status: resolved
  score: 27
  seeds: [追问链, 代际认知进化]
  date: 2026-07-09
  citation_count: 0
  edge_classification: edge
  actionable: true
  tags: [追问链, 对话模式, 认知乐谱, 实时适应]
---

## 核心结论
**用户的追问链不是"数据"，而是"认知乐谱"——同样的追问模式在不同上下文中会产生不同的洞察。** 系统不应该"提取"这个模式然后固化它，而应该"识别"这个模式并实时调整自己的回应深度。dialogue-pattern-extractor 的输出不应该是静态的 memory 文件，而应该是下一轮 orchestrator 的实时参数。

## 推导路径
对话记录 → 追问检测 → 学徒制学习（徒弟观察师傅怎么问问题）→ 音乐中的主题变奏（一个主题在不同调性、节奏中变形但保留核心）→ 追问链应该直接参与系统实时行为调整，而不是只被记录下来事后分析。

## 反常识版本
假设"追问链需要被提取和分析"→ 反转"追问链应该直接参与系统实时行为调整"→ dialogue-pattern-extractor 不只是记录者，它应该直接影响 orchestrator 在当前对话中的行为。

## 可在什么场景复用
- 任何需要理解用户深层意图的对话系统
- agent 的实时行为调整机制
- 教育场景中追踪学生的思维发展轨迹
- 产品设计中理解用户需求演变路径
