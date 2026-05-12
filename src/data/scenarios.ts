// Fictional geopolitical crises. Each round the host rolls one — every
// delegate must respond to the same crisis with a dispatch.

export function rollScenario(scenarios: string[], excluding: string[] = []): string {
  const pool = scenarios.filter((s) => !excluding.includes(s));
  return pool[Math.floor(Math.random() * pool.length)] ?? scenarios[0];
}


export const SCENARIOS: string[] = [
  "A neighbouring nation has just declared sovereignty over your largest fishing waters, citing a 14th-century parchment.",
  "Satellite imagery leaks showing your military jets parked on a glacier you publicly insist you do not own.",
  "The G20 summit livestream catches your foreign minister rolling their eyes during the host nation's anthem.",
  "An ally's parliament passes a resolution recognising your tax haven islands as 'rogue micro-states'.",
  "A rival superpower offers your closest neighbour a 'free' high-speed rail line that crosses your disputed border.",
  "Your ambassador's diplomatic pouch is intercepted at customs containing 47 kilos of artisanal cheese and a hard drive.",
  "A leaked audio recording has your defence minister referring to a treaty partner as 'the spreadsheet country'.",
  "The UN Security Council schedules an emergency session on your unannounced lithium mining operation in international waters.",
  "An adversarial state's central bank dumps your sovereign bonds at 09:01 on a Monday with no explanation.",
  "Climate refugees from a bordering nation have begun crossing on hovercrafts your coast guard cannot legally board.",
  "A foreign tech billionaire announces he is 'personally annexing' an uninhabited atoll within your maritime EEZ.",
  "Your national airline's CEO is detained at a rival capital's airport on charges of 'espionage by Wi-Fi'.",
  "A renegade general in a friendly state has seized the country's only functioning port, demanding peacekeepers — yours specifically.",
  "Hackers from an unattributable group have replaced every digital billboard in your capital with a rival nation's flag.",
  "A whistleblower releases recordings of your trade delegation laughing during a moment of silence at a summit.",
  "An OPEC member proposes pricing oil in a stablecoin issued by a country you do not formally recognise.",
  "An expedition under your flag accidentally plants it on territory administered by a rival, livestreamed.",
  "A foreign embassy in your capital accidentally orders 800 takeout pizzas to a sensitive military site.",
  "Your prime minister's deepfake apology video for a war that never happened goes viral overnight.",
  "A rival nation's reality show contestants film an episode inside your closed border zone without permission.",
  "Your former colony has just elected a parliament running on a single-issue 'reparations or war' platform.",
  "A glacier melts revealing a Cold War nuclear silo that, technically, nobody admits to having built.",
  "Pop superstar of a hostile nation announces a 'world tour for peace' beginning in your most fortified city.",
  "Your nation's space agency loses contact with a satellite that is now drifting over disputed airspace.",
  "An AI chatbot trained on your foreign ministry's memos begins answering hotlines from foreign governments overnight.",
  "Your delegation's translator at a peace conference has just confessed they invented 'most of the second hour'.",
];
