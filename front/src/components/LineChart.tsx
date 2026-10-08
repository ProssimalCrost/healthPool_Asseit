import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import type { MeasurementStatus } from '../api/types';
import { palette } from '../theme/palette';
import { computeDomain, niceTicks, scaleLinear } from '../utils/chartMath';
import { formatShortDate } from '../utils/dates';
import { formatNumber } from '../utils/numbers';

export interface ChartPoint {
  time: number;
  value: number;
  status: MeasurementStatus;
}

interface LineChartProps {
  /** Em ordem cronológica (do mais antigo ao mais novo). */
  points: ChartPoint[];
  min: number | null;
  max: number | null;
  /** Início e fim do período mostrado, em milissegundos. */
  from: number;
  to: number;
  /** Descrição para leitores de tela. */
  accessibilityLabel: string;
}

const HEIGHT = 220;
const PAD = { top: 12, right: 14, bottom: 28, left: 44 };

const POINT_COLOR: Record<MeasurementStatus, string> = {
  IN_RANGE: palette.ok,
  BELOW: palette.alert,
  ABOVE: palette.alert,
  NO_REFERENCE: palette.inkMuted,
};

/**
 * Gráfico de linha com a faixa de referência em verde e os pontos coloridos pelo status.
 * Desenhado direto em SVG: mostra exatamente o que o app precisa, sem biblioteca de gráficos.
 */
export function LineChart({ points, min, max, from, to, accessibilityLabel }: LineChartProps) {
  const [width, setWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => setWidth(Math.floor(event.nativeEvent.layout.width));

  const innerWidth = Math.max(0, width - PAD.left - PAD.right);
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;
  const bottom = PAD.top + innerHeight;

  const domain = computeDomain(
    points.map((p) => p.value),
    min,
    max,
  );
  const x = (time: number) => PAD.left + (to === from ? innerWidth / 2 : ((time - from) / (to - from)) * innerWidth);
  const y = (value: number) => scaleLinear(value, domain, bottom, PAD.top);

  const bandTop = max !== null ? y(max) : PAD.top;
  const bandBottom = min !== null ? y(min) : bottom;
  const hasBand = min !== null || max !== null;

  return (
    <View onLayout={onLayout} accessible accessibilityLabel={accessibilityLabel} className="w-full">
      {width > 0 ? (
        <Svg width={width} height={HEIGHT}>
          {hasBand ? (
            <Rect x={PAD.left} y={bandTop} width={innerWidth} height={Math.max(0, bandBottom - bandTop)} fill={palette.okSoft} />
          ) : null}

          {niceTicks(domain, 5).map((tick) => (
            <Line key={tick} x1={PAD.left} x2={PAD.left + innerWidth} y1={y(tick)} y2={y(tick)} stroke={palette.border} strokeWidth={1} />
          ))}
          {niceTicks(domain, 5).map((tick) => (
            <SvgText key={`label-${tick}`} x={PAD.left - 6} y={y(tick) + 4} fontSize={11} fill={palette.inkMuted} textAnchor="end">
              {formatNumber(tick)}
            </SvgText>
          ))}

          {min !== null ? (
            <Line x1={PAD.left} x2={PAD.left + innerWidth} y1={y(min)} y2={y(min)} stroke={palette.ok} strokeWidth={1.5} strokeDasharray="5,4" />
          ) : null}
          {max !== null ? (
            <Line x1={PAD.left} x2={PAD.left + innerWidth} y1={y(max)} y2={y(max)} stroke={palette.ok} strokeWidth={1.5} strokeDasharray="5,4" />
          ) : null}

          {points.length > 1 ? (
            <Polyline
              points={points.map((p) => `${x(p.time)},${y(p.value)}`).join(' ')}
              fill="none"
              stroke={palette.water}
              strokeWidth={2}
              strokeLinejoin="round"
            />
          ) : null}
          {points.map((p) => (
            <Circle key={`${p.time}-${p.value}`} cx={x(p.time)} cy={y(p.value)} r={5} fill={POINT_COLOR[p.status]} stroke={palette.surface} strokeWidth={2} />
          ))}

          <SvgText x={PAD.left} y={HEIGHT - 8} fontSize={11} fill={palette.inkMuted} textAnchor="start">
            {formatShortDate(from)}
          </SvgText>
          <SvgText x={PAD.left + innerWidth} y={HEIGHT - 8} fontSize={11} fill={palette.inkMuted} textAnchor="end">
            {formatShortDate(to)}
          </SvgText>
        </Svg>
      ) : null}
    </View>
  );
}
