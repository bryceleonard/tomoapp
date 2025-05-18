import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const circles = [
  { size: 300, top: 200, left: -150, opacity: 0.4, delay: 0 },
  { size: 600, top: 50, left: -300, opacity: 0.3, delay: 300 },
  { size: 900, top: -100, left: -450, opacity: 0.2, delay: 600 },
  { size: 1200, top: -250, left: -600, opacity: 0.1, delay: 900 },
  { size: 1500, top: -400, left: -750, opacity: 0.05, delay: 1200 },
];

export default function AnimatedBackground() {
  const animations = useRef(circles.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    circles.forEach((_, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animations[i], {
            toValue: 1.1,
            duration: 3000,
            delay: circles[i].delay,
            useNativeDriver: true,
          }),
          Animated.timing(animations[i], {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={styles.animatedBackground}>
      <LinearGradient
        colors={['#EEEAAF', '#63B4D1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientOverlay}
      />
      {circles.map((circle, i) => (
        <Animated.View
          key={i}
          style={[
            styles.circle,
            {
              width: circle.size,
              height: circle.size,
              top: circle.top,
              left: circle.left,
              opacity: circle.opacity,
              transform: [{ scale: animations[i] }],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  animatedBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  circle: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 1000,
    transformOrigin: 'center',
  },
});

