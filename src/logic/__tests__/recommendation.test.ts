import { glues } from '@/data/glues';
import {
  conditionsForBlock,
  rankGlues,
  recommendForBlocks,
  scoreGlue,
  topRecommendations,
  VIABLE_THRESHOLD,
} from '@/logic/recommendation';
import { DailyForecast, WeatherConditions } from '@/types';

const find = (id: string) => {
  const g = glues.find((x) => x.id === id);
  if (!g) throw new Error(`fixture glue ${id} missing`);
  return g;
};

describe('scoreGlue', () => {
  it('gives a perfect-ish score inside the optimal window', () => {
    const ice = find('tequila-ice-blue'); // 55–80°F, 10–70% RH
    const c: WeatherConditions = { temperatureF: 65, humidity: 40, pressureHpa: 1015 };
    const s = scoreGlue(ice, c);
    expect(s.score).toBeGreaterThanOrEqual(95);
    expect(s.warnings).toHaveLength(0);
  });

  it('warns and scores low when far too cold for a hot glue', () => {
    const hot = find('plain-jane-gold-rush'); // 88–115°F
    const c: WeatherConditions = { temperatureF: 35, humidity: 30, pressureHpa: 1015 };
    const s = scoreGlue(hot, c);
    expect(s.score).toBeLessThan(VIABLE_THRESHOLD);
    expect(s.warnings.some((w) => w.toLowerCase().includes('cooler'))).toBe(true);
  });

  it('flags high humidity as a warning', () => {
    const dry = find('plain-jane-gold-rush'); // humidity 0–40%
    const c: WeatherConditions = { temperatureF: 95, humidity: 90, pressureHpa: 1010 };
    const s = scoreGlue(dry, c);
    expect(s.warnings.some((w) => w.includes('Humidity'))).toBe(true);
  });
});

describe('rankGlues / topRecommendations', () => {
  it('ranks a cold-weather glue first on a cold day', () => {
    const c: WeatherConditions = { temperatureF: 38, humidity: 45, pressureHpa: 1012 };
    const ranked = rankGlues(c);
    expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
    const top = topRecommendations(c, 3);
    expect(top.length).toBeGreaterThan(0);
    expect(top.length).toBeLessThanOrEqual(3);
    // The desert-heat stick must not win a 38°F day.
    expect(top[0].glue.id).not.toBe('plain-jane-gold-rush');
  });

  it('returns at least one pick even with no strong match', () => {
    const extreme: WeatherConditions = {
      temperatureF: 200,
      humidity: 50,
      pressureHpa: 1013,
    };
    expect(topRecommendations(extreme).length).toBe(1);
  });
});

describe('time blocks', () => {
  const forecast: DailyForecast = {
    location: { latitude: 0, longitude: 0 },
    date: '2026-05-27',
    source: 'forecast',
    hourly: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      temperatureF: hour < 12 ? 60 : 95, // cool morning, hot afternoon
      humidity: 50,
      pressureHpa: 1013,
    })),
  };

  it('averages conditions within a block', () => {
    const morning = conditionsForBlock(forecast, {
      id: 'morning',
      label: 'Morning',
      startHour: 5,
      endHour: 11,
    });
    expect(morning?.temperatureF).toBe(60);
  });

  it('recommends different glues for cool morning vs hot afternoon', () => {
    const blocks = recommendForBlocks(forecast);
    const morning = blocks.find((b) => b.block.id === 'morning');
    const afternoon = blocks.find((b) => b.block.id === 'afternoon');
    expect(morning?.ranked[0].glue.id).not.toBe(afternoon?.ranked[0].glue.id);
  });
});
