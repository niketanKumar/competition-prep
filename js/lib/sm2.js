// sm2.js — SM-2 Spaced Repetition Algorithm
// Based on SuperMemo SM-2 algorithm by Piotr Wozniak

/**
 * Quality ratings:
 * 0 = Blackout / Again (complete failure)
 * 1 = Again (incorrect but remembered on seeing answer)
 * 2 = Hard (incorrect but easy to recall once shown)
 * 3 = Hard (correct with significant difficulty)
 * 4 = Good (correct with some hesitation)
 * 5 = Easy (perfect recall)
 *
 * UI maps: Again=0, Hard=2, Good=4, Easy=5
 */

export function sm2(quality, repetitions, easeFactor, interval) {
  if (quality < 3) {
    // Failed — reset
    repetitions = 0;
    interval    = 1;
  } else {
    // Passed
    if (repetitions === 0)      interval = 1;
    else if (repetitions === 1) interval = 6;
    else                         interval = Math.round(interval * easeFactor);
    repetitions += 1;
  }

  // Update ease factor (clamped to minimum 1.3)
  easeFactor = Math.max(
    1.3,
    easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  );

  const nextReview = addDays(new Date(), interval);

  return { repetitions, easeFactor, interval, nextReview };
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Initialize a new card's SM-2 state */
export function initCardState() {
  return {
    repetitions: 0,
    easeFactor: 2.5,
    interval: 0,
    nextReview: new Date(),
  };
}

/** Check if a card is due for review today */
export function isDue(card) {
  if (!card.sm2) return true;
  return new Date(card.sm2.nextReview) <= new Date();
}

/** Sort cards putting due cards first */
export function sortByDue(cards) {
  return [...cards].sort((a, b) => {
    const aDate = a.sm2?.nextReview ? new Date(a.sm2.nextReview) : new Date(0);
    const bDate = b.sm2?.nextReview ? new Date(b.sm2.nextReview) : new Date(0);
    return aDate - bDate;
  });
}

/** Count how many cards are due today */
export function countDue(cards) {
  return cards.filter(isDue).length;
}

/** Quality values for the 4 UI buttons */
export const SR_QUALITY = {
  again: 0,
  hard:  2,
  good:  4,
  easy:  5,
};
