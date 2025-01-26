export enum EVENTS_NAME {
  gameEnd = 'game-end',
  hpChange = 'hp-change',
}

export enum GameStatus {
  WIN,
  LOSE,
}

export type UpdateLifeOperation = 'INCREMENT' | 'DECREMENT';
