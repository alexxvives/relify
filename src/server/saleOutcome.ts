import { formatEur, formatWholeEur } from "@/lib/money";
import { shortNickname } from "@/lib/nickname";
import { personName } from "@/lib/project-message";
import { prisma } from "@/server/db";

export type SaleSummary = {
  codename: string;
  price: string;
  fee: string;
  feeNote: string;
  date: string;
  contractHref: string | null;
  ndaHref: string | null;
  loiHref: string | null;
  buyer: string;
  daysToClose: number;
  listedOn: string;
  interested: number;
};

function closingDate(date: Date): string {
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Madrid" });
}

/** Closed sale for the seller's active company, or null while it is still on the market. */
export async function sellerSaleSummary(ownerId: string, projectId: string | null): Promise<SaleSummary | null> {
  if (!projectId) return null;
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId },
    select: { codename: true, successFee: true, createdAt: true, verifiedAt: true, _count: { select: { accesses: true } } },
  });
  if (!project?.successFee) return null;
  const contract = await prisma.saleContract.findFirst({
    where: { status: "signed", access: { projectId } },
    orderBy: { sellerSignedAt: "desc" },
    select: { id: true, accessId: true, access: { select: { investor: { select: { name: true, lastName: true } } } } },
  });
  const fee = project.successFee;
  const listed = project.verifiedAt ?? project.createdAt;
  const buyer = contract ? personName(contract.access.investor.name, contract.access.investor.lastName) : "";
  return {
    codename: shortNickname(project.codename),
    price: formatWholeEur(fee.closedPriceCents),
    fee: formatEur(fee.sellerNetCents + fee.sellerVatCents),
    feeNote: `${formatEur(fee.sellerNetCents)} + IVA`,
    date: closingDate(fee.recordedAt),
    contractHref: contract ? `/acuerdos/contrato/${contract.id}?firmado=1` : null,
    ndaHref: contract ? `/acuerdos/nda/${contract.accessId}` : null,
    loiHref: contract ? `/acuerdos/loi/${contract.accessId}` : null,
    buyer: buyer.length > 0 ? buyer : "Comprador verificado",
    daysToClose: Math.max(1, Math.round((fee.recordedAt.getTime() - listed.getTime()) / 86_400_000)),
    listedOn: closingDate(listed),
    interested: project._count.accesses,
  };
}

export type BuyerClosed = { won: boolean; price: string; fee: string; feeNote: string; date: string };

export function buyerClosed(
  fee: { closedPriceCents: number; buyerNetCents: number; buyerVatCents: number; recordedAt: Date } | null,
  won: boolean,
): BuyerClosed | null {
  if (!fee) return null;
  return {
    won,
    price: formatWholeEur(fee.closedPriceCents),
    fee: formatEur(fee.buyerNetCents + fee.buyerVatCents),
    feeNote: `${formatEur(fee.buyerNetCents)} + IVA`,
    date: closingDate(fee.recordedAt),
  };
}

export type PurchaseSummary = {
  codename: string;
  slug: string;
  price: string;
  fee: string;
  feeNote: string;
  date: string;
  seller: string;
  daysToClose: number;
  requestedOn: string;
  contractHref: string;
  ndaHref: string;
  loiHref: string;
};

/** The investor's most recent completed purchase (signed contract on a project with a recorded success fee). */
export async function buyerPurchaseSummary(investorId: string): Promise<PurchaseSummary | null> {
  const contract = await prisma.saleContract.findFirst({
    where: { status: "signed", access: { investorId, project: { successFee: { isNot: null } } } },
    orderBy: { sellerSignedAt: "desc" },
    select: {
      id: true,
      accessId: true,
      access: {
        select: {
          requestedAt: true,
          project: {
            select: {
              codename: true,
              slug: true,
              successFee: true,
              owner: { select: { name: true, lastName: true } },
            },
          },
        },
      },
    },
  });
  const project = contract?.access.project;
  const fee = project?.successFee;
  if (!contract || !project || !fee) return null;
  const seller = project.owner ? personName(project.owner.name, project.owner.lastName) : "";
  return {
    codename: shortNickname(project.codename),
    slug: project.slug,
    price: formatWholeEur(fee.closedPriceCents),
    fee: formatEur(fee.buyerNetCents + fee.buyerVatCents),
    feeNote: `${formatEur(fee.buyerNetCents)} + IVA`,
    date: closingDate(fee.recordedAt),
    seller: seller.length > 0 ? seller : "Vendedor verificado",
    daysToClose: Math.max(1, Math.round((fee.recordedAt.getTime() - contract.access.requestedAt.getTime()) / 86_400_000)),
    requestedOn: closingDate(contract.access.requestedAt),
    contractHref: `/acuerdos/contrato/${contract.id}?firmado=1`,
    ndaHref: `/acuerdos/nda/${contract.accessId}`,
    loiHref: `/acuerdos/loi/${contract.accessId}`,
  };
}

export async function hasCompletedPurchase(investorId: string): Promise<boolean> {
  const found = await prisma.saleContract.findFirst({
    where: { status: "signed", access: { investorId, project: { successFee: { isNot: null } } } },
    select: { id: true },
  });
  return found !== null;
}
