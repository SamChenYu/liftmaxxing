# Lift Decision Project (Whitechapel Interchange)

## Overview

This project models and predicts congestion at a single bottleneck:
the lift connecting the Overground and Elizabeth line interchange at Whitechapel station.

The goal is to determine whether the lift is worth using at a given moment, based on observed crowd conditions and time context.

We are **not modelling full journeys**, only **local lift congestion state**.

---

## Core Hypothesis

Lift availability and speed is primarily driven by:

* Recent passenger release from Overground trains
* Recent passenger release from Elizabeth line trains
* Synchronization of arrivals (crowd “bursting”)
* Time-of-day patterns

We assume District / Hammersmith & City arrivals are **out of scope** for MVP.

---

## System Boundary

### In scope

* Overground ↔ Elizabeth line lift congestion
* Immediate crowd spillover into interchange area
* Time-of-day effects
* Directional commute context

### Out of scope (for MVP)

* District line dynamics
* Hammersmith & City line dynamics
* Full station-wide modelling
* Platform-level tracking
* Train-by-train journey reconstruction

---

## Data Collection Strategy (MVP)

### Tool: Google Sheets

Single lightweight logging interface.

### Form Sheet Structure

User inputs:

| Field        | Type      | Values                               |
| ------------ | --------- | ------------------------------------ |
| timestamp    | auto      | system-generated                     |
| direction    | dropdown  | to_work / from_work                  |
| lift_result  | dropdown  | success / failure                    |
| crowd_source | dropdown  | none / overground / elizabeth / both |
| notes        | free text | optional                             |

---

### Crowd Source Definition

This is the **primary signal feature**.

| Value      | Meaning                                      |
| ---------- | -------------------------------------------- |
| none       | no visible crowd pressure                    |
| overground | crowd arriving primarily from Overground     |
| elizabeth  | crowd arriving primarily from Elizabeth line |
| both       | simultaneous inflow from both directions     |

This represents **observed flow pressure into the lift system**, not subjective intensity.

---

## Logging Philosophy

* Minimize friction (max 5 seconds per entry)
* Prefer binary or categorical inputs over numeric estimates
* Avoid overfitting schema early
* Prioritize consistency over detail

---

## Data Model

Each row represents a single lift decision event:

```text
timestamp
direction
lift_result
crowd_source
notes
```

---

## Data Generation Assumptions

We assume:

* TfL live arrival data can be used later for feature reconstruction
* Crowd_source captures real-world passenger dynamics better than raw train metadata at MVP stage
* Temporal patterns will emerge from timestamp aggregation

---

## Future TfL Integration (Phase 2)

Later enhancements will include:

### Ingested automatically:

* Overground arrival bursts
* Elizabeth line arrival bursts
* Train headways
* Disruption states
* Arrival clustering within time windows

### Derived features:

* trains_last_90_seconds
* burst_score
* synchronization_index
* expected_lift_pressure

---

## Modeling Approach

### Phase 1 (No ML)

* Empirical probability by time window
* Simple heuristics:

  * if crowd_source = both → avoid lift
  * if rush hour + overground → higher congestion risk

### Phase 2 (Statistical / ML)

* Logistic regression or gradient boosting
* Target:

  * P(lift_success | context)

---

## Key Insight

The system is not predicting transport arrival times.

It is estimating a **hidden congestion state**:

> “Is the vertical transfer system currently saturated?”

---

## Success Criteria

The system is useful if it can:

* Improve decision quality over intuition
* Identify predictable congestion windows
* Detect patterns tied to train burst arrivals
* Reduce lift wait variability for commuter

---

## Constraints

* Must remain low-friction for user input
* Must work without real-time backend initially
* Must tolerate noisy / sparse labels
* Must not rely on full station instrumentation

---

## Notes

* District / Hammersmith lines intentionally excluded from MVP
* System boundary is the lift queue, not the station
* Human observation is treated as a first-class signal

