import { prisma } from '../lib/db';

export type PetEvent = Awaited<ReturnType<typeof prisma.event.findFirstOrThrow>>;

export interface CreateEventData {
  type: string;
  title: string;
  scheduledAt: Date;
  location?: string;
  notes?: string;
  remindAt?: Date;
}

export interface UpdateEventData {
  type?: string;
  title?: string;
  scheduledAt?: Date;
  location?: string;
  notes?: string;
  done?: boolean;
  remindAt?: Date;
}

export interface ListEventsOptions {
  upcoming?: boolean;
  limit?: number;
}

export async function listEvents(petId: string, options: ListEventsOptions = {}): Promise<PetEvent[]> {
  const { upcoming = false, limit = 50 } = options;

  return prisma.event.findMany({
    where: {
      petId,
      ...(upcoming ? { scheduledAt: { gte: new Date() }, done: false } : {}),
    },
    orderBy: { scheduledAt: 'asc' },
    take: limit,
  });
}

export async function createEvent(petId: string, data: CreateEventData): Promise<PetEvent> {
  return prisma.event.create({
    data: {
      petId,
      ...data,
    },
  });
}

export async function updateEvent(eventId: string, petId: string, data: UpdateEventData): Promise<PetEvent | null> {
  const event = await prisma.event.findFirst({ where: { id: eventId, petId } });
  if (!event) return null;

  return prisma.event.update({
    where: { id: eventId },
    data,
  });
}

export async function deleteEvent(eventId: string, petId: string): Promise<boolean> {
  const event = await prisma.event.findFirst({ where: { id: eventId, petId } });
  if (!event) return false;

  await prisma.event.delete({ where: { id: eventId } });
  return true;
}

export async function getUpcomingReminders(): Promise<PetEvent[]> {
  const now = new Date();
  const inFifteenMinutes = new Date(now.getTime() + 15 * 60 * 1000);

  return prisma.event.findMany({
    where: {
      done: false,
      remindAt: {
        gte: now,
        lte: inFifteenMinutes,
      },
    },
  });
}
