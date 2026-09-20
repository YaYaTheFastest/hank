window.PLAY_DATA = (function(){
"use strict";
  var GAMES = {
    minecraft: {
      id: "minecraft",
      name: "Minecraft",
      short: "Java",
      emoji: "🟩",
      tag: "Java Edition · survival + build",
      ink: "#e8f6e4",
      accent: "#3d8c3a"
    },
    hogwarts: {
      id: "hogwarts",
      name: "Hogwarts Legacy",
      short: "Hogwarts",
      emoji: "🏰",
      tag: "Story-light · explore + room + beasts",
      ink: "#f6ead4",
      accent: "#8a5a12"
    }
  };

  var INTERESTS = [
    { id: "minecraft", label: "Minecraft" },
    { id: "hogwarts", label: "Hogwarts Legacy" },
    { id: "build", label: "Building / design" },
    { id: "redstone", label: "Redstone / machines" },
    { id: "explore", label: "Exploring maps" },
    { id: "creatures", label: "Creatures / mobs / beasts" },
    { id: "puzzles", label: "Puzzles" },
    { id: "story", label: "Stories / lore" },
    { id: "sports", label: "Sports" },
    { id: "bjj", label: "BJJ" },
    { id: "lego", label: "LEGO" },
    { id: "other", label: "Something else" }
  ];

  var CARDS = {
    minecraft: [
      {
        id: "mc-first-base",
        title: "First real base",
        vibe: "Safe, pretty, expandable",
        mins: "45–90 min",
        why: "A box house works. A planned house lets you add farms and storage without tearing it down.",
        steps: [
          "Pick a flat-ish spot near water, trees, and a hill you can later hollow.",
          "Mark a 11×11 footprint with dirt. Leave the middle open for a courtyard later.",
          "Walls 4 high. Door facing sunrise if you can.",
          "One room = bed + chests + furnace wall. Do not mix ores into junk chests.",
          "Torch the perimeter and the roof edge so mobs cannot stand on you."
        ],
        guide: [
          { emoji: "\ud83d\udfe9", bg: "#7cb342", caption: "Pick flat spot near water" },
          { emoji: "\ud83d\udfe9", bg: "#558b2f", caption: "Mark 11\u00d711 dirt footprint" },
          { emoji: "\ud83d\udfe9", bg: "#9ccc65", caption: "Walls 4 high, sunrise door" },
          { emoji: "\ud83d\udfe9", bg: "#33691e", caption: "Bed, chests, furnace wall" },
          { emoji: "\ud83d\udfe9", bg: "#aed581", caption: "Torch perimeter and roof" }
        ],
        pack: "Wood, cobble, glass, 2 doors, 8 chests, furnaces, bed, torches",
        next: "Add a 5-wide storage hall off the back wall."
      },
      {
        id: "mc-storage",
        title: "Storage wall that stays sane",
        vibe: "Labels beat memory",
        mins: "30 min",
        why: "Creative kids dump everything. A labeled wall means you find diamonds in 4 seconds.",
        steps: [
          "Build a double-chest wall, 2 high, 6 wide (12 double chests).",
          "Left to right: junk wood · cobble/stone · ores · food · mob drops · redstone.",
          "Put a barrel or hopper under the crafting table for 'just mined' overflow.",
          "Item frames or signs on every column. Ugly signs beat lost iron.",
          "Once a week: empty the overflow barrel into the right column."
        ],
        guide: [
          { emoji: "\ud83d\udfe9", bg: "#7cb342", caption: "Build a double-chest wall, 2 high, 6 wide" },
          { emoji: "\ud83d\udfe9", bg: "#558b2f", caption: "Left to right: junk wood \u00b7 cobble/stone \u00b7" },
          { emoji: "\ud83d\udfe9", bg: "#9ccc65", caption: "Put a barrel or hopper under the crafting" },
          { emoji: "\ud83d\udfe9", bg: "#33691e", caption: "Item frames or signs on every column. Ugly" },
          { emoji: "\ud83d\udfe9", bg: "#aed581", caption: "Once a week: empty the overflow barrel into" }
        ],
        pack: "Chests or barrels, signs or item frames, hoppers optional",
        next: "Add a 'build supplies' column: wool, glass, terracotta."
      },
      {
        id: "mc-night",
        title: "Don't die tonight",
        vibe: "Survival loop",
        mins: "20 min",
        why: "The game opens up when nights are boring instead of scary.",
        steps: [
          "Before sunset: food in hotbar slot 1, sword/axe 2, blocks 3, torch 4.",
          "Never mine straight down. Never swim in unknown lava caves.",
          "If you hear a creeper and cannot see it, pillar up 3 or run around a corner.",
          "Sleep through night once you have a bed in a lit room.",
          "Keep a 'oops chest' at spawn with spare tools + bread + a bed."
        ],
        guide: [
          { emoji: "\ud83d\udfe9", bg: "#7cb342", caption: "Before sunset: food in hotbar slot 1, sword/axe" },
          { emoji: "\ud83d\udfe9", bg: "#558b2f", caption: "Never mine straight down. Never swim in unknown" },
          { emoji: "\ud83d\udfe9", bg: "#9ccc65", caption: "If you hear a creeper and cannot see" },
          { emoji: "\ud83d\udfe9", bg: "#33691e", caption: "Sleep through night once you have a bed" },
          { emoji: "\ud83d\udfe9", bg: "#aed581", caption: "Keep a 'oops chest' at spawn with spare" }
        ],
        pack: "Bed, food, shield if you have iron, 16 dirt, 16 torches",
        next: "Iron tools, then a shield, then a water bucket for lava."
      },
      {
        id: "mc-enchant",
        title: "Enchanting nook",
        vibe: "Tiny magic room",
        mins: "40 min",
        why: "Books + tools turn 'good enough' gear into keepers.",
        steps: [
          "Room at least 5×5. Table in the center.",
          "15 bookshelves: ring the table one block away, 2 high, leave a 1-block air gap.",
          "Do not put torches between table and shelves — that kills the power.",
          "Lapis stays in a barrel under the table.",
          "Enchant tools you will keep. Do not burn diamonds on a throwaway pick."
        ],
        guide: [
          { emoji: "\ud83d\udfe9", bg: "#7cb342", caption: "Room at least 5\u00d75. Table in the center." },
          { emoji: "\ud83d\udfe9", bg: "#558b2f", caption: "15 bookshelves: ring the table one block away," },
          { emoji: "\ud83d\udfe9", bg: "#9ccc65", caption: "Do not put torches between table and shelves" },
          { emoji: "\ud83d\udfe9", bg: "#33691e", caption: "Lapis stays in a barrel under the table." },
          { emoji: "\ud83d\udfe9", bg: "#aed581", caption: "Enchant tools you will keep. Do not burn" }
        ],
        pack: "Enchanting table, 15 bookshelves, lapis, anvil later",
        next: "Anvil + grindstone corner for combining and cleanup."
      },
      {
        id: "mc-village",
        title: "Village workshop (fair play)",
        vibe: "Jobs, not exploits",
        mins: "60 min",
        why: "A villager with the right job block is a teacher, not a cheat machine.",
        steps: [
          "Fence a small yard. Light it. Two-block-high walls stop most zombies.",
          "Give each villager one workstation and one bed. Do not stack 40 in a hole.",
          "Farmer + composter near your crop rows. Librarian + lectern near the enchant nook.",
          "Trade only what you actually need this week.",
          "If a raid starts, get inside, light up, and wait it out or fight from a window."
        ],
        guide: [
          { emoji: "\ud83d\udfe9", bg: "#7cb342", caption: "Fence a small yard. Light it. Two-block-high walls" },
          { emoji: "\ud83d\udfe9", bg: "#558b2f", caption: "Give each villager one workstation and one bed." },
          { emoji: "\ud83d\udfe9", bg: "#9ccc65", caption: "Farmer + composter near your crop rows. Librarian" },
          { emoji: "\ud83d\udfe9", bg: "#33691e", caption: "Trade only what you actually need this week." },
          { emoji: "\ud83d\udfe9", bg: "#aed581", caption: "If a raid starts, get inside, light up," }
        ],
        pack: "Beds, workstations, fences, gates, torches",
        next: "A covered walkway from your house to the yard."
      },
      {
        id: "mc-build-brief",
        title: "Ask Dad for a build card",
        vibe: "Your idea → a plan",
        mins: "talk + play",
        why: "You invent. Dad runs Grok. You get a card you can build from — same loop as Castle Fund.",
        steps: [
          "Tell Dad the vibe in one sentence. Example: 'mushroom island library with a trading hall under it.'",
          "Say survival or creative, and about how big (tiny / house-sized / mega).",
          "He brings back: name, footprint, block palette, first 5 steps.",
          "You build step 1 only tonight. Mark it done here.",
          "If a step is confusing, tap Tell Dad — that is how the board grows."
        ],
        guide: [
          { emoji: "\ud83d\udfe9", bg: "#7cb342", caption: "Tell Dad the vibe in one sentence. Example:" },
          { emoji: "\ud83d\udfe9", bg: "#558b2f", caption: "Say survival or creative, and about how big" },
          { emoji: "\ud83d\udfe9", bg: "#9ccc65", caption: "He brings back: name, footprint, block palette, first" },
          { emoji: "\ud83d\udfe9", bg: "#33691e", caption: "You build step 1 only tonight. Mark it" },
          { emoji: "\ud83d\udfe9", bg: "#aed581", caption: "If a step is confusing, tap Tell Dad" }
        ],
        pack: "Your idea + a screenshot if you have one",
        next: "Keep a list of dream builds on the Ideas tab."
      }
    ],
    hogwarts: [
      {
        id: "hl-room",
        title: "Room of Requirement that stays usable",
        vibe: "Your shop + greenhouse",
        mins: "30–45 min",
        why: "The room is a second backpack. If it is a junk pile, potions and gear get slow.",
        steps: [
          "Make three zones: potions, gear/upgrades, beasts/plants.",
          "Chests by color or label: ingredients · gear you wear · gear you are done with.",
          "Put potion stations where you walk first. You will brew more if it is in the path.",
          "Keep one clear floor path so you are not climbing furniture to leave.",
          "Once a session: sell or store junk gear so new drops are easy to see."
        ],
        guide: [
          { emoji: "\ud83c\udff0", bg: "#7e57c2", caption: "Make three zones: potions, gear/upgrades, beasts/plants." },
          { emoji: "\ud83c\udff0", bg: "#5e35b1", caption: "Chests by color or label: ingredients \u00b7 gear" },
          { emoji: "\ud83c\udff0", bg: "#9575cd", caption: "Put potion stations where you walk first. You" },
          { emoji: "\ud83c\udff0", bg: "#4527a0", caption: "Keep one clear floor path so you are" },
          { emoji: "\ud83c\udff0", bg: "#b39ddb", caption: "Once a session: sell or store junk gear" }
        ],
        pack: "Station furniture you already unlocked, chests, plants you actually use",
        next: "A tiny 'tonight's loadout' stand by the exit."
      },
      {
        id: "hl-fieldguide",
        title: "Field Guide habit (no spoilers)",
        vibe: "Explore like a collector",
        mins: "each new room",
        why: "Pages hide in ceilings, behind banners, and in corners you walk past when you rush.",
        steps: [
          "When you enter a new interior: stop, look up, look behind you, then walk.",
          "Revelio is a pulse, not a sprint. Pulse, turn 90°, pulse again.",
          "If a page is annoying, pin the area in your head and come back after the story beat.",
          "Do not watch a full-quest video that ruins the next castle surprise.",
          "Celebrate sets (a wing, a hamlet), not '100% tonight.'"
        ],
        guide: [
          { emoji: "\ud83c\udff0", bg: "#7e57c2", caption: "When you enter a new interior: stop, look" },
          { emoji: "\ud83c\udff0", bg: "#5e35b1", caption: "Revelio is a pulse, not a sprint. Pulse," },
          { emoji: "\ud83c\udff0", bg: "#9575cd", caption: "If a page is annoying, pin the area" },
          { emoji: "\ud83c\udff0", bg: "#4527a0", caption: "Do not watch a full-quest video that ruins" },
          { emoji: "\ud83c\udff0", bg: "#b39ddb", caption: "Celebrate sets (a wing, a hamlet), not '100%" }
        ],
        pack: "Revelio + curiosity",
        next: "One hamlet per session besides the main story."
      },
      {
        id: "hl-combat",
        title: "Duel without button-mashing",
        vibe: "Shield, then answer",
        mins: "practice fights",
        why: "The game rewards timing more than panic casting.",
        steps: [
          "Default rule: protect first. If you eat three hits, you were attacking too early.",
          "Yellow flash = change color. Match the color instead of dumping your favorite spell.",
          "Dodge when a big enemy winds up. Standing still is how elites flatten you.",
          "After a fight: drink or wait before opening the next door.",
          "Respec later is allowed. Early points in defense and a reliable damage spell are enough."
        ],
        guide: [
          { emoji: "\ud83c\udff0", bg: "#7e57c2", caption: "Default rule: protect first. If you eat three" },
          { emoji: "\ud83c\udff0", bg: "#5e35b1", caption: "Yellow flash = change color. Match the color" },
          { emoji: "\ud83c\udff0", bg: "#9575cd", caption: "Dodge when a big enemy winds up. Standing" },
          { emoji: "\ud83c\udff0", bg: "#4527a0", caption: "After a fight: drink or wait before opening" },
          { emoji: "\ud83c\udff0", bg: "#b39ddb", caption: "Respec later is allowed. Early points in defense" }
        ],
        pack: "A balanced spell set, not eight of the same trick",
        next: "Practice on standard enemies before elite camps."
      },
      {
        id: "hl-beasts",
        title: "Beast care loop",
        vibe: "Kind + useful",
        mins: "15 min",
        why: "Happy beasts give materials. The room feels alive when they have space.",
        steps: [
          "Rescue only when you have a pen and food ready.",
          "Feed and brush when you visit the room — same habit as feeding real animals at home.",
          "Do not hoard every species on day one. Two or three well-kept pens beat a zoo you ignore.",
          "Use materials for gear you wear, not a pile of 'maybe.'",
          "If a pen is cramped, expand before adding more."
        ],
        guide: [
          { emoji: "\ud83c\udff0", bg: "#7e57c2", caption: "Rescue only when you have a pen and" },
          { emoji: "\ud83c\udff0", bg: "#5e35b1", caption: "Feed and brush when you visit the room" },
          { emoji: "\ud83c\udff0", bg: "#9575cd", caption: "Do not hoard every species on day one." },
          { emoji: "\ud83c\udff0", bg: "#4527a0", caption: "Use materials for gear you wear, not a" },
          { emoji: "\ud83c\udff0", bg: "#b39ddb", caption: "If a pen is cramped, expand before adding" }
        ],
        pack: "Pens, food, toys you already have",
        next: "One new species when the current pens stay clean."
      },
      {
        id: "hl-broom",
        title: "Broom + hamlet circuit",
        vibe: "See the world",
        mins: "25 min",
        why: "The map is the toy. Flying a loop teaches landmarks better than a checklist.",
        steps: [
          "Pick one region. Fly a triangle: hamlet → ruin → lake → back.",
          "Land for anything that glows or looks built by hand.",
          "If combat is too hard, leave. Come back when your gear level matches the number on the map.",
          "Merlin puzzles are snacks. Skip if you are tired.",
          "End at the room. Dump loot. That close is the habit."
        ],
        guide: [
          { emoji: "\ud83c\udff0", bg: "#7e57c2", caption: "Pick one region. Fly a triangle: hamlet \u2192" },
          { emoji: "\ud83c\udff0", bg: "#5e35b1", caption: "Land for anything that glows or looks built" },
          { emoji: "\ud83c\udff0", bg: "#9575cd", caption: "If combat is too hard, leave. Come back" },
          { emoji: "\ud83c\udff0", bg: "#4527a0", caption: "Merlin puzzles are snacks. Skip if you are" },
          { emoji: "\ud83c\udff0", bg: "#b39ddb", caption: "End at the room. Dump loot. That close" }
        ],
        pack: "Broom, a few potions, inventory space",
        next: "Same circuit at dusk for different spawns and light."
      },
      {
        id: "hl-story-light",
        title: "Story nights vs explore nights",
        vibe: "No spoiler rush",
        mins: "you choose",
        why: "The castle is more fun if you do not speed-run the plot just to 'finish.'",
        steps: [
          "Pick the night's job: one main quest OR one region explore. Not both until you are tired.",
          "If a cutscene is long, that is the game talking. Let it.",
          "Hard quest? Drop difficulty or leave and train combat / gear first.",
          "Ask Dad before watching a story video. Most of them spoil the next hour.",
          "Write one sentence about what you discovered. That is your lore book."
        ],
        guide: [
          { emoji: "\ud83c\udff0", bg: "#7e57c2", caption: "Pick the night's job: one main quest OR" },
          { emoji: "\ud83c\udff0", bg: "#5e35b1", caption: "If a cutscene is long, that is the" },
          { emoji: "\ud83c\udff0", bg: "#9575cd", caption: "Hard quest? Drop difficulty or leave and train" },
          { emoji: "\ud83c\udff0", bg: "#4527a0", caption: "Ask Dad before watching a story video. Most" },
          { emoji: "\ud83c\udff0", bg: "#b39ddb", caption: "Write one sentence about what you discovered. That" }
        ],
        pack: "Patience",
        next: "Use Tell Dad if you are stuck on a puzzle — describe it, don't search the ending."
      }
    ]
  };

var SPARKS = [
    {
      id: "jk-pass-vision",
      tag: "jokic",
      title: "See the pass first",
      why: "Jokić finds the open teammate before the defense settles.",
      image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&q=80",
      youtubeId: "",
      facts: [
        "Scan early: eyes up before you catch.",
        "One hard fake can free a cutter.",
        "Best pass is the simple one that scores."
      ]
    },
    {
      id: "jk-iq-humility",
      tag: "jokic",
      title: "IQ plus quiet confidence",
      why: "Nuggets star plays smart, stays calm, lets the game come to him.",
      image: "https://images.unsplash.com/photo-1504450753142-0ea1a8a0e7e0?w=1200&q=80",
      youtubeId: "",
      facts: [
        "Talk less on the floor; see more.",
        "Miss? Next possession — no sulking.",
        "Humility keeps teammates trusting you."
      ]
    },
    {
      id: "jk-footwork-film",
      tag: "jokic",
      title: "Footwork from film",
      why: "Small steps and angles beat bigger defenders in the paint.",
      image: "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=1200&q=80",
      youtubeId: "",
      facts: [
        "Watch how he pivots — one foot plants, body turns.",
        "Film one move. Copy the feet, not the highlight dunk.",
        "Practice slow, then speed it up."
      ]
    },
    {
      id: "nba-clutch-habits",
      tag: "nba",
      title: "Clutch habits, not luck",
      why: "Late-game cool comes from routines you already own.",
      image: "https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=1200&q=80",
      youtubeId: "",
      facts: [
        "Same free-throw breath every time.",
        "Know your two go-to moves cold.",
        "Talk to teammates — calm voices win."
      ]
    },
    {
      id: "nba-film-study",
      tag: "nba",
      title: "Film beats guessing",
      why: "Pros study tendencies so live plays feel familiar.",
      image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=80",
      youtubeId: "",
      facts: [
        "Watch where help defense comes from.",
        "Spot one habit: left drive, pump fake, kick out.",
        "Write one note. Use it in your next game."
      ]
    },
    {
      id: "mc-build-spark",
      tag: "minecraft",
      title: "Build with a plan",
      why: "Great Minecraft bases start with a footprint, not random blocks.",
      image: "https://images.unsplash.com/photo-1587573089734-198028c0a8c1?w=1200&q=80",
      youtubeId: "",
      facts: [
        "Sketch rooms before you dig.",
        "Light edges so nights stay boring.",
        "One upgrade per session beats chaos."
      ],
      linkBoard: "minecraft"
    },
    {
      id: "hl-explore-spark",
      tag: "hogwarts",
      title: "Explore like a wizard",
      why: "Hogwarts rewards looking up, behind, and slow.",
      image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=80",
      youtubeId: "",
      facts: [
        "Pulse Revelio, turn, pulse again.",
        "Story night OR explore night — pick one.",
        "Ask Dad before spoiler videos."
      ],
      linkBoard: "hogwarts"
    },
    {
      id: "cj-leverage",
      tag: "jones",
      title: "Chris Jones · leverage first",
      why: "Chiefs DT wins with pad level and angles, not just size.",
      image: "https://images.unsplash.com/photo-1566577739112-ce14e5bd0c0b?w=1200&q=80",
      youtubeId: "",
      facts: [
        "Low pads beat tall pads at the snap.",
        "Step to create a seam, then drive.",
        "Power without balance is wasted."
      ]
    },
    {
      id: "cj-hands-film",
      tag: "jones",
      title: "Hands + film study",
      why: "Jones uses violent hands and knows blockers' habits.",
      image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&q=80",
      youtubeId: "",
      facts: [
        "Hand fight early — swipe, swim, rip.",
        "Film: which side does the guard lean?",
        "Practice hand speed on a bag or towel."
      ]
    },
    {
      id: "cj-close-humble",
      tag: "jones",
      title: "Close hard, stay humble",
      why: "Finish to the quarterback — then reset quiet for the next snap.",
      image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200&q=80",
      youtubeId: "",
      facts: [
        "Closing speed comes after the first move.",
        "Celebrate with the team, not the camera.",
        "Next play energy > last-play highlight."
      ]
    }
  ];

  return { GAMES: GAMES, INTERESTS: INTERESTS, CARDS: CARDS, SPARKS: SPARKS };

})();
