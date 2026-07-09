export const meta = {
  name: 'wander-mode',
  description: 'Wander Mode 完整流水线：种子提取→发散联想→中间收敛→价值筛选→苏格拉底深挖→记忆写入',
  phases: [
    { title: '提取种子', detail: '从对话、记忆、词库提取触发种子' },
    { title: '发散联想', detail: '对每个种子进行三层语义扩散' },
    { title: '中间收敛', detail: '预筛选、回环检测、去重' },
    { title: '对抗辩论', detail: '结构化挑战：最强版本/假设挖掘/反例/框架转换/边界施压/反转/综合' },
    { title: '价值筛选', detail: '五维评分 + 辩论加权 + 引用潜力评估' },
    { title: '苏格拉底深挖', detail: '对 Top-1 洞察进行前提检验、反例搜索、下一步探索' },
    { title: '记忆写入', detail: '高分洞察写入记忆系统' }
  ]
}

// ============================================================
// 辅助函数
// ============================================================
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function compress(items) {
  // 从一组评分项中提取一句话摘要
  const top = items.sort((a, b) => b.total_score - a.total_score)[0]
  return top ? top.compressed_insight || top.content : '本轮未产生高价值洞察'
}

// ============================================================
// Phase 1: 种子提取
// ============================================================
phase('提取种子')

const seedResult = await agent(
  `从当前会话上下文、memory/ 目录和 data/word_pool.json 中提取 3-5 个发散思考种子。

   记忆优先级：wander_insight > wander_open_question > wander_buffer > 其他。
   如果记忆有 citation_count > 0，权重 × 1.5。

   必须包含至少 1 个随机来源（word_pool）——用于引入偶然性（涌现事后可解释，22分）。`,
  {
    agentType: 'seed-extractor',
    schema: {
      type: 'object',
      properties: {
        selected_seeds: {
          type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 5
        },
        source_breakdown: { type: 'object' },
        rationale: { type: 'string' }
      },
      required: ['selected_seeds', 'rationale']
    }
  }
)

if (!seedResult) {
  log('⚠️ 种子提取失败，终止流水线')
  return { error: 'seed_extraction_failed' }
}

log(`🌱 提取了 ${seedResult.selected_seeds.length} 个种子：${seedResult.selected_seeds.join('、')}`)
log(`理由：${seedResult.rationale}`)

// ============================================================
// Phase 2: 发散联想（pipeline：每个种子独立处理）
// ============================================================
phase('发散联想')

const associationResults = await pipeline(
  seedResult.selected_seeds,
  seed => agent(
    `对种子 "${seed}" 进行三层语义扩散联想：
     第一层（直接相关）：核心组成、直接应用、同领域概念，3-5 个
     第二层（间接相关）：需一步推理的关联，3-5 个
     第三层（远距相关）：跨领域跳跃，3-5 个

     约束：每层向新语义方向扩展，禁止回到种子或前层概念。只有 3 层。
     最后用一句话总结联想链核心洞察。`,
    {
      agentType: 'wander-generator',
      phase: '发散联想',
      schema: {
        type: 'object',
        properties: {
          seed: { type: 'string' },
          level_1_direct: { type: 'array', items: { type: 'string' } },
          level_2_indirect: { type: 'array', items: { type: 'string' } },
          level_3_remote: { type: 'array', items: { type: 'string' } },
          chain_summary: { type: 'string' }
        },
        required: ['seed', 'level_1_direct', 'level_2_indirect', 'level_3_remote', 'chain_summary']
      }
    }
  )
)

const validAssociations = associationResults.filter(Boolean)
log(`🔗 完成 ${validAssociations.length}/${seedResult.selected_seeds.length} 个种子的联想扩散`)

// ============================================================
// Phase 3: 中间收敛（预筛选——来自"熵增-压缩平衡"，24分）
// ============================================================
phase('中间收敛')

// 收集所有待筛选内容
const itemsToPreFilter = validAssociations.map(a => ({
  seed: a.seed,
  chain_summary: a.chain_summary,
  layers: [a.level_1_direct, a.level_2_indirect, a.level_3_remote]
}))

const preFilterResult = await agent(
  `对以下 ${itemsToPreFilter.length} 条联想链进行预筛选：

   ${JSON.stringify(itemsToPreFilter, null, 2)}

   检查：
   1. 语义回环：后层是否回到了前层概念
   2. 重复检测：不同链的 chain_summary 是否高度相似
   3. 早期终止：如果前 2 个种子都质量低，建议终止
   4. 标记高潜力方向

   输出通过预筛选的链（应该比输入少）。`,
  {
    agentType: 'value-filter',
    phase: '中间收敛',
    schema: {
      type: 'object',
      properties: {
        loops_detected: { type: 'number' },
        duplicates_merged: { type: 'number' },
        early_termination: { type: 'boolean' },
        early_termination_reason: { type: 'string' },
        passed_items: {
          type: 'array', items: {
            type: 'object', properties: {
              seed: { type: 'string' },
              chain_summary: { type: 'string' },
              quality_flag: { type: 'string', enum: ['high_potential', 'normal', 'low'] }
            }
          }
        }
      },
      required: ['loops_detected', 'duplicates_merged', 'early_termination', 'passed_items']
    }
  }
)

if (!preFilterResult) {
  log('⚠️ 预筛选失败，终止流水线')
  return { error: 'pre_filter_failed', seeds: seedResult.selected_seeds }
}

log(`🔍 回环检测：${preFilterResult.loops_detected} 条 | 去重合并：${preFilterResult.duplicates_merged} 条`)
log(`通过预筛选：${preFilterResult.passed_items.length} 条`)

if (preFilterResult.early_termination) {
  log(`⏹️ 提前终止：${preFilterResult.early_termination_reason}`)
  return {
    seeds: seedResult.selected_seeds,
    early_termination: true,
    reason: preFilterResult.early_termination_reason
  }
}

// ============================================================
// Phase 3.5: 对抗辩论（v0.2.1 新增）
// ============================================================
phase('对抗辩论')

const passedItems = preFilterResult.passed_items

// 收集 wander-thinker 的核心主张
const debateTargets = passedItems.map(item => ({
  seed: item.seed,
  chain_summary: item.chain_summary
}))

let debateResult = null

if (passedItems.length >= 2) {
  // 至少 2 条通过预筛选才启动辩论（单条无需辩论）
  debateResult = await agent(
    `对以下通过预筛选的联想链进行结构化对抗辩论：

联想链：
${JSON.stringify(debateTargets, null, 2)}

从这些主张中选择 3-5 个最有挑战价值的目标，对每个目标应用至少 3 种辩论算子（steel_man / assumption_excavation / counterexample / frame_shift / edge_stress / reversal / synthesis_bridge）。

核心目标不是"赢"，而是：
1. 精确标定每个主张的适用边界
2. 发现隐藏假设
3. 寻找反题与正题共同指向的更深层原则（综合/synthesis）

特别注意：
- 挑战主张，不挑战动机
- dreamer 类产出用不同标准（重点评连接力而非逻辑严密性）
- 如果某个主张经得起所有挑战，这是高价值信号——标记 original_resilience: 4-5`,
    {
      agentType: 'adversarial-debater',
      phase: '对抗辩论',
      schema: {
        type: 'object',
        properties: {
          targets_selected: { type: 'number' },
          selection_rationale: { type: 'string' },
          challenges: {
            type: 'array', items: {
              type: 'object', properties: {
                target_id: { type: 'string' },
                original_claim: { type: 'string' },
                steel_man_version: { type: 'string' },
                operator_applications: {
                  type: 'array', items: {
                    type: 'object', properties: {
                      operator: { type: 'string' },
                      application: { type: 'string' },
                      finding: { type: 'string' },
                      challenge_strength: { type: 'number', minimum: 1, maximum: 5 },
                      original_resilience: { type: 'number', minimum: 1, maximum: 5 },
                      did_reveal_new_insight: { type: 'boolean' },
                      new_insight: { type: 'string' }
                    }
                  }
                },
                overall_assessment: {
                  type: 'object', properties: {
                    strongest_challenge: { type: 'string' },
                    original_core_survives: { type: 'boolean' },
                    survival_condition: { type: 'string' },
                    what_was_missing: { type: 'string' }
                  }
                }
              }
            }
          },
          cross_challenge_patterns: {
            type: 'object', properties: {
              recurring_weakness: { type: 'string' },
              systemic_blind_spot_hint: { type: 'string' },
              most_robust_claim: { type: 'string' }
            }
          },
          synthesis: {
            type: 'object', properties: {
              deeper_principle: { type: 'string' },
              synthesis_quality: { type: 'string', enum: ['strong', 'moderate', 'weak', 'none'] },
              synthesis_insight: { type: 'string' },
              elevated_perspective: { type: 'string' }
            }
          },
          new_open_questions: { type: 'array', items: { type: 'string' } },
          debate_summary: { type: 'string' }
        },
        required: ['targets_selected', 'challenges', 'synthesis', 'debate_summary']
      }
    }
  )

  if (debateResult) {
    log(`⚔️ 挑战了 ${debateResult.targets_selected} 个主张，应用了多种辩论算子`)
    log(`🧬 综合视角：${debateResult.synthesis.synthesis_insight || debateResult.synthesis.deeper_principle}`)

    // 标记经得起挑战的主张（resilience >= 4）
    const resilientClaims = debateResult.challenges
      .flatMap(c => c.operator_applications.filter(o => o.original_resilience >= 4))
    if (resilientClaims.length > 0) {
      log(`🛡️ ${resilientClaims.length} 个主张经挑战存活——将获得加权评分`)
    }
  }
} else {
  log('⏭️ 通过预筛选的主张不足 2 条，跳过对抗辩论')
}

// ============================================================
// Phase 4: 价值筛选（深度评分）
// ============================================================
phase('价值筛选')

const filterResult = await agent(
  `对以下 ${passedItems.length} 条通过预筛选的联想链进行五维深度评分：

${JSON.stringify(passedItems, null, 2)}

${debateResult ? `
⚠️ 重要——对抗辩论结果（作为评分参考）：

${JSON.stringify(debateResult, null, 2)}

评分时请注意：
- 经辩论挑战存活的主张（original_resilience >= 4），其 Future Value 自动 +1 分
- 辩论产生的 synthesis 和 new_open_questions 也需要参与评分
- 辩论综合视角（synthesis）如果 quality 为 strong，应作为独立的 insight 候选参与评分
` : ''}

评分维度（每项 1-5）：
1. Novelty 新颖性：是不是常识/废话？
2. Relevance 相关性：与用户当前项目关联吗？
3. Actionability 可行动性：能不能变成下一步？
4. Coherence 连贯性：逻辑是否自洽？
5. Future Value 未来价值：考虑引用潜力、催化效应、跨场景复用${debateResult ? ' + 辩论加权' : ''}

阈值：≥18 long_term | 14-17 buffer | <14 discard

每个评分项必须包含 compressed_insight（一句话压缩摘要）。
标记 top_insight（用于下一阶段的苏格拉底深挖）。
标记每个项的 citation_potential（high/medium/low）。`,
  {
    agentType: 'value-filter',
    phase: '价值筛选',
    schema: {
      type: 'object',
      properties: {
        scored_items: {
          type: 'array', items: {
            type: 'object', properties: {
              content: { type: 'string' },
              compressed_insight: { type: 'string' },
              type: { type: 'string', enum: ['insight', 'open_question'] },
              source_seeds: { type: 'array', items: { type: 'string' } },
              novelty: { type: 'number', minimum: 1, maximum: 5 },
              relevance: { type: 'number', minimum: 1, maximum: 5 },
              actionability: { type: 'number', minimum: 1, maximum: 5 },
              coherence: { type: 'number', minimum: 1, maximum: 5 },
              future_value: { type: 'number', minimum: 1, maximum: 5 },
              citation_potential: { type: 'string', enum: ['high', 'medium', 'low'] },
              total_score: { type: 'number', minimum: 0, maximum: 25 },
              decision: { type: 'string', enum: ['long_term', 'buffer', 'discard'] },
              reason: { type: 'string' }
            },
            required: ['content', 'compressed_insight', 'novelty', 'relevance', 'actionability', 'coherence', 'future_value', 'total_score', 'decision']
          }
        },
        top_insight: {
          type: 'object', properties: {
            content: { type: 'string' },
            total_score: { type: 'number' },
            why_top: { type: 'string' }
          }
        },
        save_summary: {
          type: 'object', properties: {
            long_term_count: { type: 'number' },
            buffer_count: { type: 'number' },
            discard_count: { type: 'number' }
          }
        }
      },
      required: ['scored_items', 'top_insight', 'save_summary']
    }
  }
)

   ${JSON.stringify(passedItems, null, 2)}

   评分维度（每项 1-5）：
   1. Novelty 新颖性：是不是常识/废话？
   2. Relevance 相关性：与用户当前项目关联吗？
   3. Actionability 可行动性：能不能变成下一步？
   4. Coherence 连贯性：逻辑是否自洽？
   5. Future Value 未来价值：考虑引用潜力、催化效应、跨场景复用

   阈值：≥18 long_term | 14-17 buffer | <14 discard

   每个评分项必须包含 compressed_insight（一句话压缩摘要）。
   标记 top_insight（用于下一阶段的苏格拉底深挖）。
   标记每个项的 citation_potential（high/medium/low）。`,
  {
    agentType: 'value-filter',
    phase: '价值筛选',
    schema: {
      type: 'object',
      properties: {
        scored_items: {
          type: 'array', items: {
            type: 'object', properties: {
              content: { type: 'string' },
              compressed_insight: { type: 'string' },
              type: { type: 'string', enum: ['insight', 'open_question'] },
              source_seeds: { type: 'array', items: { type: 'string' } },
              novelty: { type: 'number', minimum: 1, maximum: 5 },
              relevance: { type: 'number', minimum: 1, maximum: 5 },
              actionability: { type: 'number', minimum: 1, maximum: 5 },
              coherence: { type: 'number', minimum: 1, maximum: 5 },
              future_value: { type: 'number', minimum: 1, maximum: 5 },
              citation_potential: { type: 'string', enum: ['high', 'medium', 'low'] },
              total_score: { type: 'number', minimum: 0, maximum: 25 },
              decision: { type: 'string', enum: ['long_term', 'buffer', 'discard'] },
              reason: { type: 'string' }
            },
            required: ['content', 'compressed_insight', 'novelty', 'relevance', 'actionability', 'coherence', 'future_value', 'total_score', 'decision']
          }
        },
        top_insight: {
          type: 'object', properties: {
            content: { type: 'string' },
            total_score: { type: 'number' },
            why_top: { type: 'string' }
          }
        },
        save_summary: {
          type: 'object', properties: {
            long_term_count: { type: 'number' },
            buffer_count: { type: 'number' },
            discard_count: { type: 'number' }
          }
        }
      },
      required: ['scored_items', 'top_insight', 'save_summary']
    }
  }
)

if (!filterResult) {
  log('⚠️ 评分失败，终止流水线')
  return { error: 'scoring_failed', seeds: seedResult.selected_seeds }
}

const highScoreItems = filterResult.scored_items.filter(i => i.decision === 'long_term')
const midScoreItems = filterResult.scored_items.filter(i => i.decision === 'buffer')
const discardCount = filterResult.scored_items.filter(i => i.decision === 'discard').length

log(`📊 长期保存：${highScoreItems.length} | 缓冲：${midScoreItems.length} | 丢弃：${discardCount}`)
log(`🏆 Top Insight (${filterResult.top_insight.total_score}分)：${filterResult.top_insight.content}`)

// ============================================================
// Phase 5: 苏格拉底深挖（来自"苏格拉底追问"，19分）
// ============================================================
phase('苏格拉底深挖')

let socraticResult = null

if (filterResult.top_insight && filterResult.top_insight.total_score >= 18) {
  socraticResult = await agent(
    `对这个高价值洞察进行苏格拉底式深度追问：

     "${filterResult.top_insight.content}"

     从三个维度追问：
     1. 前提检验：隐含前提是什么？前提不成立会怎样？
     2. 反例搜索：什么情况下这个结论会失效？
     3. 下一步探索：如果洞察正确，最值得探索什么？

     追问本身可能成为新的 open_question。`,
    {
      agentType: 'socratic-probe',
      phase: '苏格拉底深挖',
      schema: {
        type: 'object',
        properties: {
          original_insight: { type: 'string' },
          probes: {
            type: 'array', items: {
              type: 'object', properties: {
                dimension: { type: 'string', enum: ['premise_check', 'counter_example', 'next_exploration'] },
                question: { type: 'string' },
                why_this_matters: { type: 'string' },
                potential_impact: { type: 'string', enum: ['high', 'medium', 'low'] }
              }
            }
          },
          deepened_understanding: { type: 'string' },
          new_open_question: { type: 'string' }
        },
        required: ['original_insight', 'probes', 'deepened_understanding']
      }
    }
  )

  if (socraticResult) {
    log(`🔍 追问 1（前提）：${socraticResult.probes[0]?.question || 'N/A'}`)
    log(`🔍 追问 2（反例）：${socraticResult.probes[1]?.question || 'N/A'}`)
    log(`🔍 追问 3（探索）：${socraticResult.probes[2]?.question || 'N/A'}`)
    if (socraticResult.new_open_question) {
      log(`💡 新开放问题：${socraticResult.new_open_question}`)
    }
  }
} else {
  log('⏭️ 无高分洞察，跳过苏格拉底深挖')
}

// ============================================================
// Phase 6: 记忆写入（用户确认后）
// ============================================================
phase('记忆写入')

const allSaveItems = [
  ...highScoreItems.map(i => ({ ...i, save_level: 'long_term_memory' })),
  ...midScoreItems.map(i => ({ ...i, save_level: 'thought_buffer' }))
]

if (allSaveItems.length === 0) {
  log('📭 本次无高价值内容需要保存')
  return {
    seeds: seedResult.selected_seeds,
    source_breakdown: seedResult.source_breakdown,
    associations: validAssociations.map(a => ({ seed: a.seed, chain_summary: a.chain_summary })),
    pre_filter: preFilterResult,
    debate: debateResult ? {
      targets_selected: debateResult.targets_selected,
      synthesis_quality: debateResult.synthesis.synthesis_quality,
      debate_summary: debateResult.debate_summary
    } : null,
    scored_items: filterResult.scored_items,
    top_insight: filterResult.top_insight,
    socratic_probes: socraticResult?.probes || [],
    deepened_understanding: socraticResult?.deepened_understanding || null,
    summary: '本次发散思考未发现足够高价值的内容，不写入记忆。'
  }
}

// 返回完整结果（写入由用户确认后手动执行）
const compressedSummary = compress(filterResult.scored_items.filter(i => i.decision === 'long_term'))

return {
  seeds: seedResult.selected_seeds,
  source_breakdown: seedResult.source_breakdown,
  associations: validAssociations.map(a => ({ seed: a.seed, chain_summary: a.chain_summary })),
  pre_filter: {
    loops_detected: preFilterResult.loops_detected,
    duplicates_merged: preFilterResult.duplicates_merged
  },
  debate: debateResult ? {
    targets_selected: debateResult.targets_selected,
    resilient_claims: debateResult.challenges
      .flatMap(c => c.operator_applications.filter(o => o.original_resilience >= 4)).length,
    synthesis_quality: debateResult.synthesis.synthesis_quality,
    synthesis_insight: debateResult.synthesis.synthesis_insight,
    new_open_questions: debateResult.new_open_questions,
    debate_summary: debateResult.debate_summary
  } : null,
  scored_items: filterResult.scored_items,
  top_insight: filterResult.top_insight,
  socratic_probes: socraticResult?.probes || [],
  deepened_understanding: socraticResult?.deepened_understanding || null,
  new_open_question: socraticResult?.new_open_question || null,
  save_candidates: allSaveItems,
  compressed_summary: compressedSummary,
  save_summary: filterResult.save_summary
}
