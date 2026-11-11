import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, dashboardTokens } from '../theme';
import type { UtilityAccent } from '../theme';

const viewBoxSize = 64;
type UtilityIconName = UtilityAccent | 'home';

// Native line geometry keeps these five small, consistent icons offline and
// resolution independent without an icon font or an additional renderer.
function Line({ from, to, color, stroke }: { from: [number, number]; to: [number, number]; color: string; stroke: number }) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const width = Math.hypot(dx, dy);
  return <View style={{ position: 'absolute', width, height: stroke, borderRadius: stroke / 2,
    left: (from[0] + to[0]) / 2 - width / 2, top: (from[1] + to[1]) / 2 - stroke / 2,
    backgroundColor: color, transform: [{ rotate: `${Math.atan2(dy, dx) * 180 / Math.PI}deg` }] }} />;
}

function Outline({ x, y, width, height = width, radius = '50%', color, stroke, children }: PropsWithChildren<{
  x: number; y: number; width: number; height?: number; radius?: number | `${number}%`; color: string; stroke: number;
}>) {
  const inset = (stroke - 2.5) / 2;
  return <View style={{ position: 'absolute', left: x - inset, top: y - inset, width: width + inset * 2, height: height + inset * 2,
    borderRadius: typeof radius === 'number' ? radius + inset : radius, borderWidth: stroke, borderColor: color }}>{children}</View>;
}

function IconDrawing({ name, color, stroke }: { name: UtilityIconName; color: string; stroke: number }) {
  let drawing;
  switch (name) {
    case 'home':
      drawing = <>
        <Line from={[7, 30]} to={[32, 9]} color={color} stroke={stroke} />
        <Line from={[32, 9]} to={[57, 30]} color={color} stroke={stroke} />
        <Line from={[15, 24]} to={[15, 56]} color={color} stroke={stroke} />
        <Line from={[15, 56]} to={[49, 56]} color={color} stroke={stroke} />
        <Line from={[49, 56]} to={[49, 24]} color={color} stroke={stroke} />
        <Outline x={27} y={39} width={10} height={17} radius={1} color={color} stroke={stroke} />
      </>;
      break;
    case 'timer':
      drawing = <>
        <Outline x={10} y={15} width={44} color={color} stroke={stroke} />
        <Line from={[26, 7]} to={[38, 7]} color={color} stroke={stroke} />
        <Line from={[32, 7]} to={[32, 15]} color={color} stroke={stroke} />
        <Line from={[49, 18]} to={[54, 13]} color={color} stroke={stroke} />
        <Line from={[32, 37]} to={[32, 25]} color={color} stroke={stroke} />
        <Line from={[32, 37]} to={[41, 37]} color={color} stroke={stroke} />
      </>;
      break;
    case 'clock':
      drawing = <>
        <Outline x={6} y={6} width={52} color={color} stroke={stroke} />
        <Line from={[32, 18]} to={[32, 32]} color={color} stroke={stroke} />
        <Line from={[32, 32]} to={[43, 38]} color={color} stroke={stroke} />
      </>;
      break;
    case 'calculator':
      drawing = <>
        <Outline x={10} y={4} width={44} height={56} radius={7} color={color} stroke={stroke} />
        <Outline x={18} y={12} width={28} height={11} radius={2} color={color} stroke={stroke} />
        {[31, 41, 51].flatMap((y) => [22, 32, 42].map((x) => (
          <View key={`${x}-${y}`} style={{ position: 'absolute', left: x - (stroke + 1) / 2, top: y - (stroke + 1) / 2,
            width: stroke + 1, height: stroke + 1, borderRadius: 1, backgroundColor: color }} />
        )))}
      </>;
      break;
    case 'countdown':
      drawing = <>
        <Line from={[12, 8]} to={[52, 8]} color={color} stroke={stroke} />
        <Line from={[12, 56]} to={[52, 56]} color={color} stroke={stroke} />
        <Line from={[16, 8]} to={[16, 17]} color={color} stroke={stroke} />
        <Line from={[48, 8]} to={[48, 17]} color={color} stroke={stroke} />
        <Line from={[16, 17]} to={[48, 47]} color={color} stroke={stroke} />
        <Line from={[48, 17]} to={[16, 47]} color={color} stroke={stroke} />
        <Line from={[16, 47]} to={[16, 56]} color={color} stroke={stroke} />
        <Line from={[48, 47]} to={[48, 56]} color={color} stroke={stroke} />
      </>;
      break;
    case 'worldClocks':
      drawing = <>
        <Outline x={6} y={6} width={52} color={color} stroke={stroke} />
        <Outline x={20} y={6} width={24} height={52} color={color} stroke={stroke} />
        <Line from={[7, 32]} to={[57, 32]} color={color} stroke={stroke} />
      </>;
  }
  return drawing;
}

export function UtilityIcon({ name, color, size = dashboardTokens.iconSize, strokeWidth = 2.5, contrast = false }: {
  name: UtilityIconName; color: string; size?: number; strokeWidth?: number; contrast?: boolean;
}) {
  return (
    <View testID={`utility-icon-${name}`} pointerEvents="none" accessible={false} collapsable={false}
      style={{ width: size, height: size }}>
      <View style={[styles.drawing, { left: (size - viewBoxSize) / 2, top: (size - viewBoxSize) / 2,
        transform: [{ scale: size / viewBoxSize }] }]}>
        {contrast && <IconDrawing name={name} color={colors.artworkInk} stroke={strokeWidth + 3} />}
        <IconDrawing name={name} color={color} stroke={strokeWidth} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  drawing: { position: 'absolute', width: viewBoxSize, height: viewBoxSize },
});
