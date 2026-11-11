import { StyleSheet, Text as NativeText, View } from 'react-native';

export type ActionIconName = 'more' | 'delete' | 'edit' | 'ambient' | 'open' | 'play' | 'pause' | 'reset' | 'settings';

// Match the existing native line-icon approach without changing rail artwork.
export function ActionIcon({ name, color, size = 24 }: { name: ActionIconName; color: string; size?: number }) {
  const line = { borderColor: color, borderWidth: 1.8 };
  return <View testID={`action-icon-${name}`} accessible={false} pointerEvents="none" style={{ width: size, height: size }}>
    <View style={[styles.canvas, { left: (size - 24) / 2, top: (size - 24) / 2, transform: [{ scale: size / 24 }] }]}>
      {name === 'more' && [4, 11, 18].map((left) => <View key={left} style={{ position: 'absolute', left, top: 10.5,
        width: 3, height: 3, borderRadius: 2, backgroundColor: color }} />)}
      {name === 'delete' && <>
        <View style={[line, styles.bin]} /><View style={[styles.lid, { backgroundColor: color }]} />
        <View style={[line, styles.handle]} />
        {[9, 14].map((left) => <View key={left} style={{ position: 'absolute', left, top: 10, width: 1.5, height: 7, backgroundColor: color }} />)}
      </>}
      {name === 'edit' && <><View style={[line, styles.pencil]} /><View style={[styles.tip, { borderBottomColor: color }]} /></>}
      {name === 'ambient' && [[3, 3, '0deg'], [14, 3, '90deg'], [14, 14, '180deg'], [3, 14, '270deg']].map(([left, top, rotate], index) =>
        <View key={index} style={{ position: 'absolute', left: Number(left), top: Number(top), width: 7, height: 7,
          borderLeftWidth: 1.8, borderTopWidth: 1.8, borderColor: color, transform: [{ rotate: rotate as `${number}deg` }] }} />)}
      {name === 'open' && <View style={{ position: 'absolute', left: 7, top: 6, width: 10, height: 10,
        borderRightWidth: 1.8, borderTopWidth: 1.8, borderColor: color, transform: [{ rotate: '45deg' }] }} />}
      {name === 'play' && <NativeText allowFontScaling={false} style={[styles.glyph, styles.playGlyph, { color }]}>▶</NativeText>}
      {name === 'pause' && [7, 14].map((left) => <View key={left} style={{ position: 'absolute', left, top: 5,
        width: 3, height: 14, borderRadius: 1, backgroundColor: color }} />)}
      {name === 'reset' && <>
        <View style={[line, styles.resetArc]} />
        <View style={[styles.resetArrow, { borderLeftColor: color }]} />
      </>}
      {name === 'settings' && <>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => <View key={angle}
          style={[styles.canvas, { transform: [{ rotate: `${angle}deg` }] }]}>
          <View style={{ position: 'absolute', left: 11, top: 2, width: 2, height: 4, borderRadius: 1, backgroundColor: color }} />
        </View>)}
        <View style={[line, styles.gear]} /><View style={[line, styles.gearCenter]} />
      </>}
    </View>
  </View>;
}
const styles = StyleSheet.create({
  canvas: { position: 'absolute', width: 24, height: 24 },
  glyph: { position: 'absolute', width: 24, height: 24, textAlign: 'center', textAlignVertical: 'center',
    includeFontPadding: false, fontFamily: 'sans-serif', fontWeight: '400' },
  playGlyph: { fontSize: 18, lineHeight: 24, paddingLeft: 2 },
  resetArc: { position: 'absolute', left: 3, top: 3, width: 18, height: 18,
    borderRadius: 9, borderTopColor: 'transparent' },
  resetArrow: { position: 'absolute', left: 14, top: 0.5, width: 0, height: 0,
    borderTopWidth: 3.5, borderBottomWidth: 3.5, borderLeftWidth: 5.5,
    borderTopColor: 'transparent', borderBottomColor: 'transparent' },
  gear: { position: 'absolute', left: 5, top: 5, width: 14, height: 14, borderRadius: 5 },
  gearCenter: { position: 'absolute', left: 9, top: 9, width: 6, height: 6, borderRadius: 3 },
  bin: { position: 'absolute', left: 6, top: 7, width: 13, height: 14, borderTopWidth: 0, borderRadius: 2 },
  lid: { position: 'absolute', left: 3, top: 5, width: 19, height: 1.8, borderRadius: 1 },
  handle: { position: 'absolute', left: 9, top: 2, width: 7, height: 4, borderBottomWidth: 0, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  pencil: { position: 'absolute', left: 10, top: 1, width: 6, height: 18, borderRadius: 1, transform: [{ rotate: '42deg' }] },
  tip: { position: 'absolute', left: 3, top: 17, borderLeftWidth: 3, borderRightWidth: 3,
    borderBottomWidth: 5, borderLeftColor: 'transparent', borderRightColor: 'transparent', transform: [{ rotate: '-138deg' }] },
});
