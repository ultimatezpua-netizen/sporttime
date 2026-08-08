import React from 'react';
import Svg, { Text as SvgText } from 'react-native-svg';

interface GarminLogoProps {
  width?: number;
  height?: number;
  color?: string;
}

export const GarminLogo: React.FC<GarminLogoProps> = ({
  width = 130,
  height = 22,
  color = '#FF5500',
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 130 22">
      <SvgText
        x="65"
        y="17"
        fill={color}
        fontSize="19"
        fontWeight="900"
        fontFamily="Arial Black, Impact, sans-serif"
        textAnchor="middle"
        letterSpacing="3"
      >
        GARMIN
      </SvgText>
    </Svg>
  );
};

export default GarminLogo;