export enum EVENTS_NAME {
  gameEnd = 'game-end',
  uiSceneCreated = 'ui-scene-created',
  uiChange = 'ui-change',
}

export enum GameStatus {
  WIN,
  LOSE,
}

export type UpdateLifeOperation = 'INCREMENT' | 'DECREMENT';
