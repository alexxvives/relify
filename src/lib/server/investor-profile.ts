import { investorProfileIsComplete } from "@/lib/investor-profile-complete";
import { createHash } from "node:crypto";
import type {
  InvestorProfileDraft,
  PublicInvestorCard,
} from "@/lib/demo-profile";
import { demoInvestorProfile, publicCardFromDraft } from "@/lib/demo-profile";
import { gazeAvatarUrl, uploadedInvestorPhoto } from "@/lib/gaze-avatar";
import {
  investorPhotoSchema,
  type InvestorProfileInput,
} from "@/lib/investor-profile";
import type { CurrentUser } from "@/lib/server/get-current-user";
import { prisma } from "@/lib/db";

export function investorGazeAvatar(userId: string): string {
  const seed = createHash("sha256")
    .update(`Relify-investor:${userId}`)
    .digest("hex")
    .slice(0, 16);
  return gazeAvatarUrl(seed);
}

const emptyDraft: InvestorProfileDraft = {
  photo: "",
  city: "",
  province: "",
  investorType: "",
  ticket: "",
  sectors: "",
  thesis: "",
  contribution: "",
  stake: "",
};

function draftFromRow(row: {
  photoPath: string;
  city: string;
  province: string;
  investorType: string;
  ticket: string;
  sectors: string;
  thesis: string;
  contribution: string;
  stake: string;
}): InvestorProfileDraft {
  return {
    photo: row.photoPath,
    city: row.city,
    province: row.province,
    investorType: row.investorType,
    ticket: row.ticket,
    sectors: row.sectors,
    thesis: row.thesis,
    contribution: row.contribution,
    stake: row.stake,
  };
}

export async function loadInvestorDraft(
  userId: string,
  email: string,
): Promise<InvestorProfileDraft> {
  const row = await prisma.investorProfile.findUnique({
    where: { userId },
    select: {
      photoPath: true,
      city: true,
      province: true,
      investorType: true,
      ticket: true,
      sectors: true,
      thesis: true,
      contribution: true,
      stake: true,
    },
  });

  if (row) {
    return draftFromRow(row);
  }

  const demo = demoInvestorProfile(email);

  if (!demo) {
    return emptyDraft;
  }

  return {
    photo: demo.photo,
    city: demo.city,
    province: demo.province,
    investorType: demo.investorType,
    ticket: demo.ticket,
    sectors: demo.sectors,
    thesis: demo.thesis,
    contribution: demo.contribution,
    stake: demo.stake,
  };
}

export async function publicCardsByInvestor(
  people: readonly { id: string; email: string }[],
): Promise<Map<string, PublicInvestorCard | null>> {
  const cards = new Map<string, PublicInvestorCard | null>();

  if (people.length === 0) {
    return cards;
  }

  const rows = await prisma.investorProfile.findMany({
    where: { userId: { in: people.map((person) => person.id) } },
    select: {
      userId: true,
      photoPath: true,
      city: true,
      province: true,
      investorType: true,
      ticket: true,
      sectors: true,
      thesis: true,
      contribution: true,
      stake: true,
    },
  });
  const byId = new Map(rows.map((row) => [row.userId, row]));

  for (const person of people) {
    const row = byId.get(person.id);
    const draft = row ? draftFromRow(row) : demoInvestorProfile(person.email);
    const card = draft ? publicCardFromDraft(draft) : null;
    const stored = uploadedInvestorPhoto(card?.photo.trim() ?? "");
    cards.set(
      person.id,
      card
        ? {
            ...card,
            photo: stored.length > 0 ? stored : investorGazeAvatar(person.id),
          }
        : null,
    );
  }

  return cards;
}

export async function saveInvestorPhoto(
  user: CurrentUser,
  photo: string,
): Promise<{ ok: true } | { ok: false }> {
  if (
    user.role !== "investor" ||
    !user.onboarded ||
    !investorPhotoSchema.safeParse(photo).success
  ) {
    return { ok: false };
  }

  await prisma.investorProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, photoPath: photo },
    update: { photoPath: photo },
  });

  return { ok: true };
}

export async function saveInvestorProfile(
  user: CurrentUser,
  input: InvestorProfileInput,
): Promise<{ ok: true } | { ok: false }> {
  if (user.role !== "investor" || !user.onboarded) {
    return { ok: false };
  }

  await prisma.investorProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      photoPath: input.photo,
      city: input.city,
      province: input.province,
      investorType: input.investorType,
      ticket: input.ticket,
      sectors: input.sectors,
      thesis: input.thesis,
      contribution: input.contribution,
      stake: input.stake,
    },
    update: {
      photoPath: input.photo,
      city: input.city,
      province: input.province,
      investorType: input.investorType,
      ticket: input.ticket,
      sectors: input.sectors,
      thesis: input.thesis,
      contribution: input.contribution,
      stake: input.stake,
    },
  });

  return { ok: true };
}

export async function buyerProfileComplete(
  userId: string,
  email: string,
): Promise<boolean> {
  return investorProfileIsComplete(await loadInvestorDraft(userId, email));
}
