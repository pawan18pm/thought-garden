import { stageOf } from '../stages';

describe('stageOf', () => {
  it('seed at 0 waters', () => expect(stageOf({ waterCount: 0, bloomedAt: null })).toBe('seed'));
  it('watered at 1', () => expect(stageOf({ waterCount: 1, bloomedAt: null })).toBe('watered'));
  it('growing at 2 and 7', () => {
    expect(stageOf({ waterCount: 2, bloomedAt: null })).toBe('growing');
    expect(stageOf({ waterCount: 7, bloomedAt: null })).toBe('growing');
  });
  it('bloom when bloomedAt set', () =>
    expect(stageOf({ waterCount: 0, bloomedAt: '2026-11-19T10:00:00+05:30' })).toBe('bloom'));
});
