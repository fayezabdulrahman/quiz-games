export const sampleMillionLadderQuestions = Array.from({ length: 15 }, (_, rung) => ({
  id: `sample-million-ladder-${rung + 1}`,
  rung,
  type: 'choice',
  prompt: `Sample ladder rung ${rung + 1}: which answer is correct?`,
  options: ['Answer A', 'Answer B', 'Answer C', 'Answer D'],
  answer: 'Answer A',
  explanation: 'This is public sample content for fallback play.',
}))
