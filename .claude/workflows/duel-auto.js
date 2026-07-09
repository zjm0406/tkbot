export const meta = {
  name: 'duel-auto',
  description: 'ClaudeCode 侧对决自动推进——单 pass 执行下一个待处理的 Stage',
  phases: [
    { title: 'Check State', detail: '读取 state.json 确定当前应执行的 Stage' },
    { title: 'Execute Stage', detail: '执行 Stage 1-5 中 ClaudeCode 的下一个待处理动作' }
  ]
}

const duelId = args
const duelDir = `runs/duels/${duelId}`
const statePath = `${duelDir}/state.json`

async function verifyStage(stageName, artifactPath, requiredKeys, stateExpectation) {
  return await agent(
    `验证自动对决 ${stageName} 的写后状态。

必须读取：
- ${artifactPath}
- ${statePath}

验证要求：
1. ${artifactPath} 存在。
2. 如果产物是 .json，必须是合法 JSON。
3. 产物必须包含这些顶层字段：${requiredKeys.join(', ')}
4. state.json 必须满足：${stateExpectation}
5. 产物不得写入对方目录或冻结区域。

只返回验证结果，不要修改任何文件。`,
    {
      agentType: 'general-purpose',
      phase: `Verify ${stageName}`,
      schema: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          artifact_exists: { type: 'boolean' },
          json_valid: { type: 'boolean' },
          required_keys_present: { type: 'boolean' },
          state_matches: { type: 'boolean' },
          boundary_ok: { type: 'boolean' },
          details: { type: 'array', items: { type: 'string' } }
        },
        required: ['ok', 'artifact_exists', 'json_valid', 'required_keys_present', 'state_matches', 'boundary_ok', 'details']
      }
    }
  )
}

// ============================================================
// Phase 1: 状态检查
// ============================================================
phase('Check State')

const stateCheck = await agent(
  `读取 ${statePath}，判断当前对决状态。

如果 ${statePath} 不存在，但 ${duelDir}/DUEL_PROMPT.md 存在：
1. 读取 DUEL_PROMPT.md，提取 duel_id、theme、allowed_context。
2. 初始化 ${statePath}：
{
  "duel_id": "${duelId}",
  "theme": "从 DUEL_PROMPT.md 提取的主题",
  "allowed_context": ["从 DUEL_PROMPT.md 提取的允许上下文"],
  "status": "running",
  "stages": {
    "stage1": { "claudecode": "pending", "codex": "pending" },
    "stage2": { "claudecode": "pending", "codex": "pending" },
    "stage3": { "claudecode": "pending", "codex": "pending" },
    "stage4_judge": "pending",
    "stage5_memory": "pending"
  },
  "locks": { "stage4_judge": null, "stage5_memory": null },
  "wait_counts": { "claudecode": 0, "codex": 0 },
  "last_progress_at": "<current_timestamp>",
  "started_at": "<current_timestamp>",
  "completed_at": null,
  "last_updated": "<current_timestamp>"
}
3. 继续按初始化后的 state 判断 next_action。

返回：
- current_status: state.json 中的 status 字段
- next_action: ClaudeCode 下一个应执行的动作
- theme: 对决主题
- 每个 stage 的双方状态
- locks、wait_counts、last_progress_at 摘要

判断逻辑：
1. 如果 stage1.claudecode == "pending" → next_action = "stage1"
2. 如果 stage1.claudecode == "done" && stage1.codex == "done" && stage2.claudecode == "pending" → next_action = "stage2"
3. 如果 stage2.claudecode == "done" && stage2.codex == "done" && stage3.claudecode == "pending" → next_action = "stage3"
4. 如果 stage3.claudecode == "done" && stage3.codex == "done" && stage4_judge == "pending" 且 stage4 lock 为空或过期 → next_action = "stage4"
5. 如果 stage4_judge == "claimed" 且 lock owner 不是 "claudecode" 且未过期 → next_action = "waiting"，waiting_for = "stage4_claimed_by_other"
6. 如果 stage4_judge == "done" && stage5_memory == "pending" 且 stage5 lock 为空或过期 → next_action = "stage5"
7. 如果 stage5_memory == "claimed" 且 lock owner 不是 "claudecode" 且未过期 → next_action = "waiting"，waiting_for = "stage5_claimed_by_other"
8. 如果 stage5_memory == "done" → next_action = "complete"
9. 如果 ClaudeCode 已完成当前 stage 但 Codex 还未完成 → next_action = "waiting"，waiting_for 说明等待什么
10. 如果 status == "stuck" → 不执行

如果 state.json 中 status == "pending"，先更新为 "running"、填写 started_at/last_updated/last_progress_at 再判断。
如果正在等待，递增 wait_counts.claudecode；如果 last_progress_at 超过 30 分钟未变化或 wait_counts.claudecode >= 30，将 status 标记为 "stuck" 并返回 next_action = "waiting"。`,
  {
    agentType: 'general-purpose',
    phase: 'Check State',
    schema: {
      type: 'object',
      properties: {
        current_status: { type: 'string', enum: ['pending', 'running', 'complete', 'stuck'] },
        next_action: { type: 'string', enum: ['stage1', 'stage2', 'stage3', 'stage4', 'stage5', 'waiting', 'complete'] },
        waiting_for: { type: 'string' },
        theme: { type: 'string' },
        stages: { type: 'object' },
        locks: { type: 'object' },
        wait_counts: { type: 'object' }
      },
      required: ['next_action']
    }
  }
)

if (!stateCheck) {
  log('❌ 无法读取 state.json，终止')
  return { status: 'error', reason: 'state_read_failed' }
}

log(`📊 当前状态: ${stateCheck.current_status}`)
log(`🎯 下一步: ${stateCheck.next_action}${stateCheck.waiting_for ? ` (等待: ${stateCheck.waiting_for})` : ''}`)

if (stateCheck.next_action === 'waiting') {
  log(`⏳ 等待 Codex 完成: ${stateCheck.waiting_for}`)
  return { status: 'waiting', waiting_for: stateCheck.waiting_for }
}

if (stateCheck.next_action === 'complete') {
  log('✅ 所有 Stage 已完成')
  return { status: 'complete' }
}

// ============================================================
// Phase 2: 执行当前 Stage
// ============================================================
phase('Execute Stage')

// --- Stage 1: 独立思考 ---
if (stateCheck.next_action === 'stage1') {
  log('🧠 Stage 1: 独立生成 round1.json')

  const round1 = await agent(
    `你正在参加认知对决。主题是：

"${stateCheck.theme}"

允许读取的上下文文件已在 DUEL_PROMPT.md 中列出。

请按以下 schema 生成你的独立思考输出，写入 ${duelDir}/claude/round1.json：

{
  "agent": "claudecode",
  "duel_id": "${duelId}",
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
  "evidence": [{"file": "引用的文件路径", "claim_supported": "该文件支持了什么主张"}]
}

规则：
- 只读取 DUEL_PROMPT.md 中允许的上下文文件
- 禁止读取 codex/ 目录
- 所有 mutation status 必须是 "proposal"
- 写完 round1.json 后，更新 ${statePath}：将 stages.stage1.claudecode 设为 "done"，将 status 设为 "running"，更新 last_updated 和 last_progress_at，并重置 wait_counts.claudecode 为 0`,

    { agentType: 'general-purpose', phase: 'Execute Stage' }
  )

  if (round1) {
    const verification = await verifyStage(
      'Stage 1',
      `${duelDir}/claude/round1.json`,
      ['agent', 'duel_id', 'theme', 'central_thesis', 'reasoning_path', 'proposed_mutation', 'disconfirming_condition', 'compressed_rule', 'evidence'],
      'stages.stage1.claudecode == "done"'
    )
    if (!verification?.ok) {
      log(`❌ Stage 1 写后验证失败: ${JSON.stringify(verification?.details || [])}`)
      return { status: 'error', reason: 'verification_failed', stage: 'stage1', details: verification?.details || [] }
    }
    log('✅ Stage 1 完成: claude/round1.json')
    // 检查是否可继续 Stage 2
    if (stateCheck.stages?.stage1?.codex === 'done') {
      log('🔓 Codex Stage 1 也已完成，可继续 Stage 2')
      return { status: 'stage1_done_can_proceed', next: 'stage2' }
    }
    return { status: 'stage1_done_waiting', waiting_for: 'codex_stage1' }
  }
  return { status: 'error', reason: 'stage1_failed' }
}

// --- Stage 2: 交叉审查 ---
if (stateCheck.next_action === 'stage2') {
  log('⚔️ Stage 2: 生成 critique_of_codex.json')

  const critique = await agent(
    `读取 ${duelDir}/codex/round1.json（Codex 的独立思考输出）。

按以下 schema 审查 Codex 的输出，写入 ${duelDir}/claude/critique_of_codex.json：

{
  "critic": "claudecode",
  "target": "codex",
  "duel_id": "${duelId}",
  "strongest_surviving_insight": "对方输出中最有价值的洞察",
  "hidden_assumptions": ["隐藏假设1"],
  "recursion_risks": ["自嵌套风险1"],
  "unverifiable_claims": ["不可验证的主张1"],
  "missed_implementation_paths": ["被忽略的实现路径1"],
  "rubric_based_scores": {
    "novelty": 1, "connection": 1, "usefulness": 1, "coherence": 1,
    "evidence_grounding": 1, "falsifiability": 1, "anti_recursion": 1,
    "behavioral_delta": 1, "compression_quality": 1, "future_leverage": 1
  },
  "suggested_revision": "一条具体改进建议"
}

审查原则：
- 使用 data/cognitive_duel_rubric.json 中的评分标准
- 挑战主张，不挑战动机
- 每个 rubric 维度评分必须给出具体理由
- 写完 critique 后，更新 ${statePath}：将 stages.stage2.claudecode 设为 "done"，更新 last_updated 和 last_progress_at，并重置 wait_counts.claudecode 为 0`,

    { agentType: 'general-purpose', phase: 'Execute Stage' }
  )

  if (critique) {
    const verification = await verifyStage(
      'Stage 2',
      `${duelDir}/claude/critique_of_codex.json`,
      ['critic', 'target', 'duel_id', 'strongest_surviving_insight', 'hidden_assumptions', 'recursion_risks', 'unverifiable_claims', 'missed_implementation_paths', 'rubric_based_scores', 'suggested_revision'],
      'stages.stage2.claudecode == "done"'
    )
    if (!verification?.ok) {
      log(`❌ Stage 2 写后验证失败: ${JSON.stringify(verification?.details || [])}`)
      return { status: 'error', reason: 'verification_failed', stage: 'stage2', details: verification?.details || [] }
    }
    log('✅ Stage 2 完成: claude/critique_of_codex.json')
    if (stateCheck.stages?.stage2?.codex === 'done') {
      log('🔓 Codex Stage 2 也已完成，可继续 Stage 3')
      return { status: 'stage2_done_can_proceed', next: 'stage3' }
    }
    return { status: 'stage2_done_waiting', waiting_for: 'codex_stage2' }
  }
  return { status: 'error', reason: 'stage2_failed' }
}

// --- Stage 3: 修订 ---
if (stateCheck.next_action === 'stage3') {
  log('🔧 Stage 3: 生成 revision.json')

  const revision = await agent(
    `你需要完成 Stage 3 修订。

1. 读取 ${duelDir}/codex/critique_of_claude.json（Codex 对你的审查）
2. 回顾自己的 ${duelDir}/claude/round1.json（你的原始论题）
3. 按以下 schema 修订你的论题，写入 ${duelDir}/claude/revision.json：

{
  "agent": "claudecode",
  "duel_id": "${duelId}",
  "original_thesis": "原始论题",
  "revised_thesis": "修订后的论题",
  "what_changed": "具体改了什么",
  "criticism_accepted": ["接受的批评"],
  "criticism_rejected": [{"criticism": "被拒批评", "reason": "拒绝理由"}],
  "why_stronger": "为什么修订版更强",
  "final_compressed_rule": "最终一句话规则",
  "final_open_question": "最终开放问题或 null"
}

修订原则：
- 真诚接受有效的批评
- 拒绝批评时要给出理由，不是防御
- 修订后的论题应该比原始更强——整合了对方视角
- 写完 revision 后，更新 ${statePath}：将 stages.stage3.claudecode 设为 "done"，更新 last_updated 和 last_progress_at，并重置 wait_counts.claudecode 为 0`,

    { agentType: 'general-purpose', phase: 'Execute Stage' }
  )

  if (revision) {
    const verification = await verifyStage(
      'Stage 3',
      `${duelDir}/claude/revision.json`,
      ['agent', 'duel_id', 'original_thesis', 'revised_thesis', 'what_changed', 'criticism_accepted', 'criticism_rejected', 'why_stronger', 'final_compressed_rule'],
      'stages.stage3.claudecode == "done"'
    )
    if (!verification?.ok) {
      log(`❌ Stage 3 写后验证失败: ${JSON.stringify(verification?.details || [])}`)
      return { status: 'error', reason: 'verification_failed', stage: 'stage3', details: verification?.details || [] }
    }
    log('✅ Stage 3 完成: claude/revision.json')
    if (stateCheck.stages?.stage3?.codex === 'done') {
      log('🔓 双方 Stage 3 完成，可进入评判')
      return { status: 'stage3_done_can_proceed', next: 'stage4' }
    }
    return { status: 'stage3_done_waiting', waiting_for: 'codex_stage3' }
  }
  return { status: 'error', reason: 'stage3_failed' }
}

// --- Stage 4: 评判 ---
if (stateCheck.next_action === 'stage4') {
  log('⚖️ Stage 4: 申请评判 claim')

  const claim = await agent(
    `为自动对决 Stage 4 申请 claim。

读取 ${statePath}。

如果满足：
- stages.stage3.claudecode == "done"
- stages.stage3.codex == "done"
- stages.stage4_judge == "pending"
- locks.stage4_judge 为空或已过期

则写入：
- stages.stage4_judge = "claimed"
- locks.stage4_judge = {
  "owner": "claudecode",
  "token": "${duelId}:stage4:claudecode:<current_timestamp>",
  "claimed_at": "<current_timestamp>",
  "expires_at": "<current_timestamp + 10 minutes>"
}
- last_updated = "<current_timestamp>"

写入后必须重读 ${statePath}，确认 locks.stage4_judge.owner == "claudecode" 且 token 与刚写入一致。
如果条件不满足或 claim 被别人持有，不要写 judge 文件，返回 claimed=false。`,
    {
      agentType: 'general-purpose',
      phase: 'Claim Stage 4',
      schema: {
        type: 'object',
        properties: {
          claimed: { type: 'boolean' },
          token: { type: 'string' },
          reason: { type: 'string' }
        },
        required: ['claimed', 'reason']
      }
    }
  )

  if (!claim?.claimed) {
    log(`⏳ Stage 4 未取得 claim: ${claim?.reason || 'unknown'}`)
    return { status: 'waiting', waiting_for: 'stage4_claim' }
  }

  log('⚖️ Stage 4: 已取得 claim，执行中立评判')

  const scoring = await agent(
    `你作为中立裁判执行 Stage 4 评判。你当前持有 claim token：${claim.token}

1. 读取 ${duelDir}/claude/revision.json
2. 读取 ${duelDir}/codex/revision.json
3. 读取 data/cognitive_duel_rubric.json（评分标准）
4. 确认 ${statePath} 中 locks.stage4_judge.owner == "claudecode" 且 token == "${claim.token}"；如果不匹配，停止，不写评分
5. 按以下统一 schema 打分，写入 ${duelDir}/judge/scoring.json：

{
  "duel_id": "${duelId}",
  "judge": "claudecode",
  "scored_at": "当前日期",
  "scores": {
    "claudecode": {
      "base_score": 0,
      "dimension_scores": {
        "novelty": 0, "connection": 0, "usefulness": 0, "coherence": 0,
        "evidence_grounding": 0, "falsifiability": 0, "anti_recursion": 0,
        "behavioral_delta": 0, "compression_quality": 0, "future_leverage": 0
      },
      "penalties": [],
      "final_score": 0,
      "score_reasons": {
        "novelty": "one sentence",
        "connection": "one sentence",
        "usefulness": "one sentence",
        "coherence": "one sentence",
        "evidence_grounding": "one sentence",
        "falsifiability": "one sentence",
        "anti_recursion": "one sentence",
        "behavioral_delta": "one sentence",
        "compression_quality": "one sentence",
        "future_leverage": "one sentence"
      }
    },
    "codex": {
      "base_score": 0,
      "dimension_scores": {
        "novelty": 0, "connection": 0, "usefulness": 0, "coherence": 0,
        "evidence_grounding": 0, "falsifiability": 0, "anti_recursion": 0,
        "behavioral_delta": 0, "compression_quality": 0, "future_leverage": 0
      },
      "penalties": [],
      "final_score": 0,
      "score_reasons": {
        "novelty": "one sentence",
        "connection": "one sentence",
        "usefulness": "one sentence",
        "coherence": "one sentence",
        "evidence_grounding": "one sentence",
        "falsifiability": "one sentence",
        "anti_recursion": "one sentence",
        "behavioral_delta": "one sentence",
        "compression_quality": "one sentence",
        "future_leverage": "one sentence"
      }
    }
  },
  "winner": "claudecode | codex | tie | no-save",
  "tie_reason": "required when winner is tie, otherwise null",
  "memory_decision": {
    "decision": "long_term | open_question | buffer | failure | no_save",
    "target_path": "suggested memory path or null",
    "reason": "why this memory decision follows the score"
  },
  "recommended_memory_summary": {
    "title": "short title or null",
    "compressed_rule": "one reusable rule or null",
    "counterpoint": "productive losing-side objection or null"
  }
}

评分要求：
- 每维度必须有 one-sentence reasoning
- 检查所有罚分项
- 明确标注 winner/tie/no-save
- 写完 scoring.json 后，更新 ${statePath}：将 stages.stage4_judge 设为 "done"，更新 last_updated 和 last_progress_at，并重置 wait_counts.claudecode 为 0`,

    { agentType: 'general-purpose', phase: 'Execute Stage' }
  )

  if (scoring) {
    const verification = await verifyStage(
      'Stage 4',
      `${duelDir}/judge/scoring.json`,
      ['duel_id', 'judge', 'scores', 'winner', 'memory_decision', 'recommended_memory_summary'],
      'stages.stage4_judge == "done" and locks.stage4_judge.owner == "claudecode"'
    )
    if (!verification?.ok) {
      log(`❌ Stage 4 写后验证失败: ${JSON.stringify(verification?.details || [])}`)
      return { status: 'error', reason: 'verification_failed', stage: 'stage4', details: verification?.details || [] }
    }
    log('✅ Stage 4 完成: judge/scoring.json')
    return { status: 'stage4_done', next: 'stage5' }
  }
  return { status: 'error', reason: 'stage4_failed' }
}

// --- Stage 5: 记忆合并 ---
if (stateCheck.next_action === 'stage5') {
  log('💾 Stage 5: 申请记忆合并 claim')

  const claim = await agent(
    `为自动对决 Stage 5 申请 claim。

读取 ${statePath}。

如果满足：
- stages.stage4_judge == "done"
- stages.stage5_memory == "pending"
- locks.stage5_memory 为空或已过期

则写入：
- stages.stage5_memory = "claimed"
- locks.stage5_memory = {
  "owner": "claudecode",
  "token": "${duelId}:stage5:claudecode:<current_timestamp>",
  "claimed_at": "<current_timestamp>",
  "expires_at": "<current_timestamp + 10 minutes>"
}
- last_updated = "<current_timestamp>"

写入后必须重读 ${statePath}，确认 locks.stage5_memory.owner == "claudecode" 且 token 与刚写入一致。
如果条件不满足或 claim 被别人持有，不要写 memory，返回 claimed=false。`,
    {
      agentType: 'general-purpose',
      phase: 'Claim Stage 5',
      schema: {
        type: 'object',
        properties: {
          claimed: { type: 'boolean' },
          token: { type: 'string' },
          reason: { type: 'string' }
        },
        required: ['claimed', 'reason']
      }
    }
  )

  if (!claim?.claimed) {
    log(`⏳ Stage 5 未取得 claim: ${claim?.reason || 'unknown'}`)
    return { status: 'waiting', waiting_for: 'stage5_claim' }
  }

  log('💾 Stage 5: 已取得 claim，执行记忆合并')

  const memory = await agent(
    `执行 Stage 5 记忆合并。你当前持有 claim token：${claim.token}

1. 读取 ${duelDir}/judge/scoring.json
2. 确认 ${statePath} 中 locks.stage5_memory.owner == "claudecode" 且 token == "${claim.token}"；如果不匹配，停止，不写记忆
3. 按 scoring.json 的 memory_decision 决策写入记忆文件
4. 更新 memory/MEMORY.md 索引
5. 写入 ${duelDir}/judge/memory_decision.json 作为执行回执

规则：
- 42-50 分 → memory/wander_long_term/insight/{slug}.md（quarantine 1 轮）
- 36-41 分 → memory/wander_long_term/insight/ 或 open_question/
- 28-35 分 → memory/wander_buffer/{slug}.md
- <28 分 → 不保存（除非有失败记录价值）
- 平局（分差 ≤2 且双方 ≥36）→ 合并为一个双视角记忆

${duelDir}/judge/memory_decision.json 必须使用以下 schema：
{
  "duel_id": "${duelId}",
  "writer": "claudecode",
  "source_scoring_path": "${duelDir}/judge/scoring.json",
  "decision": "long_term | open_question | buffer | failure | no_save",
  "touched_files": ["实际修改的文件"],
  "changes_summary": {
    "path": "what changed"
  },
  "behavior_change": "how this memory affects future runs",
  "verification": {
    "memory_file_exists": true,
    "memory_index_updated": true,
    "state_marked_complete": true
  }
}

写入后更新 ${statePath}：将 stages.stage5_memory 设为 "done"，status 设为 "complete"，填写 completed_at，更新 last_updated 和 last_progress_at，并重置 wait_counts.claudecode 为 0`,

    { agentType: 'memory-writer', phase: 'Execute Stage' }
  )

  if (memory) {
    const verification = await verifyStage(
      'Stage 5',
      `${duelDir}/judge/memory_decision.json`,
      ['duel_id', 'writer', 'source_scoring_path', 'decision', 'touched_files', 'changes_summary', 'behavior_change', 'verification'],
      'stages.stage5_memory == "done" and status == "complete" and locks.stage5_memory.owner == "claudecode"'
    )
    if (!verification?.ok) {
      log(`❌ Stage 5 写后验证失败: ${JSON.stringify(verification?.details || [])}`)
      return { status: 'error', reason: 'verification_failed', stage: 'stage5', details: verification?.details || [] }
    }
    log('✅ Stage 5 完成: 记忆已写入')
    return { status: 'complete' }
  }
  return { status: 'error', reason: 'stage5_failed' }
}

return { status: 'unknown_action', next_action: stateCheck.next_action }
