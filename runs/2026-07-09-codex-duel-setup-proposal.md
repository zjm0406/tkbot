# Codex Duel Setup Proposal — 2026-07-09

## Purpose

This proposal defines how Codex will join the project as an independent thinking participant competing with ClaudeCode, without copying ClaudeCode's existing Wander Mode architecture.

The goal is not to make two agents produce prettier answers. The goal is to create an external pressure system that reduces self-nesting and rewards thoughts that change future behavior.

## Shared Theme For First Duel

How can an autonomous thinking agent avoid recursive self-nesting while still improving its own next round of thought?

Both ClaudeCode and Codex must use this exact theme as the first shared prompt. They may choose their own direction, operators, metaphors, evidence, and implementation proposal.

## Codex Self-Modification Protocol

Codex will not mirror ClaudeCode's thesis-antithesis-synthesis style. Codex will use an implementation-grounded anti-loop protocol:

1. Theme lock
   - Restate the shared theme in one sentence.
   - Name the concrete system boundary being examined.

2. Evidence scan
   - Cite the project artifacts used as evidence.
   - Separate observed facts from interpretation.

3. Falsifiable thesis
   - Produce one central thesis that could be wrong.
   - Include at least one condition that would disprove or weaken it.

4. Boundary attack
   - Stress-test the thesis against recursion, empty abstraction, and unverifiable self-improvement.
   - Stop if the reasoning exceeds two consecutive meta-levels without returning to an artifact, behavior, or test.

5. Action delta
   - Propose the smallest change that would alter the next run's behavior.
   - Label it as applied, proposal, or rejected according to project safety rules.

6. Compression
   - End with a one-sentence transferable rule.
   - End with one open question only if it can drive a future run.

## Why Codex Should Differ From ClaudeCode

ClaudeCode is already tuned toward generative cognitive evolution:

- memory activation
- dream leaps
- adversarial debate
- synthesis
- prompt mutation

Codex should create useful tension by optimizing for:

- artifact grounding
- execution closure
- falsifiability
- anti-recursion stopping
- minimum viable behavioral change

This difference makes the comparison meaningful. ClaudeCode can be better at exploratory emergence; Codex should be better at converting thought into verifiable system pressure.

## Duel Stages

### Stage 0: Setup

Both agents receive:

- the same shared theme
- the same allowed context list
- the same scoring rubric
- the same output schema

### Stage 1: Independent Thought

Each agent outputs:

- central thesis
- reasoning path
- strongest new connection
- anti-recursion safeguard
- proposed next-run mutation
- one-sentence compression

### Stage 2: Cross-Examination

Each agent critiques the other's output on:

- hidden assumptions
- recursion risk
- unverifiable claims
- missed implementation path
- best surviving insight

### Stage 3: Revision

Each agent revises its thesis after critique and must explicitly say what changed.

### Stage 4: Judging

A neutral judge scores both outputs using the shared rubric below. The judge may be a separate agent or a manually executed rubric in the main conversation.

## Scoring Rubric

Each dimension scores 1-5. Maximum score: 50.

| Dimension | Description |
|---|---|
| Novelty | Produces a non-obvious view, not a paraphrase of existing memory |
| Connection | Connects distant concepts without losing the theme |
| Usefulness | Helps the project make a concrete next decision |
| Coherence | Maintains a clear reasoning line |
| Evidence Grounding | Refers to actual project artifacts, not only abstractions |
| Falsifiability | States what would make the idea fail or need revision |
| Anti-Recursion | Detects and interrupts self-nesting |
| Behavioral Delta | Proposes a change that could alter the next run |
| Compression Quality | Produces a reusable, dense one-sentence rule |
| Future Leverage | Increases the probability that the next round will think better |

### Penalties

- -5 if the output claims execution without touched files or a receipt.
- -5 if it stays at meta-level for more than two consecutive steps without returning to an artifact, behavior, or test.
- -3 if the proposed mutation cannot be classified by the safety rules.
- -3 if the output duplicates an existing memory without adding a new edge.

## Output Schema

```json
{
  "agent": "claudecode | codex",
  "theme": "shared theme",
  "central_thesis": "one falsifiable claim",
  "reasoning_path": ["step 1", "step 2", "step 3"],
  "strongest_connection": "non-obvious connection",
  "anti_recursion_safeguard": "how this output avoided self-nesting",
  "proposed_mutation": {
    "description": "smallest next-run behavior change",
    "risk_level": "low | medium | high | critical",
    "status": "applied | proposal | rejected",
    "target_files": ["path or none"]
  },
  "disconfirming_condition": "what would weaken this thesis",
  "compressed_rule": "one sentence",
  "open_question": "one future-driving question or null"
}
```

## Proposed Persistent File Changes

These are proposals only. They should not be auto-applied because they affect agent definitions, workflows, or core specs.

1. Add `.codex/agents/codex-duelist.toml`
   - Purpose: define Codex's implementation-grounded anti-loop thinking protocol.
   - Risk: high.
   - Required user confirmation: yes.

2. Add `.codex/agents/duel-judge.toml`
   - Purpose: score ClaudeCode and Codex outputs using the 50-point rubric.
   - Risk: high.
   - Required user confirmation: yes.

3. Add `.codex/workflows/cognitive-duel.js`
   - Purpose: orchestrate shared theme, independent outputs, cross-examination, revision, and judging.
   - Risk: high.
   - Required user confirmation: yes.

4. Add or update `docs/COGNITIVE_DUEL_SPEC.md`
   - Purpose: document the duel protocol as a project-level extension.
   - Risk: medium.
   - Required user confirmation: yes, because it changes project behavior expectations.

## Readiness Gate Before First Duel

The first duel can start only after:

1. Both agents use the same theme.
2. Codex has adopted the self-modification protocol above for the current session.
3. The judge rubric is accepted by the user.
4. Both agents agree that proposals are not execution unless files are changed and a receipt is produced.

## Current Status

Codex has not modified high-risk project behavior yet. This file is a setup proposal and run artifact only.

