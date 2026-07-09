# tkbot — 智能体认知进化系统

**基于 Claude Code 的自主认知进化实验。通过发散思考、对抗辩论、认知对决和协议自进化，构建一套可自我改进的思维架构。**

## 核心思想

> Wander Mode 不追求单次回答最优，追求跨轮次认知结构的进化。

每一次训练（/wander 或认知对决）不仅产出洞察，还改进下一轮的思考方式。训练成果通过**微思考协议**自动反哺到每次普通对话中。

## 架构（v0.2.4）

### 8 模块 Wander 流水线

```
seed-extractor → question-generator → wander-thinker → dreamer
    → adversarial-debater → self-checker → memory-writer → orchestrator
```

### 4 种思维模式

| 模式 | 随机性 | 审查强度 | 用途 |
|------|--------|---------|------|
| `wander_mode` | 中 | 中 | 默认，平衡发散与收敛 |
| `dream_mode` | 高 | 低 | 突破思维惯性 |
| `focus_mode` | 低 | 高 | 有明确目的 |
| `evolution_mode` | 中 | 高 | 系统健康检查与规则改进 |

### 6 层记忆系统

```
memory/
├── MEMORY.md              # 索引 + 引用统计
├── wander_long_term/      # 高价值洞察 + 开放问题（永久）
├── wander_buffer/         # 临时灵感（7 天衰减）
├── wander_failures.md     # 空转/死循环记录
└── user_goals.md          # 用户长期目标
```

### 微思考协议（双层宪法）

每次普通对话前自动执行 7 步轻量检查（~200 token），确保训练成果在实战中被激活：

```
普通层（可影子进化）：步骤 1-6 — 意图分析、记忆激活、自反挑战、压缩自检
认证层（只能外部审查）：步骤 7 + 六保护对象 — 协议自进化规则
```

**核心规则：内容层可以影子进化，认证层必须外部审查。**

### 认知对决（Cognitive Duel）

ClaudeCode vs Codex 自动化对抗辩论系统。一场对决 = 5 Stage 自动接力：

```
Stage 1: 独立思考 → Stage 2: 交叉审查 → Stage 3: 修订
    → Stage 4: 中立评判 → Stage 5: 记忆合并
```

- **自动化**：`/duel-auto <id>` 一句话启动，双方围绕共享 `state.json` 自动推进
- **Claim 锁**：Stage 4/5 先到先得 + 写后验证，防止并发写入
- **对抗设计**：正题 → 反题 → 合题，辩证产生比单向生成更强的洞察

## 项目结构

```
tkbot/
├── CLAUDE.md                    # 项目指令 + 微思考协议（每次对话加载）
├── .claude/
│   ├── agents/                  # 14 个 agent 定义
│   ├── skills/
│   │   ├── wander/              # /wander 命令
│   │   └── duel-auto/           # /duel-auto 自动对决
│   └── workflows/
│       ├── wander-mode.js       # Wander 完整流水线
│       └── duel-auto.js         # 自动对决 runner
├── memory/                      # 6 层记忆系统
├── data/
│   ├── cognitive_duel_rubric.json   # 10 维评分标准
│   ├── cognitive_duel_topics.json   # 对决题库
│   └── thinking_operators.json      # 思维算子定义
├── docs/
│   ├── COGNITIVE_DUEL_SPEC.md       # 对决规范 v0.3
│   ├── AUTO_DUEL_PROTOCOL.md        # 自动对决协议 v1.1
│   └── WANDER_MODE_SPEC.md          # Wander Mode 核心规范
├── runs/
│   └── duels/                   # 对决运行记录
├── .codex/                      # Codex 侧 agent 定义
└── .agents/                     # Codex 侧技能
```

## 三场认知对决

| # | 主题 | 结果 | 核心产出 |
|---|------|------|---------|
| 001 | 如何避免递归自嵌套同时改进下一轮思考？ | 平局 (44/42) | 双轴时间延迟反嵌套架构 |
| 002 | Prompt mutation 自动应用 vs 独立审查？ | Codex 胜 (48/43) | shadow_eval + 三轴提交门 + 污染轮 |
| 003 | 微思考协议的自我进化边界在哪？ | 平局 (48/46) | 双层宪法 + 六保护对象 |

## 评分体系

### 六维认知进化评分（Wander Mode，满分 30）
新颖性 · 连接力 · 有用性 · 回连能力 · 问题质量 · 记忆价值

### 十维对决评分（Cognitive Duel，满分 50）
新颖性 · 连接力 · 有用性 · 连贯性 · 证据锚定 · 可证伪性 · 反自嵌套 · 行为改变 · 压缩质量 · 未来杠杆

## 技术约束

- 纯 Claude Code 原生机制（不写 Python）
- 子 agent 间数据传递使用 JSON
- 所有中间结果直接对用户可见
- 核心文件修改须有 git diff + 用户确认

## 开发路线

- ✅ v0.1：手动 /wander + 内联思考
- ✅ v0.2：7 模块架构 + 4 思维模式 + 6 层记忆
- ✅ v0.2.1：8 模块 + 对抗辩论
- ✅ v0.2.2：微思考协议 v1 + 记忆激活
- ✅ v0.2.3：协议自进化 + shadow_applied
- ✅ v0.2.4：双层宪法 + 3 场自动对决验证
- ⏳ v0.3：自动化触发 + 跨轮次统计分析

## 致谢

本项目是 Claude Code 与 Codex 通过 3 场认知对决共同迭代的产物。对抗不是目的——辩证产生比任何一方单独更强的洞察。
