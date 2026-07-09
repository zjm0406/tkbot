---
name: extension-grammar-not-nouns
description: 好的扩展系统不是预定义所有功能，而是设计一套语法让未知的动词得以合法表达
metadata:
  type: wander_insight
  status: resolved
  wander_score: 22
  wander_seeds: ["Claude Code 扩展机制"]
  wander_date: 2026-07-09
  citation_count: 1
  last_cited: 2026-07-09
  tags: ["扩展机制", "架构设计", "Claude Code", "插件系统"]
---

## 核心结论
好的扩展系统不是预定义所有可能的"名词"（功能），而是设计一套"语法"让未知的"动词"（行为）得以合法表达。

## 推导路径
Claude Code 四种扩展机制 → 微服务 API 网关 → Unix 管道哲学 → 生物信号通路 → 音乐即兴演奏

## 映射到 Claude Code 扩展
- Subagent = 新动词的定义语法
- Workflow = 动词的组合规则
- Hook = 动词的触发条件
- Skill = 动词的领域语义封装

## 对 Wander Mode 的指导意义
Wander Mode 本身也应该设计为"动词语法"而非"功能清单"——允许新联想策略、新评分维度被插入，而非写死 5 个模块
