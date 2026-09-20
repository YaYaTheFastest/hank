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

  var CARDS = { minecraft: [], hogwarts: [] };

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
