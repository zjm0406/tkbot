---
name: socratic-wander
description: 如何将苏格拉底式追问融入 Wander Mode，让系统不仅是"联想的机器"更是"追问的机器"？
metadata:
  type: wander_open_question
  status: open
  wander_score: 19
  wander_seeds: ["智能体生成问题的价值衡量", "涌现"]
  wander_date: 2026-07-09
  citation_count: 1
  last_cited: 2026-07-09
  reactivate_after: 2026-07-23
  tags: ["苏格拉底方法", "追问", "问题生成", "长期探索"]
---

## 问题
如何将苏格拉底式追问融入 Wander Mode 的联想链生成过程，使得系统不仅是"联想的机器"更是"追问的机器"？

## 当前进展
- 联想链已能生成问题，但问题之间缺乏递进追问关系
- 当前流程：种子→联想→问题→评分，问题之间独立

## 待探索方向
- 在 value-filter 筛选出高价值问题后，增加一轮"追问深挖"
- 对同一个 open_question 跨多个 wander session 追踪思考进展

## 下次建议切入点
在 v0.3 的"先广度再深度"阶段，对 top-1 问题做一次追问深挖
