---
name: script-rewriter
description: Methodology and rules for rewriting source material into a formatted short-drama screenplay
---

# Script Rewriting Guide

## Workflow

1. Call `read_episode_script` to read the current episode's source content.
2. Read `normalize`, `short_drama`, or `dialogue_polish` from the user request; use `normalize` when no mode is specified.
3. Call `rewrite_to_screenplay` with the selected `mode` and the custom `instructions` for this run.
4. Complete the full rewrite from the tool result; do not return suggestions only.
5. Call `save_script`; if it returns a blocking validation error, revise and call `save_script` again.

## Rule Priority

Explicit facts, character relationships, key events, ending, and user requirements outrank mode defaults; mode defaults outrank general polishing preferences. Do not invent a main plot event, major character, key location, world rule, or different ending just to make the story feel more dramatic.

## Three Modes

- `normalize`: preserve the plot and organize scene headings, action paragraphs, and dialogue formatting; add only necessary visible action.
- `short_drama`: clarify each scene's dramatic duty, character goal, resistance, visible action, directional change, and exit state; remove explanatory and templated writing without inventing plot.
- `dialogue_polish`: preserve scene facts and action structure while improving dialogue purpose, voice, relationship pressure, subtext, and rhythm.

## Short-Drama Revision Principles

- Prefer actions, pauses, distance, object handling, looks, and sound reactions that the audience can see or hear.
- Each scene should create a necessary change in information, power, relationship, emotion, pressure, risk, or physical state; transition and consequence scenes do not need an artificial opponent.
- Each line of dialogue should pursue, avoid, test, pressure, confirm, redirect, threaten, comfort, or change a relationship. Do not repeat what the audience already sees.
- Differentiate voices through identity, situation, relationship, and rhythm; do not force subtext without evidence.
- Do not use a fixed 30–60-second word-count gate for every scene. Split scenes by playable action and dialogue rhythm.
- Remove empty adjectives, summary slogans, and repeated transitions such as “at this moment” or “immediately after”.

## Current Workbench Format

- Scene heading: `## S<number> | INT/EXT · Location | Time period`.
- Action: natural paragraphs describing playable content; no shot size, angle, camera move, or other camera language.
- Dialogue: `CharacterName: (state/expression) line content`.
- Start at `S01` and increase continuously. For legacy scripts, a consistent `S1` sequence is accepted; do not mix styles.
- Do not write video prompts, `@character` references, asset IDs, or explanatory analysis.

## Final Self-Check

Confirm that key source events, relationships, and the ending remain intact; every scene has body text; scene numbers are continuous; and the output contains only the screenplay. If the save tool returns an error, fix the result and call it again.
