import React from 'react';
import Svg, { Text as SvgText } from 'react-native-svg';

interface GarminLogoProps {
  width?: number;
  height?: number;
  color?: string;
}

export const GarminLogo: React.FC<GarminLogoProps> = ({
  width = 120,
  height = 20,
  color = '#FF6B00',
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 120 20">
      <SvgText
        x="60"
        y="15"
        fill={color}
        fontSize="17"
        fontWeight="900"
        fontFamily="Arial, Helvetica, sans-serif"
        textAnchor="middle"
        letterSpacing="2.5"
      >
        GARMIN
      </SvgText>
    </Svg>
  );
};

export default GarminLogo;