import webpush from 'web-push'
import { prisma } from '../lib/db'

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? ''
const VAPID_EMAIL = process.env.VAPID_EMAIL ?? 'mailto:admin@haumrau.app'

function setupVapid() {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

async function sendDueNotifications() {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return

  const now = new Date()
  const windowStart = new Date(now.getTime() - 5 * 60 * 1000)  // 5 min ago
  const windowEnd = new Date(now.getTime() + 5 * 60 * 1000)    // 5 min ahead
  const dayAhead = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const dayAheadStart = new Date(dayAhead.getTime() - 5 * 60 * 1000)
  const dayAheadEnd = new Date(dayAhead.getTime() + 5 * 60 * 1000)

  // Events where remindAt fires now, OR (no remindAt) scheduledAt is ~24h away
  const events = await prisma.event.findMany({
    where: {
      done: false,
      pushSentAt: null,
      OR: [
        { remindAt: { gte: windowStart, lte: windowEnd } },
        { remindAt: null, scheduledAt: { gte: dayAheadStart, lte: dayAheadEnd } },
      ],
    },
    include: {
      pet: {
        include: {
          household: {
            include: {
              members: {
                include: {
                  user: { include: { pushSubscriptions: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  for (const event of events) {
    const subscriptions = event.pet.household.members.flatMap(
      (m) => m.user.pushSubscriptions
    )

    const payload = JSON.stringify({
      title: `📅 ${event.pet.name}: ${event.title}`,
      body: `Zaplanowane na ${event.scheduledAt.toLocaleDateString('pl-PL', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })}`,
      url: `/pets/${event.petId}/health`,
    })

    const sends = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      } catch (err: unknown) {
        // Remove stale subscriptions (410 Gone)
        if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => {})
        }
      }
    })

    await Promise.allSettled(sends)
    await prisma.event.update({ where: { id: event.id }, data: { pushSentAt: now } })
  }
}

export function startPushScheduler() {
  setupVapid()
  // Run immediately, then every 5 minutes
  sendDueNotifications().catch(console.error)
  setInterval(() => sendDueNotifications().catch(console.error), 5 * 60 * 1000)
}
