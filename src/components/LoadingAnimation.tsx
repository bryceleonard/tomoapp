import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

const loadingTexts = [
  "Finding your calm...",
  "Preparing your meditation space...",
  "Crafting your personalized journey...",
  "Almost ready..."
];

export default function LoadingAnimation() {
  const pills = useRef([
    new Animated.Value(40),
    new Animated.Value(40),
    new Animated.Value(40),
    new Animated.Value(40),
    new Animated.Value(40)
  ]).current;
  
  const [currentTextIndex, setCurrentTextIndex] = React.useState(0);

  useEffect(() => {
    // Pill animations
    const animatePills = () => {
      const animations = pills.map((pill, index) => {
        return Animated.sequence([
          Animated.timing(pill, {
            toValue: 70,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
            delay: index * 500,
          }),
          Animated.timing(pill, {
            toValue: 40,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          })
        ]);
      });

      Animated.stagger(500, animations).start(() => {
        animatePills();
      });
    };

    animatePills();

    // Simple text rotation
    const textInterval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % loadingTexts.length);
    }, 3000);

    return () => clearInterval(textInterval);
  }, []);

  return (
    <View style={styles.wrapper}>
      <View style={styles.pillsContainer}>
        {pills.map((pill, index) => (
          <Animated.View
            key={index}
            style={[
              styles.pill,
              {
                width: pill,
              },
            ]}
          />
        ))}
      </View>
      <Text style={styles.loadingText}>
        {loadingTexts[currentTextIndex]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 30,
  },
  pill: {
    height: 30,
    borderRadius: 20,
    backgroundColor: 'rgb(209, 202, 193)',
  },
  loadingText: {
    fontSize: 18,
    color: '#2c3e50',
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'JosefinSans-Regular',
  },
}); 