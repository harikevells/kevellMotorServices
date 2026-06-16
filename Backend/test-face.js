const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const tf = require('@tensorflow/tfjs');
const faceapi = require('@vladmandic/face-api/dist/face-api.js');
const canvas = require('canvas');

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const init = async () => {
    try {
        console.log('Loading models...');
        await faceapi.nets.ssdMobilenetv1.loadFromDisk('./models/weights');
        await faceapi.nets.faceLandmark68Net.loadFromDisk('./models/weights');
        await faceapi.nets.faceRecognitionNet.loadFromDisk('./models/weights');
        console.log('Models loaded successfully!');
    } catch(e) {
        console.error('Error:', e);
    }
}

init();
