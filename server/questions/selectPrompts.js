export function selectPrompts(pool, count, usedQuestionIds = new Set()) {
  const unused = pool.filter((prompt) => !usedQuestionIds.has(prompt.id))
  const shuffledUnused = [...unused].sort(() => Math.random() - 0.5)
  const selected = shuffledUnused.slice(0, count)

  if (selected.length < count) {
    const selectedIds = new Set(selected.map((prompt) => prompt.id))
    const recycled = pool
      .filter((prompt) => !selectedIds.has(prompt.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, count - selected.length)
    selected.push(...recycled)
  }

  selected.forEach((prompt) => {
    usedQuestionIds.add(prompt.id)
  })
  return structuredClone(selected)
}
