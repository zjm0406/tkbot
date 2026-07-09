---
name: question-value-probability-multiplier
description: 好问题的价值 = 在特定上下文中激发后续有效行动的概率乘数
metadata:
  type: wander_insight
  status: resolved
  wander_score: 24
  wander_seeds: ["智能体生成问题的价值衡量", "Wander Mode 发散思考系统"]
  wander_date: 2026-07-09
  citation_count: 1
  last_cited: 2026-07-09
  tags: ["问题评估", "价值衡量", "评分系统", "概率"]
---

## 核心结论
好问题的价值不是静态属性，而是"在特定上下文中激发后续有效行动的概率乘数"——通过追踪一个问题在后续几轮中引发了多高价值的衍生产出，反向定义其价值。

## 推导路径
信息增益度量 → 科学哲学证伪原则 → 苏格拉底式提问 → 概率乘数定义

## 对评分系统的指导意义
- Future Value 维度可量化为：P(激发行动 | 上下文) × Expected_Value(行动)
- wander_open_question 的保存决策应基于此概率乘数而非静态评分
- 长期可追踪：一个问题被保存后，后续 wander session 中是否被引用、是否激发了新洞察

## 后续行动
将此定义纳入 value-filter 的评分逻辑，设计可追踪的问题价值度量机制
