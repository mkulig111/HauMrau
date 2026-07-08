import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { prisma } from '../lib/db'

const router = Router()

router.get('/vapid-key', (_req: Request, res: Response) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY ?? '' })
})

router.post('/subscribe', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id
  const { endpoint, keys } = req.body as {
    endpoint: string
    keys: { p256dh: string; auth: string }
  }

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    res.status(400).json({ error: 'Invalid subscription' })
    return
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { userId, p256dh: keys.p256dh, auth: keys.auth },
    create: { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
  })

  res.status(201).json({ ok: true })
})

router.delete('/subscribe', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id
  const { endpoint } = req.body as { endpoint: string }

  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId } })
  res.json({ ok: true })
})

export default router
