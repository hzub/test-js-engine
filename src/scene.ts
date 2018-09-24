type IVec3 = [ number, number, number ];

export interface ISceneElement {
  model: String,
  position: IVec3,
  scale?: IVec3,
};

interface IScene {
  elements: Array<ISceneElement>;
}

const scene: IScene = {
  elements: [
    { model: 'cube', position: [1, 2, 0] },
    { model: 'cube', position: [-1, 2, 0] },
    { model: 'cube', position: [-1, -2, 0] },
    { model: 'cube', position: [-3, 2, 0] },
    { model: 'cube', position: [-3, -2, 0] },
    { model: 'cube', position: [-3, 2, 2] },
    { model: 'cube', position: [-3, -2, 2] },
    { model: 'cube', position: [3, -2, 2] },
    { model: 'cube', position: [1, -2, 0] },
    { model: 'cube', position: [1, -2, -5], scale: [10, 10, 2] },
    { model: 'cube', position: [1, -2, 15], scale: [10, 10, 0.2] },
  ],
};

export function addToScene(e: ISceneElement) {
  scene.elements.push(e);
}

export function getSceneElements(): Array<ISceneElement> {
  return [...scene.elements];
}
