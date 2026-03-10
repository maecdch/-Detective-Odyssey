export interface GameState {
  story: string;
  inventory: string[];
  currentQuest: string;
  location: string;
  theTruth: string;
}

export interface StoryStep {
  text: string;
  choices: string[];
  inventory: string[];
  currentQuest: string;
  theTruth?: string;
}
