---
name: immune-system-dynamic-routing
description: 最优映射是动态路由——同一阶段在不同认知状态下激活不同扩展机制，如免疫系统动态招募效应细胞
metadata:
  type: wander_insight
  status: resolved
  wander_score: 23
  wander_seeds: ["扩展机制映射"]
  wander_date: 2026-07-09
  citation_count: 0
  tags: ["扩展机制", "动态路由", "免疫系统", "架构设计", "可实现"]
---

## 核心洞察
最优映射不是静态一对一绑定，而是动态的、上下文敏感的路由问题。同一阶段在不同认知状态下应激活不同的扩展机制——如同免疫系统根据病原特征动态招募效应细胞，而非预设固定的细胞分工表。

## 可操作化（actionability最高，5分）
可直接设计一个"阶段→机制"的动态映射表：
- 种子提取在高不确定性时→随机词库优先（熵增偏向）
- 价值筛选在高噪声时→更严格的阈值（压缩偏向）
- 苏格拉底深挖在洞察coherence高时→更深的前提检验

## 对 Wander Mode 的直接应用
将当前"一刀切"的 6 阶段固定流程改为上下文敏感的动态路由——这是 v0.3 的核心架构改进。
