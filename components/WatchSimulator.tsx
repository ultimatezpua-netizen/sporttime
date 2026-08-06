import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// ─────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────
const BEZEL = 270;
const SCREEN = 210;
const RING_SIZE = 224;

const C = {
  appBg: '#111113',
  bezel: '#1D1D1F',
  bezelEdge: '#323234',
  bezelInner: '#151517',
  orange: '#FF6400',
  orangeDim: '#7A3000',
  screenBg: '#000000',
  white: '#FFFFFF',
  textSec: '#8E8E93',
  textDim: '#48484A',
  green: '#30D158',
  yellow: '#FFD60A',
  red: '#FF453A',
  blue: '#0A84FF',
  cyan: '#5AC8FA',
  screwBg: '#131315',
  screwRing: '#3A3A3C',
  btnBg: '#242426',
  btnEdge: '#3E3E40',
  btnPress: '#FF6400',
};

// Current screen name shown below the dots
const SCREEN_NAMES = ['WATCH', 'RUNNING', 'TRAINING', 'COMPASS', 'MUSIC', 'WEATHER'];

/** Format seconds → MM:SS, or H:MM:SS when ≥ 1 hour */
function fmtSecs(s: number): string {
  if (s >= 3600) {
    const h = Math.floor(s / 3600);
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
  }
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/** Convert a bearing (0–360°) to 8-point cardinal abbreviation */
function headingToCardinal(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

// ─────────────────────────────────────────────
// Heart rate chart data
// ─────────────────────────────────────────────
const HR_DATA = [24, 32, 20, 40, 58, 35, 28, 50, 65, 48, 33, 55, 42, 62, 38, 30, 52, 70, 48, 40];

function HeartRateBars() {
  const maxH = Math.max(...HR_DATA);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 28, gap: 1.5 }}>
      {HR_DATA.map((h, i) => {
        const barH = Math.max(3, (h / maxH) * 28);
        const isLast = i === HR_DATA.length - 1;
        return (
          <View
            key={i}
            style={{
              width: 3.5,
              height: barH,
              borderRadius: 1.5,
              backgroundColor: isLast ? C.red : C.orange,
              opacity: isLast ? 1 : 0.45 + (i / HR_DATA.length) * 0.55,
            }}
          />
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────
// Dotted circular progress bar
// ─────────────────────────────────────────────
function CircularProgress({
  value,
  maxVal,
  size,
  color,
}: {
  value: number;
  maxVal: number;
  size: number;
  color: string;
}) {
  const total = 60;
  const filled = Math.round((value / maxVal) * total);
  const r = size / 2 - 9;

  return (
    <View style={{ width: size, height: size }}>
      {Array.from({ length: total }).map((_, i) => {
        const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: size / 2 + r * Math.cos(angle) - 2.5,
              top: size / 2 + r * Math.sin(angle) - 2.5,
              width: 5,
              height: 5,
              borderRadius: 2.5,
              backgroundColor: i < filled ? color : '#2C2C2E',
            }}
          />
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────
// Decorative bezel screws
// ─────────────────────────────────────────────
function Screw({
  top,
  left,
  right,
  bottom,
}: {
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
}) {
  return (
    <View style={[styles.screw, { top, left, right, bottom }]}>
      <View style={styles.screwSlotH} />
      <View style={styles.screwSlotV} />
    </View>
  );
}

// ─────────────────────────────────────────────
// Physical side button
// ─────────────────────────────────────────────
function WatchButton({
  label,
  onPress,
  large,
  accent,
}: {
  label: string;
  onPress: () => void;
  large?: boolean;
  accent?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    // Only scale — keeps useNativeDriver consistent (no mixed-driver conflict)
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.82, duration: 65, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(
      large ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium,
    );
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Animated.View
        style={[
          styles.watchBtn,
          large && styles.watchBtnLarge,
          accent && styles.watchBtnAccent,
          { transform: [{ scaleX: scale }] },
        ]}
      >
        <Text style={[styles.watchBtnText, large && styles.watchBtnTextLarge, accent && { color: C.orange }]}>
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────
// Screen 1 – Watch Face
// ─────────────────────────────────────────────
function WatchFace({ time, date, heartRate }: { time: string; date: string; heartRate: number }) {
  const hrPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(hrPulse, { toValue: 1.3, duration: 520, useNativeDriver: true }),
        Animated.timing(hrPulse, { toValue: 1, duration: 520, useNativeDriver: true }),
      ]),
    );
    a.start();
    return () => a.stop();
  }, []);

  return (
    <View style={styles.face}>
      {/* ── Top bar: battery + stamina ── */}
      <View style={[styles.absRow, { top: 20 }]}>
        <View style={styles.battRow}>
          <Ionicons name="battery-charging" size={13} color={C.green} />
          <Text style={[styles.microText, { color: C.green }]}>16d</Text>
        </View>
        <View style={styles.staminaRow}>
          <Text style={[styles.microText, { color: C.cyan, letterSpacing: 0.8 }]}>STMN</Text>
          <View style={styles.staminaTrack}>
            <View style={[styles.staminaFill, { width: '78%' }]} />
          </View>
          <Text style={[styles.microText, { color: C.cyan }]}>78</Text>
        </View>
      </View>

      {/* ── Center: time ── */}
      <View style={styles.faceCenterBlock}>
        <Text style={styles.timeText} numberOfLines={1}>{time}</Text>
        <Text style={styles.dateText}>{date}</Text>
      </View>

      {/* ── Side metrics: steps & weather ── */}
      <View style={[styles.absSide, { top: 82, left: 6 }]}>
        <Ionicons name="footsteps" size={12} color={C.textDim} />
        <Text style={styles.sideValue}>9,420</Text>
        <Text style={styles.sideLabel}>STEPS</Text>
      </View>
      <View style={[styles.absSide, { top: 82, right: 6 }]}>
        <Ionicons name="cloudy" size={12} color={C.textDim} />
        <Text style={styles.sideValue}>72°F</Text>
        <Text style={styles.sideLabel}>4,256ft</Text>
      </View>

      {/* ── Bottom: HR chart ── */}
      <View style={[styles.absRow, { bottom: 18, flexDirection: 'column', gap: 5 }]}>
        <HeartRateBars />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Animated.View style={{ transform: [{ scale: hrPulse }] }}>
            <Ionicons name="heart" size={11} color={C.red} />
          </Animated.View>
          <Text style={[styles.microText, { color: C.red, fontSize: 10, fontWeight: '700' }]}>
            {heartRate} BPM
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// Screen 2 – Running Widget
// ─────────────────────────────────────────────
function RunningWidget({ secs, heartRate }: { secs: number; heartRate: number }) {
  const zonePulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(zonePulse, { toValue: 1.35, duration: 360, useNativeDriver: true }),
        Animated.timing(zonePulse, { toValue: 1, duration: 360, useNativeDriver: true }),
      ]),
    );
    a.start();
    return () => a.stop();
  }, []);

  return (
    <View style={styles.face}>
      {/* Header */}
      <View style={[styles.absRow, { top: 20 }]}>
        <Ionicons name="walk" size={14} color={C.green} />
        <Text style={[styles.microText, { color: C.green, letterSpacing: 1.8, marginLeft: 4 }]}>
          RUNNING
        </Text>
      </View>

      {/* Timer */}
      <View style={[styles.faceCenterBlock, { marginTop: -10 }]}>
        <Text style={styles.runTimer}>{fmtSecs(secs)}</Text>
        <Text style={styles.runTimerLabel}>ELAPSED</Text>
      </View>

      {/* Stats */}
      <View style={[styles.absRow, { bottom: 46, gap: 0 }]}>
        <View style={styles.runStat}>
          <Text style={styles.runStatVal}>5:42</Text>
          <Text style={styles.runStatLbl}>PACE/mi</Text>
        </View>
        <View style={styles.runDivider} />
        <View style={styles.runStat}>
          <Text style={styles.runStatVal}>2.8</Text>
          <Text style={styles.runStatLbl}>DIST mi</Text>
        </View>
      </View>

      {/* Zone */}
      <View style={[styles.absRow, { bottom: 16 }]}>
        <Animated.View style={{ transform: [{ scale: zonePulse }] }}>
          <Ionicons name="heart" size={14} color={C.yellow} />
        </Animated.View>
        <Text style={[styles.runStatVal, { color: C.yellow, marginLeft: 5, fontSize: 13 }]}>
          {heartRate} BPM
        </Text>
        <View style={styles.zoneBadge}>
          <Text style={styles.zoneBadgeText}>Z3</Text>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// Screen 3 – Training Readiness
// ─────────────────────────────────────────────
function TrainingReadiness() {
  const metrics = [
    { label: 'RECOVERY', value: 'GOOD', color: C.green },
    { label: 'SLEEP', value: '7.5 h', color: C.blue },
    { label: 'HRV', value: '54 ms', color: C.cyan },
  ];

  return (
    <View style={styles.face}>
      <Text style={[styles.microText, { position: 'absolute', top: 20, letterSpacing: 1.5, textAlign: 'center' }]}>
        TRAINING{'\n'}READINESS
      </Text>

      <View style={styles.trainCircleWrap}>
        <CircularProgress value={72} maxVal={100} size={104} color={C.green} />
        <View style={styles.trainScoreOverlay}>
          <Text style={styles.trainScore}>72</Text>
          <Text style={[styles.microText, { fontSize: 7.5, letterSpacing: 0.5 }]}>/ 100</Text>
        </View>
      </View>

      <View style={[styles.trainMetrics, { position: 'absolute', bottom: 14 }]}>
        {metrics.map((m) => (
          <View key={m.label} style={styles.trainMetricRow}>
            <Text style={styles.trainMetricLbl}>{m.label}</Text>
            <Text style={[styles.trainMetricVal, { color: m.color }]}>{m.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// Screen 4 – ABC Widget (Altimeter · Barometer · Compass)
// ─────────────────────────────────────────────
function ABCWidget({ heading }: { heading: number }) {
  const COMP = 110;
  const cx = COMP / 2;   // 55
  const tickR = cx - 5;  // 50
  const labelR = cx - 19; // 36

  const ticks = Array.from({ length: 36 }, (_, i) => i * 10);
  const cardinals = [
    { label: 'N', deg: 0 },
    { label: 'E', deg: 90 },
    { label: 'S', deg: 180 },
    { label: 'W', deg: 270 },
  ];

  return (
    <View style={styles.face}>
      {/* Header */}
      <Text style={[styles.microText, { position: 'absolute', top: 16, letterSpacing: 2 }]}>
        COMPASS
      </Text>

      {/* Compass ring — absolutely centered, sits below header */}
      <View
        style={{
          position: 'absolute',
          top: 28,
          left: (SCREEN - COMP) / 2,
          width: COMP,
          height: COMP,
        }}
      >
        {/* Tick dots */}
        {ticks.map((deg) => {
          const rad = (deg * Math.PI) / 180 - Math.PI / 2;
          const isMajor = deg % 90 === 0;
          const isNorth = deg === 0;
          const sz = isMajor ? 5 : 3;
          return (
            <View
              key={deg}
              style={{
                position: 'absolute',
                left: cx + tickR * Math.cos(rad) - sz / 2,
                top: cx + tickR * Math.sin(rad) - sz / 2,
                width: sz,
                height: sz,
                borderRadius: sz / 2,
                backgroundColor: isNorth ? C.orange : isMajor ? '#CFCFD0' : '#3A3A3C',
              }}
            />
          );
        })}

        {/* Cardinal labels */}
        {cardinals.map(({ label, deg }) => {
          const rad = (deg * Math.PI) / 180 - Math.PI / 2;
          return (
            <Text
              key={label}
              style={{
                position: 'absolute',
                left: cx + labelR * Math.cos(rad) - 8,
                top: cx + labelR * Math.sin(rad) - 7,
                color: label === 'N' ? C.orange : C.textSec,
                fontSize: label === 'N' ? 11 : 9,
                fontWeight: '700',
                width: 16,
                textAlign: 'center',
              }}
            >
              {label}
            </Text>
          );
        })}

        {/* Center crosshair */}
        <View
          style={{
            position: 'absolute',
            left: cx - 4,
            top: cx - 4,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#111113',
            borderWidth: 1.5,
            borderColor: C.orange,
          }}
        />
      </View>

      {/* Current heading */}
      <Text
        style={{
          position: 'absolute',
          top: 147,
          color: C.white,
          fontSize: 19,
          fontWeight: '300',
          letterSpacing: 0.5,
          textAlign: 'center',
          width: SCREEN,
        }}
      >
        {Math.round(heading)}° {headingToCardinal(heading)}
      </Text>

      {/* Altitude + barometer */}
      <View style={[styles.absRow, { bottom: 28, gap: 14 }]}>
        <View style={{ alignItems: 'center', gap: 1 }}>
          <Text style={[styles.microText, { fontSize: 7, letterSpacing: 1.2 }]}>ALTITUDE</Text>
          <Text style={{ color: C.cyan, fontSize: 12, fontWeight: '600' }}>4,200 m</Text>
        </View>
        <View style={{ width: 1, height: 22, backgroundColor: C.textDim }} />
        <View style={{ alignItems: 'center', gap: 1 }}>
          <Text style={[styles.microText, { fontSize: 7, letterSpacing: 1.2 }]}>BARO</Text>
          <Text style={{ color: C.blue, fontSize: 12, fontWeight: '600' }}>1013 hPa</Text>
        </View>
      </View>

      {/* GPS fix */}
      <Text
        style={{
          position: 'absolute',
          bottom: 9,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: C.textSec,
          fontSize: 8,
          letterSpacing: 1,
          fontFamily: 'monospace',
        }}
      >
        GPS 50°27'N 30°31'E · KYIV
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// Screen 5 – Music Controls (Spotify)
// ─────────────────────────────────────────────
const SPOTIFY_GREEN = '#1DB954';

function MusicControls({
  isPlaying,
  onTogglePlay,
  musicSecs,
}: {
  isPlaying: boolean;
  onTogglePlay: () => void;
  musicSecs: number;
}) {
  return (
    <View style={styles.face}>
      {/* Header */}
      <View style={[styles.absRow, { top: 16 }]}>
        <MaterialCommunityIcons name="spotify" size={11} color={SPOTIFY_GREEN} />
        <Text style={[styles.microText, { color: SPOTIFY_GREEN, letterSpacing: 1.5, marginLeft: 3 }]}>
          MUSIC
        </Text>
      </View>

      {/* Song title */}
      <View
        style={{ position: 'absolute', top: 43, left: 0, right: 0, alignItems: 'center', gap: 2 }}
      >
        <Text
          style={{ color: C.white, fontSize: 13, fontWeight: '700', letterSpacing: 0.2 }}
          numberOfLines={1}
        >
          Thunderstruck
        </Text>
        <Text style={[styles.microText, { fontSize: 9 }]}>AC/DC</Text>
      </View>

      {/* Progress bar */}
      <View style={{ position: 'absolute', top: 80, left: 38, right: 38 }}>
        <View
          style={{ height: 3, borderRadius: 2, backgroundColor: '#2C2C2E', overflow: 'hidden' }}
        >
          <View
            style={{ width: `${(musicSecs / 272) * 100}%`, height: '100%', backgroundColor: SPOTIFY_GREEN, borderRadius: 2 }}
          />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 }}>
          <Text style={[styles.microText, { fontSize: 7 }]}>{fmtSecs(musicSecs)}</Text>
          <Text style={[styles.microText, { fontSize: 7 }]}>4:32</Text>
        </View>
      </View>

      {/* Playback controls */}
      <View
        style={{
          position: 'absolute',
          top: 108,
          left: 0,
          right: 0,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
        }}
      >
        <TouchableOpacity activeOpacity={0.7}>
          <MaterialCommunityIcons name="skip-previous" size={26} color={C.textSec} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onTogglePlay}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: SPOTIFY_GREEN,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons name={isPlaying ? 'pause' : 'play'} size={24} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7}>
          <MaterialCommunityIcons name="skip-next" size={26} color={C.textSec} />
        </TouchableOpacity>
      </View>

      {/* Volume */}
      <View style={[styles.absRow, { bottom: 17, gap: 6 }]}>
        <MaterialCommunityIcons name="volume-low" size={10} color={C.textDim} />
        <View
          style={{
            width: 76,
            height: 3,
            backgroundColor: '#2C2C2E',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <View
            style={{ width: '65%', height: '100%', backgroundColor: '#4A4A4E', borderRadius: 2 }}
          />
        </View>
        <MaterialCommunityIcons name="volume-high" size={10} color={C.textDim} />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// Screen 6 – Weather & Sun
// ─────────────────────────────────────────────
function WeatherSun() {
  // Sun arc: top-half semicircle; left=sunrise, peak=zenith, right=sunset
  // Dots at angles π→0 with y = baseline − r·sin(angle)
  const ARC_W = 132;
  const ARC_H = 52;   // height of the view = arc radius
  const arcR = 50;
  const arcCX = ARC_W / 2; // 66
  const arcCY = ARC_H;     // 52 — the baseline sits at the bottom of the view
  const total = 30;
  const filled = 9;   // ~30% through the day (≈10:00 am between 05:42 and 20:15)

  return (
    <View style={styles.face}>
      {/* Header */}
      <Text style={[styles.microText, { position: 'absolute', top: 16, letterSpacing: 2 }]}>
        WEATHER
      </Text>

      {/* Sun arc */}
      <View
        style={{
          position: 'absolute',
          top: 30,
          left: (SCREEN - ARC_W) / 2,
          width: ARC_W,
          height: ARC_H,
        }}
      >
        {Array.from({ length: total }).map((_, i) => {
          const angle = Math.PI - (i / (total - 1)) * Math.PI; // π → 0
          const x = arcCX + arcR * Math.cos(angle) - 2;
          const y = arcCY - arcR * Math.sin(angle) - 2;
          const isSun = i === filled;
          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: isSun ? 7 : 4,
                height: isSun ? 7 : 4,
                borderRadius: isSun ? 3.5 : 2,
                backgroundColor: isSun
                  ? C.yellow
                  : i < filled
                  ? 'rgba(255,214,10,0.45)'
                  : '#2C2C2E',
              }}
            />
          );
        })}
      </View>

      {/* Temperature */}
      <View
        style={{ position: 'absolute', top: 88, left: 0, right: 0, alignItems: 'center', gap: 2 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <Ionicons name="sunny" size={22} color={C.yellow} />
          <Text
            style={{ color: C.white, fontSize: 38, fontWeight: '300', letterSpacing: -1.5 }}
          >
            24°C
          </Text>
        </View>
        <Text style={[styles.microText, { fontSize: 8, letterSpacing: 1.5 }]}>
          SUNNY · FEELS 26°C
        </Text>
      </View>

      {/* Sunrise / Sunset */}
      <View style={[styles.absRow, { bottom: 13, paddingHorizontal: 14 }]}>
        <View style={{ alignItems: 'center', gap: 1 }}>
          <Ionicons name="sunny-outline" size={13} color={C.yellow} />
          <Text style={[styles.microText, { fontSize: 8 }]}>05:42</Text>
        </View>
        <View style={{ flex: 1, height: 1, backgroundColor: '#2C2C2E', marginHorizontal: 6 }} />
        <View style={{ alignItems: 'center', gap: 1 }}>
          <Ionicons name="moon-outline" size={13} color={C.orange} />
          <Text style={[styles.microText, { fontSize: 8 }]}>20:15</Text>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// Main watch simulator
// ─────────────────────────────────────────────
export default function WatchSimulator() {
  const insets = useSafeAreaInsets();
  const [screen, setScreen] = useState(0);
  const screenRef = useRef(0); // stable ref for use inside PanResponder
  const [time, setTime] = useState('10:42');
  const [date, setDate] = useState('WED, AUG 4');
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideX = useRef(new Animated.Value(0)).current;

  // ── Dynamic state ──────────────────────────────────────────────────
  const [heartRate, setHeartRate] = useState(72);
  const [heading, setHeading] = useState(342);
  const [runSecs, setRunSecs] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [musicSecs, setMusicSecs] = useState(103);

  // ── Heart Rate Engine: 146–153 running, 69–76 resting (2500 ms) ───
  useEffect(() => {
    const t = setInterval(() => {
      setHeartRate(
        screen === 1
          ? Math.floor(Math.random() * 8) + 146
          : Math.floor(Math.random() * 8) + 69,
      );
    }, 2500);
    return () => clearInterval(t);
  }, [screen]);

  // ── Compass drift: ±1.5° micro-oscillation every 2 s ──────────────
  useEffect(() => {
    const t = setInterval(() => {
      setHeading((h) => {
        const next = (h + (Math.random() - 0.5) * 3 + 360) % 360;
        return Math.round(next * 10) / 10;
      });
    }, 2000);
    return () => clearInterval(t);
  }, []);

  // ── Stopwatch: ticks only while isTimerRunning ─────────────────────
  useEffect(() => {
    if (!isTimerRunning) return;
    const t = setInterval(() => setRunSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [isTimerRunning]);

  // ── Music progress: ticks only while isPlaying ─────────────────────
  useEffect(() => {
    if (!isPlaying) return;
    const t = setInterval(() => setMusicSecs((s) => Math.min(s + 1, 272)), 1000);
    return () => clearInterval(t);
  }, [isPlaying]);

  // Keep screenRef in sync so PanResponder can read current screen
  useEffect(() => { screenRef.current = screen; }, [screen]);

  // Live clock (update every minute)
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = now.getHours();
      const m = String(now.getMinutes()).padStart(2, '0');
      setTime(`${h}:${m}`);
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      setDate(`${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`);
    };
    update();
    const t = setInterval(update, 30000);
    return () => clearInterval(t);
  }, []);

  /** Slide the current screen out, swap, slide new screen in. */
  const slideToScreen = (direction: 'left' | 'right') => {
    const exitX = direction === 'left' ? -SCREEN : SCREEN;
    const enterX = direction === 'left' ? SCREEN : -SCREEN;
    Animated.timing(slideX, { toValue: exitX, duration: 200, useNativeDriver: true }).start(() => {
      setScreen((s) => {
        const next = direction === 'left' ? (s + 1) % 6 : (s + 5) % 6;
        screenRef.current = next;
        return next;
      });
      slideX.setValue(enterX);
      Animated.timing(slideX, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    });
  };

  /** Fade transition used by buttons. */
  const goTo = (next: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 110, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    setTimeout(() => {
      setScreen(next);
      screenRef.current = next;
    }, 110);
  };

  /** PanResponder — horizontal swipe on the watch face */
  const panResponder = useRef(
    PanResponder.create({
      // Only intercept clearly horizontal gestures so vertical scroll still works
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 8 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.3,
      onPanResponderMove: (_, gs) => {
        // Clamp drag so it doesn't go too far
        const clamped = Math.max(-SCREEN * 0.7, Math.min(SCREEN * 0.7, gs.dx));
        slideX.setValue(clamped);
      },
      onPanResponderRelease: (_, gs) => {
        const THRESHOLD = 35;
        if (gs.dx < -THRESHOLD || gs.vx < -0.5) {
          slideToScreen('left');
        } else if (gs.dx > THRESHOLD || gs.vx > 0.5) {
          slideToScreen('right');
        } else {
          // Not far enough — snap back
          Animated.spring(slideX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(slideX, { toValue: 0, useNativeDriver: true }).start();
      },
    }),
  ).current;

  const handleUp = () => goTo((screen + 5) % 6);
  const handleDown = () => goTo((screen + 1) % 6);
  const handleStart = () => {
    if (screen === 1) {
      setIsTimerRunning((prev) => !prev); // ▶ toggles start/pause on the running screen
    } else {
      goTo(1);                            // ▶ navigates to the running screen from elsewhere
    }
  };

  return (
    <View
      style={[
        styles.root,
        Platform.OS === 'web' && {
          paddingTop: Math.max(50, insets.top + 10),
          paddingBottom: 24,
        },
      ]}
    >
      {/* ── Top watch strap ── */}
      <View style={styles.strapTop}>
        <View style={styles.strapGroove} />
        <View style={styles.strapGroove} />
        <View style={styles.strapHardware} />
      </View>

      {/* ─── Watch assembly row ─── */}
      <View style={[styles.watchRow, { zIndex: 2 }]}>
        {/* Left button */}
        <View style={styles.leftCol}>
          <WatchButton label="◀" onPress={() => goTo((screen + 5) % 6)} />
        </View>

        {/* ── Bezel ── */}
        <View style={styles.bezel}>
          {/* Decorative screws */}
          <Screw top={18} left={18} />
          <Screw top={18} right={18} />
          <Screw bottom={18} left={18} />
          <Screw bottom={18} right={18} />

          {/* Outer metallic ring texture (subtle highlight arc) */}
          <View style={styles.bezelHighlightArc} />

          {/* Orange accent ring */}
          <View style={styles.orangeRing}>
            {/* AMOLED screen — swipe gestures captured here */}
            <View style={styles.watchScreen} {...panResponder.panHandlers}>
              <Animated.View
                style={[
                  styles.screenInner,
                  { opacity: fadeAnim, transform: [{ translateX: slideX }] },
                ]}
              >
                {screen === 0 && <WatchFace time={time} date={date} heartRate={heartRate} />}
                {screen === 1 && <RunningWidget secs={runSecs} heartRate={heartRate} />}
                {screen === 2 && <TrainingReadiness />}
                {screen === 3 && <ABCWidget heading={heading} />}
                {screen === 4 && (
                  <MusicControls
                    isPlaying={isPlaying}
                    onTogglePlay={() => setIsPlaying((p) => !p)}
                    musicSecs={musicSecs}
                  />
                )}
                {screen === 5 && <WeatherSun />}
              </Animated.View>
            </View>
          </View>
        </View>

        {/* Right buttons */}
        <View style={styles.rightCol}>
          <WatchButton label="UP" onPress={handleUp} />
          <WatchButton label="▶" onPress={handleStart} large accent />
          <WatchButton label="DN" onPress={handleDown} />
        </View>
      </View>

      {/* ── Bottom watch strap ── */}
      <View style={styles.strapBottom}>
        <View style={styles.strapHardware} />
        <View style={styles.strapGroove} />
        <View style={styles.strapGroove} />
      </View>

      {/* ─── Screen indicator dots ─── */}
      <View style={styles.dotRow}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={[styles.dot, screen === i && styles.dotActive]} />
        ))}
      </View>

      {/* ─── Current screen name ─── */}
      <Text style={styles.screenLabel}>{SCREEN_NAMES[screen]}</Text>
      <Text style={styles.hintText}>swipe or use buttons to navigate</Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.appBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Columns for buttons
  leftCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginRight: 0,
  },
  rightCol: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 12,
  },

  // Buttons
  watchBtn: {
    width: 13,
    height: 30,
    backgroundColor: C.btnBg,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: C.btnEdge,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.7,
    shadowRadius: 4,
    elevation: 6,
  },
  watchBtnLarge: {
    height: 44,
    width: 15,
  },
  watchBtnAccent: {
    borderColor: C.orangeDim,
  },
  watchBtnText: {
    color: C.textDim,
    fontSize: 5,
    fontWeight: '700' as const,
  },
  watchBtnTextLarge: {
    fontSize: 9,
  },

  // Bezel
  bezel: {
    width: BEZEL,
    height: BEZEL,
    borderRadius: BEZEL / 2,
    backgroundColor: C.bezel,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.bezelEdge,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 24,
  },
  bezelHighlightArc: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    height: BEZEL / 2,
    borderRadius: BEZEL / 2,
    borderTopWidth: 1,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },

  // Screws
  screw: {
    position: 'absolute' as const,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: C.screwBg,
    borderWidth: 1,
    borderColor: C.screwRing,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screwSlotH: {
    position: 'absolute' as const,
    width: 5.5,
    height: 1.5,
    backgroundColor: '#555558',
    borderRadius: 1,
  },
  screwSlotV: {
    position: 'absolute' as const,
    width: 1.5,
    height: 5.5,
    backgroundColor: '#555558',
    borderRadius: 1,
  },

  // Orange ring
  orangeRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2.5,
    borderColor: C.orange,
    backgroundColor: C.bezelInner,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Screen
  watchScreen: {
    width: SCREEN,
    height: SCREEN,
    borderRadius: SCREEN / 2,
    backgroundColor: C.screenBg,
    overflow: 'hidden' as const,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenInner: {
    width: SCREEN,
    height: SCREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Face container
  face: {
    width: SCREEN,
    height: SCREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Shared absolute row
  absRow: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  // Absolute side metric (left/right)
  absSide: {
    position: 'absolute' as const,
    alignItems: 'center',
    gap: 1,
  },

  // Micro text
  microText: {
    color: C.textSec,
    fontSize: 8.5,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    fontFamily: 'Inter_600SemiBold',
  },

  // Battery row
  battRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  // Stamina
  staminaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  staminaTrack: {
    width: 30,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2C2C2E',
    overflow: 'hidden' as const,
  },
  staminaFill: {
    height: '100%',
    backgroundColor: C.cyan,
    borderRadius: 2,
  },

  // Center block
  faceCenterBlock: {
    alignItems: 'center',
  },
  timeText: {
    color: C.white,
    fontSize: 50,
    fontWeight: '300' as const,
    letterSpacing: -1.5,
    fontFamily: 'Inter_400Regular',
    lineHeight: 54,
  },
  dateText: {
    color: C.textSec,
    fontSize: 9,
    fontWeight: '600' as const,
    letterSpacing: 1.8,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 1,
  },

  // Side metrics
  sideValue: {
    color: C.white,
    fontSize: 10,
    fontWeight: '600' as const,
    fontFamily: 'Inter_600SemiBold',
  },
  sideLabel: {
    color: C.textDim,
    fontSize: 7,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    fontFamily: 'Inter_600SemiBold',
  },

  // Running screen
  runTimer: {
    color: C.white,
    fontSize: 44,
    fontWeight: '200' as const,
    letterSpacing: -1,
    fontFamily: 'Inter_400Regular',
  },
  runTimerLabel: {
    color: C.textDim,
    fontSize: 8,
    fontWeight: '700' as const,
    letterSpacing: 2,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 1,
  },
  runStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  runStat: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  runStatVal: {
    color: C.white,
    fontSize: 16,
    fontWeight: '600' as const,
    fontFamily: 'Inter_600SemiBold',
  },
  runStatLbl: {
    color: C.textSec,
    fontSize: 8,
    fontWeight: '600' as const,
    letterSpacing: 0.8,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 1,
  },
  runDivider: {
    width: 1,
    height: 22,
    backgroundColor: C.textDim,
    borderRadius: 1,
  },
  zoneBadge: {
    backgroundColor: C.yellow,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    marginLeft: 6,
  },
  zoneBadgeText: {
    color: '#000',
    fontSize: 8,
    fontWeight: '800' as const,
  },

  // Training screen
  trainCircleWrap: {
    width: 104,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  trainScoreOverlay: {
    position: 'absolute' as const,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trainScore: {
    color: C.white,
    fontSize: 28,
    fontWeight: '300' as const,
    fontFamily: 'Inter_400Regular',
    lineHeight: 30,
  },
  trainMetrics: {
    width: '100%',
    gap: 3,
  },
  trainMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
  },
  trainMetricLbl: {
    color: C.textDim,
    fontSize: 8,
    fontWeight: '600' as const,
    letterSpacing: 0.8,
    fontFamily: 'Inter_600SemiBold',
  },
  trainMetricVal: {
    fontSize: 9,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
  },

  // ── Watch straps ──────────────────────────────
  strapTop: {
    width: 126,
    height: 56,
    backgroundColor: '#181819',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderColor: '#2A2A2C',
    borderBottomWidth: 0,
    zIndex: 1,
    marginBottom: -28,       // pulled behind bezel by 28px
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 10,
    gap: 6,
  },
  strapBottom: {
    width: 126,
    height: 56,
    backgroundColor: '#181819',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderWidth: 1,
    borderColor: '#2A2A2C',
    borderTopWidth: 0,
    zIndex: 1,
    marginTop: -28,          // pulled behind bezel by 28px
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 10,
    gap: 6,
  },
  // Subtle texture grooves pressed into the silicone strap
  strapGroove: {
    width: 76,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderRadius: 1,
  },
  // Quick-release hardware pin bar
  strapHardware: {
    width: 52,
    height: 3,
    backgroundColor: '#2E2E32',
    borderRadius: 1.5,
    borderWidth: 0.5,
    borderColor: '#3E3E42',
  },

  // Page dots
  dotRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 20,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: C.textDim,
  },
  dotActive: {
    backgroundColor: C.orange,
    width: 18,
    borderRadius: 3,
  },

  // Screen label
  screenLabel: {
    color: C.orange,
    fontSize: 9,
    fontWeight: '700' as const,
    letterSpacing: 3,
    marginTop: 9,
    fontFamily: 'Inter_600SemiBold',
  },

  // Hint
  hintText: {
    color: C.textDim,
    fontSize: 9,
    marginTop: 4,
    letterSpacing: 0.4,
    fontFamily: 'Inter_400Regular',
  },
});
