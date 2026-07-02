export const difficulties = [90, 80, 70, 60, 50, 40, 30, 20, 10, 1]

export const answer = (text, points, ...accepted) => ({
  text,
  points,
  accepted: [text, ...accepted],
})

export const wordRankMap = (entries) =>
  Object.fromEntries(entries.map(([word, rank]) => [word.toLowerCase(), rank]))
