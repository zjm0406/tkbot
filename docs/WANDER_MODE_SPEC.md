# Wander Mode — 面向长期认知进化的发散思考系统

**版本**: v0.2.1
**定位**: 认知操作系统规范，不是脚本说明
**最后更新**: 2026-07-09

---

## 0. 核心定义

**Wander Mode 不追求单次回答的最优，而追求跨轮次认知结构的进化。**

它通过随机扰动制造新连接，通过记忆沉淀保存有价值的中间状态，通过自我检测避免空转，通过 prompt mutation 改变下一轮的思考方式。

### 0.1 评价标准

不是"这轮想得对不对"，而是：

> **这轮有没有让下一轮更有可能产生更好的想法。**

### 0.2 与普通 Agent 的本质区别

```
普通 agent： 完成任务 → 结束
Wander Mode：完成一轮思考 → 评估本轮 → 修改下一轮的思考方式 → 下一轮更好
```

这是代际认知进化（Generational Cognitive Evolution）。

---

## 1. 系统架构

### 1.1 整体数据流（非线性）

```
上一轮 memory
     │
     ▼
┌─────────────┐    ┌──────────────┐    ┌───────────────┐
│ seed-        │───▶│ question-    │───▶│ wander-       │
│ extractor    │    │ generator    │    │ thinker       │
│ 提取种子      │    │ 种子→问题     │    │ 围绕问题发散   │
└─────────────┘    └──────────────┘    └───────┬───────┘
                                               │
                    ┌──────────────┐            │
                    │ dreamer      │◀───────────┤
                    │ 高随机联想     │            │
                    └──────┬───────┘            │
                           │                    │
                           ▼                    │
                    ┌──────────────┐            │
                    │ adversarial- │            │
                    │ debater      │◀───────────┘
                    │ 对抗辩论+综合  │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ self-checker │
                    │ 自我检测+评分  │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ memory-      │
                    │ writer       │
                    │ 分层沉淀记忆   │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ orchestrator │
                    │ 主控+prompt   │
                    │ mutation     │
                    └──────────────┘
                           │
                           ▼
                    下一轮 memory + 改进后的规则
```

### 1.2 8 模块职责

| # | 模块 | 职责 | 工具权限 | 输入 | 输出 |
|---|------|------|---------|------|------|
| 1 | seed-extractor | 从多源提取思考种子 | Read, Glob, Grep | 对话上下文 + memory | 3-5 个种子 |
| 2 | question-generator | 种子→困惑→问题 | 无（纯推理） | 种子列表 | 5-10 个问题 |
| 3 | wander-thinker | 围绕问题发散思考 | 无（纯推理） | 问题 + 思维算子 | 思考链 + 洞察 |
| 4 | dreamer | 高随机跨领域联想 | Read(随机词库) | 当前主题 + 随机词 | 奇怪连接 + 隐喻 |
| 5 | adversarial-debater | 结构化挑战 + 辩证综合 | Read, Grep, Glob | 思考链 + 隐喻 | 挑战 + 综合视角 + 新问题 |
| 6 | self-checker | 检测价值/循环/空转 | Read, Grep | 本轮全部输出 + 辩论结果 | 评分 + 诊断 |
| 7 | memory-writer | 分层写入记忆 | Write, Read, Glob | 筛选后的洞察 | 更新的 memory 文件 |
| 8 | orchestrator | 主控循环 + 规则进化 | 全部 | 用户参数 + memory | 编排结果 + prompt_mutation |

### 1.3 4 种思维模式

| 模式 | 目标 | 随机性 | 审查强度 | 产出 | 触发方式 |
|------|------|--------|---------|------|---------|
| **focus_mode** | 解决问题 | 低 | 高 | 方案、代码、结论 | `--mode focus` |
| **wander_mode** | 发散探索 | 中 | 中 | 新问题、新联系 | `--mode wander`（默认） |
| **dream_mode** | 跳脱联想 | 高 | 低 | 隐喻、类比、怪想法 | `--mode dream` |
| **evolution_mode** | 改进系统 | 中 | 高 | prompt 修改、规则更新 | 每 3 轮自动触发 |

---

## 2. 运行周期

### 2.1 单轮硬性上限

```
┌─────────────────────────┐
│ 参数                    │ 上限          │
├─────────────────────────┤
│ 种子数                  │ 3-5           │
│ 每个种子生成问题数        │ 2-3           │
│ 进入思考的问题数（筛选后） │ 3-5           │
│ 每个问题思考 token        │ 15000         │
│ 单轮总思考 token          │ 70000         │
│ dreamer 联想次数          │ 3-5           │
│ 每个联想必须给出的回连     │ 1 条          │
│ 输出洞察数                │ 3-8           │
│ orchestrator 重试         │ 最多 1 次      │
│ 单轮总 agent 调用         │ ≤ 15          │
└─────────────────────────┘
```

### 2.2 提前终止条件

满足任一，本轮立即终止：
1. 连续 2 个问题思考未产生新概念/新问题/新类比 → **语义枯竭，停止**
2. 上下文使用超过 80% → **打包 memory，停止**
3. self-checker 连续 2 次判定空转 → **切换种子或停止**
4. 前 2 个种子全部低分（总分 < 20） → **当前上下文不适合发散**
5. 检测到语义回环（A→B→C→A） → **标记回环，跳过该方向**

### 2.3 跨轮次冷却

```
┌─────────────────────────┬──────────────┐
│ 条件                    │ 冷却规则       │
├─────────────────────────┤
│ self_improvement 类洞察  │ 冷却 1 轮     │
│ 同一 seed 连续出现       │ 冷却 2 轮     │
│ 新写入的 insight         │ 下一轮 quarantine（不可选为种子）│
│ 同一 open_question 未被推进 │ 3 轮后降级为 buffer │
│ 连续 2 轮无有效洞察      │ 自动触发 evolution_mode │
└─────────────────────────┘
```

---

## 3. 思维算子

wander-thinker 和 dreamer 必须使用以下思维算子，不能只是"分析"：

### 3.1 wander-thinker 算子

| 算子 | 说明 | 示例 prompt |
|------|------|-----------|
| **类比** | 将当前概念映射到另一个领域 | "把 X 类比为 Y 领域的什么？这个类比揭示了什么？" |
| **反转** | 假设核心假设的反面成立 | "如果 X 的反面是对的，会发生什么？" |
| **冲突** | 寻找两个概念之间的张力 | "X 和 Y 在什么条件下矛盾？这个矛盾是真实的还是表面的？" |
| **边界探测** | 追问适用范围的极限 | "X 在什么极端条件下会失效？失效方式揭示什么？" |
| **层次跳跃** | 升降抽象层级 | "如果把 X 看作某个更底层原理的一个实例，那个原理是什么？" |

### 3.2 dreamer 算子

| 算子 | 说明 | 示例 prompt |
|------|------|-----------|
| **远跳** | 随机词 × 当前主题 | "如果 [随机词] 是理解 [当前主题] 的关键隐喻，会怎样？" |
| **失败回放** | 想象一个失败场景并从中学习 | "假设这个想法彻底失败了——最可能的失败原因是什么？这个失败本身揭示了什么？" |
| **梦境联想** | 无视逻辑约束的感官联想 | "如果这个抽象概念有颜色、质感、温度，它会是什么？这暗示了什么？" |
| **功能替换** | 把 A 的功能用 B 的实现方式重做 | "用 [随机词] 的原理重新实现 [当前主题] 的核心功能，会变成什么？" |

### 3.3 关键约束

- dreamer 的每个远跳联想**必须附带一条回连路径**：这个联想如何回到当前问题？
- dreamer 负责发散，self-checker 负责筛选。**不要在同一 agent 内同时发散和审查。**
- 每条联想链输出必须先压缩为**一句话摘要**，再传递给下一模块。

---

## 4. 记忆系统

### 4.1 六层记忆架构

```
memory/
  ├── MEMORY.md                    # 索引 + 引用统计
  ├── wander_insights.md           # 已沉淀的高价值洞察（永久）
  ├── wander_open_questions.md     # 长期困惑列表（优先重新激活）
  ├── wander_buffer.md             # 临时灵感（7 天，自动清理）
  ├── wander_failures.md           # 记录空转、死循环、跑题的模式
  ├── wander_prompt_mutations.md   # prompt/规则变更历史 + 效果
  └── user_goals.md                # 用户长期目标（不每轮遗忘）
```

### 4.2 各层详细规格

#### wander_insights.md

记录已形成的高价值洞察。格式：

```markdown
---
name: <kebab-case-slug>
description: <一句话>
metadata:
  type: wander_insight
  status: resolved
  score: <总分>
  seeds: [种子列表]
  date: YYYY-MM-DD
  citation_count: <被后续引用的次数>
  edge_classification: edge | safe | noise
  actionable: true | false
---

## 核心结论
<一句话>

## 推导路径
<关键推理步骤>

## 可在什么场景复用
<跨场景适用性>
```

#### wander_open_questions.md

记录值得追踪但未解决的问题：

```markdown
---
name: <kebab-case-slug>
description: <问题本身>
metadata:
  type: wander_open_question
  status: open
  score: <总分>
  date: YYYY-MM-DD
  last_reactivated: YYYY-MM-DD
  attempted_directions: [已尝试的方向]
  unexplored_directions: [未探索的方向]
  stuck_rounds: <连续未推进的轮数>
---

## 问题
<清晰的问题陈述>

## 当前进展
<已知的部分答案或相关洞察>

## 与已有洞察的关联
<引用 wander_insights 中的相关条目>

## 下次建议切入点
<给下次思考的具体建议>
```

#### wander_buffer.md

临时灵感，不一定对但可能有用：

```markdown
---
name: <kebab-case-slug>
description: <一句话>
metadata:
  type: wander_buffer
  score: <总分>
  date: YYYY-MM-DD
  expires: YYYY-MM-DD  (date + 7 天)
---

## 核心内容
<简短描述>

## 为什么暂存
<不是低价值，但还需要验证或等待合适的上下文>
```

#### wander_failures.md

记录失败模式，用于避免重复错误：

```markdown
---
name: <kebab-case-slug>
description: <失败模式描述>
metadata:
  type: wander_failure
  failure_type: semantic_loop | empty_run | topic_drift | scoring_bias | other
  date: YYYY-MM-DD
  occurrence_count: <出现次数>
---

## 失败现象
<具体描述>

## 诊断
<为什么发生>

## 已尝试的修复
<做了什么，效果如何>

## 对系统的启示
<这条失败教给我们什么>
```

#### wander_prompt_mutations.md

记录 prompt 和规则的变更历史：

```markdown
---
name: <kebab-case-slug>
description: <变更描述>
metadata:
  type: prompt_mutation
  date: YYYY-MM-DD
  round: <第几轮>
  affected_agent: <修改了哪个 agent>
  verified_effect: positive | neutral | negative | unknown
---

## 发现的问题
<本轮暴露出什么缺陷>

## 做出的修改
<具体改了哪个文件、哪个参数、哪条规则>

## 预期效果
<为什么认为这个修改会改进>

## 实际验证
<下轮跑完后回填>
```

#### user_goals.md

```markdown
---
name: <kebab-case-slug>
description: <目标描述>
metadata:
  type: user_goal
  priority: high | medium | low
  date_added: YYYY-MM-DD
  last_relevant: YYYY-MM-DD
---

## 目标
<清晰的目标描述>

## 相关洞察
<哪些 wander_insight 与此目标有关>
```

### 4.3 记忆激活规则

种子提取时，按以下优先级：

1. **open_questions**（连续 stuck ≥ 3 轮降权）
2. **insights**（citation_count 越高权重越大）
3. **user_goals**（priority=high 权重加成）
4. **buffer**（距离过期越近权重越低）
5. **failures**（仅 evolution_mode 读取）

---

## 5. 评分体系

### 5.1 六维认知进化评分

| 维度 | 1 分 | 3 分 | 5 分 | 说明 |
|------|------|------|------|------|
| **Novelty** 新颖性 | 常识/废话 | 有新意 | 意外独特 | 是否产生了新视角 |
| **Connection** 连接力 | 同领域 | 跨领域 | 远距映射 | 是否建立了非显而易见的连接 |
| **Usefulness** 有用性 | 与项目无关 | 间接相关 | 直接可用 | 是否对项目/用户有实际价值 |
| **Coherence** 回连能力 | 偏离后回不来 | 可回连 | 回连且加深理解 | dream 后能否回到主线 |
| **Question Quality** 问题质量 | 封闭/可搜索 | 开放/需思考 | 开放/可能改变方向 | 产生的问题是否值得继续探索 |
| **Memory Value** 记忆价值 | 一次性 | 短期有用 | 长期反复激活 | 是否值得存入长期记忆 |

满分 30 分。

### 5.2 决策阈值

| 总分 | 决策 | 去向 |
|------|------|------|
| ≥ 22 | long_term | wander_insights 或 wander_open_questions |
| 16-21 | buffer | wander_buffer（7 天） |
| < 16 | discard | 仅记录统计，附加 loss_note |

### 5.3 evolution_mode 额外评分

evolution_mode 还额外评分：

| 维度 | 说明 |
|------|------|
| **Prompt Mutation Quality** | 本轮提出的 prompt 修改是否值得采纳 |
| **Blind Spot Discovery** | 是否发现了系统的新盲点 |
| **Architecture Insight** | 是否产生了架构级的改进想法 |

---

## 6. 反常识机制

每轮 wander_mode 和 dream_mode **强制生成至少 1 个反常识问题**：

```
当前系统最重要的假设是什么？
如果这个假设反过来，会怎样？
```

示例：
- 假设：AI 需要更长上下文才能更好思考 → 反转：也许更短上下文 + 更强记忆压缩更有效
- 假设：随机词是噪声 → 反转：随机词是创造性连接的入口
- 假设：self-checker 能提高质量 → 反转：过早 self-checker 会杀死发散性

这个机制防止系统陷入"顺着说"的惯性。

---

## 6.5. 对抗辩论机制（v0.2.1 新增）

### 6.5.1 核心概念

**正题（Thesis）→ 反题（Antithesis）→ 合题（Synthesis）**

Wander Mode 的思考链和 dreamer 隐喻作为"正题"，adversarial-debater 发起结构化挑战作为"反题"，双方共同产生"合题"——一个同时吸收了双方优点的更深层视角。

### 6.5.2 辩论算子

adversarial-debater 使用 7 种辩论算子：

| 算子 | 操作 | 适用场景 |
|------|------|---------|
| **steel_man**（最强版本） | 重构原主张到最强形态，再针对最强版本挑战 | 原表述不够精确时 |
| **assumption_excavation**（挖掘假设） | 找出隐藏前提，逐一追问不成立会怎样 | 所有非平凡主张 |
| **counterexample**（反例构造） | 构造具体可验证的反例场景 | 普适性主张的试金石 |
| **frame_shift**（框架转换） | 用完全不同的认知框架重新审视 | 原框架内逻辑自洽但可能不是最优 |
| **edge_stress**（边界施压） | 推到极限条件，追问崩溃点 | 标定主张的适用范围 |
| **reversal**（反转） | 认真假设反面成立，推演后果 | 检验主张的可证伪性 |
| **synthesis_bridge**（综合桥接） | 寻找统一正反双方的更深层原则 | 辩论的终极目标 |

### 6.5.3 辩论加权规则

- 在辩论中 `original_resilience >= 4` 的主张 → Memory Value 自动 +1
- 辩论产生的 synthesis（quality=strong）→ 作为独立 insight 候选参与评分
- 辩论产生的新问题 → 优先进入 open_questions 候选
- `--no-debate` 参数可跳过此阶段（快速模式）

### 6.5.4 辩论质量指标

好辩论 ≠ 赢辩论。高价值辩论的特征：
1. 至少 1 个 `original_resilience >= 4` 的评估（原主张经受住了考验）
2. 至少 1 个 `did_reveal_new_insight = true`（挑战产生了建设性价值）
3. synthesis_quality 为 strong 或 moderate（找到了综合视角）
4. 辩论产出至少 1 个新的 open_question

---

## 7. Prompt Mutation 机制

### 7.1 触发条件

- evolution_mode：每 3 轮自动触发
- 异常触发：连续 2 轮无有效洞察
- 手动触发：`--mode evolution`

### 7.2 Mutation 流程

```
1. 收集最近 3 轮的 self-checker 报告
2. 识别重复出现的失败模式
3. 诊断根因（是 agent prompt 问题？阈值问题？流程问题？）
4. 生成 mutation 建议
5. 评估 mutation 的风险等级
6. 低风险 mutation → 自动应用
7. 高风险 mutation → 生成 proposal，等用户确认
```

### 7.3 Mutation 类型与风险

| 类型 | 示例 | 风险 | 权限 |
|------|------|------|------|
| 参数调整 | 修改评分阈值 22→20 | 低 | 自动 |
| prompt 微调 | 给 dreamer 添加回连约束 | 低 | 自动 |
| 新增规则 | 添加新的思维算子 | 中 | proposal |
| 架构变更 | 新增/删除模块 | 高 | proposal |
| 核心文件修改 | 修改 CLAUDE.md 核心原则 | critical | 禁止自动 |

---

## 8. 防死循环机制

### 8.1 四种循环类型与对策

| 循环类型 | 现象 | 对策 |
|---------|------|------|
| **语义回环** | A→B→C→A | wander-thinker 提示词约束 + self-checker 检测 + 标记跳过 |
| **评分死循环** | 反复打分不决 | self-checker 只执行一次，最多重试 1 次 |
| **跨轮重复** | 不同轮对同一主题重复思考 | memory-writer 写前去重 + citation_count 追踪 |
| **无限发散** | 联想越跑越远 | 硬性 3 层上限 + token 预算硬限制 |

### 8.2 空转检测

self-checker 判定空转的条件（满足任一）：
- 本轮输出与上一轮输出相似度 > 70%（主题层面）
- 未产生任何新的 open_question
- 未产生任何新的 insight
- 所有联想链的 chain_summary 都是已有记忆的变体

连续 2 轮空转 → 自动触发 evolution_mode。

---

## 9. 运行记录

### 9.1 runs/ 目录

每一轮完整运行保存一个记录文件：

```
runs/
  YYYY-MM-DD-run-NNN.md
```

### 9.2 记录格式

```markdown
# Run NNN — 2026-07-09 14:30

## 元数据
- 模式：wander_mode
- 种子：[列表]
- 生成问题数：X
- 产出洞察数：Y
- 写入记忆数：Z
- token 消耗：N
- self-checker 评分：[分数]
- 是否提前终止：是/否（原因）

## 种子提取
[来源和选择理由]

## 问题生成
[本轮生成的问题列表]

## 思考过程摘要
[每个问题的核心思考]

## 洞察产出
[高价值洞察列表 + 评分]

## 反常识问题
[强制生成的反常识问题]

## 失败记录
[本轮出现的问题、回环、空转]

## Prompt Mutation 建议
[如果有]

## 下一轮建议
[给 orchestrator 的下一轮建议]
```

---

## 10. 安全架构

### 10.1 五级风险分类

| 级别 | 范围 | 权限 |
|------|------|------|
| **low** | memory/buffer, runs/, logs | 自动写入 |
| **medium** | memory 核心文件, MEMORY.md, docs | 自动生成，diff 可见 |
| **high** | agent 定义, workflow, SKILL.md | 只能 proposal |
| **critical** | CLAUDE.md 核心原则, settings, API key | 禁止自动修改 |

### 10.2 独立审查原则

- **value-filter 判价值，safety-auditor 判安全** — 二者独立
- 所有 insight 写入前必须通过 safety-auditor
- self_improvement 类 insight 默认 quarantine 1 轮

---

## 11. v0.2 实现清单

### Phase 1：核心规范（当前）
- [x] WANDER_MODE_SPEC.md（本文档）

### Phase 2：Agent 体系重构
- [ ] seed-extractor.md（更新：纳入 memory 六层结构）
- [ ] question-generator.md（新建）
- [ ] wander-thinker.md（从 wander-generator 重构）
- [ ] dreamer.md（新建，合并 associative-resonator）
- [ ] self-checker.md（新建，合并 value-filter + 空转检测）
- [ ] memory-writer.md（更新：支持六层记忆）
- [ ] orchestrator.md（新建：主控规范）

### Phase 3：Workflow 实现
- [ ] wander-mode.js（重构：匹配新架构）
- [ ] 实际跑通第一轮

### Phase 4：记忆系统
- [ ] 按六层结构重组 memory/ 目录
- [ ] 迁移已有记忆到新结构

### Phase 5：验证
- [ ] 跑 3 轮，检查代际进化效果
- [ ] 验证 prompt mutation 机制

---

## 附录 A：思维算子参考

完整的算子列表在 `data/thinking_operators.json`。

## 附录 B：术语表

| 术语 | 定义 |
|------|------|
| **代际认知进化** | 每轮思考不仅产出洞察，还改进下一轮的思考方式 |
| **种子** | 触发发散思考的起点词/概念 |
| **联想链** | 从种子出发的三层语义扩散路径 |
| **回连** | dreamer 远跳后，将奇怪联想与原始问题重新连接 |
| **空转** | 思考未产生新概念、新问题或新洞察 |
| **语义回环** | 联想链在几个概念间打转 |
| **Prompt Mutation** | 根据本轮经验修改下一轮的 agent 提示词或规则 |
| **Quarantine** | 新 insight 的隔离期，期间不可被选为种子 |
| **反常识机制** | 每轮强制追问核心假设的反面 |
