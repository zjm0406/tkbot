# tkbot — Wander Mode 项目

## 项目定位
基于 Claude Code 的智能体模拟发散思考系统。
当前版本：v0.1（Claude Code 原型，手动触发）。

## 核心原则
- 生成时要发散，保存时要克制
- 一次触发 = 一次有限思考回合，自动停止
- v0.1 只输出保存建议，不自动写入记忆
- 不追求模拟人类意识，追求功能性认知行为

## 项目结构
- `.claude/agents/` — 子代理（seed-extractor, wander-generator, value-filter）
- `.claude/skills/wander/` — /wander 命令
- `memory/` — 记忆存储
- `data/` — 静态数据（随机词库）
- `remind.md` — 完整设计文档

## 开发阶段
- v0.1：手动 /wander + 保存建议（当前）
- v0.2：用户确认后写入记忆
- v0.3：远距组合增强
- v0.5：独立 runtime

## 技术约束
- v0.1 纯 Claude Code 原生机制，不写 Python
- 子代理间数据传递使用 JSON
- 不绑定单一模型后端
