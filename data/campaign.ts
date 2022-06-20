import UpgradeService from "../services/UpgradeService";

export interface ITrait {
  id: string;
  name: string;
  description: string;
}

export interface ISkillSet {
  id: string;
  name: string;
  traits: ITrait[];
}

const traitDefinitions = {
  gf: {
    units: [
      {
        "name": "Agile",
        "description": "Moves +1” on advance and +2” on rush and charge."
      },
      {
        "name": "Headstrong",
        "description": "Gets +1 to rolls when taking morale tests."
      },
      {
        "name": "Specialist (Melee)",
        "description": "Gets +1 to rolls in melee."
      },
      {
        "name": "Specialist (Shooting)",
        "description": "Gets +1 to rolls when shooting."
      },
      {
        "name": "Resilient",
        "description": "Gets +1 to rolls when blocking hits."
      },
      {
        "name": "Elite",
        "description": "May re-roll one roll of any kind once per game."
      }
    ],
    "heroes": [
      {
        name: "Captain",
        traits: [
          {
            name: "Leader",
            description: "Friendly units within 6” get +1 to morale tests."
          },
          {
            name: "Instigator",
            description: "Friendly units within 6” get +1 to melee."
          },
          {
            name: "Tactician",
            description: "Friendly units within 6” get +1 to shooting."
          }
        ]
      },
      {
        name: "Support",
        traits: [
          {
            name: "Vanguard",
            description: "Friendly units within 6” get +4” charge range."
          },
          {
            name: "Scavenger",
            description: "Friendly units within 6” get +6” firing range."
          },
          {
            name: "Mastermind",
            description: "Enemy units within 6” get -1 to defense."
          }
        ]
      },
      {
        name: "Fighter",
        traits: [
          {
            name: "Duellist",
            description: "Enemy units get -1 in melee against the hero."
          },
          {
            name: "Fanatic",
            description: "The hero gets +1 attack when in melee."
          },
          {
            name: "Berserker",
            description: "Enemies get -1 to morale tests when in melee with the hero."
          }
        ]
      },
      {
        name: "Shooter",
        traits: [
          {
            name: "Hunter",
            description: "The hero may shoot even after rush actions."
          },
          {
            name: "Destroyer",
            description: "The hero gets AP(+1) when shooting."
          },
          {
            name: "Suppressor",
            description: "Enemies shot at by the hero get -1 to shooting until the end of the round."
          }
        ]
      },
      {
        name: "Pathfinder",
        traits: [
          {
            name: "Runner",
            description: "The hero always moves +2” (even in terrain)."
          },
          {
            name: "Prowler",
            description: "Enemy units further than 12” get -1 to shooting rolls against the hero."
          },
          {
            name: "Daredevil",
            description: "The hero ignores dangerous terrain effects."
          }
        ]
      },
      {
        name: "Healer",
        traits: [
          {
            name: "Chemist",
            description: "Friendly units within 6” get +1 to morale tests when in melee."
          },
          {
            name: "Herbalist",
            description: "Friendly units within 6” may ignore wounds on a roll of 6+."
          },
          {
            name: "Warden",
            description: "When the hero is activated roll one die, on a 5+ all friendly units within 6” stop being pinned."
          }
        ]
      }
    ],
    "injuries": [
      {
        "name": "Chest Wound",
        "description": "Gets -1 to rolls when blocking hits."
      },
      {
        "name": "Blinded Eye",
        "description": "Gets -1 to rolls when shooting."
      },
      {
        "name": "Arm Injury",
        "description": "Gets -1 to rolls when in melee."
      },
      {
        "name": "Traumatised",
        "description": "Gets -1 to rolls when taking morale tests."
      },
      {
        "name": "Smashed Leg",
        "description": "Moves -1” on advance and -2” on rush and charge actions."
      },
    ],
    "talents": [
      {
        "name": "Motivated",
        "description": "Always passes the first morale test of the match."
      },
      {
        "name": "Crazed",
        "description": "Gets +1 attack in melee when charging."
      },
      {
        "name": "Bitter Rivalry",
        "description": "Always hits pinned units on 2+."
      },
      {
        "name": "Horrible Scars",
        "description": "Enemy units get -1 to hit when in melee against the hero."
      },
      {
        "name": "Toughened",
        "description": "Gets Tough(+1)."
      },
    ]
  },
  gff: {
    units: [
      {
        "name": "Agile",
        "description": "Moves +1” on advance and +2” on rush and charge."
      },
      {
        "name": "Headstrong",
        "description": "Gets +1 to rolls when taking morale tests."
      },
      {
        "name": "Specialist (Melee)",
        "description": "Gets +1 to rolls in melee."
      },
      {
        "name": "Specialist (Shooting)",
        "description": "Gets +1 to rolls when shooting."
      },
      {
        "name": "Resilient",
        "description": "Gets +1 to rolls when blocking hits."
      },
      {
        "name": "Elite",
        "description": "May re-roll one die of any kind once per game."
      }
    ],
    "heroes": [
      {
        name: "Captain",
        traits: [
          {
            name: "Leader",
            description: "Friendly units within 3” get +1 to morale tests."
          },
          {
            name: "Instigator",
            description: "Friendly units within 3” get +1 to melee."
          },
          {
            name: "Tactician",
            description: "Friendly units within 3” get +1 to shooting."
          }
        ]
      },
      {
        name: "Support",
        traits: [
          {
            name: "Vanguard",
            description: "Friendly units within 3” get +4” charge range."
          },
          {
            name: "Scavenger",
            description: "Friendly units within 3” get +6” firing range."
          },
          {
            name: "Mastermind",
            description: "Enemy units within 3” get -1 to defense."
          }
        ]
      },
      {
        name: "Fighter",
        traits: [
          {
            name: "Duellist",
            description: "Enemy units get -1 in melee against the hero."
          },
          {
            name: "Fanatic",
            description: "The hero gets +1 attack when in melee."
          },
          {
            name: "Berserker",
            description: "Enemies get +1 to wound results when in melee with the hero."
          }
        ]
      },
      {
        name: "Shooter",
        traits: [
          {
            name: "Hunter",
            description: "The hero may shoot even after rush actions."
          },
          {
            name: "Destroyer",
            description: "The hero gets AP(+1) when shooting."
          },
          {
            name: "Suppressor",
            description: "Enemies shot at by the hero get -1 to shooting until the end of the round."
          }
        ]
      },
      {
        name: "Pathfinder",
        traits: [
          {
            name: "Runner",
            description: "The hero always moves +2” (even in terrain)."
          },
          {
            name: "Prowler",
            description: "Enemy units further than 12” get -1 to shooting rolls against the hero."
          },
          {
            name: "Daredevil",
            description: "The hero needs to roll only 2+ (instead of 3+) when dropping, leaping and jumping."
          }
        ]
      },
      {
        name: "Healer",
        traits: [
          {
            name: "Chemist",
            description: "Friendly units within 3” get -1 to wound result rolls."
          },
          {
            name: "Herbalist",
            description: "Friendly units within 3” may ignore wounds on a roll of 6+."
          },
          {
            name: "Warden",
            description: "When the hero is activated roll one die, on a 5+ all friendly units within 3” stop being stunned."
          }
        ]
      }
    ],
    "injuries": [
      {
        "name": "Chest Wound",
        "description": "Gets -1 to rolls when blocking hits."
      },
      {
        "name": "Blinded Eye",
        "description": "Gets -1 to rolls when shooting."
      },
      {
        "name": "Arm Injury",
        "description": "Gets -1 to rolls when in melee."
      },
      {
        "name": "Traumatised",
        "description": "Gets -1 to rolls when taking morale tests."
      },
      {
        "name": "Smashed Leg",
        "description": "Moves -1” on advance and -2” on rush and charge actions."
      },
    ],
    "talents": [
      {
        "name": "Motivated",
        "description": "Always passes the first morale test of the match."
      },
      {
        "name": "Crazed",
        "description": "Gets +1 attack in melee when charging."
      },
      {
        "name": "Bitter Rivalry",
        "description": "Always hits stunned units on 2+."
      },
      {
        "name": "Horrible Scars",
        "description": "Enemy units get -1 to hit when in melee against the hero."
      },
      {
        "name": "Toughened",
        "description": "Gets Tough(+1)."
      },
    ]
  },
  aof: {
    units: [
      {
        "name": "Agile",
        "description": "Moves +1” on advance and +2” on rush and charge."
      },
      {
        "name": "Headstrong",
        "description": "Gets +1 to rolls when taking morale tests."
      },
      {
        "name": "Specialist (Melee)",
        "description": "Gets +1 to rolls in melee."
      },
      {
        "name": "Specialist (Shooting)",
        "description": "Gets +1 to rolls when shooting."
      },
      {
        "name": "Resilient",
        "description": "Gets +1 to rolls when blocking hits."
      },
      {
        "name": "Elite",
        "description": "May re-roll one roll of any kind once per game."
      }
    ],
    "heroes": [
      {
        name: "Captain",
        traits: [
          {
            name: "Leader",
            description: "Friendly units within 6” get +1 to morale tests."
          },
          {
            name: "Instigator",
            description: "Friendly units within 6” get +1 to melee."
          },
          {
            name: "Tactician",
            description: "Friendly units within 6” get +1 to shooting."
          }
        ]
      },
      {
        name: "Support",
        traits: [
          {
            name: "Vanguard",
            description: "Friendly units within 6” get +1 to morale tests."
          },
          {
            name: "Scavenger",
            description: "Friendly units within 6” get +1 to melee."
          },
          {
            name: "Mastermind",
            description: "Friendly units within 6” get +1 to shooting."
          }
        ]
      },
      {
        name: "Fighter",
        traits: [
          {
            name: "Duellist",
            description: "Friendly units within 6” get +1 to morale tests."
          },
          {
            name: "Fanatic",
            description: "Friendly units within 6” get +1 to melee."
          },
          {
            name: "Berserker",
            description: "Friendly units within 6” get +1 to shooting."
          }
        ]
      },
      {
        name: "Shooter",
        traits: [
          {
            name: "Hunter",
            description: "The hero may shoot even after rush actions."
          },
          {
            name: "Destroyer",
            description: "The hero gets AP(+1) when shooting."
          },
          {
            name: "Suppressor",
            description: "Enemies shot at by the hero get -1 to shooting until the end of the round."
          }
        ]
      },
      {
        name: "Pathfinder",
        traits: [
          {
            name: "Runner",
            description: "The hero always moves +2” (even in terrain)."
          },
          {
            name: "Prowler",
            description: "Enemy units further than 12” get -1 to shooting rolls against the hero."
          },
          {
            name: "Daredevil",
            description: "The hero ignores dangerous terrain effects."
          }
        ]
      },
      {
        name: "Healer",
        traits: [
          {
            name: "Chemist",
            description: "Friendly units within 6” get +1 to morale tests when in melee."
          },
          {
            name: "Herbalist",
            description: "Friendly units within 6” may ignore wounds on a roll of 6+."
          },
          {
            name: "Warden",
            description: "When the hero is activated roll one die, on a 5+ all friendly units within 6” stop being pinned."
          }
        ]
      }
    ],
    "injuries": [
      {
        "name": "Chest Wound",
        "description": "Gets -1 to rolls when blocking hits."
      },
      {
        "name": "Blinded Eye",
        "description": "Gets -1 to rolls when shooting."
      },
      {
        "name": "Arm Injury",
        "description": "Gets -1 to rolls when in melee."
      },
      {
        "name": "Traumatised",
        "description": "Gets -1 to rolls when taking morale tests."
      },
      {
        "name": "Smashed Leg",
        "description": "Moves -1” on advance and -2” on rush and charge actions."
      },
    ],
    "talents": [
      {
        "name": "Motivated",
        "description": "Always passes the first morale test of the match."
      },
      {
        "name": "Crazed",
        "description": "Gets +1 attack in melee when charging."
      },
      {
        "name": "Bitter Rivalry",
        "description": "Always hits pinned units on 2+."
      },
      {
        "name": "Horrible Scars",
        "description": "Enemy units get -1 to hit when in melee against the hero."
      },
      {
        "name": "Toughened",
        "description": "Gets Tough(+1)."
      },
    ]
  },
  aofs: {
    units: [
      {
        "name": "Agile",
        "description": "Moves +1” on advance and +2” on rush and charge."
      },
      {
        "name": "Headstrong",
        "description": "Gets +1 to rolls when taking morale tests."
      },
      {
        "name": "Specialist (Melee)",
        "description": "Gets +1 to rolls in melee."
      },
      {
        "name": "Specialist (Shooting)",
        "description": "Gets +1 to rolls when shooting."
      },
      {
        "name": "Resilient",
        "description": "Gets +1 to rolls when blocking hits."
      },
      {
        "name": "Elite",
        "description": "May re-roll one roll of any kind once per game."
      }
    ],
    "heroes": [
      {
        name: "Captain",
        traits: [
          {
            name: "Leader",
            description: "Friendly units within 6” get +1 to morale tests."
          },
          {
            name: "Instigator",
            description: "Friendly units within 6” get +1 to melee."
          },
          {
            name: "Tactician",
            description: "Friendly units within 6” get +1 to shooting."
          }
        ]
      },
      {
        name: "Support",
        traits: [
          {
            name: "Vanguard",
            description: "Friendly units within 6” get +1 to morale tests."
          },
          {
            name: "Scavenger",
            description: "Friendly units within 6” get +1 to melee."
          },
          {
            name: "Mastermind",
            description: "Friendly units within 6” get +1 to shooting."
          }
        ]
      },
      {
        name: "Fighter",
        traits: [
          {
            name: "Duellist",
            description: "Friendly units within 6” get +1 to morale tests."
          },
          {
            name: "Fanatic",
            description: "Friendly units within 6” get +1 to melee."
          },
          {
            name: "Berserker",
            description: "Friendly units within 6” get +1 to shooting."
          }
        ]
      },
      {
        name: "Shooter",
        traits: [
          {
            name: "Hunter",
            description: "The hero may shoot even after rush actions."
          },
          {
            name: "Destroyer",
            description: "The hero gets AP(+1) when shooting."
          },
          {
            name: "Suppressor",
            description: "Enemies shot at by the hero get -1 to shooting until the end of the round."
          }
        ]
      },
      {
        name: "Pathfinder",
        traits: [
          {
            name: "Runner",
            description: "The hero always moves +2” (even in terrain)."
          },
          {
            name: "Prowler",
            description: "Enemy units further than 12” get -1 to shooting rolls against the hero."
          },
          {
            name: "Daredevil",
            description: "The hero ignores dangerous terrain effects."
          }
        ]
      },
      {
        name: "Healer",
        traits: [
          {
            name: "Chemist",
            description: "Friendly units within 6” get +1 to morale tests when in melee."
          },
          {
            name: "Herbalist",
            description: "Friendly units within 6” may ignore wounds on a roll of 6+."
          },
          {
            name: "Warden",
            description: "When the hero is activated roll one die, on a 5+ all friendly units within 6” stop being pinned."
          }
        ]
      }
    ],
    "injuries": [
      {
        "name": "Chest Wound",
        "description": "Gets -1 to rolls when blocking hits."
      },
      {
        "name": "Blinded Eye",
        "description": "Gets -1 to rolls when shooting."
      },
      {
        "name": "Arm Injury",
        "description": "Gets -1 to rolls when in melee."
      },
      {
        "name": "Traumatised",
        "description": "Gets -1 to rolls when taking morale tests."
      },
      {
        "name": "Smashed Leg",
        "description": "Moves -1” on advance and -2” on rush and charge actions."
      },
    ],
    "talents": [
      {
        "name": "Motivated",
        "description": "Always passes the first morale test of the match."
      },
      {
        "name": "Crazed",
        "description": "Gets +1 attack in melee when charging."
      },
      {
        "name": "Bitter Rivalry",
        "description": "Always hits pinned units on 2+."
      },
      {
        "name": "Horrible Scars",
        "description": "Enemy units get -1 to hit when in melee against the hero."
      },
      {
        "name": "Toughened",
        "description": "Gets Tough(+1)."
      },
    ]
  },
  aofr: {}
};

traitDefinitions["aofr"] = traitDefinitions["aof"];


export function getTraitDefinitions() {
  return traitDefinitions[UpgradeService.gameSystem];
}

export function getFlatTraitDefinitions(): ITrait[] {
  const defs = traitDefinitions[UpgradeService.gameSystem];
  if (!traitDefinitions[UpgradeService.gameSystem]["all"]) {
    traitDefinitions[UpgradeService.gameSystem]["all"] = defs.units.concat(defs.injuries).concat(defs.talents).concat(defs.heroes.flatMap(x => x.traits));
  }
  return traitDefinitions[UpgradeService.gameSystem]["all"];
}