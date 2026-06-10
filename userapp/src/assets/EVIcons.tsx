import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

export const EVCar = ({ width = 200, height = 200 }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7c0 .6.4 1 1 1h2" />
    <Circle cx="7" cy="17" r="2" />
    <Path d="M9 17h6" />
    <Circle cx="17" cy="17" r="2" />
  </Svg>
);

export const EVCharging = ({ width = 200, height = 200 }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <Path d="M12 18h.01" />
    <Path d="M12 7l-2 4h4l-2 4" />
  </Svg>
);

export const EVBike = ({ width = 200, height = 200 }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="5.5" cy="17.5" r="3.5" />
    <Circle cx="18.5" cy="17.5" r="3.5" />
    <Path d="M15 6a1 1 0 100-2 1 1 0 000 2zm-3 11.5V14l-3-3 4-3 2 3h2" />
  </Svg>
);

export const EVTruck = ({ width = 200, height = 200 }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M10 17h4V5H2v12h3M20 17h2v-6l-3-2h-3v8h1" />
    <Circle cx="7.5" cy="17.5" r="2.5" />
    <Circle cx="17.5" cy="17.5" r="2.5" />
    <Path d="M14 17h1" />
  </Svg>
);
