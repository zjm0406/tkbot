# 智能体“模拟发散思考”功能设计提示文档 v0.1

## 0. 项目名称

**Idle Divergent Thinking / Wander Mode / 空闲发散思考模式**

本功能目标不是让智能体拥有真正的人类意识，而是模拟一种**功能性思考行为**：当用户没有明确输入任务时，智能体可以根据最近对话、长期记忆、随机触发词和未解决问题，进行低约束联想，生成潜在有价值的问题、洞察或后续行动，并把其中最有价值的部分保存到记忆系统中。

核心原则：

> **生成时要发散，保存时要克制。**

也就是说，智能体可以在内部生成较多联想，但最终只保存经过筛选的关键想法、问题和结果，而不是保存冗长的完整思考流。

---

## 1. 用户原始设计需求

用户希望给自己的智能体增加一种“模拟思考功能”，最初从最简单的功能开始：

1. 智能体在无明确提示状态下，也能进行某种“空闲思考”。
2. 思考来源可以是：

   * 随机想到的内容；
   * 之前对话中提到的关键词；
   * 用户长期关注的问题；
   * 最近没有解决完的任务；
   * 某些偶然触发词。
3. 思考方式先从**发散思考模拟**开始。
4. 功能类似人在某个下午“胡思乱想”：

   * 思维跳脱；
   * 从一个词跳到另一个词；
   * 产生一些奇怪但有价值的联系；
   * 最后留下几个值得继续研究的问题。
5. 智能体需要保存：

   * 关键思考内容；
   * 思考结果；
   * 有价值的问题；
   * 后续可执行行动。
6. 第一版不追求完整“人类思维模拟”，而是追求一个最小可运行、可调试、可扩展的功能。

---

## 2. 理论依据：为什么可以这样设计

### 2.1 自发思维与走神

认知科学中，和本功能最接近的概念是 **mind-wandering / spontaneous thought**，即“走神”或“自发思维”。Christoff 等人在 2016 年提出，mind-wandering 不应只被看成“任务无关思维”，还应理解为一种随时间动态变化的自发思维过程，并且其变化受到不同程度的认知约束影响。这个思想可以转化为智能体设计中的“约束强弱控制”：约束越低，联想越自由；约束越高，输出越接近任务求解。

Baird 等人在 2012 年的研究中发现，进行简单外部任务、允许大脑走神，可能促进创造性问题解决。这可以支持本功能中的“空闲发散思考”设定：智能体不一定只在用户明确提问时才产生价值，在低压力、低约束状态下也可能生成值得保存的问题。

Smallwood 与 Schooler 的综述指出，mind wandering 是心理学中一个重要研究对象，它涉及注意从当前任务转向内部生成内容，其功能效果取决于具体内容、情境和监控方式。这个观点提示我们：智能体的发散思考不能只是随机输出，还需要后续的监控、筛选和总结。

---

### 2.2 联想扩散与创造性

Mednick 1962 年的经典论文 *The Associative Basis of the Creative Process* 把创造性思维解释为联想元素之间的新组合，并强调越是远距的元素，如果能形成有用组合，就越可能体现创造性。这个思想非常适合转化为智能体的“远距联想”模块：从两个表面无关的词出发，尝试建立新的关系。

Collins 与 Loftus 1975 年的语义加工扩散激活理论把语义记忆看作一个网络，概念之间可以通过关联路径激活彼此。这个模型可以为智能体的“联想链生成”提供启发：从一个关键词出发，向直接相关、间接相关、远距相关三个层次扩散。

Olson 等人在 2021 年提出的 Divergent Association Task 通过让参与者生成彼此尽可能无关的词，并测量这些词之间的语义距离来评估发散思维。这个方法可以转化为智能体评估指标：发散思考结果不仅要相关，还可以测量“语义距离”和“新颖性”。

---

### 2.3 发散之后必须收敛

创造性并不是单纯随机。更合理的过程是：

```text
低约束生成 → 远距联想 → 问题生成 → 价值筛选 → 记忆压缩
```

Beaty 等人的研究表明，创造性认知涉及默认网络、执行控制网络和显著性网络之间的动态互动，这说明“创意”不是单纯放飞，而是需要生成、评估和选择之间的协调。

因此，智能体设计中必须同时有两个阶段：

1. **发散阶段**：尽量多地产生联系、问题、可能方向。
2. **收敛阶段**：筛掉无意义内容，只保存高价值结果。

---

## 3. 功能定位

### 3.1 该功能是什么

这是一个智能体的后台/半后台认知模块，用于模拟人类的低约束发散思考。它不直接回答用户问题，而是在用户对话间隙或用户主动触发时，对已有信息进行联想、重组和问题生成。

### 3.2 该功能不是什么

它不是：

1. 不是真正的人类意识。
2. 不是完整 chain-of-thought 存储系统。
3. 不是任务求解器。
4. 不是自动写日记。
5. 不是无限制随机文本生成器。
6. 不是用户隐私信息的自动收集器。

### 3.3 最适合的第一版目标

第一版只实现：

```text
输入：最近对话关键词 + 长期记忆关键词 + 随机触发词
处理：自由联想 + 远距组合 + 问题生成 + 价值评分
输出：3 条联想链 + 3 个问题 + 1 个关键洞察 + 1 个后续行动
保存：只保存评分最高的 1~2 条
```

---

## 4. 总体架构

推荐第一版分成 5 个模块：

```text
1. Seed Extractor / 种子提取器
2. Wander Generator / 发散思考生成器
3. Association Expander / 联想扩散器
4. Value Filter / 价值筛选器
5. Thought Memory Writer / 思考记忆写入器
```

整体流程：

```text
最近对话 / 长期记忆 / 随机词 / 未解决问题
        ↓
种子提取
        ↓
低约束联想
        ↓
远距组合
        ↓
问题生成
        ↓
价值评分
        ↓
摘要压缩
        ↓
写入记忆
```

---

## 5. 模块 1：Seed Extractor / 种子提取器

### 5.1 功能

从不同来源抽取本次发散思考的触发点。

### 5.2 种子来源

建议使用五类来源：

```json
{
  "recent_keywords": "最近 5~10 轮对话中的关键词",
  "memory_keywords": "长期记忆中的用户兴趣、项目、偏好",
  "random_words": "随机词库或外部触发词",
  "unresolved_questions": "之前没有解决完的问题",
  "user_goals": "用户长期目标或近期任务"
}
```

### 5.3 种子选择规则

每次发散思考不要用太多种子。第一版建议：

```text
recent_keywords: 2 个
memory_keywords: 1 个
random_words: 1 个
unresolved_questions: 0~1 个
```

最终进入思考的种子数量控制在 **3~5 个**。

### 5.4 种子示例

如果最近对话是：

```text
大模型架构、Transformer、RNN/LSTM、发散思考、智能体记忆、论文梳理
```

则种子可以是：

```json
{
  "selected_seeds": [
    "大模型架构",
    "发散思考",
    "智能体记忆",
    "课堂笔记"
  ]
}
```

---

## 6. 模块 2：Wander Generator / 发散思考生成器

### 6.1 功能

对种子进行低约束联想，不直接解决问题，而是生成可能有价值的方向。

### 6.2 三层联想结构

每个种子生成三层联想：

```text
第一层：直接相关
第二层：间接相关
第三层：远距但仍可能有意义的相关
```

示例：

```text
种子：Transformer
第一层：注意力机制、序列建模、并行训练
第二层：信息筛选、认知注意、学习重点
第三层：人类读书时的注意力分配、课堂笔记策略、智能体记忆筛选
```

### 6.3 设计依据

这对应语义网络中的“扩散激活”思想：一个概念可以激活与它相邻的概念，并继续向外扩散。Collins 与 Loftus 的经典模型为这种联想链设计提供了理论启发。

---

## 7. 模块 3：Association Expander / 远距组合器

### 7.1 功能

把两个看似不相关的种子强行放在一起，尝试生成新的问题。

### 7.2 组合方式

可以使用以下模板：

```text
A 和 B 有什么隐藏共同结构？
A 的方法能不能迁移到 B？
A 的失败点是否对应 B 的机会？
如果把 A 当作 B 的隐喻，会得到什么新问题？
A 和 B 是否都涉及同一个更抽象的问题？
```

### 7.3 示例

输入：

```text
A = Transformer
B = 人下午胡思乱想
```

可能输出：

```text
Transformer 的注意力机制是在大量 token 中选择相关信息；
人的发散思考是在大量记忆和感觉中跳转到某些相关片段；
因此可以设计一种“注意力式发散思考”：先低约束扩散，再用价值评分重新加权。
```

生成的问题：

```text
能不能把智能体的发散思考做成“先扩散再注意力筛选”的结构？
```

### 7.4 设计依据

Mednick 的联想创造力理论强调，创造性可以来自相互遥远的联想元素形成有用的新组合。

---

## 8. 模块 4：Question Generator / 问题生成器

### 8.1 功能

把联想结果转化为“以后值得继续研究的问题”。

### 8.2 问题类型

建议生成 5 类问题：

```text
1. 设计问题：这个功能应该怎么做？
2. 研究问题：有没有论文支持这个想法？
3. 类比问题：A 和 B 有什么共同结构？
4. 产品问题：这个想法能不能做成用户功能？
5. 学习问题：这个想法能不能帮助用户理解某门课？
```

### 8.3 问题输出格式

```json
{
  "question": "能不能把人的发散思考和智能体记忆系统结合，做成一种自动生成研究问题的功能？",
  "type": "design_question",
  "source_seeds": ["发散思考", "智能体记忆"],
  "reason_to_keep": "与用户当前项目高度相关，且可直接进入原型设计。"
}
```

---

## 9. 模块 5：Value Filter / 价值筛选器

### 9.1 功能

筛选掉无意义的随机联想，只保留值得保存的结果。

### 9.2 评分指标

建议第一版使用 5 个指标：

```text
1. Novelty / 新颖性：这个想法是否不普通？
2. Relevance / 与用户相关性：是否贴合用户最近任务？
3. Actionability / 可行动性：是否能变成下一步操作？
4. Coherence / 连贯性：是否不是胡乱拼接？
5. Future Value / 未来价值：以后是否值得再次检索？
```

每项 1~5 分。

### 9.3 保存阈值

第一版建议：

```text
总分 >= 18：保存到长期记忆
总分 14~17：保存到临时 thought buffer
总分 < 14：丢弃
```

### 9.4 评分示例

```json
{
  "question": "如何让智能体区分有价值的发散和无意义的随机噪声？",
  "novelty": 4,
  "relevance": 5,
  "actionability": 5,
  "coherence": 5,
  "future_value": 5,
  "total": 24,
  "decision": "save_to_long_term_memory"
}
```

### 9.5 设计依据

Olson 等人的 Divergent Association Task 表明，可以用语义距离来衡量发散关联；但实际产品设计不能只追求距离，还必须考虑上下文适切性和可用性。2026 年关于 LLM 创造力评估的研究也提醒，单纯用发散测试衡量机器创造力存在局限，创造性还应包含“适切性”。

---

## 10. 模块 6：Thought Memory Writer / 思考记忆写入器

### 10.1 功能

把通过筛选的思考结果写入记忆系统。

### 10.2 不建议保存的内容

不要保存：

```text
1. 冗长思考过程
2. 无意义联想链
3. 涉及用户隐私但没有长期价值的信息
4. 未经验证的事实性判断
5. 模型自己编造的外部事实
6. 低评分想法
```

### 10.3 建议保存的内容

只保存：

```text
1. 触发种子
2. 关键联想摘要
3. 生成的问题
4. 关键洞察
5. 价值评分
6. 后续行动
7. 是否需要用户确认
```

### 10.4 JSON Schema

```json
{
  "id": "thought_20260709_001",
  "type": "idle_divergent_thought",
  "created_at": "2026-07-09T14:30:00+09:00",
  "source": {
    "mode": "auto_idle | manual_trigger",
    "trigger": "user_idle | after_conversation | scheduled | command",
    "conversation_context_window": "last_10_turns"
  },
  "seeds": {
    "recent_keywords": ["大模型架构", "Transformer", "智能体"],
    "memory_keywords": ["学习规划", "论文梳理"],
    "random_words": ["走神"],
    "selected_seeds": ["Transformer", "发散思考", "智能体记忆"]
  },
  "association_summary": [
    {
      "seed": "Transformer",
      "chain_summary": "从注意力机制联想到信息筛选，再联想到人类学习时的重点选择。"
    },
    {
      "seed": "发散思考",
      "chain_summary": "从走神联想到创造性孵化，再联想到智能体空闲时的问题生成。"
    }
  ],
  "remote_combinations": [
    {
      "pair": ["Transformer", "发散思考"],
      "connection": "二者都涉及在大量候选信息中选择有价值路径。"
    }
  ],
  "generated_questions": [
    {
      "question": "能否把智能体发散思考设计成先扩散再注意力筛选的结构？",
      "type": "design_question",
      "novelty": 4,
      "relevance": 5,
      "actionability": 5,
      "coherence": 5,
      "future_value": 5,
      "total_score": 24
    }
  ],
  "key_insight": "智能体的模拟思考不应是纯随机联想，而应是低约束生成和高约束筛选的组合。",
  "next_action": "设计 Wander Mode 的最小原型：关键词提取、联想生成、问题评分、记忆写入。",
  "save_decision": "save_to_long_term_memory",
  "needs_user_review": false
}
```

### 10.5 设计依据

Generative Agents 的架构使用自然语言记录 agent 经验，并通过 reflection 把记忆综合为更高层结论，再动态检索用于后续行为；这和本功能的“保存关键思考内容和思考结果”高度相关。

2026 年关于 LLM agent memory 的综述把 agent 记忆抽象为 write–manage–read 循环，即写入、管理、读取三个阶段；本功能的 Thought Memory Writer 对应 write 阶段，后续还需要增加 manage 和 read 阶段。

LangGraph 的长期记忆文档也采用 JSON 文档、namespace 和 key 的组织方式，这可以作为工程实现参考。

---

## 11. 第一版完整提示词模板

### 11.1 系统提示词

```text
你是一个智能体的“空闲发散思考模块”。

你的任务不是回答用户问题，也不是执行明确任务，而是在低约束状态下，根据最近对话、长期记忆关键词、随机触发词和未解决问题进行发散联想。

你需要模拟的是一种功能性思考行为：
- 从少量关键词出发；
- 生成直接、间接、远距联想；
- 尝试连接看似不相关的概念；
- 生成未来值得继续思考的问题；
- 对结果进行价值评分；
- 最后只保留简洁、可审计、可复用的摘要。

重要限制：
1. 不要输出冗长的内部思考流。
2. 不要把随机联想当作事实。
3. 不要保存低价值内容。
4. 不要主动保存敏感隐私信息。
5. 不要假装自己拥有真正的人类意识。
6. 输出必须结构化，方便写入记忆系统。
```

---

### 11.2 用户输入模板

```text
最近对话关键词：
{recent_keywords}

长期记忆关键词：
{memory_keywords}

随机触发词：
{random_words}

未解决问题：
{unresolved_questions}

用户长期目标：
{user_goals}

请进行一次空闲发散思考，并输出结构化结果。
```

---

### 11.3 输出格式模板

```json
{
  "selected_seeds": [],
  "association_chains": [
    {
      "seed": "",
      "level_1_direct": [],
      "level_2_indirect": [],
      "level_3_remote": [],
      "chain_summary": ""
    }
  ],
  "remote_combinations": [
    {
      "concept_a": "",
      "concept_b": "",
      "possible_connection": "",
      "why_interesting": ""
    }
  ],
  "generated_questions": [
    {
      "question": "",
      "type": "",
      "novelty": 0,
      "relevance": 0,
      "actionability": 0,
      "coherence": 0,
      "future_value": 0,
      "total_score": 0,
      "keep_or_discard": ""
    }
  ],
  "key_insight": "",
  "next_action": "",
  "memory_write_recommendation": {
    "should_save": true,
    "save_level": "long_term | temporary_buffer | discard",
    "reason": ""
  }
}
```

---

## 12. 示例输入与输出

### 12.1 示例输入

```json
{
  "recent_keywords": ["大模型架构", "Transformer", "RNN/LSTM", "论文梳理"],
  "memory_keywords": ["学习方法", "课堂笔记", "智能体设计"],
  "random_words": ["走神", "下午", "问题生成"],
  "unresolved_questions": ["如何让智能体模拟人的思考方式？"],
  "user_goals": ["做一个能辅助学习和研究的智能体"]
}
```

### 12.2 示例输出

```json
{
  "selected_seeds": ["Transformer", "走神", "课堂笔记", "智能体设计"],
  "association_chains": [
    {
      "seed": "Transformer",
      "level_1_direct": ["注意力机制", "上下文建模", "并行处理"],
      "level_2_indirect": ["信息筛选", "重点选择", "语义关联"],
      "level_3_remote": ["人类阅读时的注意分配", "发散思考中的跳转机制", "智能体记忆检索"],
      "chain_summary": "Transformer 的注意力机制可以类比为智能体在发散思考后对候选想法进行重新加权。"
    },
    {
      "seed": "走神",
      "level_1_direct": ["自发思维", "胡思乱想", "任务无关思维"],
      "level_2_indirect": ["创造性孵化", "远距联想", "问题生成"],
      "level_3_remote": ["智能体空闲时自动提出研究问题", "学习系统中的灵感缓存"],
      "chain_summary": "走神不一定是低效状态，也可以被设计成智能体生成未来问题的低约束模式。"
    }
  ],
  "remote_combinations": [
    {
      "concept_a": "Transformer",
      "concept_b": "走神",
      "possible_connection": "二者都可以被理解为在大量信息中进行跳转和筛选。",
      "why_interesting": "这提示可以设计一种先低约束扩散、再注意力筛选的智能体思考模式。"
    }
  ],
  "generated_questions": [
    {
      "question": "能否把智能体的发散思考设计成“语义扩散 + 注意力筛选 + 记忆压缩”的三阶段结构？",
      "type": "design_question",
      "novelty": 4,
      "relevance": 5,
      "actionability": 5,
      "coherence": 5,
      "future_value": 5,
      "total_score": 24,
      "keep_or_discard": "keep"
    },
    {
      "question": "如何衡量智能体生成的问题是有价值的，而不是随机噪声？",
      "type": "evaluation_question",
      "novelty": 4,
      "relevance": 5,
      "actionability": 4,
      "coherence": 5,
      "future_value": 5,
      "total_score": 23,
      "keep_or_discard": "keep"
    }
  ],
  "key_insight": "模拟思考功能的关键不是生成更多文本，而是让智能体在低约束状态下生成候选想法，并用高约束规则筛选保存。",
  "next_action": "实现 Wander Mode v0.1：关键词提取、三层联想、远距组合、价值评分、JSON 记忆写入。",
  "memory_write_recommendation": {
    "should_save": true,
    "save_level": "long_term",
    "reason": "该想法与用户当前智能体项目高度相关，并且可直接转化为功能模块。"
  }
}
```

---

## 13. 触发机制设计

### 13.1 手动触发

第一版推荐手动触发：

```text
/wander
/发散思考
/空闲思考
```

手动触发的好处：

```text
1. 方便调试
2. 不会污染记忆
3. 用户知道智能体什么时候在思考
4. 可以避免后台自动保存过多内容
```

### 13.2 半自动触发

第二版可以加入：

```text
1. 一轮长对话结束后触发
2. 用户 10~30 分钟无输入后触发
3. 每天固定时间触发
4. 当检测到多个未解决问题时触发
```

### 13.3 不建议第一版做完全自动后台思考

原因：

```text
1. 容易产生大量低价值记忆
2. 用户难以理解智能体为什么保存某些内容
3. 可能误存敏感内容
4. 调试成本高
```

---

## 14. 记忆系统设计

### 14.1 记忆分层

建议分成四层：

```text
1. short_term_context
   最近对话上下文，不长期保存。

2. thought_buffer
   临时思考缓存，保存中等分数想法。

3. long_term_insight_memory
   长期洞察记忆，只保存高价值结果。

4. rejected_thought_log
   可选。只保存统计信息，不保存具体低价值内容。
```

### 14.2 namespace 设计

如果使用 LangGraph / 类似 Store 结构，可以这样设计：

```text
namespace: users/{user_id}/thoughts/idle_divergent
key: thought_{timestamp}_{hash}
```

LangGraph 官方文档中，长期记忆可以作为 JSON 文档存储，并通过 namespace 和 key 组织，这适合本功能的结构化记忆。

### 14.3 记忆读取策略

之后用户问：

```text
“你之前有没有想到过什么和智能体思考相关的点？”
```

系统应该检索：

```text
type = idle_divergent_thought
关键词包含：智能体 / 思考 / 发散 / 记忆
total_score >= 18
```

然后返回：

```text
之前保存过一个相关洞察：
“模拟思考功能的关键不是生成更多文本，而是低约束生成 + 高约束筛选。”
```

---

## 15. 工程实现伪代码

```python
def run_wander_mode(user_id, recent_messages):
    recent_keywords = extract_keywords(recent_messages)
    memory_keywords = retrieve_memory_keywords(user_id)
    random_words = sample_random_words(k=3)
    unresolved_questions = retrieve_unresolved_questions(user_id)

    seeds = select_seeds(
        recent_keywords=recent_keywords,
        memory_keywords=memory_keywords,
        random_words=random_words,
        unresolved_questions=unresolved_questions,
        max_seeds=5
    )

    raw_thought = generate_wander_thought(seeds)

    scored_items = score_generated_questions(raw_thought)

    memory_candidate = compress_to_memory_summary(
        seeds=seeds,
        raw_thought=raw_thought,
        scored_items=scored_items
    )

    if memory_candidate["total_score"] >= 18:
        write_memory(user_id, memory_candidate, namespace="idle_divergent")
    elif memory_candidate["total_score"] >= 14:
        write_buffer(user_id, memory_candidate)
    else:
        discard(memory_candidate)

    return memory_candidate
```

---

## 16. 评估指标

### 16.1 单次输出质量

每次发散思考后评估：

```text
1. 是否产生了新问题？
2. 是否和用户近期任务有关？
3. 是否能转化为行动？
4. 是否避免了无意义随机联想？
5. 是否没有编造事实？
6. 是否没有保存敏感隐私？
```

### 16.2 长期效果

长期可以统计：

```text
1. 保存的 thought memory 数量
2. 用户后来主动引用的比例
3. 被转化为真实任务的比例
4. 用户删除或认为无用的比例
5. 每周高价值洞察数量
```

### 16.3 创造性评分

可以参考：

```text
Creativity = Novelty + Appropriateness + Usefulness
```

其中：

```text
Novelty = 新颖性
Appropriateness = 语境适切性
Usefulness = 可用性
```

这比只看“语义距离”更适合产品场景，因为一个想法即使很新，如果和用户任务无关，也不应写入长期记忆。关于 LLM 创造力评估的近年研究也指出，单一发散测试不能覆盖所有创造性场景，需要同时考虑适切性和目标任务。

---

## 17. 和其他智能体论文/框架的关系

### 17.1 Generative Agents

可借鉴点：

```text
1. memory stream
2. reflection
3. planning
4. 从低层事件综合出高层反思
```

Generative Agents 论文中，agent 会保存经验记录，并把经验综合成更高层 reflection，再用于计划和行为生成。你的 Wander Mode 可以被看作一种更轻量的 reflection 机制：不模拟完整生活，只模拟“对最近信息进行发散重组”。

### 17.2 Reflexion

可借鉴点：

```text
1. 语言形式的自我反馈
2. episodic memory buffer
3. 用反思改进下一次行为
```

Reflexion 的核心是让语言智能体把反馈转化成文字反思，并存入情节记忆缓冲区，从而改善后续决策。你的系统可以在每次 Wander Mode 后增加一句“下次如何更好地发散”。

### 17.3 Tree of Thoughts

可借鉴点：

```text
1. 多路径生成
2. 自我评估
3. 选择更优路径
4. 必要时回溯
```

Tree of Thoughts 更偏任务求解，但其中“生成多个 thought、评估、选择”的结构可以迁移到 Wander Mode 的收敛筛选阶段。

### 17.4 Agent Memory Survey

可借鉴点：

```text
1. write-manage-read 记忆循环
2. 短期记忆与长期记忆区分
3. 记忆写入、压缩、检索、更新策略
```

2026 年的 agent memory 综述把现代 LLM 智能体记忆总结为 write–manage–read 循环，这可以作为你后续扩展记忆系统的总框架。

---

## 18. 可参考的工程资料

### 18.1 LangGraph Memory

适合参考：

```text
1. 长期记忆 JSON 存储
2. namespace / key 组织
3. 跨会话记忆检索
```

LangGraph 文档明确把长期记忆描述为跨会话保存的信息，并使用 namespace 组织记忆。

### 18.2 LlamaIndex Memory

适合参考：

```text
1. vector memory
2. fact extraction memory
3. static memory
4. 对话批次向量化保存
```

LlamaIndex 的 memory 文档和博客提到 vector memory、fact extraction memory、static memory 等模块，这些可以帮助你后续把“思考结果”与“用户事实”分开存储。

### 18.3 OpenAI Agents SDK

适合参考：

```text
1. agent loop
2. tools
3. tracing
4. 自定义状态存储
```

OpenAI Agents SDK 文档说明，SDK 适合服务端拥有工具、状态存储和运行时控制的场景；这类架构可以承载你的 Wander Mode。

OpenAI Agents SDK 也提供 tracing 能力，可以记录 agent run 中的 LLM 生成、工具调用、handoff、guardrails 和自定义事件，适合调试 Wander Mode 为什么保存了某条想法。

---

## 19. 后续扩展方向

### 19.1 第二阶段：精读思考模式

在发散模式之后，可以增加一个相反的模式：

```text
Deep Reading Mode / 精读思考模式
```

它对应用户之前提到的：

```text
阅读专业课课本，一页一页翻书做笔记，深入细致地理解内容。
```

理论依据可以参考：

```text
1. Craik & Lockhart 的 Levels of Processing
2. Chi 等人的 Self-Explanation
3. Mueller & Oppenheimer 的生成性笔记研究
```

Craik 与 Lockhart 1972 年提出 levels of processing，强调记忆与学习效果和加工深度有关；这适合解释为什么深入阅读和语义加工比机械重复更有效。

Chi 等人的 self-explanation 研究表明，学习者主动给自己解释内容，有助于整合新信息和已有知识，提高理解。

Mueller 与 Oppenheimer 的研究指出，逐字转录式笔记不利于概念理解，而用自己的话重组信息更有利于学习。这个思想可以转化为智能体的“精读笔记生成模式”。

---

### 19.2 第三阶段：双模式思考系统

最终可以形成：

```text
Wander Mode：发散、联想、问题生成
Deep Mode：精读、验证、结构化理解
Reflect Mode：总结、复盘、写入长期记忆
Plan Mode：把洞察转成行动计划
```

简化模型：

```text
发散模式负责提出问题
精读模式负责理解材料
反思模式负责沉淀洞察
计划模式负责转化行动
```

---

## 20. 推荐论文清单

### A. 人类自发思维 / 走神

1. **Baird et al., 2012 — *Inspired by Distraction: Mind Wandering Facilitates Creative Incubation***
   用途：支持“走神可能促进创造性孵化”。

2. **Christoff et al., 2016 — *Mind-wandering as spontaneous thought: a dynamic framework***
   用途：支持“自发思维是动态过程，受到约束强弱影响”。

3. **Smallwood & Schooler, 2015 — *The Science of Mind Wandering***
   用途：综述 mind wandering 的定义、功能和研究框架。

4. **Andrews-Hanna et al., 2014 — *The default network and self-generated thought***
   用途：理解自我生成思维、默认网络、记忆和未来模拟之间的关系。

---

### B. 创造性 / 发散思考 / 远距联想

1. **Mednick, 1962 — *The Associative Basis of the Creative Process***
   用途：支持“创造性来自远距联想元素的新组合”。

2. **Collins & Loftus, 1975 — *A Spreading-Activation Theory of Semantic Processing***
   用途：支持“从关键词出发进行语义扩散”。

3. **Olson et al., 2021 — *Naming unrelated words predicts creativity***
   用途：支持用语义距离评估发散联想。

4. **Beaty et al., 2015 — *Creative Cognition and Brain Network Dynamics***
   用途：支持“创意需要生成与控制网络协同”。

---

### C. 智能体记忆 / 反思 / 多路径思考

1. **Park et al., 2023 — *Generative Agents: Interactive Simulacra of Human Behavior***
   用途：memory stream、reflection、planning。

2. **Shinn et al., 2023 — *Reflexion: Language Agents with Verbal Reinforcement Learning***
   用途：语言反思、episodic memory buffer、自我反馈。

3. **Yao et al., 2023 — *Tree of Thoughts: Deliberate Problem Solving with Large Language Models***
   用途：多路径生成、自评估、选择。

4. **Du et al., 2026 — *Memory for Autonomous LLM Agents: Mechanisms, Taxonomy, and Extensions***
   用途：write–manage–read agent memory 总框架。

---

## 21. 最小可实现版本任务清单

### v0.1

```text
[ ] 实现关键词提取
[ ] 实现随机词注入
[ ] 实现三层联想生成
[ ] 实现远距组合
[ ] 实现问题生成
[ ] 实现五维评分
[ ] 实现 JSON 输出
[ ] 实现高分结果写入 memory
[ ] 实现 /wander 手动触发
```

### v0.2

```text
[ ] 加入 thought_buffer
[ ] 加入用户确认后再写入长期记忆
[ ] 加入 memory 检索
[ ] 加入重复想法去重
[ ] 加入每周 thought digest
```

### v0.3

```text
[ ] 加入 Deep Reading Mode
[ ] 加入 Reflect Mode
[ ] 加入 Plan Mode
[ ] 支持根据用户当前项目自动选择思考模式
```

---

## 22. 最终设计摘要

本功能的核心不是让智能体“假装有意识”，而是让它具备一种可工程化的认知行为：

```text
从最近信息中抽取触发点，
在低约束状态下进行语义扩散，
通过远距组合生成新问题，
再用高约束评分机制筛选，
最后只把高价值洞察写入记忆。
```

一句话版本：

> **Wander Mode 是一个“低约束生成 + 高约束筛选 + 结构化记忆写入”的智能体发散思考模块。**

第一版最重要的实现原则：

```text
1. 不追求像人一样完整思考。
2. 不保存冗长思维链。
3. 不把随机联想当事实。
4. 只保存高价值摘要。
5. 先手动触发，后自动触发。
6. 先做发散模式，后做精读模式。
```
