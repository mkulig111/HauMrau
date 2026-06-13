import { prisma } from '../lib/db';
import crypto from 'crypto';

export async function createHousehold(userId: string, name: string) {
  return prisma.$transaction(async (tx) => {
    const household = await tx.household.create({ data: { name } });
    await tx.householdMember.create({
      data: { householdId: household.id, userId, role: 'OWNER' },
    });
    return household;
  });
}

export async function getHousehold(userId: string) {
  const memberships = await prisma.householdMember.findMany({
    where: { userId },
    include: {
      household: {
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      },
    },
    orderBy: { joinedAt: 'asc' },
  });
  return memberships.map((m) => ({ ...m.household, role: m.role }));
}

export async function generateInviteCode(userId: string, householdId: string) {
  const membership = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId } },
  });
  if (!membership) throw new Error('Not a member of this household');

  const code = crypto.randomBytes(4).toString('hex').toUpperCase();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return prisma.householdInvite.create({
    data: { householdId, code, createdById: userId, expiresAt },
  });
}

export async function joinHousehold(userId: string, code: string) {
  const invite = await prisma.householdInvite.findUnique({ where: { code } });
  if (!invite) throw new Error('Invalid invite code');
  if (invite.usedAt) throw new Error('Invite code already used');
  if (invite.expiresAt < new Date()) throw new Error('Invite code expired');

  const existing = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId: invite.householdId, userId } },
  });
  if (existing) throw new Error('Already a member of this household');

  return prisma.$transaction(async (tx) => {
    await tx.householdMember.create({
      data: { householdId: invite.householdId, userId, role: 'MEMBER' },
    });
    await tx.householdInvite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    });
    return tx.household.findUniqueOrThrow({ where: { id: invite.householdId } });
  });
}

export async function leaveHousehold(userId: string, householdId: string) {
  const membership = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId } },
  });
  if (!membership) throw new Error('Not a member');
  if (membership.role === 'OWNER') {
    const otherMembers = await prisma.householdMember.count({
      where: { householdId, userId: { not: userId } },
    });
    if (otherMembers > 0) throw new Error('Transfer ownership before leaving');
  }
  await prisma.householdMember.delete({
    where: { householdId_userId: { householdId, userId } },
  });
}
