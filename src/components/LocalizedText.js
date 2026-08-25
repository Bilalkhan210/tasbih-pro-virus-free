import React from 'react';
import { Text } from 'react-native';
import { useAppDirection } from '../hooks/useAppDirection';

const LocalizedText = ({ style, center = false, ...props }) => {
  const { centerTextStyle, textStyle } = useAppDirection();
  return (
    <Text
      style={[center ? centerTextStyle : textStyle, style]}
      {...props}
    />
  );
};

export default LocalizedText;
