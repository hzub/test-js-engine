import { prepareShaders } from './shaders';
import { initializeCube, registerModel } from './models';
import { getSceneElements } from './scene';
import { renderItem } from './render';

import { mat4, quat, vec3 } from 'gl-matrix';

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
};

let cameraPos = [0, 0, -6];
let cameraRot2 = quat.create();

// let cameraSpeed = 0;

let shipMovement = vec3.create();

const keyboard = {
  up: false,
  down: false,
  left: false,
  right: false,
  w: false,
  s: false,
  q: false,
  e: false,
};

const mouse = {
  ax: 0,
  ay: 0,
};

const shipRotationVectors = {
  ar: 0,
  ay: 0,
  ap: 0,
};

let timePassed = 0;

function processPhysics(timeMult) {
  const coeff = (timeMult / 16.0);

  let thrustVector = vec3.create();

  if (keyboard.w) { // thrust

    const [x,y,w,z] = cameraRot2;

    const rx = 2 * (x*z + w*y);
    const ry = 2 * (y*z - w*x);
    const rz = 1 - 2 * (x*x + y*y);

    thrustVector = vec3.fromValues(-ry, rx, rz);
    vec3.scale(thrustVector, thrustVector, 0.005 * coeff);
  }

  if (keyboard.s) { // reverse

    const [x,y,w,z] = cameraRot2;

    const rx = 2 * (x*z + w*y);
    const ry = 2 * (y*z - w*x);
    const rz = 1 - 2 * (x*x + y*y);

    thrustVector = vec3.fromValues(ry, -rx, -rz);
    vec3.scale(thrustVector, thrustVector, 0.005 * coeff);
  }

  if (keyboard.left) { // slide left

    const [x,y,w,z] = cameraRot2;

    const rx = 2 * (x*y - w*z);
    const ry = 1 - 2 * (x*x + z*z);
    const rz = 2 * (y*z + w*x);


    thrustVector = vec3.fromValues(-ry, rx, rz);
    vec3.scale(thrustVector, thrustVector, 0.005 * coeff);
  }

  if (keyboard.right) { // slide left

    const [x,y,w,z] = cameraRot2;

    const rx = 2 * (x*y - w*z)
    const ry = 1 - 2 * (x*x + z*z)
    const rz = 2 * (y*z + w*x)


    thrustVector = vec3.fromValues(ry, -rx, -rz);
    vec3.scale(thrustVector, thrustVector, 0.005 * coeff);
  }

  if (vec3.len(thrustVector)) {
    vec3.add(shipMovement, shipMovement, thrustVector);
  }

  vec3.add(cameraPos, cameraPos, shipMovement);

  const brakingVector = vec3.create();

  vec3.scale(brakingVector, shipMovement, -1);
  vec3.normalize(brakingVector, brakingVector);
  vec3.scale(brakingVector, brakingVector, 0.0003);

  vec3.add(shipMovement, shipMovement, brakingVector);

  if (vec3.length(shipMovement) < 0.001) {
    vec3.scale(shipMovement, shipMovement, 0);
  }
}

function processInput(timeMult) {
  const rotationZ = keyboard.q ? -1 : (keyboard.e ? 1 : 0);

  if (mouse.ax !== null && mouse.ay !== null) {
      const deltaX = mouse.ax;
      const deltaY = mouse.ay;

      mouse.ax = 0;
      mouse.ay = 0;

      shipRotationVectors.ar += rotationZ * 0.09;
      shipRotationVectors.ay += deltaX * 0.002;
      shipRotationVectors.ap += deltaY * 0.002;

      shipRotationVectors.ar -= shipRotationVectors.ar * 0.10;
      shipRotationVectors.ay -= shipRotationVectors.ay * 0.10;
      shipRotationVectors.ap -= shipRotationVectors.ap * 0.10;

      shipRotationVectors.ar = clamp(shipRotationVectors.ar, -4, 4);
      shipRotationVectors.ay = clamp(shipRotationVectors.ay, -1, 1);
      shipRotationVectors.ap = clamp(shipRotationVectors.ap, -1, 1);

      const newQuat = quat.create();

      quat.fromEuler(newQuat,  shipRotationVectors.ap,  shipRotationVectors.ay, shipRotationVectors.ar);
      quat.multiply(cameraRot2, newQuat, cameraRot2);
  }
}

function prepareProjectionMatrix(gl) {
  const fieldOfView = 60 * Math.PI / 180;   // in radians
  const aspect = window.innerWidth / window.innerHeight;
  const zNear = 0.1;
  const zFar = 1000.0;
  const projectionMatrix = mat4.create();
  const rotationMatrix = mat4.create();

  mat4.perspective(projectionMatrix,
    fieldOfView,
    aspect,
    zNear,
    zFar);

    //mat4.rotate(projectionMatrix, projectionMatrix, cameraRot[1], [1, 0, 0]);
    //mat4.rotate(projectionMatrix, projectionMatrix, cameraRot[0], [0, 1, 0]);
    mat4.fromQuat(rotationMatrix, cameraRot2);
    mat4.multiply(projectionMatrix, projectionMatrix, rotationMatrix);
    mat4.translate(projectionMatrix, projectionMatrix, cameraPos);

  return projectionMatrix;
}

function init() {
  const canvas = document.querySelector("canvas");
  // Initialize the GL context
  const gl = canvas.getContext("webgl");


  // Only continue if WebGL is available and working
  if (gl === null) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    return;
  }

  const programInfo = prepareShaders(gl);

  const cubeModel = initializeCube(gl);

  registerModel('cube', cubeModel);

  window.requestAnimationFrame((time) => render(time, gl, programInfo));

  return gl;
}

function render(time, gl, programInfo) {
  // Set clear color to black, fully opaque
  gl.clearColor(0.4, 0.0, 0.0, 1.0);

  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
  // Clear the color buffer with specified clear color
  gl.clear(gl.COLOR_BUFFER_BIT);

  const projectionMatrix = prepareProjectionMatrix(gl);

  getSceneElements().forEach((element) => {
    renderItem(gl, element, projectionMatrix, programInfo);
  });

  const delta = time - timePassed;
  timePassed = time;

  processInput(delta);
  processPhysics(delta);

  window.requestAnimationFrame((time) => render(time, gl, programInfo));
}

init();


window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp') {
    keyboard.up = true;
  }

  if (e.key === 'ArrowDown') {
    keyboard.down = true;
  }

  if (e.key === 'ArrowLeft' || e.key === 'a') {
    keyboard.left = true;
  }

  if (e.key === 'ArrowRight' || e.key === 'd') {
    keyboard.right = true;
  }
  if (e.key === 'w') {
    keyboard.w = true;
  }
  if (e.key === 's') {
    keyboard.s = true;
  }

  if (e.key === 'q') {
    keyboard.q = true;
  }
  if (e.key === 'e') {
    keyboard.e = true;
  }

});

window.addEventListener('mousemove', (e) => {
  mouse.ax += e.movementX || e.mozMovementX || e.webkitMovementX || 0;
  mouse.ay += e.movementY || e.mozMovementY || e.webkitMovementY || 0;
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowUp') {
    keyboard.up = false;
  }

  if (e.key === 'ArrowDown') {
    keyboard.down = false;
  }

  if (e.key === 'ArrowLeft' || e.key === 'a') {
    keyboard.left = false;
  }

  if (e.key === 'ArrowRight' || e.key === 'd') {
    keyboard.right = false;
  }
  if (e.key === 'w') {
    keyboard.w = false;
  }
  if (e.key === 's') {
    keyboard.s = false;
  }

  if (e.key === 'q') {
    keyboard.q = false;
  }
  if (e.key === 'e') {
    keyboard.e = false;
  }

});

document.body.onclick = document.body.requestPointerLock ||
                        document.body.mozRequestPointerLock ||
                        document.body.webkitRequestPointerLock;