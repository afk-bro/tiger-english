import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Unit } from '../../lesson.types';

// Mock `../units` so each test controls the fixture order/status.
vi.mock('../units', () => ({
  units: [] as Unit[],
}));

// Minimal Unit factory — only the fields the helper reads.
const makeUnit = (overrides: Partial<Unit> & { slug: string }): Unit => ({
  number: 0,
  title: 'Test Unit',
  topic: '',
  grammarFocus: '',
  estimatedMinutes: 0,
  status: 'available',
  sections: [],
  translations: {},
  ...overrides,
});

const setUnits = async (units: Unit[]) => {
  const mod = await import('../units');
  (mod as { units: Unit[] }).units = units;
};

describe('getNextAvailableUnit', () => {
  beforeEach(async () => {
    await setUnits([]);
    vi.resetModules();
  });

  it('returns the next available unit', async () => {
    await setUnits([
      makeUnit({ slug: 'unit-1', status: 'available' }),
      makeUnit({ slug: 'unit-2', status: 'available' }),
    ]);
    const { getNextAvailableUnit } = await import('../getUnit');
    const next = getNextAvailableUnit('unit-1');
    expect(next?.slug).toBe('unit-2');
  });

  it('skips coming-soon units to find the next available', async () => {
    await setUnits([
      makeUnit({ slug: 'unit-1', status: 'available' }),
      makeUnit({ slug: 'unit-2', status: 'coming-soon' }),
      makeUnit({ slug: 'unit-3', status: 'available' }),
    ]);
    const { getNextAvailableUnit } = await import('../getUnit');
    const next = getNextAvailableUnit('unit-1');
    expect(next?.slug).toBe('unit-3');
  });

  it('returns undefined when current is the last available and rest are coming-soon', async () => {
    await setUnits([
      makeUnit({ slug: 'unit-1', status: 'available' }),
      makeUnit({ slug: 'unit-2', status: 'available' }),
      makeUnit({ slug: 'unit-3', status: 'coming-soon' }),
      makeUnit({ slug: 'unit-4', status: 'coming-soon' }),
    ]);
    const { getNextAvailableUnit } = await import('../getUnit');
    expect(getNextAvailableUnit('unit-2')).toBeUndefined();
  });

  it('returns undefined when the unit is the last in the array', async () => {
    await setUnits([makeUnit({ slug: 'unit-only', status: 'available' })]);
    const { getNextAvailableUnit } = await import('../getUnit');
    expect(getNextAvailableUnit('unit-only')).toBeUndefined();
  });

  it('returns undefined for unknown slug', async () => {
    await setUnits([makeUnit({ slug: 'unit-1' })]);
    const { getNextAvailableUnit } = await import('../getUnit');
    expect(getNextAvailableUnit('unit-99')).toBeUndefined();
  });

  it('returns undefined when units array is empty', async () => {
    await setUnits([]);
    const { getNextAvailableUnit } = await import('../getUnit');
    expect(getNextAvailableUnit('unit-1')).toBeUndefined();
  });
});
