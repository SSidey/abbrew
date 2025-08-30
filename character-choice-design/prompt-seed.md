I have established a tabletop rpg system and am looking to create some character creation options.

The mechanics of the system are as such:
It is based on a D10, adding one of a statistic out of strength (how physically strong you are), dexterity (hand dexterity, used for lockpicking, slight of hand etc.), agility (how agile you are, influences movement and dodging), constitution (your physical ability to overcome disease, poisons and recover from injury), intelligence (raw mental power), wits (mental speed / charisma), will (mental fortitude, a mental combination of strength and constitution), visualisation (creativity, ability to visualise concepts).
Depending on the attributes of a creature, they will have a different tier e.g.
Tier 1 Common
Tier 2 Uncommon
Tier 3 Rare
Tier 4 Legendary
Tier 5 Mythic
Tier 6 Demigod
Tier 7 Lesser Deity
Tier 8 Deity
Tier 9 Greater Deity
Tier 10 Firstborn
With players starting at Tier 1.
Creatures have a number of Tier Dice equal to their Tier with which they can spend on specific abilities.

A roll with have a criticality, by default 10, if the raw die roll is equal to this number or greater, the roll explodes and rolls another D10, this can chain into further D10s

You can increase a rolls fortune, which allows you to roll more dice and keep either the highest values for fortune or the lowest values for misfortune e.g. 2D10 with fortune +1 would roll 3D10 and keep the highest 2 results whereas 1D10 with fortune -1 would roll 2D10 and keep the lowest 1.

Combat takes place with each creature taking a turn within a round, their order determined by a roll at the start of combat.

Attacks automatically hit, the damage that is done is removed from the target's guard (this is provided mainly by armour), while also increasing the target's risk. When a creature reaches 0 guard, it gains the status "guard broken" until it gains some guard, as well as "staggered" for 1 round (preventing it from increasing guard, doding, parrying). A creature that is "guard broken" or "off guard" can be targeted by finishers, which cost an amount of risk to activate also and reduce the target's risk when applied, finishers scale depending on the amount of risk e.g. 10 risk might inflict 1 wound, 80 risk might remove a limb. An attack can have increased lethality, which is then added to the risk spent from a creature e.g. a creature with 30 risk hit by an attack with lethal 1, would act as though it had 40 risk. Finishers will also typically apply wounds. Once a creature reaches a number of wounds equal to its resolve (2 + the highest of mental and physical attributes) it is defeated (not dead, but out of the fight). if it reaches double its resolve it will die.

Creatures are made up of various anatomy parts e.g. humanoids having a head, torso, two legs, two arms and any of these could be broken (disabled, so any skills reliant on that part e.g. head for sight would be disabled also) or dismembered.

There are several fundamental skills that every creature will have regarding attacks: attack (can be parried), overpower (cannot be parried), feint (detrimental to defenders that choose to parry), parry (beats attack, preventing damage from being dealt), ranged shot (ranged, cannot crit / explode), aimed shot (ranged, more actions but can crit), thrown (thrown weapon attack e.g. spear)

Skills can cost actions (a creature restores 5 at the end of each of its turns - actions can be taken outside of your turn based on triggers), they can cost resources e.g. clerics would have a resource called faith to power theirs, they can also cost concepts e.g. fire, water, sin, fear, slashing (I can provide a full list if required), and these skills can trigger off eachother modify one another, request rolls to be made of other creatures etc. they do not directly have to be offense based skills. Standalone skills are triggered directly, Synergy skills modify a Standalone.

When a player creates a character, they will choose an archetype, an archetype covers a broad category and will indicate a number of roles as in the following json block
{
"melee": "You fight primarily in melee with your opponents.",
"ranged": "You prefer to fight at a distance from your opponents.",
"martial": "Your primary tools in combat are your weapons.",
"magic": "You primarily harness magic to combat your foes.",
"face": "You weaponise your wits and charm to bring the downfall of your foes.",
"crafter": "You create and/or modify equipment to bolster your power as well as that of the party.",
"vanguard": "Your main role in combat is to bring down your enemies as quickly as possible.",
"protector": "Your main role in combat is in reducing the damage dealt to your allies.",
"healer": "You are well acquainted with fixing up the party after a fight.",
"honourbound": "You are bound by a code of ethics that you must uphold.",
"scoundrel": "You are proficient in illicit skills, engaging in underhanded tactics.",
"acolyte": "You derive your abilities from a higher power.",
"bound": "You are bound to another being, this fusion provides you with your abilities.",
"director": "You have a keen knowledge or sense for the energies around you and can direct them at will.",
"innerpower": "Your magic comes from within yourself.",
"implement": "You harness magic through implements of power.",
"style": "You do your thing with panache, drawing attention to yourself.",
"durable": "You are capable of withstanding more abuse than most.",
"professional": "You are skilled in a profession.",
"scout": "You head in first, attampting to remain undetected to scope out the situation and provide your party with foresight."
}, this archetype should provide some overarching themed skill that ties to it and costs a number of Tier Dice to activate.

To provide skill progression, players will also select a Path, like Archetypes a Path has a number of roles associated, though Archetypes should generally have few, a Path should have several e.g. Cleric (an archetype) has two requirements with one being martial, the other being acolyte whereas Paths fitting those e.g. Divine Adherent ("acolyte", "magic", "melee", "ranged") and Shield Fighter ("martial", "melee", "durable"). A Path should have some characteristic Skill that is used as the basis for most other Skills within that Path e.g. Barbarian has Rage where they must have used that Skill in order to allow others to be used, or while it is active they are immune to certain wound types.

{ "type": "Path", "name": "Barbarian", "theme": "A barbarian is a fierce, untamed warrior who channels raw emotion and primal fury into devastating combat prowess, thriving where instinct matters more than discipline. Their main mechanic revolves around Rage, an ability that forces them to fight in a risky manner (mechanically it makes them take an additional 5 risk when attacked, and prevents them from using feint, parry or dodge to represent a risky fighting style that ignores the wounds they suffer)", "roles": ["martial", "melee", "vanguard", "durable"] }