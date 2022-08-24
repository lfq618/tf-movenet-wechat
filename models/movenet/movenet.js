import * as tf from '@tensorflow/tfjs-core';
import {drawKeypoints, drawSkeleton} from './util';
const { appWidth, appHeight, benchmarkLevel } = getApp().globalData;

function padAndResizeTo(input, [targetH, targetW]) {
  const [height, width] = [input.height, input.width];
  const targetAspect = targetW / targetH;
  const aspect = width / height;
  let [padT, padB, padL, padR] = [0, 0, 0, 0];
   if (aspect > targetAspect) {
    // pads the width
    padT = 0;
    padB = 0;
    padL = Math.round(0.5 * (targetAspect * height - width));
    padR = Math.round(0.5 * (targetAspect * height - width));
  } else {
    // pads the height
     padT = Math.round(0.5 * ((1.0 / targetAspect) * width - height));
    padB = Math.round(0.5 * ((1.0 / targetAspect) * width - height));
    padL = 0;
    padR = 0;
  }
    
  const resized = tf.tidy(() => {
    let imageTensor = tf.browser.fromPixels(input);
    imageTensor = tf.pad3d(imageTensor, [[padT, padB], [padL, padR], [0, 0]]);
    let result = tf.image.resizeBilinear(imageTensor, [targetH, targetW]);
    imageTensor.dispose();
    return result;
  });
    
   return resized;
}

export async function detectPoseInRealTime(image, net, mirror) {
  const imgData = {
    data: new Uint8Array(image.data),
    width: Number(image.width),
    height: Number(image.height)
  }

  const video = padAndResizeTo(imgData, [appHeight, appWidth]);
  const flipHorizontal = mirror;
  const pose = await net.estimatePoses(video, {maxPoses: 1, flipHorizontal: flipHorizontal});

  video.dispose();

  return pose;
}

export function drawPoses(page) {
  if (page.poses == null || page.ctx == null) return;
  const ctx = page.ctx;
  const poses = page.poses;
  const minPoseConfidence = 0.3;
  const minPartConfidence = 0.3;

  poses.forEach(({score, keypoints}) => {
    if (score >= minPoseConfidence) {
      drawKeypoints(keypoints, minPartConfidence, ctx);
      drawSkeleton(keypoints, minPartConfidence, ctx);
    }
  });
  ctx.draw();
  return poses;
}