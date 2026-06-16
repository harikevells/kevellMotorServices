const path = require('path');
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
const faceapi = require('@vladmandic/face-api/dist/face-api.js');
const tf = require('@tensorflow/tfjs');
const canvas = require('canvas');

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

let modelsLoaded = false;

const initFaceAPI = async () => {
  if (modelsLoaded) return;
  const modelsPath = path.join(__dirname, '../models/weights');
  try {
    console.log('[Face API] Loading models from:', modelsPath);
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath);
    modelsLoaded = true;
    console.log('[Face API] Models loaded successfully!');
  } catch (error) {
    console.error('[Face API] Error loading models:', error);
  }
};

const getDescriptorFromImage = async (imageBuffer) => {
  if (!modelsLoaded) {
    throw new Error('Face API models not loaded yet');
  }

  // Load image via canvas
  const img = await canvas.loadImage(imageBuffer);
  
  // Detect face and extract descriptor
  const detection = await faceapi.detectSingleFace(img)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    throw new Error('No face detected in the image');
  }

  return Array.from(detection.descriptor);
};

const compareFaces = (descriptor1, descriptor2) => {
  const d1 = new Float32Array(descriptor1);
  const d2 = new Float32Array(descriptor2);
  const distance = faceapi.euclideanDistance(d1, d2);
  return distance;
};

module.exports = {
  initFaceAPI,
  getDescriptorFromImage,
  compareFaces
};
