TODO: Address bounds and  cost on alternate resolve methods

----- 

That’s a really elegant consolidation — you’re now describing a *single unified cost model* where **entropy is the sole currency of magic**, and every other factor (actions, resolve, ritual time, skill) simply mediates how entropy is expressed or stabilised.

Let’s bring everything together cleanly under that principle.

---

## 🜂 1.  Core Rule:

### **Every spell has one total entropy value.**

> **Total Entropy = Intent + Concept + Delivery + Form + Duration**

* Each component adds entropy (default 1 e each).
* Duration adds additional entropy based on the time-band.
* **Actions** are the *time required to visualise* the spell, scaling with its entropy band.
* **Resolve** and **rituals** are alternative means to stabilise or release entropy that exceeds containment.

### Unified notation

> `Xa / Ye` → X = visualisation time (actions or minutes) Y = total entropy of the spell

Containment (≈ Tier + Will + Study modifiers) is the maximum entropy a caster can hold stably.
Anything above that must be paid for in *Resolve* or off-loaded into *anchors, foci, loci,* or *ritual time*.

---

## 🜃 2.  Default Component Entropy

| Component    | Base Entropy | Reduced by Knowledge of… |
| ------------ | ------------ | ------------------------ |
| **Intent**   | 1 e          | Intent family            |
| **Concept**  | 1 e          | Concept study            |
| **Delivery** | 1 e          | Spatial study            |
| **Form**     | 1 e          | Spellform study          |
| **Duration** | 0–9 e        | Temporal study           |

Each known component reduces its contribution by 1 e (to a minimum 0 e).

---

## 2.1 Components of a Spell

Each spell is written as a *grammatical sentence*.
Each component contributes actions and entropy, both of which can be reduced through study.

### 2.1 Intent – *What you seek to do*

Verbs of magical purpose.

| Family          | Intents                           | Description                                    |
| --------------- | --------------------------------- | ---------------------------------------------- |
| **Formative**   | Create, Destroy, Transmute, Shape | Construct, erase, or reshape matter and energy |
| **Kinetic**     | Move, Stop                        | Control motion or momentum                     |
| **Integrative** | Infuse, Extract                   | Merge or separate concepts and subjects        |
| **Protective**  | Protect from, Protect with        | Ward or repel effects                          |
| **Cognitive**   | Reveal, Obscure                   | Perception, knowledge, deception               |
| **Temporal**    | Delay, Sustain                    | Manipulate time and persistence                |

**Base Cost:** `1a / 1e`
**Study Benefit:** –1 e if the Intent family is known.

---

### 2.2 Concept – *What force or principle you act upon*

The noun of the spell, defining the domain of power.

| Tier | Category  | Examples                             | Intelligence Prerequisite |
| ---- | --------- | ------------------------------------ | ------------------------- |
| I    | Material  | Flesh, Metal, Poison, Blood          | Int 1–2                   |
| II   | Elemental | Fire, Water, Air, Earth, Light, Dark | Int 3–4                   |
| III  | Emotional | Rage, Fear, Joy, Calm                | Int 5–6                   |
| IV   | Symbolic  | Virtue, Sin, Death, War, Fate        | Int 7–9                   |

**Base Cost:** `1a / 1e`
**Study Benefit:** –1 e if Concept known.
**Advanced Rule:** If Intelligence is below the prerequisite, spend 1 additional Skill per missing point to access higher tiers.

---

### 2.3 Delivery – *Where and to whom the effect applies*

| Range     | Actions | Entropy | Description                |
| --------- | ------- | ------- | -------------------------- |
| **Self**  | 1       | 1       | Caster only                |
| **Touch** | 2       | 1       | Physical contact           |
| **Near**  | 3       | 1       | Up to 10 m                 |
| **Far**   | 4       | 1       | Up to 50 m / line of sight |

**Study Benefit:** –1 e if the caster has a Spatial Study.
**Extended Range:** Remote or extraplanar effects require a **Locus or Anchor** and are always performed as rituals.

---

### 2.4 Form – *The geometry of the effect*

| Form      | Base Actions | Base Entropy | Description                      |
| --------- | ------------ | ------------ | -------------------------------- |
| **Point** | 0            | 0            | single target or origin          |
| **Line**  | +1           | +1           | 10× length × entropy band        |
| **Cone**  | +1           | +1           | 5× radius × entropy band         |
| **Burst** | +1           | +1           | 2× radius × entropy band         |
| **Wall**  | +1*           | +1           | planar construct; adds dimension |

Applied with line,cone or burst

**Study Benefit:** –1 e if the caster knows the Spellform.
Scaling area or size adds +1 entropy per magnitude (doubling).

---

## 🜄 3.  Duration & Scale Entropy – “Bands of Order”

Both **time** and **space** share the same entropy ladder.
Each level represents roughly a ten-fold increase in persistence and area.

| **Entropy** | **Typical Duration**  | **Spatial / Area Scale** | **Tier able to cast freely** | **If Below Tier**                  |
| ----------- | --------------------- | ------------------------ | ---------------------------- | ---------------------------------- |
| **0**       | Instant               | 1 m / self               | 1                            | —                                  |
| **1**       | 1 Round               | 5 m                      | 1                            | —                                  |
| **2**       | 1 Minute              | 10 m                     | 2                            | spend 2 Resolve to accelerate cast |
| **3**       | 10 Minutes            | 25 m                     | 2                            | spend 3 Resolve or 1 min ritual    |
| **4**       | 1 Hour                | 50 m                     | 3                            | spend 4 Resolve or 10 min ritual   |
| **5**       | 12 Hours              | 100 m                    | 3                            | spend 5 Resolve or 1 h ritual      |
| **6**       | 1 Day                 | 100 m                    | 4                            | spend 5 Resolve or 1 h ritual      |
| **7**       | 1 Week                | 250 m                    | 5                            | spend 6 Resolve or 1 day ritual    |
| **8**       | 1 Month               | 250 m                    | 6                            | spend 6 Resolve or 1 week ritual   |
| **9**       | 1 Year                | 1 km / city              | 7                            | ritual (month)                     |
| **10**      | 10 Years              | 10 km / region           | 8                            | ritual (year)                      |
| **12**      | Permanent             | continental / planar     | 9                            | anchor required                    |

A caster can always *cast* a spell of higher entropy as a **ritual**, whose base duration equals the time-band immediately below the desired one.
1 More than containment costs resolve
2+ More then you need an Anchor

---

## 🜁 5.  Calculating the Spell

1. Add 1 e per component (Intent, Concept, Delivery, Form).
2. Add duration entropy from the table.
3. Subtract 1 e per known component.
4. Multiply by how abstract the effect is
5. Compare total e to containment.
    • ≤ Containment → stable cast.
    • > Containment → spend (difference) Resolve or transfer to an external stabiliser.
6. Casting time = entropy band’s action cost (usually 1 action per component plus the band’s extra visualisation time).

---

### Example A – *Create Fire Near for 10 minutes in a 2 m Burst*

| Component                     | Base e   | Known? | Final e |
| ----------------------------- | -------- | ------ | ------- |
| Intent (Create)               | 1        | yes    | 0       |
| Concept (Fire)                | 1        | yes    | 0       |
| Delivery (Near)               | 1        | yes    | 0       |
| Form (Burst 2 m)              | 1        | yes    | 0       |
| Duration (10 min = Entropy 3) | 3        | —      | 3       |
| **Total Entropy**             | 6 (base) | —      | **3 e** |

**Total cost:** 6 actions / 3 entropy.
A Tier 3 caster (containment 3) casts freely.
A Tier 1 caster (containment 1) may:

* spend 2 Resolve → instant 6a / 3e cast, or
* take 1 minute to perform as a short ritual.

---

### Example B – Untrained Folklore Ritual

No relevant studies, same spell:

```
Create (1e) + Fire (1e) + Near (1e) + Burst (1e) + Duration 3 e = 7 e total
≈ month-long ritual for non-casters
```

This becomes a folkloric or religious rite: the “ritual memory” of what trained casters can do instantly.

---

### Example C – Wand of Fireburst

Wand inscription fixes the components.
The user only provides entropy for **duration**.
Activation cost = same 6a / 4e (includes 1 e stored in the wand’s focus).
A Tier 1 wielder can charge the wand with Resolve equal to the excess (2 Resolve) to ignite it immediately.

---

## 🜇 6.  Alternative Entropy Sinks

When total e > containment, surplus entropy can be tied into:

| Stabiliser      | What it does                                                       | Typical Capacity        |
| --------------- | ------------------------------------------------------------------ | ----------------------- |
| **Resolve**     | Personal vitality; instant stabilisation                           | 1 e per Resolve spent   |
| **Focus**       | Portable conduit (wand, torch)                                     | 1–2 e for its concept   |
| **Locus**       | Fixed ritual geometry                                              | 2–5 e within its bounds |
| **Anchor**      | Dedicated vessel / relic                                           | 5–9 e long-term         |
| **Ritual Time** | Replace Resolve cost with preparation time from lower entropy band | varies                  |

---

## 🜈 7.  Reading the System in Play

* **Actions** = speed of shaping
* **Entropy** = total strain
* **Containment** = Tier + Will + Studies
* **Resolve** = how far beyond your limits you dare reach
* **Foci / Loci / Anchors** = external stabilisers for persistent or large-scale effects

Everything — casting time, cost, and permanence — flows from that single entropy number.

---

Would you like me to prepare a **reference sheet version** next (a concise, two-column layout with the entropy ladder, example phrases, and containment summary) so it can drop directly into your rulebook?
