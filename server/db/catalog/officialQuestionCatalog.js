const privateCatalogPath = '../../private-question-seeds/officialQuestionCatalog.js'

export async function loadOfficialQuestionSets() {
  try {
    const catalog = await import(privateCatalogPath)
    if (!Array.isArray(catalog.officialQuestionSets)) {
      throw new Error('officialQuestionSets export is missing or is not an array.')
    }
    return catalog.officialQuestionSets
  } catch (error) {
    if (error?.code === 'ERR_MODULE_NOT_FOUND' || error?.message?.includes(privateCatalogPath)) {
      throw new Error(
        'Private question seed catalog not found. Add server/private-question-seeds/officialQuestionCatalog.js locally before running npm run db:seed.'
      )
    }
    throw error
  }
}
