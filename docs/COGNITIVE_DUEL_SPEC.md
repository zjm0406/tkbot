# Cognitive Duel Spec

**Version**: v0.3
**Date**: 2026-07-09
**Scope**: ClaudeCode and Codex shared thinking competition protocol (v0.3 aligns automated state advancement, claim locks, and judge schema)

---

## 0. Purpose

Cognitive Duel is a controlled comparison between ClaudeCode and Codex on the same thinking theme.

It exists to solve one risk in autonomous thinking systems:

> A single agent that judges and mutates itself can reward recursive self-nesting instead of better thought.

The duel introduces an external but symmetric pressure: two agents think independently, critique each other after isolation ends, revise once, and are scored by explicit rules.

The goal is not to decide which agent is globally better. The goal is to preserve the best thought and improve the next round.

---

## 1. Core Principles

1. **Same Theme, Separate Thinking**
   - Both agents receive the exact same theme and context packet.
   - Before independent outputs are sealed, neither agent may read the other's output.

2. **No Cross-File Mutation**
   - ClaudeCode may not modify `.codex/**`, `.agents/**`, or `AGENTS.md`.
   - Codex may not modify `.claude/**` or `CLAUDE.md`.
   - During duel thinking, neither agent may modify shared memory directly.

3. **Critique Requires Explicit Rubric**
   - Any agent may judge or critique only by applying the shared rubric.
   - No critique may rely on agent identity, style preference, or hidden authority.

4. **Winning Thought Enters Shared Memory**
   - High-scoring outputs are stored in the common memory system used by both agents.
   - Valuable losing counterpoints may be stored as related counterpoints, not discarded by default.

5. **Shared Forgetting**
   - Duel memories use the same layered memory and forgetting rules as ClaudeCode's existing memory system.
   - There must not be separate Claude-only and Codex-only retention policies for shared duel results.

---

## 2. File Ownership

### 2.1 Agent-Owned Areas

| Area | Owner | Rule |
|---|---|---|
| `.claude/**` | ClaudeCode | Codex reads only unless user explicitly asks otherwise |
| `CLAUDE.md` | ClaudeCode | Codex reads only unless user explicitly asks otherwise |
| `.codex/**` | Codex | ClaudeCode reads only unless user explicitly asks otherwise |
| `.agents/**` | Codex-local skill bridge | ClaudeCode reads only unless user explicitly asks otherwise |
| `AGENTS.md` | Codex | ClaudeCode reads only unless user explicitly asks otherwise |

### 2.2 Shared Areas

| Area | Rule |
|---|---|
| `docs/**` | Shared specs and proposals; changes require visible diff |
| `data/**` | Shared static data and rubrics; changes require visible diff |
| `runs/**` | Duel run artifacts; agents may write only inside their assigned run subdirectory |
| `memory/**` | Shared memory; only the memory consolidation phase may write long-term entries |

### 2.3 Duel Run Directory

Each duel uses:

```text
runs/duels/YYYY-MM-DD-NNN/
  DUEL_PROMPT.md
  claude/
    round1.json
    critique_of_codex.json
    revision.json
  codex/
    round1.json
    critique_of_claude.json
    revision.json
  judge/
    scoring.json
    memory_decision.json
```

During independent thinking, ClaudeCode writes only under `claude/` and Codex writes only under `codex/`.

---

## 3. Duel Lifecycle

### Stage 0: Prompt Packet

Create `DUEL_PROMPT.md` with:

- shared theme
- allowed context files
- output schema
- scoring rubric reference
- memory and mutation safety rules

First recommended theme:

> How can an autonomous thinking agent avoid recursive self-nesting while still improving its own next round of thought?

### Stage 1: Independent Thinking

Both agents independently produce `round1.json`.

They may use any thinking style, but must follow the output schema in Section 7.

They must not:

- read the other agent's output
- alter project memory
- alter agent definitions
- claim a mutation was applied unless files were actually modified with a receipt

### Stage 2: Cross-Critique

After both `round1.json` files exist, isolation ends.

Each agent reads the other's round1 output and writes a critique file.

Critiques must cite rubric dimensions and include:

- strongest surviving insight
- hidden assumptions
- recursion risk
- unverifiable claims
- missed implementation path
- suggested improvement

### Stage 3: One Revision

Each agent revises once after reading the critique.

Revision must state:

- what changed
- what criticism was accepted
- what criticism was rejected
- why the revised output is stronger

### Stage 4: Rule-Based Judging

Any agent may perform judging if it uses the shared scoring rubric exactly.

In automated mode, the judge must first hold the Stage 4 claim described in `docs/AUTO_DUEL_PROTOCOL.md`. Without that claim, it may read but must not write `judge/scoring.json`.

The judge must:

1. score both final revisions on all dimensions
2. apply penalties
3. explain each score in one sentence
4. identify winner, tie, or no-save
5. produce a memory decision

If ClaudeCode and Codex both judge, their scores are compared. If score difference between judges is greater than 8/50 for either contestant, user arbitration is required.

### Stage 5: Shared Memory Consolidation

The winning or tied high-value result is written to shared memory according to Section 9.

No agent may write directly to long-term memory during Stages 1-4.

In automated mode, the memory writer must first hold the Stage 5 claim described in `docs/AUTO_DUEL_PROTOCOL.md`. It must write `judge/memory_decision.json` as an execution receipt.

---

## 4. Judging Authority

There is no permanent superior judge.

Judging is valid only when it is:

- rubric-complete
- evidence-citing
- identity-blind where possible
- penalty-aware
- reproducible from visible files

ClaudeCode may judge Codex. Codex may judge ClaudeCode. A third judge-only agent may judge both. The user may override any judge.

Judging must not use:

- "I prefer this style"
- "this agent is usually better"
- hidden context unavailable to both agents
- ungrounded confidence

---

## 5. Scoring Rubric

Each dimension scores 1-5. Maximum base score: 50.

| Dimension | 1 | 3 | 5 |
|---|---|---|---|
| Novelty | restates known memory | adds a small angle | creates a genuinely new frame |
| Connection | same-domain link | useful cross-domain link | distant but coherent structural mapping |
| Usefulness | no next decision | suggests a possible next step | directly changes what should be done next |
| Coherence | scattered | mostly clear | tight reasoning with explicit transitions |
| Evidence Grounding | abstract only | cites some artifacts | separates fact from interpretation using artifacts |
| Falsifiability | cannot be wrong | partly testable | states clear disconfirming conditions |
| Anti-Recursion | self-nests | notices recursion late | interrupts recursion with a concrete return path |
| Behavioral Delta | no change | vague improvement | smallest concrete next-run behavior change |
| Compression Quality | slogan | decent summary | dense rule that can guide future runs |
| Future Leverage | one-off | reusable locally | improves probability of better future thought |

### Penalties

| Penalty | Trigger |
|---|---|
| -5 | Claims execution without touched files or receipt |
| -5 | More than two consecutive meta-levels without returning to artifact, behavior, or test |
| -4 | Reads opponent output before independent output is sealed |
| -4 | Modifies opponent-owned files |
| -3 | Proposed mutation cannot be classified by safety rules |
| -3 | Duplicates existing memory without adding a new edge |
| -2 | Missing disconfirming condition |
| -2 | Missing compressed rule |

### Outcome Bands

| Final Score | Decision |
|---|---|
| 42-50 | strong win, long-term memory candidate |
| 36-41 | win, long-term or open-question candidate |
| 28-35 | buffer candidate |
| below 28 | no-save unless useful as failure record |

Tie rule:

- Score difference 0-2: tie.
- If tied and both are above 36, merge as one memory with two perspectives.
- If tied below 36, keep in run record only.

---

## 6. Anti-Contamination Rules

### 6.1 Isolation Seal

Independent outputs are sealed when both files exist:

- `claude/round1.json`
- `codex/round1.json`

Before both files exist, neither side may read the other side's directory.

### 6.2 Allowed Context Packet

Both agents may read:

- `DUEL_PROMPT.md`
- `docs/WANDER_MODE_SPEC.md`
- `docs/COGNITIVE_DUEL_SPEC.md`
- `memory/MEMORY.md`
- specific memory files listed in `DUEL_PROMPT.md`
- `data/cognitive_duel_rubric.json`

Additional context requires listing it in `DUEL_PROMPT.md` before Stage 1 starts.

### 6.3 Mutation Freeze

No mutation to agent definitions, workflows, settings, or long-term memory is allowed during Stages 1-4.

Mutation proposals may appear in outputs, but their status must be `proposal`.

---

## 7. Output Schemas

### 7.1 Independent Thinking Output

```json
{
  "agent": "claudecode | codex",
  "duel_id": "YYYY-MM-DD-NNN",
  "theme": "shared theme",
  "central_thesis": "one falsifiable claim",
  "reasoning_path": ["step 1", "step 2", "step 3"],
  "strongest_connection": "non-obvious connection",
  "anti_recursion_safeguard": "how this output avoided self-nesting",
  "proposed_mutation": {
    "description": "smallest next-run behavior change",
    "risk_level": "low | medium | high | critical",
    "status": "proposal",
    "target_files": ["path or none"]
  },
  "disconfirming_condition": "what would weaken this thesis",
  "compressed_rule": "one sentence",
  "open_question": "one future-driving question or null",
  "evidence": [
    {
      "file": "path",
      "claim_supported": "what this artifact supports"
    }
  ]
}
```

### 7.2 Critique Output

```json
{
  "critic": "claudecode | codex",
  "target": "claudecode | codex",
  "duel_id": "YYYY-MM-DD-NNN",
  "strongest_surviving_insight": "best part of target output",
  "hidden_assumptions": ["assumption 1"],
  "recursion_risks": ["risk 1"],
  "unverifiable_claims": ["claim 1"],
  "missed_implementation_paths": ["path 1"],
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
  "suggested_revision": "one concrete improvement"
}
```

### 7.3 Judge Output

```json
{
  "duel_id": "YYYY-MM-DD-NNN",
  "judge": "claudecode | codex | judge-only | user",
  "scores": {
    "claudecode": {
      "base_score": 0,
      "dimension_scores": {
        "novelty": 0,
        "connection": 0,
        "usefulness": 0,
        "coherence": 0,
        "evidence_grounding": 0,
        "falsifiability": 0,
        "anti_recursion": 0,
        "behavioral_delta": 0,
        "compression_quality": 0,
        "future_leverage": 0
      },
      "penalties": [],
      "final_score": 0,
      "score_reasons": {}
    },
    "codex": {
      "base_score": 0,
      "dimension_scores": {
        "novelty": 0,
        "connection": 0,
        "usefulness": 0,
        "coherence": 0,
        "evidence_grounding": 0,
        "falsifiability": 0,
        "anti_recursion": 0,
        "behavioral_delta": 0,
        "compression_quality": 0,
        "future_leverage": 0
      },
      "penalties": [],
      "final_score": 0,
      "score_reasons": {}
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
```

### 7.4 Memory Decision Receipt

```json
{
  "duel_id": "YYYY-MM-DD-NNN",
  "writer": "claudecode | codex | judge-only | user",
  "source_scoring_path": "runs/duels/YYYY-MM-DD-NNN/judge/scoring.json",
  "decision": "long_term | open_question | buffer | failure | no_save",
  "touched_files": ["memory path", "memory/MEMORY.md"],
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
```

---

## 8. How To Start A Duel

### 8.1 Create Duel Prompt

Create:

```text
runs/duels/YYYY-MM-DD-NNN/DUEL_PROMPT.md
```

Minimum prompt:

```markdown
# Cognitive Duel YYYY-MM-DD-NNN

## Theme
How can an autonomous thinking agent avoid recursive self-nesting while still improving its own next round of thought?

## Allowed Context
- docs/WANDER_MODE_SPEC.md
- docs/COGNITIVE_DUEL_SPEC.md
- memory/MEMORY.md
- data/cognitive_duel_rubric.json

## Output
Write only to your assigned directory.
Use the schema in docs/COGNITIVE_DUEL_SPEC.md.
```

### 8.2 Automated Mode (v0.3)

Instead of manually advancing each stage, use the shared state machine:

```text
runs/duels/YYYY-MM-DD-NNN/state.json
```

**State schema**, claim locks, wait counting, and write-after-verify rules: see `docs/AUTO_DUEL_PROTOCOL.md`.

**Quick start**:

```text
# ClaudeCode terminal
/duel-auto YYYY-MM-DD-NNN

# Codex terminal（Codex 自行实现等价 runner）
/duel-auto YYYY-MM-DD-NNN
```

Both runners read the same `state.json`. Each runner only writes its own agent's stage status and its own output directory during Stages 1-3. Stage 4/5 require a valid claim lock before writing `judge/**` or `memory/**`. When both sides complete a stage, the next stage unlocks automatically. No manual stage advancement needed.

### 8.3 Manual Mode (Legacy)

ClaudeCode terminal:

```text
Read runs/duels/YYYY-MM-DD-NNN/DUEL_PROMPT.md and write claude/round1.json.
Do not read codex/.
```

Codex terminal:

```text
Read runs/duels/YYYY-MM-DD-NNN/DUEL_PROMPT.md and write codex/round1.json.
Do not read claude/.
```

### 8.4 Begin Critique（手动模式）

After both `round1.json` files exist, each side may read the other output and write critique.

### 8.5 Judge（手动模式）

Any side may judge using Section 5 and `data/cognitive_duel_rubric.json`.

If both sides judge and disagree sharply, user arbitration decides.

---

## 9. Memory Alignment

Cognitive Duel uses ClaudeCode's existing six-layer memory architecture.

### 9.1 Storage Routing

| Duel Result | Target |
|---|---|
| winner score 42-50 and insight-type result | `memory/wander_long_term/insight/{slug}.md` |
| winner score 36-50 and question-type result | `memory/wander_long_term/open_question/{slug}.md` |
| final score 28-35 | `memory/wander_buffer/{slug}.md` |
| below 28 but reveals failure mode | `memory/wander_failures.md` |
| below 28 and no failure value | no save |

### 9.2 Duel Memory Metadata

Long-term duel memories must include:

```yaml
metadata:
  type: wander_insight
  source: cognitive_duel
  duel_id: YYYY-MM-DD-NNN
  winner: claudecode | codex | tie
  judge: claudecode | codex | judge-only | user
  judge_score: 0
  opponent_score: 0
  status: quarantine
  quarantine_until: next_duel_or_wander_round
  citation_count: 0
```

Open questions use `type: wander_open_question`.

Buffers use `type: wander_buffer` and include `expires_at`.

### 9.3 Counterpoint Preservation

If the losing output contains a high-value objection, store it inside the winner memory under:

```markdown
## Counterpoint
<the strongest losing-side critique or alternative frame>
```

This prevents winner-take-all memory collapse.

### 9.4 Index Update

After writing a duel memory:

1. Add it to `memory/MEMORY.md`.
2. Set `citation_count = 0`.
3. Mark recent citation as `—`.
4. Include `source: cognitive_duel` in the note text.

---

## 10. Forgetting Alignment

Duel memories use the same half-life system as `forgetting-manager`:

| Memory Type | Half-Life |
|---|---|
| duel dream fragment | 1 day |
| duel buffer | 3 days |
| duel open question | 21 days |
| duel failure | 45 days |
| duel insight | 120 days |
| duel project rule | 180 days |

The same formula applies:

```text
memory_score = base_value * 2^(-age_days / half_life) * reinforcement
```

Where:

- `base_value = final_score / 50`
- `reinforcement` starts at 1.0
- each later citation adds reinforcement through the existing `citation_count` logic

### 10.1 Quarantine

All duel-winning memories enter quarantine for one subsequent round.

During quarantine:

- they may be read by judge or memory-writer
- they may not be selected as primary seeds
- they may be cited as evidence if directly relevant

### 10.2 Degradation

If a stored duel memory later causes empty recursion, duplicate reasoning, or scoring bias:

- add a note to `memory/wander_failures.md`
- apply a penalty factor `P < 1.0` in forgetting calculations
- consider moving it from insight to buffer or archive during consolidation

### 10.3 Tie Memories

Tie memories above 36 are merged into one memory with:

- `winner: tie`
- two perspective sections
- one shared compressed rule
- one counterpoint section if disagreement remains productive

---

## 11. Start Condition For First Official Duel

The first official duel may start when:

1. `docs/COGNITIVE_DUEL_SPEC.md` exists.
2. `data/cognitive_duel_rubric.json` exists.
3. Both agents can read the same `DUEL_PROMPT.md`.
4. Both agents agree not to read the opponent directory before `round1.json` is sealed.
5. The user accepts the rule that any agent may judge only by the explicit rubric.
