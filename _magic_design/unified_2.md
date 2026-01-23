Excellent — that’s exactly the right moment to lock in **loci / anchors** as true infrastructure pieces of the world rather than bounded abstractions.
We’ll tackle this in three layers:

1. The **reference sheet** for entropy and spell construction (ready-to-insert in a rulebook).
2. **Locus & Anchor creation** – cost, crafting, and scaling quality.
3. **Economy and wealth** scaling across Tier 1–10 adventuring.

---

# ✴ Unified Spellcasting Reference

### ✦ Core Equation

> **Spell Entropy = Intent + Concept + Delivery + Form + Duration**

Each component contributes **entropy (e)**.
Each known component (through study) reduces its contribution by **1 e (min 0)**.
Casting time is measured in **actions (a)**.

Containment = Tier + Will + relevant Studies.
Resolve or stabilisers (Focus, Locus, Anchor) absorb excess entropy.

### ✦ Standard Component Costs

| Component    | Default Cost                                 | Reduced by Knowledge of… |
| ------------ | -------------------------------------------- | ------------------------ |
| **Intent**   | 1 e / 1 a                                    | Intent Family            |
| **Concept**  | 1 e / 1 a                                    | Concept Study            |
| **Delivery** | 1 e / 1–4 a (Self 1, Touch 2, Near 3, Far 4) | Spatial Study            |
| **Form**     | 1 e / +1 a                                   | Spellform Study          |
| **Duration** | 0–9 e / 0–1 a                                | Temporal Study           |

**Total Entropy (e)** → compare to containment.
Excess entropy = Resolve cost or must be stabilised.

---

### ✦ Unified Entropy Ladder

Both **time** and **space** share the same entropy ladder.
Each level represents roughly a ten-fold increase in persistence and area.

| **Entropy** | **Typical Duration**  | **Spatial / Area Scale** | **Tier able to stable cast** |
| ----------- | --------------------- | ------------------------ | ---------------------------- |
| **0**       | Instant (1 action)    | 1 m / self               | 1                            |
| **1**       | 1 Round               | 5 m                      | 1                            |
| **2**       | 1 Minute              | 10 m                     | 2                            |
| **3**       | 10 Minutes            | 25 m                     | 2                            |
| **4**       | 1 Hour                | 50 m                     | 3                            |
| **5**       | 12 Hours              | 100 m                    | 3                            |
| **6**       | 1 Day                 | 100 m                    | 4                            |
| **7**       | 1 Week                | 250 m                    | 5                            |
| **8**       | 1 Month               | 250 m                    | 6                            |
| **9**       | 1 Year                | 1 km / city              | 7                            |
| **10**      | 10 Years              | 10 km / region           | 8                            |
| **12**      | Permanent             | continental / planar     | 9                            |

A caster can always *cast* a spell of higher entropy than they are able to cast stably as a **ritual**, whose base duration equals the time-band immediately below the desired one.
When casting a spell of higher temporal entropy, increase the cast time by the band below e.g. a 10minute duration adds a 1minute cast time, a caster can spend resolve equal to that entropy to reduce the cast time by one level, so 10m duration 1m cast spending 2 resolve reduces the cast to 1 round, a further 1 resolve would bring the cost to 1 action.
1 More than containment costs resolve equal to the increase in entropy
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
6. Casting time = entropy band’s action cost (usually 1 action per component plus the spell’s extra visualisation time).

### ✦ Typical Example (Tier 1)

**Create Fire Near for 10 minutes (Burst 2 m)**

```
Create (1a/1e)
Fire (1a/1e)
Near (3a/1e)
Burst (1a/1e)
Duration 10 min (0a/3e)
Total = 6a / 7e
Known: Create, Fire, Near, Burst → -4e
Final = 6a / 3e
```

Tier 3 containment = free cast with 1 minute ritual (can spend 2 resolve instead to make this free)
Tier 2 containment = spend 1 Resolve and take 1 minute ritual
Tier 1 containment = spend 2 Resolve and take 1 minute ritual

---

### ✦ Alternative Entropy Sinks

| Stabiliser  | Description                        | Function                                                   |
| ----------- | ---------------------------------- | ---------------------------------------------------------- |
| **Resolve** | Personal vitality                  | Pay 1 per excess entropy                                   |
| **Focus**   | Portable item (wand, torch, relic) | Cancels 1–2 e for aligned concept                          |
| **Locus**   | Fixed, prepared site               | Holds any amount of entropy based on quality and materials |
| **Anchor**  | Bound object / relic               | Stores temporal entropy indefinitely                       |

---

# ✴ Loci & Anchors

## ✦ Locus

A **locus** is a *fixed pattern of meaning* — a ritual circle, altar, or sacred site.
It defines the *origin* or *target* of a spell and provides stable containment.

### Locus Grade & Cost

| Grade        | Material / Description       | Stable Entropy | Creation Cost* | Notes                              |
| ------------ | ---------------------------- | -------------- | -------------- | ---------------------------------- |
| **Minor**    | chalk circle, carved sigil   | 3 e            | 10 × Tier^2    | usable once, crumbles after effect |
| **Standard** | stone altar, permanent glyph | 6 e            | 100 × Tier^2   | reusable, requires cleansing       |
| **Greater**  | temple chamber, ley focus    | 9 e            | 1,000 × Tier^2 | permanent node                     |
| **Mythic**   | world leyline, divine font   | unlimited      | priceless      | natural or god-made                |

*Cost in local currency units per caster Tier — easily converted to silver/gold/etc.
Each additional 1 e capacity above the listed rating doubles material cost.

---

## ✦ Anchor

An **anchor** is a *portable or semi-portable vessel* that stores entropy over time: rings, staves, relics, golems.

### Anchor Grade & Cost

| Grade     | Item Example         | Stable Entropy | Creation Time | Material Cost   |
| --------- | -------------------- | -------------- | ------------- | --------------- |
| **Minor** | charm, ring, wand    | 3 e            | 1 week        | 100 × Tier^2    |
| **Major** | staff, sword, statue | 6 e            | 1 month       | 1,000 × Tier^2  |
| **Relic** | artifact, monument   | 9 e+           | 1 year        | 10,000 × Tier^2 |

Anchors can *accumulate Resolve* equal to their stable entropy.
When charged, they maintain effects passively (e.g. a ring of protection “fed” 2 Resolve each morning).

---

# ✴ Wealth & Economy by Tier

Treat wealth as the measure of **ritual access** rather than currency hoard.
Each Tier’s expected resources match the scale of entropy they can manipulate.

| **Tier**      | **Lifestyle / Wealth Band** | **Typical Treasure Value** | **Item Band**                  |
| ------------- | --------------------------- | -------------------------- | ------------------------------ |
| 1 Common      | day-laborer, adventurer     | 100 coins                  | minor foci, charms             |
| 2 Uncommon    | guild-trained, soldier      | 500 coins                  | lesser scrolls, reagents       |
| 3 Rare        | seasoned adventurer         | 2 000 coins                | quality anchors, potions       |
| 4 Legendary   | knight, master mage         | 10 000 coins               | crafted locus materials        |
| 5 Mythic      | hero, archmage              | 50 000 coins               | major anchors, relic fragments |
| 6 Demigod     | planar champion             | 250 000 coins              | divine foci                    |
| 7 Minor Deity | cult patron                 | 1 000 000 coins            | domain anchors                 |
| 8 Major Deity | pantheon head               | 5 000 000 coins            | city or world loci             |
| 9 Firstborn   | primal architect            | 25 000 000 coins           | leyline constructs             |
| 10 Source     | cosmic origin               | —                          | creation itself                |

### Practical guideline

* **Minor items** ≈ ½ Tier’s expected treasure.
* **Major items** ≈ 2–3× Tier’s treasure.
* Anchors and loci are investments, not loot; heroes find **raw materials, relic shards, or sites** worth that value, keeping the treasure loop intact.

---

# ✴ Summary Flow

1. **Compose Phrase** → determine components.
2. **Total Entropy** → sum base + duration – known.
3. **Containment Check** → Tier + Will + Studies.
4. **Resolve / Focus / Locus / Anchor** → stabilise excess.
5. **Manifest** → spend listed actions.

Everything — from torchlight to divine ward — obeys the same algebra:

> **Entropy is the single price of magic.**

---

Would you like the next iteration to include **worked examples of locus / anchor construction** (materials, time, returns) and a **currency equivalence table** so GMs can plug their own economy scale into the costs above?
