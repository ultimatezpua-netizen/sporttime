import React from 'react';
import Svg, { Path, Text as SvgText } from 'react-native-svg';

type GarminLogoProps = {
  width?: number;
  height?: number;
  color?: string;
};

export function GarminLogo({ width = 125, height = 20, color = '#FF6B00' }: GarminLogoProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 125 20" accessibilityRole="image">
      <Path d="M64 2.5 70 10.5H58L64 2.5Z" fill={color} />
      <SvgText
        x="0"
        y="16"
        fill={color}
        fontSize="17"
        fontWeight="800"
        fontFamily="Arial"
        letterSpacing="1.8"
      >
        GARMIN
      </SvgText>
    </Svg>
  );
}

