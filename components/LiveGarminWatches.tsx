import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, Pressable } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Ionicons } from '@/components/SafeIonicons';
import { FONTS } from '@/constants/typography';

type Mode = 'widget' | 'menu' | 'app';
type MenuPage = 'main' | 'clock_settings' | 'stopwatch' | 'navigation' | 'body_battery' | 'solar_charging' | 'flashlight';
type WatchViewMode = 'watchface' | 'heartrate' | 'steps' | 'map_sim' | 'body_battery' | 'solar_charging' | 'flashlight';

const WIDGET_VIEWS: WatchViewMode[] = [
  'watchface',
  'heartrate',
  'steps',
  'map_sim',
  'body_battery',
  'solar_charging',
  'flashlight',
];

const MENU_ITEMS: { page: MenuPage; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { page: 'clock_settings', label: 'ГОДИННИК', icon: 'time-outline' },
  { page: 'stopwatch', label: 'СЕКУНДОМІР', icon: 'stopwatch-outline' },
  { page: 'navigation', label: 'НАВІГАЦІЯ', icon: 'compass-outline' },
  { page: 'body_battery', label: 'BODY BATTERY', icon: 'battery-charging-outline' },
  { page: 'solar_charging', label: 'SOLAR CHARGING', icon: 'sunny-outline' },
  { page: 'flashlight', label: 'ЛІХТАРИК LED', icon: 'flash-outline' },
];

export const LiveGarminWatches = () => {
  const [watchState, setWatchState] = useState<{
    mode: Mode;
    activeWidgetIndex: number;
    menuPage: MenuPage;
    use24Hour: boolean;
    stopwatchTime: number;
    stopwatchRunning: boolean;
  }>({
    mode: 'widget',
    activeWidgetIndex: 0,
    menuPage: 'main',
    use24Hour: true,
    stopwatchTime: 0,
    stopwatchRunning: false,
  });

  const [menuSelectedIndex, setMenuSelectedIndex] = useState(0);
  const [flashlightColor, setFlashlightColor] = useState<'white' | 'red'>('white');
  const [time, setTime] = useState(new Date());

  const panY = useRef(new Animated.Value(0)).current;
  const panX = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const screenScale = useRef(new Animated.Value(1)).current;

  const watchStateRef = useRef(watchState);
  watchStateRef.current = watchState;

  const menuIndexRef = useRef(menuSelectedIndex);
  menuIndexRef.current = menuSelectedIndex;

  // Real-time Clock interval
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Stopwatch Timer interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (watchState.stopwatchRunning) {
      interval = setInterval(() => {
        setWatchState(prev => ({
          ...prev,
          stopwatchTime: prev.stopwatchTime + 10,
        }));
      }, 10);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [watchState.stopwatchRunning]);

  const animateTransition = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(screenScale, {
        toValue: 0.92,
        duration: 90,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      panY.setValue(0);
      panX.setValue(0);
      Animated.parallel([
        Animated.spring(screenOpacity, {
          toValue: 1,
          friction: 6,
          tension: 90,
          useNativeDriver: true,
        }),
        Animated.spring(screenScale, {
          toValue: 1,
          friction: 6,
          tension: 90,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 4 || Math.abs(gestureState.dx) > 4;
      },
      onPanResponderMove: (_, gestureState) => {
        panY.setValue(gestureState.dy * 0.4);
        panX.setValue(gestureState.dx * 0.3);
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dy, dx, vy, vx } = gestureState;
        const current = watchStateRef.current;

        // Gesture Detection
        if (dx > 45 || vx > 0.35) {
          if (current.mode === 'menu') {
            // Confirm Selection in Menu Mode
            const targetPage = MENU_ITEMS[menuIndexRef.current].page;
            animateTransition(() => {
              setWatchState(prev => ({
                ...prev,
                mode: 'app',
                menuPage: targetPage,
              }));
            });
          } else {
            // Open Main Menu from Widget Mode
            animateTransition(() => {
              setWatchState(prev => ({
                ...prev,
                mode: 'menu',
                menuPage: 'main',
              }));
            });
          }
        } else if (dx < -45 || vx < -0.35) {
          // Swipe LEFT -> Back to Widget
          animateTransition(() => {
            setWatchState(prev => ({
              ...prev,
              mode: 'widget',
            }));
          });
        } else if (dy < -30 || vy < -0.25) {
          // Swipe UP
          if (current.mode === 'widget') {
            animateTransition(() => {
              setWatchState(prev => ({
                ...prev,
                activeWidgetIndex: (prev.activeWidgetIndex + 1) % WIDGET_VIEWS.length,
              }));
            });
          } else if (current.mode === 'menu') {
            // Scroll Menu UP
            setMenuSelectedIndex(prev => (prev + 1) % MENU_ITEMS.length);
            Animated.parallel([
              Animated.spring(panY, { toValue: 0, friction: 5, tension: 70, useNativeDriver: true }),
              Animated.spring(panX, { toValue: 0, friction: 5, tension: 70, useNativeDriver: true }),
            ]).start();
          } else {
            Animated.parallel([
              Animated.spring(panY, { toValue: 0, friction: 5, tension: 70, useNativeDriver: true }),
              Animated.spring(panX, { toValue: 0, friction: 5, tension: 70, useNativeDriver: true }),
            ]).start();
          }
        } else if (dy > 30 || vy > 0.25) {
          // Swipe DOWN
          if (current.mode === 'widget') {
            animateTransition(() => {
              setWatchState(prev => ({
                ...prev,
                activeWidgetIndex: (prev.activeWidgetIndex - 1 + WIDGET_VIEWS.length) % WIDGET_VIEWS.length,
              }));
            });
          } else if (current.mode === 'menu') {
            // Scroll Menu DOWN
            setMenuSelectedIndex(prev => (prev - 1 + MENU_ITEMS.length) % MENU_ITEMS.length);
            Animated.parallel([
              Animated.spring(panY, { toValue: 0, friction: 5, tension: 70, useNativeDriver: true }),
              Animated.spring(panX, { toValue: 0, friction: 5, tension: 70, useNativeDriver: true }),
            ]).start();
          } else {
            Animated.parallel([
              Animated.spring(panY, { toValue: 0, friction: 5, tension: 70, useNativeDriver: true }),
              Animated.spring(panX, { toValue: 0, friction: 5, tension: 70, useNativeDriver: true }),
            ]).start();
          }
        } else {
          // Spring back to center
          Animated.parallel([
            Animated.spring(panY, { toValue: 0, friction: 5, tension: 70, useNativeDriver: true }),
            Animated.spring(panX, { toValue: 0, friction: 5, tension: 70, useNativeDriver: true }),
          ]).start();
        }
      },
    })
  ).current;

  const handlePressUp = () => {
    const current = watchStateRef.current;
    if (current.mode === 'widget') {
      animateTransition(() => {
        setWatchState(prev => ({
          ...prev,
          activeWidgetIndex: (prev.activeWidgetIndex - 1 + WIDGET_VIEWS.length) % WIDGET_VIEWS.length,
        }));
      });
    } else if (current.mode === 'menu') {
      setMenuSelectedIndex(prev => (prev - 1 + MENU_ITEMS.length) % MENU_ITEMS.length);
    }
  };

  const handlePressDown = () => {
    const current = watchStateRef.current;
    if (current.mode === 'widget') {
      animateTransition(() => {
        setWatchState(prev => ({
          ...prev,
          activeWidgetIndex: (prev.activeWidgetIndex + 1) % WIDGET_VIEWS.length,
        }));
      });
    } else if (current.mode === 'menu') {
      setMenuSelectedIndex(prev => (prev + 1) % MENU_ITEMS.length);
    }
  };

  const handlePressStart = () => {
    const current = watchStateRef.current;
    if (current.mode === 'menu') {
      const targetPage = MENU_ITEMS[menuIndexRef.current].page;
      animateTransition(() => {
        setWatchState(prev => ({
          ...prev,
          mode: 'app',
          menuPage: targetPage,
        }));
      });
    } else {
      animateTransition(() => {
        setWatchState(prev => ({
          ...prev,
          mode: 'menu',
          menuPage: 'main',
        }));
      });
    }
  };

  const handlePressBack = () => {
    animateTransition(() => {
      setWatchState(prev => ({
        ...prev,
        mode: 'widget',
      }));
    });
  };

  const handlePressLight = () => {
    animateTransition(() => {
      setWatchState(prev => ({
        ...prev,
        mode: prev.mode === 'app' && prev.menuPage === 'flashlight' ? 'widget' : 'app',
        menuPage: 'flashlight',
      }));
    });
  };

  // Time & Pulse Helpers
  let hours = time.getHours();
  if (!watchState.use24Hour) {
    hours = hours % 12 || 12;
  }
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const formatTwoDigits = (num: number) => (num < 10 ? `0${num}` : `${num}`);
  const livePulse = 70 + (seconds % 7);

  // Stopwatch Formatter (MM:SS.ss)
  const formatStopwatch = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const hundredths = Math.floor((ms % 1000) / 10);
    return `${formatTwoDigits(mins)}:${formatTwoDigits(secs)}.${formatTwoDigits(hundredths)}`;
  };

  const currentView = WIDGET_VIEWS[watchState.activeWidgetIndex];

  // Calculate 3 visible items for the Garmin OS Curved Menu Wheel
  const prevItemIndex = (menuSelectedIndex - 1 + MENU_ITEMS.length) % MENU_ITEMS.length;
  const nextItemIndex = (menuSelectedIndex + 1) % MENU_ITEMS.length;

  return (
    <View style={styles.container}>
      {/* Background Innovation Lab Blueprint Overlay Texts */}
      <View style={styles.labBlueprintOverlay} pointerEvents="none">
        <Text style={styles.textLab1}>
          DATA ANALYTICS // AVERAGE PACE FORMULA: V = S / T{'\n'}
          HEART RATE VARIABILITY // HRV INDEX: 78 MS
        </Text>

        <Text style={styles.textLab2}>
          ECG MONITORING // R-R INTERVALS: 0.8s{'\n'}
          VO2 MAX ESTIMATE // 54 ML/KG/MIN
        </Text>

        <Text style={styles.textLab3}>
          GPS SATELLITE TRIANGULATION // LAT/LON MOCK: 47.843° N, 35.132° E // ELEV: 164M
        </Text>
      </View>

      {/* Top Header Live Badge */}
      <View style={styles.headerRow}>
        <View style={styles.badgeLive}>
          <View style={styles.liveDot} />
          <Text style={styles.badgeLiveText}>ІНТЕРАКТИВНИЙ СИМУЛЯТОР GARMIN</Text>
        </View>
        <Text style={styles.hintText}>Свайп пальцем по екрану</Text>
      </View>

      {/* Main Watch Assembly */}
      <View style={styles.watchContainer}>
        {/* Watch Bezel Metal Case */}
        <View style={styles.watchBezel}>
          {/* Bezel Screws / Ticks */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
            <View
              key={deg}
              style={[
                styles.bezelScrew,
                {
                  transform: [
                    { rotate: `${deg}deg` },
                    { translateY: -102 },
                  ],
                },
              ]}
            />
          ))}

          {/* Interactive Touch Screen */}
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.watchScreen,
              {
                opacity: screenOpacity,
                transform: [
                  { translateY: panY },
                  { translateX: panX },
                  { scale: screenScale },
                ],
              },
            ]}
          >
            {/* Gesture Directional Arrows Indicators (Only in non-flashlight mode) */}
            {currentView !== 'flashlight' && (
              <>
                <Text style={[styles.arrowHint, styles.arrowTop]}>▲</Text>
                <Text style={[styles.arrowHint, styles.arrowBottom]}>▼</Text>
                <Text style={[styles.arrowHint, styles.arrowRight]}>MENU ▶</Text>
                <Text style={[styles.arrowHint, styles.arrowLeft]}>◀ BACK</Text>
              </>
            )}

            {/* MODE 1: WIDGET VIEWS */}
            {watchState.mode === 'widget' && (
              <>
                {/* Widget 1: Digital Watchface */}
                {currentView === 'watchface' && (
                  <View style={styles.screenContent}>
                    <Text style={styles.brandText}>GARMIN</Text>

                    <View style={styles.timeContainer}>
                      <Text style={styles.timeMainText}>
                        {formatTwoDigits(hours)}:{formatTwoDigits(minutes)}
                      </Text>
                      <Text style={styles.timeSecText}>:{formatTwoDigits(seconds)}</Text>
                    </View>

                    <Text style={styles.dateText}>
                      ВТ, 4 СЕРП {!watchState.use24Hour ? (time.getHours() >= 12 ? 'PM' : 'AM') : ''}
                    </Text>

                    <View style={styles.microStatsRow}>
                      <View style={styles.microStatItem}>
                        <Ionicons name="battery-charging" size={11} color="#22C55E" />
                        <Text style={styles.microStatText}>84%</Text>
                      </View>
                      <View style={styles.microStatDivider} />
                      <View style={styles.microStatItem}>
                        <Ionicons name="heart" size={11} color="#FF3B30" />
                        <Text style={styles.microStatText}>{livePulse}</Text>
                      </View>
                      <View style={styles.microStatDivider} />
                      <View style={styles.microStatItem}>
                        <Ionicons name="sunny" size={11} color="#FFB800" />
                        <Text style={styles.microStatText}>24°C</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Widget 2: Heart Rate Graph */}
                {currentView === 'heartrate' && (
                  <View style={styles.screenContent}>
                    <View style={styles.widgetHeader}>
                      <Ionicons name="heart" size={14} color="#FF3B30" />
                      <Text style={[styles.widgetTitle, { color: '#FF3B30' }]}>ПУЛЬС (BPM)</Text>
                    </View>

                    <Text style={styles.pulseBigText}>{livePulse}</Text>

                    <Svg height="36" width="130" viewBox="0 0 130 36">
                      <Path
                        d="M0 28 Q 15 32, 30 18 T 60 26 T 90 8 T 120 20 L 130 22"
                        fill="none"
                        stroke="#FF3B30"
                        strokeWidth="2.5"
                      />
                      <Circle cx="120" cy="20" r="4" fill="#FF3B30" />
                    </Svg>

                    <View style={styles.hrMinMaxRow}>
                      <Text style={styles.hrMinMaxText}>Мін: 58</Text>
                      <Text style={styles.hrMinMaxText}>Макс: 162</Text>
                    </View>
                  </View>
                )}

                {/* Widget 3: Steps Progress */}
                {currentView === 'steps' && (
                  <View style={styles.screenContent}>
                    <View style={styles.widgetHeader}>
                      <Ionicons name="footsteps" size={14} color="#00E5FF" />
                      <Text style={[styles.widgetTitle, { color: '#00E5FF' }]}>КРОКИ СЬОГОДНІ</Text>
                    </View>

                    <Text style={styles.stepsBigText}>8,420</Text>
                    <Text style={styles.stepsTargetText}>Ціль: 10,000 (84%)</Text>

                    <Svg height="24" width="120" viewBox="0 0 120 12">
                      <Rect x="0" y="2" width="120" height="8" rx="4" fill="#2C2C2E" />
                      <Rect x="0" y="2" width="100" height="8" rx="4" fill="#00E5FF" />
                    </Svg>

                    <View style={styles.stepsDetailRow}>
                      <Text style={styles.stepsDetailText}>6.4 км</Text>
                      <Text style={styles.stepsDetailText}>•</Text>
                      <Text style={styles.stepsDetailText}>480 ккал</Text>
                    </View>
                  </View>
                )}

                {/* Widget 4: GPS Map Simulator */}
                {currentView === 'map_sim' && (
                  <View style={styles.screenContent}>
                    <View style={styles.widgetHeader}>
                      <Ionicons name="navigate" size={14} color="#22C55E" />
                      <Text style={[styles.widgetTitle, { color: '#22C55E' }]}>GPS ТРЕКЕР</Text>
                    </View>

                    <Svg height="48" width="130" viewBox="0 0 130 48">
                      <Path
                        d="M10 40 L 35 20 L 60 32 L 90 10 L 115 24"
                        fill="none"
                        stroke="#22C55E"
                        strokeWidth="3"
                        strokeDasharray="4 2"
                      />
                      <Circle cx="10" cy="40" r="4" fill="#FF5500" />
                      <Circle cx="115" cy="24" r="5" fill="#22C55E" stroke="#FFFFFF" strokeWidth="1.5" />
                    </Svg>

                    <Text style={styles.mapDistText}>4.2 км • ТРЕК</Text>
                    <Text style={styles.mapHeadingText}>148° ПД-СХ</Text>
                  </View>
                )}

                {/* Widget 5: Body Battery */}
                {currentView === 'body_battery' && (
                  <View style={styles.screenContent}>
                    <View style={styles.widgetHeader}>
                      <Ionicons name="battery-charging" size={14} color="#00E5FF" />
                      <Text style={[styles.widgetTitle, { color: '#00E5FF' }]}>BODY BATTERY</Text>
                    </View>

                    <Text style={styles.pulseBigText}>88%</Text>

                    <View style={styles.bodyBatteryBarContainer}>
                      <View style={[styles.bodyBatteryBarFill, { width: '88%' }]} />
                    </View>

                    <Text style={styles.bodyBatteryStatus}>ЗАРЯД ВИСОКИЙ // +18 ВІДНОВЛЕННЯ</Text>
                  </View>
                )}

                {/* Widget 6: Solar Charging */}
                {currentView === 'solar_charging' && (
                  <View style={styles.screenContent}>
                    <View style={styles.widgetHeader}>
                      <Ionicons name="sunny" size={14} color="#FF5500" />
                      <Text style={[styles.widgetTitle, { color: '#FF5500' }]}>SOLAR CHARGING</Text>
                    </View>

                    <Text style={styles.solarLuxText}>78k LUX</Text>

                    <View style={styles.solarSegmentsRow}>
                      {[1, 2, 3, 4, 5].map(seg => (
                        <View
                          key={seg}
                          style={[
                            styles.solarSegmentBar,
                            seg <= 4 && styles.solarSegmentActive,
                          ]}
                        />
                      ))}
                    </View>

                    <Text style={styles.solarStatusText}>ІНТЕНСИВНІСТЬ: 84%</Text>
                  </View>
                )}

                {/* Widget 7: LED Flashlight */}
                {currentView === 'flashlight' && (
                  <Pressable
                    style={[
                      styles.flashlightScreenFull,
                      { backgroundColor: flashlightColor === 'white' ? '#FFFFFF' : '#FF0000' }
                    ]}
                    onPress={() => setFlashlightColor(prev => prev === 'white' ? 'red' : 'white')}
                  >
                    <Ionicons
                      name="flash"
                      size={26}
                      color={flashlightColor === 'white' ? '#000000' : '#FFFFFF'}
                    />
                    <Text
                      style={[
                        styles.flashlightText,
                        { color: flashlightColor === 'white' ? '#000000' : '#FFFFFF' }
                      ]}
                    >
                      {flashlightColor === 'white' ? 'LED СВІТЛО' : 'NIGHT VISION'}
                    </Text>
                    <Text
                      style={[
                        styles.flashlightSubtext,
                        { color: flashlightColor === 'white' ? '#666666' : '#FFCCCC' }
                      ]}
                    >
                      Торкніться для зміни
                    </Text>
                  </Pressable>
                )}
              </>
            )}

            {/* MODE 2: NATIVE GARMIN OS CURVED MENU WHEEL */}
            {watchState.mode === 'menu' && (
              <View style={styles.garminOsMenuContainer}>
                {/* Scroll Indicators */}
                <Text style={styles.garminOsArrowTop}>▲</Text>
                <Text style={styles.garminOsArrowBottom}>▼</Text>

                {/* Top Inactive Item (Prev) */}
                <Pressable
                  style={styles.garminOsItemInactive}
                  onPress={() => setMenuSelectedIndex(prevItemIndex)}
                >
                  <Ionicons name={MENU_ITEMS[prevItemIndex].icon} size={11} color="#8E8E93" />
                  <Text style={styles.garminOsItemTextInactive}>
                    {MENU_ITEMS[prevItemIndex].label}
                  </Text>
                </Pressable>

                {/* Center Active Selected Item (Enlarged Capsule with Vivid Orange Accent) */}
                <Pressable
                  style={styles.garminOsItemActiveCapsule}
                  onPress={() => {
                    const targetPage = MENU_ITEMS[menuSelectedIndex].page;
                    setWatchState(prev => ({ ...prev, mode: 'app', menuPage: targetPage }));
                  }}
                >
                  <View style={styles.garminOsActiveIndicatorBar} />
                  <Ionicons name={MENU_ITEMS[menuSelectedIndex].icon} size={15} color="#FFFFFF" />
                  <Text style={styles.garminOsItemTextActive}>
                    {MENU_ITEMS[menuSelectedIndex].label}
                  </Text>
                </Pressable>

                {/* Bottom Inactive Item (Next) */}
                <Pressable
                  style={styles.garminOsItemInactive}
                  onPress={() => setMenuSelectedIndex(nextItemIndex)}
                >
                  <Ionicons name={MENU_ITEMS[nextItemIndex].icon} size={11} color="#8E8E93" />
                  <Text style={styles.garminOsItemTextInactive}>
                    {MENU_ITEMS[nextItemIndex].label}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.garminOsBackTextBtn}
                  onPress={() => setWatchState(prev => ({ ...prev, mode: 'widget' }))}
                >
                  <Text style={styles.garminOsBackText}>◄ НАЗАД ДО ЧАСІВ</Text>
                </Pressable>
              </View>
            )}

            {/* MODE 3: APPS & FUNCTIONS */}
            {watchState.mode === 'app' && (
              <View style={styles.appContainer}>
                {/* App A: Clock Settings */}
                {watchState.menuPage === 'clock_settings' && (
                  <View style={styles.screenContent}>
                    <Text style={styles.appTitle}>НАЛАШТУВАННЯ ЧАСУ</Text>

                    <Pressable
                      style={styles.settingToggleBtn}
                      onPress={() => setWatchState(prev => ({ ...prev, use24Hour: !prev.use24Hour }))}
                    >
                      <Text style={styles.settingToggleLabel}>Формат часу:</Text>
                      <Text style={styles.settingToggleValue}>
                        {watchState.use24Hour ? '24 Години' : '12 Годин (AM/PM)'}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.appBackBtn}
                      onPress={() => setWatchState(prev => ({ ...prev, mode: 'menu', menuPage: 'main' }))}
                    >
                      <Text style={styles.appBackBtnText}>◄ НАЗАД У МЕНЮ</Text>
                    </Pressable>
                  </View>
                )}

                {/* App B: Stopwatch */}
                {watchState.menuPage === 'stopwatch' && (
                  <View style={styles.screenContent}>
                    <Text style={styles.appTitle}>СЕКУНДОМІР</Text>
                    <Text style={styles.stopwatchDisplay}>
                      {formatStopwatch(watchState.stopwatchTime)}
                    </Text>

                    <View style={styles.stopwatchBtnRow}>
                      <Pressable
                        style={[
                          styles.stopwatchBtn,
                          { backgroundColor: watchState.stopwatchRunning ? '#FF3B30' : '#22C55E' },
                        ]}
                        onPress={() =>
                          setWatchState(prev => ({
                            ...prev,
                            stopwatchRunning: !prev.stopwatchRunning,
                          }))
                        }
                      >
                        <Text style={styles.stopwatchBtnText}>
                          {watchState.stopwatchRunning ? 'СТОП' : 'СТАРТ'}
                        </Text>
                      </Pressable>

                      <Pressable
                        style={[styles.stopwatchBtn, { backgroundColor: '#333338' }]}
                        onPress={() =>
                          setWatchState(prev => ({
                            ...prev,
                            stopwatchRunning: false,
                            stopwatchTime: 0,
                          }))
                        }
                      >
                        <Text style={styles.stopwatchBtnText}>СБРОС</Text>
                      </Pressable>
                    </View>

                    <Pressable
                      style={styles.appBackBtn}
                      onPress={() => setWatchState(prev => ({ ...prev, mode: 'menu', menuPage: 'main' }))}
                    >
                      <Text style={styles.appBackBtnText}>◄ МЕНЮ</Text>
                    </Pressable>
                  </View>
                )}

                {/* App C: Navigation / GPS Coordinates */}
                {watchState.menuPage === 'navigation' && (
                  <View style={styles.screenContent}>
                    <Text style={[styles.appTitle, { color: '#22C55E' }]}>GPS КООРДИНАТИ</Text>

                    <View style={styles.coordsBox}>
                      <Text style={styles.coordsMainText}>47.843° N</Text>
                      <Text style={styles.coordsMainText}>35.132° E</Text>
                    </View>

                    <Text style={styles.coordsCityText}>ЗАПОРІЖЖЯ • 148° ПД-СХ</Text>
                    <Text style={styles.gpsStatusText}>🛰️ Пошук супутників (Mock)...</Text>

                    <Pressable
                      style={styles.appBackBtn}
                      onPress={() => setWatchState(prev => ({ ...prev, mode: 'menu', menuPage: 'main' }))}
                    >
                      <Text style={styles.appBackBtnText}>◄ МЕНЮ</Text>
                    </Pressable>
                  </View>
                )}

                {/* App D: Body Battery */}
                {watchState.menuPage === 'body_battery' && (
                  <View style={styles.screenContent}>
                    <Text style={[styles.appTitle, { color: '#00E5FF' }]}>BODY BATTERY</Text>
                    <Text style={styles.pulseBigText}>88%</Text>
                    <View style={styles.bodyBatteryBarContainer}>
                      <View style={[styles.bodyBatteryBarFill, { width: '88%' }]} />
                    </View>
                    <Text style={styles.bodyBatteryStatus}>ЗАРЯД ВИСОКИЙ // +18 ВІДНОВЛЕННЯ</Text>
                    <Pressable
                      style={styles.appBackBtn}
                      onPress={() => setWatchState(prev => ({ ...prev, mode: 'menu', menuPage: 'main' }))}
                    >
                      <Text style={styles.appBackBtnText}>◄ МЕНЮ</Text>
                    </Pressable>
                  </View>
                )}

                {/* App E: Solar Charging */}
                {watchState.menuPage === 'solar_charging' && (
                  <View style={styles.screenContent}>
                    <Text style={[styles.appTitle, { color: '#FF5500' }]}>SOLAR CHARGING</Text>
                    <Text style={styles.solarLuxText}>78k LUX</Text>
                    <View style={styles.solarSegmentsRow}>
                      {[1, 2, 3, 4, 5].map(seg => (
                        <View
                          key={seg}
                          style={[
                            styles.solarSegmentBar,
                            seg <= 4 && styles.solarSegmentActive,
                          ]}
                        />
                      ))}
                    </View>
                    <Text style={styles.solarStatusText}>ІНТЕНСИВНІСТЬ: 84%</Text>
                    <Pressable
                      style={styles.appBackBtn}
                      onPress={() => setWatchState(prev => ({ ...prev, mode: 'menu', menuPage: 'main' }))}
                    >
                      <Text style={styles.appBackBtnText}>◄ МЕНЮ</Text>
                    </Pressable>
                  </View>
                )}

                {/* App F: LED Flashlight */}
                {watchState.menuPage === 'flashlight' && (
                  <Pressable
                    style={[
                      styles.flashlightScreenFull,
                      { backgroundColor: flashlightColor === 'white' ? '#FFFFFF' : '#FF0000' }
                    ]}
                    onPress={() => setFlashlightColor(prev => prev === 'white' ? 'red' : 'white')}
                  >
                    <Ionicons
                      name="flash"
                      size={26}
                      color={flashlightColor === 'white' ? '#000000' : '#FFFFFF'}
                    />
                    <Text
                      style={[
                        styles.flashlightText,
                        { color: flashlightColor === 'white' ? '#000000' : '#FFFFFF' }
                      ]}
                    >
                      {flashlightColor === 'white' ? 'LED СВІТЛО' : 'NIGHT VISION'}
                    </Text>
                    <Pressable
                      style={[styles.appBackBtn, { marginTop: 8 }]}
                      onPress={() => setWatchState(prev => ({ ...prev, mode: 'menu', menuPage: 'main' }))}
                    >
                      <Text
                        style={[
                          styles.appBackBtnText,
                          { color: flashlightColor === 'white' ? '#333333' : '#FFFFFF' }
                        ]}
                      >
                        ◄ МЕНЮ
                      </Text>
                    </Pressable>
                  </Pressable>
                )}
              </View>
            )}

            {/* Screen Lens Reflective Overlay */}
            <View style={styles.glareOverlay} />
          </Animated.View>
        </View>

        {/* External Bezel Button Labels (Interactive) */}
        <Pressable style={[styles.bezelLabel, styles.labelLight]} onPress={handlePressLight} hitSlop={8}>
          <Text style={styles.bezelLabelText}>LIGHT</Text>
        </Pressable>
        <Pressable style={[styles.bezelLabel, styles.labelUp]} onPress={handlePressUp} hitSlop={8}>
          <Text style={styles.bezelLabelText}>UP</Text>
        </Pressable>
        <Pressable style={[styles.bezelLabel, styles.labelDown]} onPress={handlePressDown} hitSlop={8}>
          <Text style={styles.bezelLabelText}>DOWN</Text>
        </Pressable>
        <Pressable style={[styles.bezelLabel, styles.labelStart]} onPress={handlePressStart} hitSlop={8}>
          <Text style={styles.bezelLabelText}>START</Text>
        </Pressable>
        <Pressable style={[styles.bezelLabel, styles.labelBack]} onPress={handlePressBack} hitSlop={8}>
          <Text style={styles.bezelLabelText}>BACK</Text>
        </Pressable>
      </View>

      {/* Widget Pagination Indicator Dots (Only in Widget Mode) */}
      {watchState.mode === 'widget' && (
        <View style={styles.paginationDots}>
          {WIDGET_VIEWS.map((mode, i) => (
            <View
              key={mode}
              style={[
                styles.paginationDot,
                i === watchState.activeWidgetIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#161618',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333338',
    padding: 16,
    alignItems: 'center',
    marginVertical: 14,
    gap: 54,
    position: 'relative',
    overflow: 'hidden',
  },
  labBlueprintOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 12,
    justifyContent: 'space-between',
    zIndex: 0,
  },
  textLab1: {
    position: 'absolute',
    top: 14,
    left: 14,
    color: '#8E8E93',
    opacity: 0.18,
    fontSize: 8,
    lineHeight: 12,
    fontFamily: FONTS.condensedBold,
    letterSpacing: 0.5,
  },
  textLab2: {
    position: 'absolute',
    top: 14,
    right: 14,
    color: '#8E8E93',
    opacity: 0.18,
    fontSize: 8,
    lineHeight: 12,
    textAlign: 'right',
    fontFamily: FONTS.condensedBold,
    letterSpacing: 0.5,
  },
  textLab3: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    color: '#8E8E93',
    opacity: 0.18,
    fontSize: 8,
    textAlign: 'center',
    fontFamily: FONTS.condensedBold,
    letterSpacing: 0.5,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  badgeLive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF5500',
  },
  badgeLiveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    fontFamily: FONTS.condensedBold,
  },
  hintText: {
    color: '#8E8E93',
    fontSize: 9,
    fontFamily: FONTS.regular,
  },
  watchContainer: {
    width: 236,
    height: 236,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
    zIndex: 2,
  },
  watchBezel: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#1C1C1E',
    borderWidth: 4,
    borderColor: '#333338',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  bezelScrew: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#44444A',
  },
  watchScreen: {
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#252528',
    position: 'relative',
  },
  arrowHint: {
    position: 'absolute',
    color: 'rgba(255, 255, 255, 0.25)',
    fontSize: 8,
    fontWeight: '700',
    fontFamily: FONTS.condensedBold,
  },
  arrowTop: { top: 4 },
  arrowBottom: { bottom: 4 },
  arrowRight: { right: 6, fontSize: 7 },
  arrowLeft: { left: 6, fontSize: 7 },
  screenContent: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  brandText: {
    color: '#8E8E93',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: FONTS.condensedBold,
    marginBottom: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  timeMainText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    fontFamily: FONTS.condensedBold,
    letterSpacing: 1,
  },
  timeSecText: {
    color: '#FF5500',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONTS.condensedBold,
    marginLeft: 2,
  },
  dateText: {
    color: '#A0A5B1',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
    fontFamily: FONTS.medium,
    marginTop: 2,
    marginBottom: 6,
  },
  microStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#161618',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  microStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  microStatText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: FONTS.medium,
  },
  microStatDivider: {
    width: 1,
    height: 8,
    backgroundColor: '#2C2C2E',
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  widgetTitle: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: FONTS.condensedBold,
  },
  pulseBigText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    fontFamily: FONTS.condensedBold,
  },
  hrMinMaxRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 2,
  },
  hrMinMaxText: {
    color: '#8E8E93',
    fontSize: 9,
    fontFamily: FONTS.regular,
  },
  stepsBigText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    fontFamily: FONTS.condensedBold,
  },
  stepsTargetText: {
    color: '#8E8E93',
    fontSize: 9,
    fontFamily: FONTS.medium,
    marginBottom: 4,
  },
  stepsDetailRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  stepsDetailText: {
    color: '#00E5FF',
    fontSize: 9,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  mapDistText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: FONTS.condensedBold,
    marginTop: 2,
  },
  mapHeadingText: {
    color: '#8E8E93',
    fontSize: 8,
    fontFamily: FONTS.regular,
  },

  /* Body Battery Styles */
  bodyBatteryBarContainer: {
    width: 110,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#2C2C2E',
    overflow: 'hidden',
    marginVertical: 4,
  },
  bodyBatteryBarFill: {
    height: '100%',
    backgroundColor: '#00E5FF',
    borderRadius: 4,
  },
  bodyBatteryStatus: {
    color: '#8E8E93',
    fontSize: 7,
    fontFamily: FONTS.condensedBold,
    letterSpacing: 0.5,
  },

  /* Solar Charging Styles */
  solarLuxText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    fontFamily: FONTS.condensedBold,
  },
  solarSegmentsRow: {
    flexDirection: 'row',
    gap: 4,
    marginVertical: 4,
  },
  solarSegmentBar: {
    width: 16,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2C2C2E',
  },
  solarSegmentActive: {
    backgroundColor: '#FF5500',
  },
  solarStatusText: {
    color: '#FF8800',
    fontSize: 8,
    fontFamily: FONTS.condensedBold,
    letterSpacing: 0.5,
  },

  /* Flashlight Styles */
  flashlightScreenFull: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  flashlightText: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: FONTS.condensedBold,
    letterSpacing: 1,
    marginTop: 4,
  },
  flashlightSubtext: {
    fontSize: 8,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },

  /* NATIVE GARMIN OS CURVED WHEEL MENU STYLES */
  garminOsMenuContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    position: 'relative',
    gap: 6,
  },
  garminOsArrowTop: {
    position: 'absolute',
    top: 4,
    color: '#FF5500',
    fontSize: 9,
    fontFamily: FONTS.condensedBold,
  },
  garminOsArrowBottom: {
    position: 'absolute',
    bottom: 4,
    color: '#FF5500',
    fontSize: 9,
    fontFamily: FONTS.condensedBold,
  },
  garminOsItemInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    opacity: 0.45,
    transform: [{ scale: 0.85 }],
    paddingVertical: 2,
  },
  garminOsItemTextInactive: {
    color: '#8E8E93',
    fontSize: 9,
    fontFamily: FONTS.condensedBold,
    letterSpacing: 0.8,
  },
  garminOsItemActiveCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FF5500',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    width: '92%',
    transform: [{ scale: 1.05 }],
    position: 'relative',
    elevation: 4,
    shadowColor: '#FF5500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  garminOsActiveIndicatorBar: {
    position: 'absolute',
    left: -2,
    top: 4,
    bottom: 4,
    width: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  garminOsItemTextActive: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    fontFamily: FONTS.condensedBold,
    letterSpacing: 1.2,
  },
  garminOsBackTextBtn: {
    marginTop: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  garminOsBackText: {
    color: '#55555C',
    fontSize: 7,
    fontFamily: FONTS.condensedBold,
    letterSpacing: 0.5,
  },

  /* App Styles */
  appContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTitle: {
    color: '#FF5500',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: FONTS.condensedBold,
    marginBottom: 6,
  },
  settingToggleBtn: {
    backgroundColor: '#161618',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    alignItems: 'center',
    gap: 4,
    width: '85%',
  },
  settingToggleLabel: {
    color: '#8E8E93',
    fontSize: 9,
    fontFamily: FONTS.regular,
  },
  settingToggleValue: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: FONTS.condensedBold,
  },
  stopwatchDisplay: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    fontFamily: FONTS.condensedBold,
    letterSpacing: 1,
    marginVertical: 4,
  },
  stopwatchBtnRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  stopwatchBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    minWidth: 50,
    alignItems: 'center',
  },
  stopwatchBtnText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: FONTS.condensedBold,
  },
  coordsBox: {
    alignItems: 'center',
    gap: 2,
    marginVertical: 4,
  },
  coordsMainText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    fontFamily: FONTS.condensedBold,
    letterSpacing: 1,
  },
  coordsCityText: {
    color: '#00E5FF',
    fontSize: 8,
    fontWeight: '700',
    fontFamily: FONTS.condensedBold,
  },
  gpsStatusText: {
    color: '#8E8E93',
    fontSize: 7,
    fontFamily: FONTS.regular,
    marginTop: 4,
  },
  appBackBtn: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  appBackBtnText: {
    color: '#8E8E93',
    fontSize: 8,
    fontWeight: '700',
    fontFamily: FONTS.condensedBold,
  },

  glareOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 88,
    pointerEvents: 'none',
  },
  bezelLabel: {
    position: 'absolute',
    zIndex: 10,
  },
  bezelLabelText: {
    color: '#6C6C70',
    fontSize: 7,
    fontWeight: '700',
    fontFamily: FONTS.condensedBold,
    letterSpacing: 0.5,
  },
  labelLight: { top: 38, left: 4 },
  labelUp: { top: 114, left: 0 },
  labelDown: { bottom: 38, left: 4 },
  labelStart: { top: 54, right: 2 },
  labelBack: { bottom: 54, right: 2 },
  paginationDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
    zIndex: 2,
  },
  paginationDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#333338',
  },
  paginationDotActive: {
    backgroundColor: '#FF5500',
    width: 14,
  },
});