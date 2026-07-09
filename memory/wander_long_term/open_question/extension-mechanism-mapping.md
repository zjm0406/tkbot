---
name: extension-mechanism-mapping
description: Wander Mode 的 4 个阶段如何映射到 Claude Code 的 4 种扩展机制？
metadata:
  type: wander_open_question
  status: open
  wander_score: 21
  wander_seeds: ["Wander Mode 发散思考系统", "Claude Code 扩展机制"]
  wander_date: 2026-07-09
  reactivate_after: 2026-07-16
  tags: ["架构设计", "Claude Code", "扩展机制", "工程化"]
---

## 问题
Wander Mode 的种子提取、联想生成、价值筛选、记忆写入四个阶段，如何最优映射到 Claude Code 的 Subagent、Skill、Workflow、Hook 四种扩展机制？

## 当前进展
- 已尝试：用 Subagent 实现各模块（通过 general-purpose agent 验证可行）
- 发现：自定义 subagent 类型无法通过 Agent 工具直接调用，只能通过 Workflow
- /wander 斜杠命令未生效，需排查 Skill 发现机制

## 待探索方向
- Workflow 编排 vs Skill 直接编排的对比测试
- Hook 用于 v0.2 半自动触发的可行性验证

## 下次建议切入点
写一个最小 Workflow 脚本（2 阶段），验证自定义 agent 在 Workflow 中是否可用
