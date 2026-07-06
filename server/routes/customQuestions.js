import express from 'express'
import { formFromQuestion } from '../../shared/customQuestionSchemas.js'
import { resolveAccessFromToken } from '../auth/access.js'
import {
  contentOptionsForGame,
  createUserPack,
  deleteUserPack,
  deleteUserQuestion,
  getUserPackWithQuestions,
  isSupportedGame,
  listUserPacks,
  saveContentPreference,
  updateUserPack,
  upsertUserQuestion,
} from '../db/questions/customPacks.js'

export const customQuestionsRouter = express.Router()

function sendResult(response, result) {
  if (!result?.ok) {
    response.status(result?.status || 400).json({
      ok: false,
      error: result?.error || 'Something went wrong.',
      errors: result?.errors || undefined,
      warnings: result?.warnings || undefined,
    })
    return
  }
  response.json({ ok: true, ...result })
}

function withQuestionForms(pack) {
  return {
    ...pack,
    questions: (pack.questions || []).map((question) => ({
      ...question,
      form: formFromQuestion(question),
    })),
  }
}

async function requireCustomQuestionAccess(request, response, next) {
  try {
    const access = await resolveAccessFromToken(request.headers.authorization)
    if (!access.clerkUserId || !access.userId) {
      response.status(401).json({ ok: false, error: 'Sign in to manage custom packs.' })
      return
    }
    if (!access.featureKeys?.includes('custom_questions')) {
      response.status(403).json({
        ok: false,
        code: 'purchase_required',
        error: 'Purchase a plan with custom questions to manage packs.',
      })
      return
    }
    request.access = access
    next()
  } catch (error) {
    next(error)
  }
}

customQuestionsRouter.use(requireCustomQuestionAccess)

customQuestionsRouter.get('/question-packs', async (request, response, next) => {
  try {
    const gameType = request.query.gameType ? String(request.query.gameType) : null
    if (gameType && !isSupportedGame(gameType)) {
      response.status(400).json({ ok: false, error: 'Choose a supported game.' })
      return
    }
    const packs = await listUserPacks(request.access, gameType)
    response.json({ ok: true, packs })
  } catch (error) {
    next(error)
  }
})

customQuestionsRouter.post('/question-packs', async (request, response, next) => {
  try {
    sendResult(response, await createUserPack(request.access, request.body))
  } catch (error) {
    next(error)
  }
})

customQuestionsRouter.get('/question-packs/:packId', async (request, response, next) => {
  try {
    const pack = await getUserPackWithQuestions(request.access, request.params.packId)
    if (!pack) {
      response.status(404).json({ ok: false, error: 'Pack not found.' })
      return
    }
    response.json({ ok: true, pack: withQuestionForms(pack) })
  } catch (error) {
    next(error)
  }
})

customQuestionsRouter.patch('/question-packs/:packId', async (request, response, next) => {
  try {
    sendResult(response, await updateUserPack(request.access, request.params.packId, request.body))
  } catch (error) {
    next(error)
  }
})

customQuestionsRouter.delete('/question-packs/:packId', async (request, response, next) => {
  try {
    sendResult(response, await deleteUserPack(request.access, request.params.packId))
  } catch (error) {
    next(error)
  }
})

customQuestionsRouter.post('/question-packs/:packId/questions', async (request, response, next) => {
  try {
    sendResult(response, await upsertUserQuestion(request.access, request.params.packId, request.body))
  } catch (error) {
    next(error)
  }
})

customQuestionsRouter.patch('/question-packs/:packId/questions/:questionId', async (request, response, next) => {
  try {
    sendResult(
      response,
      await upsertUserQuestion(
        request.access,
        request.params.packId,
        request.body,
        request.params.questionId,
      ),
    )
  } catch (error) {
    next(error)
  }
})

customQuestionsRouter.delete('/question-packs/:packId/questions/:questionId', async (request, response, next) => {
  try {
    sendResult(
      response,
      await deleteUserQuestion(request.access, request.params.packId, request.params.questionId),
    )
  } catch (error) {
    next(error)
  }
})

customQuestionsRouter.get('/content-options', async (request, response, next) => {
  try {
    const gameType = String(request.query.gameType || '')
    const options = await contentOptionsForGame(request.access, gameType)
    if (!options) {
      response.status(400).json({ ok: false, error: 'Choose a supported game.' })
      return
    }
    response.json({ ok: true, options })
  } catch (error) {
    next(error)
  }
})

customQuestionsRouter.get('/content-preferences/:gameType', async (request, response, next) => {
  try {
    const options = await contentOptionsForGame(request.access, request.params.gameType)
    if (!options) {
      response.status(400).json({ ok: false, error: 'Choose a supported game.' })
      return
    }
    response.json({ ok: true, preference: options.preference, options })
  } catch (error) {
    next(error)
  }
})

customQuestionsRouter.put('/content-preferences/:gameType', async (request, response, next) => {
  try {
    sendResult(
      response,
      await saveContentPreference(request.access, request.params.gameType, request.body),
    )
  } catch (error) {
    next(error)
  }
})
