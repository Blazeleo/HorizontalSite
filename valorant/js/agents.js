/* ---------------------------------------------------------------------------
   VALORANT // AGENT ROSTER - data

   The 13 launch-roster agents, in release order.

   `splash` is a composed wide piece - agent-coloured haze, the face close-up,
   the painted figure and the signature ability motif, assembled by
   ../assets/compose-splash.py because Riot ships those parts separately and
   publishes no wide art at all for these 13. Its alpha is vignetted so it
   dissolves into the page instead of ending in a rectangle.

   `art` is the source painted key art alone (kept as a swap-in). `mark` is
   Riot's white-alpha name watermark. width/pos used to be hand-set per
   agent (62vw-94vw, Qode's catalog idea, where every project gets its own
   frame) - one agent's portrait could arrive nearly a third larger than the
   last one's and land in a different corner, which read as a rough cut
   rather than a roster. Uniform now: every agent gets the same frame, so
   switching agents changes who is on screen without also changing the
   screen.

   `bio` and `abilityInfo` (name/description/icon for the 4 active abilities -
   passives are excluded, not every agent has one) feed the click-to-open
   dossier. Icons are vendored under assets/abilities/<agent>-<slot>.png.

   All text and art came from one fetch of
   valorant-api.com/v1/agents?isPlayableCharacter=true and Riot's own wiki.
   All of it is Riot Games' own. See ../SPEC.md.
--------------------------------------------------------------------------- */

window.AGENTS = [
  {
    name: "BRIMSTONE", role: "CONTROLLER",
    accent: "#363c4f", deep: "#211d21",
    bio: "Joining from the U.S.A., Brimstone's orbital arsenal ensures his squad always has the advantage. His ability to deliver utility precisely and safely make him the unmatched boots-on-the-ground commander.",
    abilities: ["Stim Beacon", "Incendiary", "Sky Smoke", "Orbital Strike"],
    abilityInfo: [
      { name: "Stim Beacon", desc: "INSTANTLY toss down a stim beacon. Upon landing, it creates a field that grants players a Combat Stim and a Speed Boost.", icon: "assets/abilities/brimstone-grenade.png" },
      { name: "Incendiary", desc: "EQUIP an incendiary grenade launcher. FIRE to launch a grenade that detonates as it comes to a rest on the floor, creating a lingering fire zone that damages players within the zone.", icon: "assets/abilities/brimstone-ability1.png" },
      { name: "Sky Smoke", desc: "EQUIP a tactical map. FIRE to set locations where Brimstone's smoke clouds will land. ALT FIRE to confirm, launching long-lasting smoke clouds that block vision in the selected area.", icon: "assets/abilities/brimstone-ability2.png" },
      { name: "Orbital Strike", desc: "EQUIP a tactical map. FIRE to launch a lingering orbital strike laser at the selected location, dealing high damage-over-time to players caught in the selected area.", icon: "assets/abilities/brimstone-ultimate.png" }
    ],
    art: "assets/agents/brimstone.png",
    splash: "assets/splash/brimstone.webp",
    width: "78vw", pos: "right:-4%; top:0%"
  },
  {
    name: "VIPER", role: "CONTROLLER",
    accent: "#1a5f46", deep: "#2c4f5e",
    bio: "The American Chemist, Viper deploys an array of poisonous chemical devices to control the battlefield and choke the enemy's vision. If the toxins don't kill her prey, her mindgames surely will.",
    abilities: ["Poison Cloud", "Toxic Screen", "Snake Bite", "Viper's Pit"],
    abilityInfo: [
      { name: "Poison Cloud", desc: "EQUIP a gas emitter. FIRE to throw the emitter that perpetually remains throughout the round. ALT FIRE to lob. RE-USE the ability to create a toxic gas cloud that Decays opponents inside it at the cost of fuel. This ability can be picked up to be REDEPLOYED before the round starts and can be RE-USED more than once throughout the round.", icon: "assets/abilities/viper-ability1.png" },
      { name: "Toxic Screen", desc: "EQUIP a gas emitter launcher that penetrates terrain. FIRE to deploy a long line of gas emitters. RE-USE the ability to create a tall wall of toxic gas that Decays opponents that cross it at the cost of fuel. This ability can be RE-USED more than once.", icon: "assets/abilities/viper-ability2.png" },
      { name: "Snake Bite", desc: "EQUIP a chemical launcher. FIRE to launch a canister that shatters upon hitting the floor, creating a lingering chemical zone that damages and applies Vulnerable.", icon: "assets/abilities/viper-grenade.png" },
      { name: "Viper's Pit", desc: "EQUIP a chemical sprayer. FIRE to spray a chemical cloud in all directions around Viper, creating a large cloud that Nearsights players and Decays the health of enemies inside of it. HOLD the ability key to disperse the cloud early.", icon: "assets/abilities/viper-ultimate.png" }
    ],
    art: "assets/agents/viper.png",
    splash: "assets/splash/viper.webp",
    width: "78vw", pos: "right:-4%; top:0%"
  },
  {
    name: "OMEN", role: "CONTROLLER",
    accent: "#433178", deep: "#344673",
    bio: "A phantom of a memory, Omen hunts in the shadows. He renders enemies blind, teleports across the field, then lets paranoia take hold as his foe scrambles to uncover where he might strike next.",
    abilities: ["Paranoia", "Dark Cover", "Shrouded Step", "From the Shadows"],
    abilityInfo: [
      { name: "Paranoia", desc: "EQUIP a blinding orb.  FIRE to throw it forward, briefly Nearsighting and Deafening all players it touches. This projectile can pass straight through walls.", icon: "assets/abilities/omen-ability1.png" },
      { name: "Dark Cover", desc: "EQUIP a shadow orb, entering a phased world to place and target the orbs. PRESS the ability key to throw the shadow orb to the marked location, creating a long-lasting shadow sphere that blocks vision. HOLD FIRE while targeting to move the marker further away. HOLD ALT FIRE while targeting to move the marker closer. PRESS RELOAD to toggle normal targeting view.", icon: "assets/abilities/omen-ability2.png" },
      { name: "Shrouded Step", desc: "EQUIP a shrouded step ability and see its range indicator. FIRE to begin a brief channel, then teleport to the marked location.", icon: "assets/abilities/omen-grenade.png" },
      { name: "From the Shadows", desc: "EQUIP a tactical map. FIRE to begin teleporting to the selected location. While teleporting, Omen will appear as a Shade that can be destroyed by an enemy to cancel his teleport, or PRESS EQUIP for Omen to cancel his teleport.", icon: "assets/abilities/omen-ultimate.png" }
    ],
    art: "assets/agents/omen.png",
    splash: "assets/splash/omen.webp",
    width: "78vw", pos: "right:-4%; top:0%"
  },
  {
    name: "KILLJOY", role: "SENTINEL",
    accent: "#522162", deep: "#413950",
    bio: "The genius of Germany, Killjoy effortlessly secures key battlefield positions with her arsenal of inventions. If their damage doesn't take her enemies out, the debuff her robots provide will make short work of them.",
    abilities: ["Nanoswarm", "ALARMBOT", "TURRET", "Lockdown"],
    abilityInfo: [
      { name: "Nanoswarm", desc: "EQUIP a Nanoswarm grenade. FIRE to throw the grenade. Upon landing, the Nanoswarm goes covert. ALT FIRE to lob. ACTIVATE the Nanoswarm to deploy a damaging swarm of nanobots.", icon: "assets/abilities/killjoy-grenade.png" },
      { name: "ALARMBOT", desc: "EQUIP a covert Alarmbot. FIRE to deploy a bot that hunts down enemies that get in range.  After reaching its target, the bot explodes and applies Vulnerable to enemies in the area. HOLD EQUIP to recall a deployed bot.", icon: "assets/abilities/killjoy-ability1.png" },
      { name: "TURRET", desc: "EQUIP a Turret. FIRE to deploy a turret that fires at enemies in a 100 degree cone. While targeting, EQUIP again to swap turret direction, HOLD ALT FIRE to rotate. HOLD EQUIP to recall the deployed turret.", icon: "assets/abilities/killjoy-ability2.png" },
      { name: "Lockdown", desc: "EQUIP the Lockdown device. FIRE to deploy the device. After a long windup, the device Detains all enemies caught in the radius. The device can be destroyed by enemies.", icon: "assets/abilities/killjoy-ultimate.png" }
    ],
    art: "assets/agents/killjoy.png",
    splash: "assets/splash/killjoy.webp",
    width: "78vw", pos: "right:-4%; top:0%"
  },
  {
    name: "CYPHER", role: "SENTINEL",
    accent: "#2f5078", deep: "#3f3f6c",
    bio: "The Moroccan information broker, Cypher is a one-man surveillance network who keeps tabs on the enemy's every move. No secret is safe. No maneuver goes unseen. Cypher is always watching.",
    abilities: ["Cyber Cage", "Spycam", "Trapwire", "Neural Theft"],
    abilityInfo: [
      { name: "Cyber Cage", desc: "INSTANTLY toss the cyber cage in front of Cypher. ACTIVATE to create a zone that blocks vision and plays an audio cue when enemies pass through it.", icon: "assets/abilities/cypher-ability1.png" },
      { name: "Spycam", desc: "EQUIP a spycam. FIRE to place the spycam at the targeted location. RE-USE this ability to take control of the camera's view. While in control of the camera, FIRE to shoot a marking dart. This dart will Reveal the location of any player struck by the dart. This ability can be picked up to be REDEPLOYED.", icon: "assets/abilities/cypher-ability2.png" },
      { name: "Trapwire", desc: "EQUIP a trapwire. FIRE to place a destructible and covert trapwire at the targeted location, creating a line that spans between the placed location and the wall opposite. Enemy players who cross a trapwire will be Slowed and Revealed after a short period if they do not destroy the device in time. This ability can be picked up to be REDEPLOYED.", icon: "assets/abilities/cypher-grenade.png" },
      { name: "Neural Theft", desc: "INSTANTLY use on a targeted dead enemy to download information on their team.  After a brief delay, the location of all living enemy players will be Revealed twice.", icon: "assets/abilities/cypher-ultimate.png" }
    ],
    art: "assets/agents/cypher.png",
    splash: "assets/splash/cypher.webp",
    width: "78vw", pos: "right:-4%; top:0%"
  },
  {
    name: "SOVA", role: "INITIATOR",
    accent: "#355285", deep: "#101c47",
    bio: "Born from the eternal winter of Russia's tundra, Sova tracks, finds, and eliminates enemies with ruthless efficiency and precision. His custom bow and incredible scouting abilities ensure that even if you run, you cannot hide.",
    abilities: ["Shock Bolt", "Recon Bolt", "Owl Drone", "Hunter's Fury"],
    abilityInfo: [
      { name: "Shock Bolt", desc: "EQUIP a bow with a shock bolt. FIRE to send the explosive bolt forward, detonating upon collision and damaging players nearby. HOLD FIRE to extend the range of the projectile. ALT FIRE to add up to two bounces to this arrow.", icon: "assets/abilities/sova-ability1.png" },
      { name: "Recon Bolt", desc: "EQUIP a bow with recon bolt. FIRE to send the recon bolt forward, activating upon collision and Revealing the location of nearby enemies caught in the line of sight of the bolt. Enemies can destroy this bolt. HOLD FIRE to extend the range of the projectile. ALT FIRE to add up to two bounces to this arrow.", icon: "assets/abilities/sova-ability2.png" },
      { name: "Owl Drone", desc: "EQUIP an owl drone. FIRE to deploy and take control of movement of the drone. While in control of the drone, FIRE to shoot a marking dart. This dart will Reveal the location of any player struck by the dart. Enemies can destroy the Owl Drone.", icon: "assets/abilities/sova-grenade.png" },
      { name: "Hunter's Fury", desc: "EQUIP a bow with three long-range, wall-piercing energy blasts. FIRE to release an energy blast in a line in front of Sova, dealing damage and Revealing the location of enemies caught in the line. This ability can be RE-USED up to two more times while the ability timer is active.", icon: "assets/abilities/sova-ultimate.png" }
    ],
    art: "assets/agents/sova.png",
    splash: "assets/splash/sova.webp",
    width: "78vw", pos: "right:-4%; top:0%"
  },
  {
    name: "SAGE", role: "SENTINEL",
    accent: "#1f5148", deep: "#102d23",
    bio: "The bastion of China, Sage creates safety for herself and her team wherever she goes. Able to revive fallen friends and stave off forceful assaults, she provides a calm center to a hellish battlefield.",
    abilities: ["Slow Orb", "Healing Orb", "Barrier Orb", "Resurrection"],
    abilityInfo: [
      { name: "Slow Orb", desc: "EQUIP a slowing orb. FIRE to throw a slowing orb forward that detonates upon landing, creating a lingering field that Slows and reduces the dash speed of players caught inside of it.", icon: "assets/abilities/sage-ability1.png" },
      { name: "Healing Orb", desc: "EQUIP a healing orb. FIRE with your crosshairs over a damaged ally to activate a Heal-Over-Time on them. ALT FIRE while Sage is damaged to activate a self Heal-Over-Time.", icon: "assets/abilities/sage-ability2.png" },
      { name: "Barrier Orb", desc: "EQUIP a barrier orb. FIRE places a wall that fortifies after a few seconds. ALT FIRE rotates the targeter.", icon: "assets/abilities/sage-grenade.png" },
      { name: "Resurrection", desc: "EQUIP a resurrection ability. FIRE with your crosshairs placed over a dead ally to begin resurrecting them. After a brief channel, the ally will be brought back to life with full health.", icon: "assets/abilities/sage-ultimate.png" }
    ],
    art: "assets/agents/sage.png",
    splash: "assets/splash/sage.webp",
    width: "78vw", pos: "right:-4%; top:0%"
  },
  {
    name: "PHOENIX", role: "DUELIST",
    accent: "#74321c", deep: "#262423",
    bio: "Hailing from the U.K., Phoenix's star power shines through in his fighting style, igniting the battlefield with flash and flare. Whether he's got backup or not, he's rushing in to fight on his own terms.",
    abilities: ["Blaze", "Hot Hands", "Curveball", "Run it Back"],
    abilityInfo: [
      { name: "Blaze", desc: "EQUIP a flame wall. FIRE to create a line of flame that moves forward, passing through the world and creating a wall of fire that blocks vision and damages players passing through it. The fire wall heals Phoenix instead of dealing damage. HOLD FIRE to bend the wall in the direction of your crosshair.", icon: "assets/abilities/phoenix-grenade.png" },
      { name: "Hot Hands", desc: "EQUIP a fireball. FIRE to throw a fireball that explodes after a set amount of time or upon hitting the ground, creating a lingering fire zone that damages enemies. The fire zone heals Phoenix instead of dealing damage. ALT FIRE to lob.", icon: "assets/abilities/phoenix-ability1.png" },
      { name: "Curveball", desc: "EQUIP a flare orb that takes a curving path and detonates shortly after throwing. FIRE to curve the flare orb to the left, detonating and Blinding any player who sees the orb. ALT FIRE to curve the flare orb to the right. Curveball resets a charge every two kills.", icon: "assets/abilities/phoenix-ability2.png" },
      { name: "Run it Back", desc: "INSTANTLY place a marker at Phoenix's location. While this ability is active, dying or allowing the timer to expire will end this ability and bring Phoenix back to this location with full health and the amount of armor he had when the ability was cast.", icon: "assets/abilities/phoenix-ultimate.png" }
    ],
    art: "assets/agents/phoenix.png",
    splash: "assets/splash/phoenix.webp",
    width: "78vw", pos: "right:-4%; top:0%"
  },
  {
    name: "JETT", role: "DUELIST",
    accent: "#25607a", deep: "#0f1923",
    bio: "Representing her home country of South Korea, Jett's agile and evasive fighting style lets her take risks no one else can. She runs circles around every skirmish, cutting enemies up before they even know what hit them.",
    abilities: ["Updraft", "Tailwind", "Cloudburst", "Blade Storm"],
    abilityInfo: [
      { name: "Updraft", desc: "INSTANTLY propel Jett high into the air.", icon: "assets/abilities/jett-ability1.png" },
      { name: "Tailwind", desc: "ACTIVATE to prepare a gust of wind for a limited time. RE-USE the wind to propel Jett in the direction she is moving. If Jett is standing still, she propels forward. Tailwind charge resets every two kills.", icon: "assets/abilities/jett-ability2.png" },
      { name: "Cloudburst", desc: "INSTANTLY throw a projectile that expands into a brief vision-blocking cloud on impact with a surface. HOLD the ability key to curve the smoke in the direction of your crosshair.", icon: "assets/abilities/jett-grenade.png" },
      { name: "Blade Storm", desc: "EQUIP a set of highly accurate throwing knives. FIRE to throw a single knife and recharge knives on a kill. ALT FIRE to throw all remaining daggers but does not recharge on a kill.", icon: "assets/abilities/jett-ultimate.png" }
    ],
    art: "assets/agents/jett.png",
    splash: "assets/splash/jett.webp",
    width: "78vw", pos: "right:-4%; top:0%"
  },
  {
    name: "REYNA", role: "DUELIST",
    accent: "#662d62", deep: "#2f2664",
    bio: "Forged in the heart of Mexico, Reyna dominates single combat, popping off with each kill she scores. Her capability is only limited by her raw skill, making her sharply dependent on performance.",
    abilities: ["Devour", "Dismiss", "Leer", "Empress"],
    abilityInfo: [
      { name: "Devour", desc: "Soul Harvest: Enemies that die within 3 seconds of taking damage from Reyna leave behind Soul Orbs that last 3 seconds.\r Devour: INSTANTLY consume a soul orb, rapidly gaining Temporary Health. If EMPRESS is active then Devour automatically casts, does not consume the Soul Orb, and Healing is permanent.", icon: "assets/abilities/reyna-ability1.png" },
      { name: "Dismiss", desc: "INSTANTLY consume a nearby Soul Orb, becoming Intangible for a short duration. If EMPRESS is active, also become Invisible.", icon: "assets/abilities/reyna-ability2.png" },
      { name: "Leer", desc: "EQUIP an ethereal, destructible eye. ACTIVATE to cast the eye a short distance forward. The eye will Nearsight all enemies who look at it.", icon: "assets/abilities/reyna-grenade.png" },
      { name: "Empress", desc: "INSTANTLY enter a frenzy, gaining a Combat Stim that increases firing, equip and reload speed dramatically. Gain infinite charges of Soul Harvest abilities.", icon: "assets/abilities/reyna-ultimate.png" }
    ],
    art: "assets/agents/reyna.png",
    splash: "assets/splash/reyna.webp",
    width: "78vw", pos: "right:-4%; top:0%"
  },
  {
    name: "RAZE", role: "DUELIST",
    accent: "#742e1e", deep: "#2c5942",
    bio: "Raze explodes out of Brazil with her big personality and big guns. With her blunt-force-trauma playstyle, she excels at flushing entrenched enemies and clearing tight spaces with a generous dose of \"boom.\"",
    abilities: ["Blast Pack", "Paint Shells", "Boom Bot", "Showstopper"],
    abilityInfo: [
      { name: "Blast Pack", desc: "INSTANTLY throw a Blast Pack that will stick to surfaces. RE-USE the ability after deployment to detonate, moving anything hit and dealing damage if fully armed.", icon: "assets/abilities/raze-ability1.png" },
      { name: "Paint Shells", desc: "EQUIP a cluster grenade. FIRE to throw the grenade, which does damage and creates sub-munitions, each doing damage to anyone in their range. ALT FIRE to lob. Paint Shells charge resets every two kills.", icon: "assets/abilities/raze-ability2.png" },
      { name: "Boom Bot", desc: "EQUIP a Boom Bot. FIRE will deploy the bot, causing it to travel in a straight line on the ground, bouncing off walls. The Boom Bot will lock on to any enemies in its frontal cone and chase them, exploding for heavy damage if it reaches them.", icon: "assets/abilities/raze-grenade.png" },
      { name: "Showstopper", desc: "EQUIP a rocket launcher. FIRE to shoot a rocket that does massive area damage on contact with anything.", icon: "assets/abilities/raze-ultimate.png" }
    ],
    art: "assets/agents/raze.png",
    splash: "assets/splash/raze.webp",
    width: "78vw", pos: "right:-4%; top:0%"
  },
  {
    name: "BREACH", role: "INITIATOR",
    accent: "#81331a", deep: "#523a23",
    bio: "The bionic Swede Breach fires powerful, targeted kinetic blasts to aggressively clear a path through enemy ground. The damage and disruption he inflicts ensures no fight is ever fair.",
    abilities: ["Flashpoint", "Fault Line", "Aftershock", "Rolling Thunder"],
    abilityInfo: [
      { name: "Flashpoint", desc: "EQUIP a Blinding charge. FIRE the charge to set a fast-acting burst through the wall. The charge detonates to Blind all players looking at it.", icon: "assets/abilities/breach-ability1.png" },
      { name: "Fault Line", desc: "EQUIP a Seismic Blast. HOLD FIRE to increase the distance. RELEASE to set off the quake, Concussing all players in its zone and in a line up to the zone.", icon: "assets/abilities/breach-ability2.png" },
      { name: "Aftershock", desc: "EQUIP a fusion charge. FIRE the charge to set a slow-acting burst through the wall. The burst does heavy damage to anyone caught in its area.", icon: "assets/abilities/breach-grenade.png" },
      { name: "Rolling Thunder", desc: "EQUIP a Seismic Charge. FIRE to send a cascading quake through all terrain in a large zone. The quake Concusses and knocks up anyone caught in it.", icon: "assets/abilities/breach-ultimate.png" }
    ],
    art: "assets/agents/breach.png",
    splash: "assets/splash/breach.webp",
    width: "78vw", pos: "right:-4%; top:0%"
  },
  {
    name: "SKYE", role: "INITIATOR",
    accent: "#436a51", deep: "#4f1413",
    bio: "Hailing from Australia, Skye and her band of beasts trailblaze the way through hostile territory. With her creations hampering the enemy, and her power to heal others, the team is strongest and safest by Skye's side.",
    abilities: ["Trailblazer", "Guiding Light", "Regrowth", "Seekers"],
    abilityInfo: [
      { name: "Trailblazer", desc: "EQUIP a Tasmanian tiger trinket. FIRE to send out and take control of the predator. While in control, FIRE to leap forward, exploding in a Concussive blast on impact and damaging directly hit enemies.", icon: "assets/abilities/skye-ability1.png" },
      { name: "Guiding Light", desc: "EQUIP a hawk trinket. FIRE to send it forward. HOLD FIRE to guide the hawk in the direction of your crosshair. RE-USE while the hawk is in flight to transform it into a flash. The flash reaches max potency after a short duration during the hawk's flight.", icon: "assets/abilities/skye-ability2.png" },
      { name: "Regrowth", desc: "EQUIP a healing trinket. HOLD FIRE to channel, Healing allies in range and line of sight. Can be reused until her healing pool is depleted. Skye cannot heal herself.", icon: "assets/abilities/skye-grenade.png" },
      { name: "Seekers", desc: "EQUIP a Seeker trinket. FIRE to send out three Seekers to track down the three closest enemies. If a Seeker reaches its target, it Nearsights and slows them. Enemies can destroy the Seekers.", icon: "assets/abilities/skye-ultimate.png" }
    ],
    art: "assets/agents/skye.png",
    splash: "assets/splash/skye.webp",
    width: "78vw", pos: "right:-4%; top:0%"
  }
];
