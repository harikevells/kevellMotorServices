import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

export const EVCar = ({ width = 200, height = 200 }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="#00E676" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7c0 .6.4 1 1 1h2" />
    <Circle cx="7" cy="17" r="2" />
    <Path d="M9 17h6" />
    <Circle cx="17" cy="17" r="2" />
  </Svg>
);

export const EVCharging = ({ width = 200, height = 200 }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="#00E676" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <Path d="M12 18h.01" />
    <Path d="M12 7l-2 4h4l-2 4" />
  </Svg>
);
