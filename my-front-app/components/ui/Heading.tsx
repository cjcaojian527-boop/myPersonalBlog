import { TextStyle, TextProps } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | string;

interface HeadingProps extends TextProps {
    level?: HeadingLevel;
}

const HEADING_STYLES: Record<HeadingLevel, TextStyle> = {
    h1: { fontSize: 24, fontWeight: '700' },
    h2: { fontSize: 21, fontWeight: '700' },
    h3: { fontSize: 18, fontWeight: '600' },
    h4: { fontSize: 16, fontWeight: '600' },
    h5: { fontSize: 15, fontWeight: '500' },
    h6: { fontSize: 14, fontWeight: '500' },
};

export function Heading({ level = 'h1', style, ...rest }: HeadingProps) {
    const base = HEADING_STYLES[level];
    return <ThemedText style={[base, style]} {...rest} />;
}