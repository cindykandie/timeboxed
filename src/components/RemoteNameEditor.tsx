import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../typography/Text';

import { colors } from '../theme';
import { TVButton } from './TVButton';

const rows = ['ABCDEF', 'GHIJKL', 'MNOPQR', 'STUVWX', 'YZ0123', '456789'];
export function RemoteNameEditor({ value, onChange, onDone }: { value: string; onChange: (value: string) => void; onDone: () => void }) {
  const first = useRef<View>(null);
  return <View testID="event-name-keyboard" style={styles.root}>
    <Text style={styles.value} numberOfLines={1}>{value || 'Event name'}</Text>
    {rows.map((row) => <View key={row} style={styles.row}>
      {[...row].map((letter) => <TVButton key={letter} label={letter} compact style={styles.key}
        preferredFocus={letter === 'A'} buttonRef={letter === 'A' ? first : undefined}
        onPress={() => onChange((value + letter).slice(0, 40))} />)}
    </View>)}
    <View style={styles.row}>
      <TVButton label="Clear" compact style={styles.key} onPress={() => { onChange(''); first.current?.requestTVFocus(); }} />
      <TVButton label="Space" compact style={styles.key} onPress={() => onChange((value + ' ').slice(0, 40))} />
      <TVButton label="Delete" compact style={styles.key} onPress={() => onChange(value.slice(0, -1))} />
      <TVButton label="Done" compact style={styles.key} onPress={onDone} />
    </View>
  </View>;
}
const styles = StyleSheet.create({
  root: { gap: 5 }, row: { flexDirection: 'row', gap: 6 }, key: { flex: 1, minHeight: 44, paddingVertical: 6 },
  value: { color: colors.text, fontSize: 26, marginBottom: 8 },
});
