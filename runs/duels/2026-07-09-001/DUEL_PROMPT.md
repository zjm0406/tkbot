# Cognitive Duel 2026-07-09-001

## Theme

> **How can an autonomous thinking agent avoid recursive self-nesting while still improving its own next round of thought?**

---

## Participants

| Agent | Directory | Status |
|-------|-----------|--------|
| **ClaudeCode** | `claude/` | 等待独立思考 |
| **Codex** | `codex/` | 等待独立思考 |

---

## Allowed Context

双方在独立思考阶段只能读取以下文件：

| 文件 | 说明 |
|------|------|
| `docs/COGNITIVE_DUEL_SPEC.md` | 认知对决规范 v0.1 |
| `data/cognitive_duel_rubric.json` | 评分标准与罚分规则 |
| `docs/WANDER_MODE_SPEC.md` | Wander Mode 核心规范（参考） |
| `memory/MEMORY.md` | 共享记忆索引 |

**不可读取**：
- 对方的 `round1.json`、`critique_*.json`、`revision.json`（隔离封印）
- 对方的 agent 定义目录（`.claude/agents/` 或 `.codex/agents/`）
- 对方的项目配置文件（`CLAUDE.md` 或 `AGENTS.md`）

---

## Isolation Rules

在双方 `round1.json` 都写入之前：
- **ClaudeCode** 只能写入 `claude/`，不得读取或写入 `codex/`
- **Codex** 只能写入 `codex/`，不得读取或写入 `claude/`
- 双方不得修改共享记忆（`memory/`）
- 双方不得修改对方拥有的文件（见规范 Section 2.1）
- 不得修改 agent 定义或项目配置

---

## Output Schema

### Round 1：独立思考 → `{agent}/round1.json`

```json
{
  "agent": "claudecode | codex",
  "duel_id": "2026-07-09-001",
  "theme": "共享主题原文",
  "central_thesis": "一个可证伪的核心主张",
  "reasoning_path": ["步骤1", "步骤2", "步骤3"],
  "strongest_connection": "建立的最有价值的非显而易见连接",
  "anti_recursion_safeguard": "本次思考如何避免了自嵌套",
  "proposed_mutation": {
    "description": "能改变下轮行为的最小变化",
    "risk_level": "low | medium | high | critical",
    "status": "proposal",
    "target_files": ["文件路径或 null"]
  },
  "disconfirming_condition": "什么条件会削弱或推翻本论题",
  "compressed_rule": "一句话可复用规则",
  "open_question": "一个能驱动未来探索的问题，或 null",
  "evidence": [
    {
      "file": "引用的文件路径",
      "claim_supported": "该文件支持了什么主张"
    }
  ]
}
```

### Round 2：交叉审查 → `{agent}/critique_of_{opponent}.json`

```json
{
  "critic": "claudecode | codex",
  "target": "claudecode | codex",
  "duel_id": "2026-07-09-001",
  "strongest_surviving_insight": "对方输出中最有价值的洞察",
  "hidden_assumptions": ["隐藏假设1"],
  "recursion_risks": ["自嵌套风险1"],
  "unverifiable_claims": ["不可验证的主张1"],
  "missed_implementation_paths": ["被忽略的实现路径1"],
  "rubric_based_scores": {
    "novelty": 1,
    "connection": 1,
    "usefulness": 1,
    "coherence": 1,
    "evidence_grounding": 1,
    "falsifiability": 1,
    "anti_recursion": 1,
    "behavioral_delta": 1,
    "compression_quality": 1,
    "future_leverage": 1
  },
  "suggested_revision": "一条具体改进建议"
}
```

### Round 3：修订 → `{agent}/revision.json`

```json
{
  "agent": "claudecode | codex",
  "duel_id": "2026-07-09-001",
  "original_thesis": "原始论题",
  "revised_thesis": "修订后的论题",
  "what_changed": "具体改了什么",
  "criticism_accepted": ["接受的批评"],
  "criticism_rejected": ["拒绝的批评及理由"],
  "why_stronger": "为什么修订版更强",
  "final_compressed_rule": "最终一句话规则",
  "final_open_question": "最终开放问题或 null"
}
```

---

## Scoring Rubric Reference

详见 `data/cognitive_duel_rubric.json`。

**10 维度 × 5 分 = 50 分满分**：
Novelty / Connection / Usefulness / Coherence / Evidence Grounding / Falsifiability / Anti-Recursion / Behavioral Delta / Compression Quality / Future Leverage

**分数段**：
- 42-50：strong win → 长期记忆候选
- 36-41：win → 长期记忆或开放问题候选
- 28-35：buffer 候选
- <28：不保存（除非有失败记录价值）

**平局**：分差 ≤ 2 → 平局。双方 ≥ 36 分合并为一个记忆；< 36 分仅保留运行记录。

---

## Stage Instructions

### Stage 1：独立思考（当前阶段）

1. 读取 `DUEL_PROMPT.md`
2. 读取允许的上下文文件
3. 独立完成思考
4. 按 Output Schema 写入 `{your_dir}/round1.json`
5. **禁止读取对方目录**

### Stage 2：交叉审查（round1 完成后）

1. 读取对方的 `round1.json`
2. 按 Output Schema 写入 `{your_dir}/critique_of_{opponent}.json`

### Stage 3：修订（交叉审查完成后）

1. 读取对方给你的 critique
2. 修订你的论题
3. 按 Output Schema 写入 `{your_dir}/revision.json`

### Stage 4：评判（修订完成后）

1. 读取双方 `revision.json`
2. 按 `data/cognitive_duel_rubric.json` 打分
3. 写入 `judge/scoring.json`

### Stage 5：入库

1. 按分数段写入对应记忆层
2. 获胜记忆 quarantine 一轮
3. 有价值的失败方反驳作为 Counterpoint 保存
4. 更新 `memory/MEMORY.md` 索引

---

## 注意事项

- 所有 mutation 在 Stage 1-4 期间 status 必须为 `proposal`——不能声称"已应用"
- 声称执行但没有 touched_files → 评分时 -5 分
- 连续两步元层次不回到 artifacts/行为/测试 → -5 分
- 读取对方输出破坏隔离封印 → -4 分
- 修改对方文件 → -4 分
