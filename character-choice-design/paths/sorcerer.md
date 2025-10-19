Excellent, thank you for giving me the **spellcasting framework** — that’s a strong foundation for how the **Sorcerer Path** should feel: a caster whose strength isn’t in careful preparation (*like a Wizard*) or devotion (*like a Cleric*), but in **raw inner energy**.

Let’s set the **core mechanics** for Sorcerer, then build out **Initiate skills** (including their special mechanic), followed by **Tier Skills** and **Path skills**.

---

# **Path: Sorcerer**

**Theme:**
*A Sorcerer is a magician who draws on an inner font of raw power rather than study or ritual. Their magic is instinctive, sometimes erratic, but always potent. They channel this **Inner Power** into shaping spell concepts, overwhelming foes with spells that bend reality through sheer force of will.*

**Roles:** `magic`, `ranged`, `vanguard`

---

## **Core Mechanics – Inner Power**

* **Inner Power**

  * Resource pool: starts at **10 maximum**, replenished fully on a long rest.
  * By itself, Inner Power cannot be directly spent — it must be *drawn out*.

* **Initiate Skill – Draw Power**
  *You draw on your inner well of magic.*

  * **Mechanics:** On Use (1 action). Convert any amount of Inner Power into *Free Power*. Free Power can be spent to empower spellcasting (default = used for free Visualisations, but skills will expand this).
  * **Human Readable:** You burn part of your inner reserve to fuel spells directly.

---

## **Tier Skills**

**Rank 1 Tier Skill – Overflowing Font** *(cost: 1 Tier Die)*
*The power inside you bursts outward, reshaping your spells.*

* **Mechanics:** Passive. You may spend 1 Free Power to add an extra Visualisation of a concept you already hold. This allows you to exceed your normal concept cap by +1 for that concept.
* **Human Readable:** Spend Free Power to double up on a concept, even if you’ve reached your limit.

---

**Rank 6 Tier Skill – Instinctive Casting** *(cost: 2 Tier Dice)*
*Your magic leaps to your will without thought.*

* **Mechanics:** On Use (free). Spend 2 Tier Dice to reduce the action cost of your next *Manifest Spell* by 2 actions. Usable once per round.
* **Human Readable:** Spend dice to make a spell manifest much faster.

---

**Rank 10 Tier Skill – Arcane Cataclysm** *(cost: 3 Tier Dice)*
*The storm of your inner power is unleashed unchecked.*

* **Mechanics:** On Use (free, once per day). For the next 3 rounds, you may treat up to 3 Visualisations per round as free (no cost, no action). At the end of this effect, suffer 1 Instability lingering wound.
* **Human Readable:** For a short time, you can visualise magic without cost or limit — but your body pays the price.

---

## **Initiate Package (Sorcerer-specific skills granted at entry)**

1. **Draw Power** *(see above).*
2. **Inner Power Pool** *(Passive)* — You begin with a pool of 10 Inner Power that replenishes on rest.
3. **Overflow Potential** *(Passive)* — Free Power can always be used to pay for free Visualisations, and future Sorcerer skills may expand its use.

---

## **Direction for Path Skills**

Since spellcasting is *modular* (via components), the Sorcerer’s Path skills should lean into:

* **Resource manipulation** (gaining, converting, or bending Inner/Free Power).
* **Casting efficiency** (reducing action costs, extending spell ranges, chaining spells).
* **Instinctive magic surges** (passives that cause spells to have extra effects when Free Power is spent).
* **Vanguard aspect** = some melee-range spellcasters who *burn inner power* for survivability or explosive retaliation.

---

👉 Would you like me to start with **Ranks 1–3 (5 skills each)** like we did with Shield Guardian and Barbarian, to show how Sorcerers begin to shape their Inner Power into practical combat tools? That way you can see the resource loop come to life before we scale to Rank 10.


Great — let’s build **Ranks 1–3 for Sorcerer**, 5 skills per rank.
I’ll mix **Inner Power manipulation**, **spellcasting efficiency**, and **combat-flavoured twists**, with a clear progression from “learning to shape raw power” at Rank 1 to “instinctively bending it” by Rank 3.

---

# **Sorcerer Path Skills (Ranks 1–3)**

---

## **Rank 1 Skills**

1. **Power Surge** *(Spender)*
   *Your inner force flares out with every spell.*

* **Mechanics:** Passive. Whenever you spend 2 or more Free Power on Visualisations for a single spell, that spell gains +1 damage of its main concept’s type.
* **Human Readable:** Using a lot of Free Power at once makes your spells hit harder.

---

2. **Wellspring Tap** *(Generator)*
   *You learn to draw carefully, not recklessly.*

* **Mechanics:** On Use (1 action). Convert up to 2 Inner Power into Free Power. If used outside combat, convert 3 instead.
* **Human Readable:** You can draw smaller amounts of power more efficiently.

---

3. **Instinctive Visualisation** *(Spender)*
   *Your body remembers the flow of concepts.*

* **Mechanics:** On Use (free, 1 Free Power). Instantly Visualise a concept you already hold.
* **Human Readable:** Spend Free Power to repeat a Visualisation without costing actions.

---

4. **Arcane Resilience** *(Neutral)*
   *The power within you reinforces your flesh.*

* **Mechanics:** Passive. While holding at least 3 concepts visualised, gain +1 Guard.
* **Human Readable:** Having magic swirling around you makes you a little tougher.

---

5. **Unstable Flare** *(Spender)*
   *Your magic lashes out uncontrolled.*

* **Mechanics:** On Use (1 action, 1 Free Power). Release raw energy in a 2-space radius around you; all enemies take 1 untyped damage and +5 Risk.
* **Human Readable:** Spend Free Power to blast nearby enemies with unstable energy.

---

## **Rank 2 Skills**

1. **Overdraw** *(Spender)*
   *You risk more than is safe to fuel your spell.*

* **Mechanics:** On Use (free). Convert 1 Inner Power into Free Power instantly; you also gain 1 Instability wound.
* **Human Readable:** Force extra energy into play right now, but risk corruption.

---

2. **Empowered Manifestation** *(Spender)*
   *You release spells with greater force.*

* **Mechanics:** On Use (free, 1 Free Power). Your next *Manifest Spell* this turn gains +1 Fortune.
* **Human Readable:** Spend Free Power to make your next spell more accurate/potent.

---

3. **Elemental Veil** *(Neutral)*
   *Your magic clings to you defensively.*

* **Mechanics:** Passive. When you Visualise an elemental concept (Fire, Cold, Electric, Acid), gain resistance 1 to that type until the start of your next turn.
* **Human Readable:** Holding elemental magic temporarily protects you against it.

---

4. **Focus Pulse** *(Generator)*
   *You push your will outward, steadying the flow.*

* **Mechanics:** On Use (1 action). Regain 1 Free Power for every 2 concepts currently visualised (rounded down).
* **Human Readable:** Regain energy based on how much magic you’re already holding.

---

5. **Reckless Cast** *(Spender)*
   *You give no thought to stability, only impact.*

* **Mechanics:** On Use (free). When you Manifest a spell, you may spend 1 Free Power to add +2 damage, but you gain +5 Risk.
* **Human Readable:** Spend Free Power to supercharge a spell at the cost of leaving yourself open.

---

## **Rank 3 Skills**

1. **Inner Cascade** *(Spender)*
   *Once drawn, power flows faster and faster.*

* **Mechanics:** Passive. The first time each round you use *Draw Power*, gain +1 extra Free Power.
* **Human Readable:** Drawing out energy at the start of a round gives you more.

---

2. **Arcing Resonance** *(Spender)*
   *Your magic crackles outward from its target.*

* **Mechanics:** On Use (free, 1 Free Power). When you deal damage with a spell, another enemy adjacent to the target takes 1 damage of the same type.
* **Human Readable:** Spend Free Power to make your spells splash onto nearby foes.

---

3. **Overchannelled Flesh** *(Neutral)*
   *Your body mutates slightly under stress, but endures.*

* **Mechanics:** Passive. Once per combat, when you would suffer an Instability wound, you may ignore it and take +5 Risk instead.
* **Human Readable:** You can shrug off magical backlash once by risking exposure instead.

---

4. **Spell Shunt** *(Spender)*
   *You twist the magic away at the last moment.*

* **Mechanics:** Reaction (1 Free Power). When targeted by a spell, reduce its damage by 2 and increase your Risk by +5.
* **Human Readable:** Spend Free Power to deflect part of an incoming spell.

---

5. **Raw Infusion** *(Generator/Spender)*
   *You pour excess energy into your body.*

* **Mechanics:** On Use (1 action, 1 Free Power). Restore 1 Guard for every different type of concept currently visualised.
* **Human Readable:** Spend Free Power to reinforce your body using the variety of magic you hold.

---

✨ That’s the **Rank 1–3 Sorcerer skillset**:

* Rank 1 = foundation tools: basic Duty-equivalents (Power → Damage, small Free Power economy, defensive layer).
* Rank 2 = more deliberate resource spending/generation, start taking risks for efficiency.
* Rank 3 = reactive control and multi-target shaping, building toward chaotic but powerful flows.

Would you like me to continue into **Ranks 4–6 next (including the Rank 6 Tier Skill: Instinctive Casting)** so we can see how Sorcerers scale into faster, more explosive spell output?

Perfect — let’s push into **Sorcerer Ranks 4–6**, with 5 skills per rank and the **Rank 6 Tier Skill: Instinctive Casting**.

Here the Sorcerer starts turning into a real **combat engine**: faster casting, chaining spells together, and bending Free Power into more unusual effects.

---

# **Sorcerer Path Skills (Ranks 4–6)**

---

## **Rank 4 Skills**

1. **Chain Spark** *(Spender)*
   *Your magic leaps from one foe to the next.*

* **Mechanics:** On Use (free, 1 Free Power). When a spell deals damage, choose another enemy within 2 spaces of the target; they take 1 damage of the same type. Can trigger once per spell.
* **Human Readable:** Spend Free Power to make your magic arc between enemies.

---

2. **Well of Fury** *(Generator)*
   *You tap deeper than is safe, but it works.*

* **Mechanics:** On Use (1 action). Convert up to 4 Inner Power into Free Power. Gain +5 Risk.
* **Human Readable:** Draw more power at once, but expose yourself to danger.

---

3. **Arcane Shove** *(Spender/Utility)*
   *Your raw force pushes back those who come too close.*

* **Mechanics:** On Use (1 action, 1 Free Power). Push one adjacent enemy 2 spaces away. If they hit an obstacle, deal 2 damage.
* **Human Readable:** Spend Free Power to shove enemies back with a burst of force.

---

4. **Esoteric Guard** *(Neutral)*
   *Energy swirls around you, forming a shield.*

* **Mechanics:** Passive. While holding 3+ concepts visualised, gain +2 Guard.
* **Human Readable:** The more concepts you sustain, the more you’re protected.

---

5. **Surging Spell** *(Spender)*
   *Sometimes the spell just doesn’t stop.*

* **Mechanics:** On Use (free, 1 Free Power). When you Manifest a spell, roll a D10; on 7+, immediately repeat the spell’s effect at no additional action cost.
* **Human Readable:** Spend Free Power to give your spell a chance to “go off” twice.

---

## **Rank 5 Skills**

1. **Burning Core** *(Spender)*
   *You sacrifice stability for raw intensity.*

* **Mechanics:** On Use (free). Spend 2 Free Power when Manifesting a spell to give it +2 Lethal. Gain 1 Instability wound.
* **Human Readable:** Trade safety for a spell that can punch through resistances.

---

2. **Magnetic Resonance** *(Generator/Spender)*
   *Your spells feed one another.*

* **Mechanics:** Passive. When you Manifest a spell using 3+ concepts, regain 1 Free Power.
* **Human Readable:** Complex spells give back a little of the power you spent.

---

3. **Spell-Eater’s Skin** *(Neutral)*
   *You have learned to absorb some of what should burn you.*

* **Mechanics:** Passive. Resistance 1 to untyped damage.
* **Human Readable:** Your body can blunt the raw backlash of magic.

---

4. **Arcane Step** *(Spender/Utility)*
   *Your power carries you across the battlefield.*

* **Mechanics:** On Use (1 action, 1 Free Power). Teleport 2 spaces to a visible empty square. If you currently have 4+ concepts visualised, this costs no actions.
* **Human Readable:** Spend Free Power to blink short distances, easier when heavily charged.

---

5. **Searing Aftermath** *(Spender)*
   *Your spell leaves behind smouldering ruin.*

* **Mechanics:** On Use (free, 1 Free Power). A spell that deals Fire damage also applies 1 Burning lingering wound.
* **Human Readable:** Spend Free Power to set enemies ablaze when casting fire.

---

## **Rank 6 Skills**

**Tier Skill – Instinctive Casting** *(cost: 2 Tier Dice)*
*Your magic leaps to your command before thought catches up.*

* **Mechanics:** On Use (free). Spend 2 Tier Dice to reduce the action cost of your next *Manifest Spell* by 2 actions. Usable once per round.
* **Human Readable:** Spend dice to hurl out a spell much faster.

---

1. **Mana Flood** *(Generator/Spender)*
   *You let the river of power overflow.*

* **Mechanics:** On Use (1 action). Convert 2 Inner Power into 2 Free Power and immediately Visualise 1 concept for free.
* **Human Readable:** Draw and shape power at once, creating momentum.

---

2. **Overlapping Currents** *(Spender)*
   *Your magic feeds itself in strange ways.*

* **Mechanics:** Passive. When you Manifest a spell that uses the same concept multiple times, reduce its action cost by 1.
* **Human Readable:** Spells focused on one concept are easier to shape.

---

3. **Crackling Aura** *(Neutral)*
   *The air around you is alive with energy.*

* **Mechanics:** Passive. While you hold 3+ concepts visualised, all adjacent enemies take +5 Risk at the start of their turns.
* **Human Readable:** The sheer force of your power unsettles foes nearby.

---

4. **Feedback Loop** *(Spender)*
   *The backlash becomes fuel.*

* **Mechanics:** On Use (free, 1 Free Power). When you gain an Instability wound, immediately regain 2 Free Power.
* **Human Readable:** Turn magical backlash into more energy to spend.

---

5. **Twin Manifestation** *(Spender)*
   *One spell, two results.*

* **Mechanics:** On Use (free, 2 Free Power). When you Manifest a spell, you may also Manifest a second spell with a total cost of 2 concepts or less as part of the same action.
* **Human Readable:** Spend Free Power to cast two spells in the time of one.

---

✨ That’s **Ranks 4–6**:

* Rank 4: introduces chaining and battlefield shaping.
* Rank 5: ramps up efficiency, mobility, and concept synergies.
* Rank 6: explosive burst-casting via **Instinctive Casting** and double-spell tricks.

Would you like me to take Sorcerer through **Ranks 7–10 next (with the Rank 10 Tier Skill: Arcane Cataclysm)** so we complete the full progression?

Perfect — let’s finish the **Sorcerer Path** with **Ranks 7–10**, including the **Rank 10 Tier Skill: Arcane Cataclysm**.
Here’s where they become outright unstable powerhouses: bending rules, overloading the battlefield with concepts, and risking Instability for devastating output.

---

# **Sorcerer Path Skills (Ranks 7–10)**

---

## **Rank 7 Skills**

1. **Overfull Circuit** *(Generator/Spender)*
   *The more you hold, the more dangerous you become.*

* **Mechanics:** Passive. While holding the maximum number of concepts, gain +1 damage on all spells. If you spend Free Power while at maximum, gain +5 Risk.
* **Human Readable:** Being “full” of magic makes your spells stronger, but any extra power destabilises you.

---

2. **Spell Riposte** *(Spender/Reaction)*
   *Your energy lashes out when threatened.*

* **Mechanics:** Reaction (1 Free Power). When targeted by a melee attack, deal 2 untyped damage to the attacker. If you currently have 3+ concepts visualised, also apply Distracted for 1 round.
* **Human Readable:** Spend Free Power to punish enemies who swing at you.

---

3. **Runaway Power** *(Spender)*
   *You can’t always control the overflow, but you can weaponise it.*

* **Mechanics:** On Use (free, 1 Free Power). Roll a D10: on 6+, all enemies within 2 spaces of you take 2 damage of a random type among your current concepts.
* **Human Readable:** Channel unstable energy into a dangerous, chaotic burst.

---

4. **Resonant Core** *(Neutral)*
   *Your magic stabilises when channeled deeply.*

* **Mechanics:** Passive. When you spend 3+ Free Power in a single round, gain +2 Guard.
* **Human Readable:** Casting heavily hardens you temporarily.

---

5. **Channel Through Pain** *(Spender)*
   *Wounds become conduits for fury.*

* **Mechanics:** Passive. While you have at least 1 Pain wound, your spells cost –1 action to Manifest (minimum 1).
* **Human Readable:** Casting becomes faster when you’re suffering.

---

## **Rank 8 Skills**

1. **Cascade Failure** *(Spender)*
   *When you break, you break loudly.*

* **Mechanics:** On Use (free, 1 Free Power). When you gain an Instability wound, one enemy within 3 spaces takes 2 untyped damage.
* **Human Readable:** Magical backlash lashes outward at your foes.

---

2. **Spellstorm Weave** *(Spender)*
   *The magic refuses to end.*

* **Mechanics:** On Use (free, 2 Free Power). When you Manifest a spell, you may immediately Visualise an extra concept at no action cost.
* **Human Readable:** Casting spells can open the door to even more magic.

---

3. **Elemental Eruption** *(Spender)*
   *Raw destruction tears the battlefield apart.*

* **Mechanics:** On Use (2 actions, 2 Free Power). Deal 3 damage of each elemental type you currently have visualised (Fire, Cold, Electric, Acid) to all enemies within 3 spaces.
* **Human Readable:** Pour all your active elements into one devastating blast.

---

4. **Instinctive Ward** *(Neutral)*
   *Your subconscious protects you.*

* **Mechanics:** Reaction (free, once per round). When you would take an Instability wound, reduce it to 0 and lose 2 Free Power.
* **Human Readable:** Sacrifice energy to stop magical backlash from hurting you.

---

5. **Disruptive Surge** *(Spender/Utility)*
   *Your uncontrolled magic interferes with theirs.*

* **Mechanics:** On Use (1 action, 2 Free Power). Target caster within 6 spaces must succeed on an opposed Intelligence check or lose 1 visualised concept of your choice.
* **Human Readable:** Spend Free Power to strip away an enemy’s spell energy.

---

## **Rank 9 Skills**

1. **Arcane Devastation** *(Spender)*
   *Every ounce of power goes into annihilation.*

* **Mechanics:** On Use (2 actions, 3 Free Power). Choose a 3x3 area within 6 spaces; all creatures inside take 6 untyped damage. You gain +1 Instability wound.
* **Human Readable:** Spend heavily to unleash a destructive magical blast.

---

2. **Echoing Manifest** *(Spender)*
   *Your spells won’t stay quiet.*

* **Mechanics:** On Use (free, 1 Free Power). When you Manifest a spell, at the start of your next turn repeat its effect (same targets if possible).
* **Human Readable:** Spells repeat themselves, echoing after you cast.

---

3. **Living Conduit** *(Neutral)*
   *Your body itself becomes part of the spell.*

* **Mechanics:** Passive. While holding 5+ concepts, gain immunity to Pain wounds.
* **Human Readable:** When heavily charged with power, you no longer feel pain.

---

4. **Catastrophic Overflow** *(Spender)*
   *You burn too brightly to last.*

* **Mechanics:** On Use (free, 2 Free Power). For 1 round, all your spells deal +2 damage. At the end of the round, take 1 Instability wound.
* **Human Readable:** Push all your spells into overdrive for a round, but at a cost.

---

5. **Warped Space** *(Spender/Utility)*
   *Reality bends around your power.*

* **Mechanics:** On Use (1 action, 2 Free Power). Teleport yourself and up to 1 ally within 3 spaces to anywhere within 5 spaces. You and the ally each gain +5 Risk.
* **Human Readable:** Spend Free Power to reposition yourself and a companion at great risk.

---

## **Rank 10 Skills**

**Tier Skill – Arcane Cataclysm** *(cost: 3 Tier Dice)*
*Your inner storm is unleashed upon the world.*

* **Mechanics:** On Use (free, once per day). For the next 3 rounds, you may treat up to 3 Visualisations per round as free (no cost, no action). At the end of this effect, suffer 1 Instability wound.
* **Human Readable:** For three turns, you can Visualise multiple concepts per round with no cost, before backlash inevitably hits you.

---

1. **Worldfire Torrent** *(Spender)*
   *The ultimate destructive storm.*

* **Mechanics:** On Use (2 actions, 3 Free Power). Choose a 5x5 area within 6 spaces; all creatures inside take 4 Fire + 4 Light damage, ignoring resistance.
* **Human Readable:** Spend heavily to summon an apocalyptic firestorm.

---

2. **Arcane Singularity** *(Spender/Utility)*
   *The weight of power bends all things.*

* **Mechanics:** On Use (2 actions, 3 Free Power). Create a 2-space radius zone for 2 rounds; all creatures entering are pulled to its centre and take 2 untyped damage.
* **Human Readable:** Spend Free Power to conjure a miniature black hole of magic.

---

3. **Storm-Sculptor** *(Neutral)*
   *You shape the storm as easily as breathing.*

* **Mechanics:** Passive. While holding 5+ concepts, reduce the action cost of Manifest Spell by 1 (minimum 1).
* **Human Readable:** Casting becomes second nature when you’re brimming with power.

---

4. **Flesh of Mana** *(Spender)*
   *Your body dissolves into raw magic for a moment.*

* **Mechanics:** On Use (free, 2 Free Power). For 1 round, you cannot be targeted by melee attacks. At the end, take 1 Fatigue wound.
* **Human Readable:** Turn into a being of pure mana, untouchable for a round.

---

5. **Reality Break** *(Spender)*
   *You rip the world apart with your will.*

* **Mechanics:** On Use (2 actions, 4 Free Power). Choose any point within 8 spaces. All creatures in a 3x3 area centred on it must pass a Will check or gain 1 Instability wound.
* **Human Readable:** Spend Free Power to force magical backlash directly onto your enemies.

---

✨ That completes the **Sorcerer Path, Ranks 1–10**:

* Starts with careful *Inner Power → Free Power* control.
* Scales into faster, more reckless spell output.
* Peaks with catastrophic surges, battlefield warping, and **Arcane Cataclysm** as their ultimate Tier Skill.

Would you like me to now produce a **single continuous Sorcerer progression sheet** (like we did with Barbarian), so you can see Rage → Skills → Tier Skills all in order for players?
