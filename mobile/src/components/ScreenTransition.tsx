// ============================================================
// SCREEN TRANSITION — animación de entrada tipo iOS
// ============================================================
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { Platform } from 'react-native';

interface Props {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
}

export default function ScreenTransition({
  children,
  direction = 'right',
  duration = 300,
}: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const distance = 50;
    const initial = { x: 0, y: 0 };

    if (direction === 'left') initial.x = distance;
    else if (direction === 'right') initial.x = -distance;
    else if (direction === 'up') initial.y = distance;
    else if (direction === 'down') initial.y = -distance;

    translateX.setValue(initial.x);
    translateY.setValue(initial.y);
    opacity.setValue(0);

    const useNativeDriver = Platform.OS !== 'web';

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration,
        useNativeDriver,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        useNativeDriver,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        useNativeDriver,
      }),
    ]).start();
  }, [direction, duration, translateX, translateY, opacity]);

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          transform: [{ translateX }, { translateY }],
          opacity,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}