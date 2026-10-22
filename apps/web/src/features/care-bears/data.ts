// Mock data for the Care Bears workforce allocation dashboard. Swap for API
// calls once a backend exists; the shapes here are the contract the UI reads.

export type BearStatus = "deployed" | "available" | "recharging" | "off-duty";

export type MissionStatus =
  | "in-progress"
  | "scheduled"
  | "unassigned"
  | "completed";

export type MissionPriority = "critical" | "high" | "normal" | "low";

export type BellyBadge =
  | "heart"
  | "rainbow"
  | "rain-cloud"
  | "sun"
  | "clover"
  | "twin-hearts"
  | "lollipops"
  | "shooting-star"
  | "moon"
  | "cupcake"
  | "flowers"
  | "trophy"
  | "music"
  | "padlock";

export type BearTone = "primary" | "secondary" | "accent" | "neutral";

export type Power = {
  name: string;
  description: string;
  /** Proficiency, 0–100. */
  level: number;
};

export type Bear = {
  id: string;
  name: string;
  role: string;
  bellyBadge: BellyBadge;
  bellyBadgeLabel: string;
  tone: BearTone;
  status: BearStatus;
  homeBase: string;
  bio: string;
  /** Caring energy, 0–100. Below 30 the bear should recharge. */
  energy: number;
  powers: Power[];
  specialties: string[];
  joined: string;
  missionsCompleted: number;
  heartsHelped: number;
};

export type Mission = {
  id: string;
  title: string;
  location: string;
  summary: string;
  priority: MissionPriority;
  status: MissionStatus;
  bearIds: string[];
  requiredPowers: string[];
  start: string;
  due: string;
  /** 0–100. */
  progress: number;
};

export const LOW_ENERGY_THRESHOLD = 30;

const careBearStare: Power = {
  name: "Care Bear Stare",
  description:
    "Combined belly-badge beam that turns uncaring hearts caring again.",
  level: 0,
};

const stare = (level: number): Power => ({ ...careBearStare, level });

export const bears: Bear[] = [
  {
    id: "tenderheart",
    name: "Tenderheart Bear",
    role: "Team lead",
    bellyBadge: "heart",
    bellyBadgeLabel: "Red heart",
    tone: "primary",
    status: "deployed",
    homeBase: "Care-a-Lot",
    bio: "Helps everyone express their feelings and keeps the whole team pointed in the same direction.",
    energy: 72,
    powers: [
      stare(96),
      {
        name: "Feelings finder",
        description: "Senses who needs help, even from far away.",
        level: 92,
      },
      {
        name: "Rally call",
        description: "Gathers every available bear for a group stare.",
        level: 88,
      },
    ],
    specialties: ["Leadership", "Emotional support", "Crisis response"],
    joined: "1982-04-01",
    missionsCompleted: 412,
    heartsHelped: 18240,
  },
  {
    id: "cheer",
    name: "Cheer Bear",
    role: "Morale specialist",
    bellyBadge: "rainbow",
    bellyBadgeLabel: "Rainbow",
    tone: "accent",
    status: "deployed",
    homeBase: "Care-a-Lot",
    bio: "Can turn the gloomiest day bright and is the team's go-to for low morale.",
    energy: 64,
    powers: [
      stare(90),
      {
        name: "Rainbow slide",
        description: "Builds a rainbow path to reach anyone quickly.",
        level: 85,
      },
      {
        name: "Cheer burst",
        description: "Lifts the mood of a whole crowd at once.",
        level: 94,
      },
    ],
    specialties: ["Morale", "Crowd work", "Rapid transit"],
    joined: "1982-04-01",
    missionsCompleted: 365,
    heartsHelped: 15110,
  },
  {
    id: "grumpy",
    name: "Grumpy Bear",
    role: "Engineer",
    bellyBadge: "rain-cloud",
    bellyBadgeLabel: "Rain cloud with hearts",
    tone: "primary",
    status: "recharging",
    homeBase: "Care-a-Lot workshop",
    bio: "Fixes the Cloudmobiles and the Caring Meter. Shows that it's okay to have a bad day.",
    energy: 18,
    powers: [
      stare(78),
      {
        name: "Gadgeteering",
        description: "Builds and repairs anything from cloud and starlight.",
        level: 97,
      },
      {
        name: "Heart rain",
        description: "Summons a shower that softens stubborn moods.",
        level: 70,
      },
    ],
    specialties: ["Repairs", "Cloudmobiles", "Caring Meter"],
    joined: "1982-04-01",
    missionsCompleted: 298,
    heartsHelped: 9870,
  },
  {
    id: "funshine",
    name: "Funshine Bear",
    role: "Field agent",
    bellyBadge: "sun",
    bellyBadgeLabel: "Smiling sun",
    tone: "accent",
    status: "available",
    homeBase: "Care-a-Lot",
    bio: "Brings fun and sunshine wherever there's a frown. Never met a game they didn't like.",
    energy: 88,
    powers: [
      stare(84),
      {
        name: "Sunbeam",
        description: "Warms a room and clears away gloomy clouds.",
        level: 90,
      },
      {
        name: "Playtime",
        description: "Turns any chore into a game everyone joins.",
        level: 86,
      },
    ],
    specialties: ["Children's outreach", "Weather", "Games"],
    joined: "1982-04-01",
    missionsCompleted: 276,
    heartsHelped: 12400,
  },
  {
    id: "good-luck",
    name: "Good Luck Bear",
    role: "Field agent",
    bellyBadge: "clover",
    bellyBadgeLabel: "Four-leaf clover",
    tone: "secondary",
    status: "deployed",
    homeBase: "Care-a-Lot",
    bio: "Spreads good fortune and helps others find the luck they make for themselves.",
    energy: 55,
    powers: [
      stare(82),
      {
        name: "Lucky break",
        description: "Nudges the odds toward a happy outcome.",
        level: 89,
      },
      {
        name: "Clover charm",
        description: "Leaves a token that boosts confidence for a day.",
        level: 74,
      },
    ],
    specialties: ["Confidence", "Competitions", "Exams"],
    joined: "1982-04-01",
    missionsCompleted: 241,
    heartsHelped: 8830,
  },
  {
    id: "love-a-lot",
    name: "Love-a-Lot Bear",
    role: "Relationship specialist",
    bellyBadge: "twin-hearts",
    bellyBadgeLabel: "Two hearts",
    tone: "accent",
    status: "available",
    homeBase: "Care-a-Lot",
    bio: "Helps friends, families and neighbours show each other they care.",
    energy: 91,
    powers: [
      stare(88),
      {
        name: "Heartstring",
        description: "Reconnects people who've drifted apart.",
        level: 93,
      },
      {
        name: "Kindness echo",
        description: "Makes one kind act ripple through a group.",
        level: 81,
      },
    ],
    specialties: ["Mediation", "Families", "Friendship"],
    joined: "1982-04-01",
    missionsCompleted: 254,
    heartsHelped: 11320,
  },
  {
    id: "share",
    name: "Share Bear",
    role: "Community organizer",
    bellyBadge: "lollipops",
    bellyBadgeLabel: "Two crossed lollipops",
    tone: "secondary",
    status: "deployed",
    homeBase: "Care-a-Lot",
    bio: "Teaches that sharing makes everything better, from toys to troubles.",
    energy: 47,
    powers: [
      stare(80),
      {
        name: "Double up",
        description: "Turns one treat into enough for everyone.",
        level: 87,
      },
      {
        name: "Fair split",
        description: "Settles disputes so everyone feels heard.",
        level: 79,
      },
    ],
    specialties: ["Conflict resolution", "Schools", "Food drives"],
    joined: "1983-03-01",
    missionsCompleted: 188,
    heartsHelped: 7420,
  },
  {
    id: "wish",
    name: "Wish Bear",
    role: "Dream coordinator",
    bellyBadge: "shooting-star",
    bellyBadgeLabel: "Shooting star",
    tone: "primary",
    status: "available",
    homeBase: "Care-a-Lot observatory",
    bio: "Helps wishes come true, especially the ones people are too shy to say out loud.",
    energy: 79,
    powers: [
      stare(83),
      {
        name: "Wishing star",
        description: "Sends Twinkers the star to grant a heartfelt wish.",
        level: 91,
      },
      {
        name: "Starlight map",
        description: "Charts the quickest way to anyone who's wishing.",
        level: 77,
      },
    ],
    specialties: ["Dreams", "Navigation", "Night missions"],
    joined: "1982-04-01",
    missionsCompleted: 203,
    heartsHelped: 9010,
  },
  {
    id: "bedtime",
    name: "Bedtime Bear",
    role: "Night shift",
    bellyBadge: "moon",
    bellyBadgeLabel: "Crescent moon with star",
    tone: "primary",
    status: "off-duty",
    homeBase: "Care-a-Lot",
    bio: "Watches over sleepers and chases away bad dreams. Sleeps through most of the day shift.",
    energy: 40,
    powers: [
      stare(76),
      {
        name: "Sweet dreams",
        description: "Swaps nightmares for gentle dreams.",
        level: 95,
      },
      {
        name: "Lullaby",
        description: "Calms anyone who can't settle.",
        level: 88,
      },
    ],
    specialties: ["Night watch", "Nightmares", "Calming"],
    joined: "1982-04-01",
    missionsCompleted: 222,
    heartsHelped: 10150,
  },
  {
    id: "birthday",
    name: "Birthday Bear",
    role: "Celebrations",
    bellyBadge: "cupcake",
    bellyBadgeLabel: "Cupcake with a candle",
    tone: "accent",
    status: "recharging",
    homeBase: "Care-a-Lot",
    bio: "Makes sure no birthday is ever forgotten and every celebration feels special.",
    energy: 24,
    powers: [
      stare(74),
      {
        name: "Party planner",
        description: "Pulls together a celebration at a moment's notice.",
        level: 92,
      },
      {
        name: "Remember-me",
        description: "Never forgets a date that matters to someone.",
        level: 98,
      },
    ],
    specialties: ["Events", "Logistics", "Surprises"],
    joined: "1982-04-01",
    missionsCompleted: 176,
    heartsHelped: 6880,
  },
  {
    id: "friend",
    name: "Friend Bear",
    role: "Field agent",
    bellyBadge: "flowers",
    bellyBadgeLabel: "Two smiling flowers",
    tone: "secondary",
    status: "deployed",
    homeBase: "Care-a-Lot",
    bio: "Helps lonely folks make friends and keeps old friendships in bloom.",
    energy: 61,
    powers: [
      stare(81),
      {
        name: "Bloom bond",
        description: "Sparks a friendship between two strangers.",
        level: 90,
      },
      {
        name: "Garden of pals",
        description: "Grows a circle of support around someone lonely.",
        level: 76,
      },
    ],
    specialties: ["Loneliness", "New arrivals", "Buddy systems"],
    joined: "1982-04-01",
    missionsCompleted: 199,
    heartsHelped: 8120,
  },
  {
    id: "champ",
    name: "Champ Bear",
    role: "Coach",
    bellyBadge: "trophy",
    bellyBadgeLabel: "Trophy",
    tone: "accent",
    status: "available",
    homeBase: "Care-a-Lot stadium",
    bio: "Coaches fair play and reminds everyone that doing your best is what counts.",
    energy: 85,
    powers: [
      stare(79),
      {
        name: "Second wind",
        description: "Restores the energy of a tired teammate.",
        level: 84,
      },
      {
        name: "Good sport",
        description: "Turns rivals into teammates.",
        level: 87,
      },
    ],
    specialties: ["Sports", "Teamwork", "Fair play"],
    joined: "1984-05-01",
    missionsCompleted: 154,
    heartsHelped: 5960,
  },
  {
    id: "harmony",
    name: "Harmony Bear",
    role: "Diversity & inclusion",
    bellyBadge: "music",
    bellyBadgeLabel: "Flower of music notes",
    tone: "primary",
    status: "available",
    homeBase: "Care-a-Lot",
    bio: "Celebrates differences and helps everyone find their part in the song.",
    energy: 76,
    powers: [
      stare(85),
      {
        name: "Perfect pitch",
        description: "Brings clashing voices into harmony.",
        level: 91,
      },
      {
        name: "Chorus",
        description: "Amplifies the team's stare when singing together.",
        level: 80,
      },
    ],
    specialties: ["Inclusion", "Music", "Group harmony"],
    joined: "1984-05-01",
    missionsCompleted: 147,
    heartsHelped: 6210,
  },
  {
    id: "secret",
    name: "Secret Bear",
    role: "Confidant",
    bellyBadge: "padlock",
    bellyBadgeLabel: "Heart-shaped padlock",
    tone: "neutral",
    status: "off-duty",
    homeBase: "Care-a-Lot",
    bio: "Keeps every secret safe and communicates mostly through gestures and whispers.",
    energy: 58,
    powers: [
      stare(77),
      {
        name: "Vault",
        description: "Keeps a confidence safe no matter what.",
        level: 99,
      },
      {
        name: "Quiet comfort",
        description: "Says the right thing without saying a word.",
        level: 83,
      },
    ],
    specialties: ["Trust", "Confidential cases", "Listening"],
    joined: "1985-01-01",
    missionsCompleted: 131,
    heartsHelped: 4970,
  },
];

export const missions: Mission[] = [
  {
    id: "m-104",
    title: "Lift spirits at Riverside Elementary",
    location: "Riverside, Earth",
    summary:
      "Caring Meter dropped after a cancelled field trip. Cheer up the class and help plan a new one.",
    priority: "high",
    status: "in-progress",
    bearIds: ["cheer", "share"],
    requiredPowers: ["Cheer burst", "Fair split"],
    start: "2026-10-20",
    due: "2026-10-24",
    progress: 60,
  },
  {
    id: "m-105",
    title: "Stop No Heart's frost over Forest of Feelings",
    location: "Forest of Feelings",
    summary:
      "No Heart is freezing the forest's caring. Needs a full-strength group stare.",
    priority: "critical",
    status: "in-progress",
    bearIds: ["tenderheart", "good-luck", "friend"],
    requiredPowers: ["Care Bear Stare", "Rally call"],
    start: "2026-10-21",
    due: "2026-10-23",
    progress: 35,
  },
  {
    id: "m-106",
    title: "New-kid welcome at Maple Street",
    location: "Maple Street, Earth",
    summary: "A family just moved in and their kid hasn't made friends yet.",
    priority: "normal",
    status: "scheduled",
    bearIds: ["friend"],
    requiredPowers: ["Bloom bond"],
    start: "2026-10-25",
    due: "2026-10-27",
    progress: 0,
  },
  {
    id: "m-107",
    title: "Repair the Caring Meter",
    location: "Care-a-Lot",
    summary:
      "Needle is sticking after last week's storm. Recalibrate and test.",
    priority: "high",
    status: "unassigned",
    bearIds: [],
    requiredPowers: ["Gadgeteering"],
    start: "2026-10-23",
    due: "2026-10-26",
    progress: 0,
  },
  {
    id: "m-108",
    title: "Nightmare patrol: Oakwood suburbs",
    location: "Oakwood, Earth",
    summary: "A run of bad dreams reported on the Star-a-Scope.",
    priority: "normal",
    status: "unassigned",
    bearIds: [],
    requiredPowers: ["Sweet dreams"],
    start: "2026-10-23",
    due: "2026-10-30",
    progress: 0,
  },
  {
    id: "m-109",
    title: "Surprise party for Grandpa Joe",
    location: "Pine Hollow, Earth",
    summary: "Turning 90 and thinks everyone forgot.",
    priority: "low",
    status: "scheduled",
    bearIds: ["love-a-lot"],
    requiredPowers: ["Party planner"],
    start: "2026-10-28",
    due: "2026-10-28",
    progress: 0,
  },
  {
    id: "m-110",
    title: "Big-game sportsmanship clinic",
    location: "Lakeside Park, Earth",
    summary:
      "Two rival teams need a reminder about fair play before the final.",
    priority: "normal",
    status: "unassigned",
    bearIds: [],
    requiredPowers: ["Good sport"],
    start: "2026-10-24",
    due: "2026-10-25",
    progress: 0,
  },
  {
    id: "m-098",
    title: "Rainbow bridge restoration",
    location: "Care-a-Lot",
    summary: "Fixed the faded bridge after Beastly's prank.",
    priority: "high",
    status: "completed",
    bearIds: ["cheer", "grumpy"],
    requiredPowers: ["Rainbow slide", "Gadgeteering"],
    start: "2026-10-10",
    due: "2026-10-14",
    progress: 100,
  },
  {
    id: "m-099",
    title: "Cloudmobile fleet tune-up",
    location: "Care-a-Lot workshop",
    summary: "Seasonal maintenance for all eight Cloudmobiles.",
    priority: "normal",
    status: "completed",
    bearIds: ["grumpy"],
    requiredPowers: ["Gadgeteering"],
    start: "2026-10-05",
    due: "2026-10-09",
    progress: 100,
  },
  {
    id: "m-100",
    title: "Lost puppy reunion",
    location: "Brookfield, Earth",
    summary: "Helped a child and their dog find each other.",
    priority: "normal",
    status: "completed",
    bearIds: ["good-luck", "wish"],
    requiredPowers: ["Lucky break", "Starlight map"],
    start: "2026-10-11",
    due: "2026-10-12",
    progress: 100,
  },
  {
    id: "m-101",
    title: "Sleepover jitters",
    location: "Elm Court, Earth",
    summary: "First sleepover away from home. Calmed the nerves.",
    priority: "low",
    status: "completed",
    bearIds: ["bedtime"],
    requiredPowers: ["Lullaby"],
    start: "2026-10-15",
    due: "2026-10-15",
    progress: 100,
  },
  {
    id: "m-102",
    title: "Talent show stage fright",
    location: "Hillcrest Middle, Earth",
    summary: "Helped a shy singer find their voice.",
    priority: "normal",
    status: "completed",
    bearIds: ["harmony", "funshine"],
    requiredPowers: ["Perfect pitch"],
    start: "2026-10-16",
    due: "2026-10-17",
    progress: 100,
  },
  {
    id: "m-103",
    title: "Birthday rescue",
    location: "Cedar Lane, Earth",
    summary: "A forgotten birthday turned into the best one yet.",
    priority: "high",
    status: "completed",
    bearIds: ["birthday", "love-a-lot", "secret"],
    requiredPowers: ["Party planner", "Remember-me"],
    start: "2026-10-18",
    due: "2026-10-19",
    progress: 100,
  },
];
