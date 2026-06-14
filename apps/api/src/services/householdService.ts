import crypto from 'crypto';
import { prisma } from '../lib/db';

export async function getHousehold(userId: string) {
  const memberships = await prisma.householdMember.findMany({
    where: { userId },
    include: { household: { include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } } } },
  });
  return memberships.map((m: typeof memberships[number]) => ({ ...m.household, role: m.role }));
}

export async function generateInviteCode(userId: string, householdId: string) {
  const membership = await prisma.householdMember.findUnique({ where: { householdId_userId: { householdId, userId } } });
  if (!membership) throw new Error('Not a member');
  const code = crypto.randomBytes(4).toString('hex').toUpperCase();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return prisma.householdInvite.create({ data: { householdId, code, createdById: userId, expiresAt } });
}

export async function joinHousehold(userId: string, code: string) {
  const invite = await prisma.householdInvite.findUnique({ where: { code } });
  if (!invite) throw new Error('Invalid invite code');
  if (invite.usedAt) throw new Error('Invite already used');
  if (invite.expiresAt < new Date()) throw new Error('Invite expired');
  const existing = await prisma.householdMember.findUnique({ where: { householdId_userId: { householdId: invite.householdId, userId } } });
  if (existing) throw new Error('Already a member');
  return prisma.$transaction(async (tx: typeof prisma) => {
    await tx.householdInvite.update({ where: { id: invite.id }, data: { usedAt: new Date() } });
    return tx.householdMember.create({ data: { householdId: invite.householdId, userId, role: 'MEMBER' } });
  });
}

export async function leaveHousehold(userId: string, householdId: string) {
  const membership = await prisma.householdMember.findUnique({ where: { householdId_userId: { householdId, userId } } });
  if (!membership) throw new Error('Not a member');
  if (membership.role === 'OWNER') {
    const count = await prisma.householdMember.count({ where: { householdId } });
    if (count > 1) throw new Error('Owner cannot leave while other members exist');
  }
  await prisma.householdMember.delete({ where: { householdId_userId: { householdId, userId } } });
}
