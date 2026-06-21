export const MILLION_LADDER_PRIZES = [
  100,
  200,
  300,
  500,
  1_000,
  2_000,
  4_000,
  8_000,
  16_000,
  32_000,
  64_000,
  125_000,
  250_000,
  500_000,
  1_000_000,
]

export const formatPrize = (value) => `$${value.toLocaleString('en-US')}`

export function guaranteedPrize(reachedIndex) {
  if (reachedIndex >= 9) return 32_000
  if (reachedIndex >= 4) return 1_000
  return 0
}
