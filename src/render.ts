import { ISceneElement } from './scene';
import { getModelBuffers } from './models';

import  * as glMatrix from 'gl-matrix';

const mat4 = glMatrix.mat4;

export function renderItem(gl, element: ISceneElement, projectionMatrix, programInfo) {
  const model = getModelBuffers(element.model);

  const modelViewMatrix = mat4.create();

  mat4.translate(modelViewMatrix,
    modelViewMatrix,
    element.position);

  if (element.scale) {
    mat4.scale(modelViewMatrix,
      modelViewMatrix,
      element.scale);
  }

  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, model.modelBuffers.position);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      numComponents,
      type,
      normalize,
      stride,
      offset);
    gl.enableVertexAttribArray(
      programInfo.attribLocations.vertexPosition);
  }

  {
    const numComponents = 4;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, model.modelBuffers.color);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexColor,
      numComponents,
      type,
      normalize,
      stride,
      offset);
    gl.enableVertexAttribArray(
      programInfo.attribLocations.vertexColor);
  }

  {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.modelBuffers.indices);
  }

  gl.useProgram(programInfo.program);

  gl.uniformMatrix4fv(
    programInfo.uniformLocations.projectionMatrix,
    false,
    projectionMatrix);
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelViewMatrix,
    false,
    modelViewMatrix);

  {
    const vertexCount = 36;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }
}