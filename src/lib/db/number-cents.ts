import type { PrismaClient } from "@/generated/prisma/client";

/**
 * Money columns are BIGINT in Postgres (t60: no more 21,4 M€ ceiling) but the app works in JS numbers.
 * Every read converts them back to number; euro cents stay far below Number.MAX_SAFE_INTEGER.
 * Writes accept numbers as they are.
 */
function toNumber(value: bigint): number;
function toNumber(value: bigint | null): number | null;
function toNumber(value: bigint | null): number | null {
  return value === null ? null : Number(value);
}

export function withNumberCents(client: PrismaClient) {
  return client.$extends({
    result: {
      project: {
        shareCapitalCents: {
          needs: { shareCapitalCents: true },
          compute: (row) => toNumber(row.shareCapitalCents),
        },
        revenueCents: {
          needs: { revenueCents: true },
          compute: (row) => toNumber(row.revenueCents),
        },
        ebitdaCents: {
          needs: { ebitdaCents: true },
          compute: (row) => toNumber(row.ebitdaCents),
        },
        adjustedEbitdaCents: {
          needs: { adjustedEbitdaCents: true },
          compute: (row) => toNumber(row.adjustedEbitdaCents),
        },
        askingPriceCents: {
          needs: { askingPriceCents: true },
          compute: (row) => toNumber(row.askingPriceCents),
        },
        netIncomeCents: {
          needs: { netIncomeCents: true },
          compute: (row) => toNumber(row.netIncomeCents),
        },
        opexCents: {
          needs: { opexCents: true },
          compute: (row) => toNumber(row.opexCents),
        },
        rentMonthlyCents: {
          needs: { rentMonthlyCents: true },
          compute: (row) => toNumber(row.rentMonthlyCents),
        },
      },
      projectYear: {
        intangibleAssetsCents: {
          needs: { intangibleAssetsCents: true },
          compute: (row) => toNumber(row.intangibleAssetsCents),
        },
        tangibleAssetsCents: {
          needs: { tangibleAssetsCents: true },
          compute: (row) => toNumber(row.tangibleAssetsCents),
        },
        otherFixedAssetsCents: {
          needs: { otherFixedAssetsCents: true },
          compute: (row) => toNumber(row.otherFixedAssetsCents),
        },
        otherCurrentAssetsCents: {
          needs: { otherCurrentAssetsCents: true },
          compute: (row) => toNumber(row.otherCurrentAssetsCents),
        },
        totalAssetsCents: {
          needs: { totalAssetsCents: true },
          compute: (row) => toNumber(row.totalAssetsCents),
        },
        subscribedCapitalCents: {
          needs: { subscribedCapitalCents: true },
          compute: (row) => toNumber(row.subscribedCapitalCents),
        },
        otherEquityCents: {
          needs: { otherEquityCents: true },
          compute: (row) => toNumber(row.otherEquityCents),
        },
        provisionsCents: {
          needs: { provisionsCents: true },
          compute: (row) => toNumber(row.provisionsCents),
        },
        otherNonCurrentLiabilitiesCents: {
          needs: { otherNonCurrentLiabilitiesCents: true },
          compute: (row) => toNumber(row.otherNonCurrentLiabilitiesCents),
        },
        otherCurrentLiabilitiesCents: {
          needs: { otherCurrentLiabilitiesCents: true },
          compute: (row) => toNumber(row.otherCurrentLiabilitiesCents),
        },
        totalLiabilitiesAndEquityCents: {
          needs: { totalLiabilitiesAndEquityCents: true },
          compute: (row) => toNumber(row.totalLiabilitiesAndEquityCents),
        },
        workingCapitalCents: {
          needs: { workingCapitalCents: true },
          compute: (row) => toNumber(row.workingCapitalCents),
        },
        operatingRevenueCents: {
          needs: { operatingRevenueCents: true },
          compute: (row) => toNumber(row.operatingRevenueCents),
        },
        materialsConsumptionCents: {
          needs: { materialsConsumptionCents: true },
          compute: (row) => toNumber(row.materialsConsumptionCents),
        },
        materialsCents: {
          needs: { materialsCents: true },
          compute: (row) => toNumber(row.materialsCents),
        },
        grossResultCents: {
          needs: { grossResultCents: true },
          compute: (row) => toNumber(row.grossResultCents),
        },
        sabiOtherOperatingExpensesCents: {
          needs: { sabiOtherOperatingExpensesCents: true },
          compute: (row) => toNumber(row.sabiOtherOperatingExpensesCents),
        },
        otherOperatingItemsCents: {
          needs: { otherOperatingItemsCents: true },
          compute: (row) => toNumber(row.otherOperatingItemsCents),
        },
        operatingResultCents: {
          needs: { operatingResultCents: true },
          compute: (row) => toNumber(row.operatingResultCents),
        },
        ebitCents: {
          needs: { ebitCents: true },
          compute: (row) => toNumber(row.ebitCents),
        },
        ebitdaCents: {
          needs: { ebitdaCents: true },
          compute: (row) => toNumber(row.ebitdaCents),
        },
        financialIncomeCents: {
          needs: { financialIncomeCents: true },
          compute: (row) => toNumber(row.financialIncomeCents),
        },
        financialExpensesCents: {
          needs: { financialExpensesCents: true },
          compute: (row) => toNumber(row.financialExpensesCents),
        },
        interestExpensesCents: {
          needs: { interestExpensesCents: true },
          compute: (row) => toNumber(row.interestExpensesCents),
        },
        corporateTaxCents: {
          needs: { corporateTaxCents: true },
          compute: (row) => toNumber(row.corporateTaxCents),
        },
        ordinaryResultCents: {
          needs: { ordinaryResultCents: true },
          compute: (row) => toNumber(row.ordinaryResultCents),
        },
        extraordinaryIncomeCents: {
          needs: { extraordinaryIncomeCents: true },
          compute: (row) => toNumber(row.extraordinaryIncomeCents),
        },
        extraordinaryExpensesCents: {
          needs: { extraordinaryExpensesCents: true },
          compute: (row) => toNumber(row.extraordinaryExpensesCents),
        },
        extraordinaryResultCents: {
          needs: { extraordinaryResultCents: true },
          compute: (row) => toNumber(row.extraordinaryResultCents),
        },
        cashFlowCents: {
          needs: { cashFlowCents: true },
          compute: (row) => toNumber(row.cashFlowCents),
        },
        addedValueCents: {
          needs: { addedValueCents: true },
          compute: (row) => toNumber(row.addedValueCents),
        },
        salesCents: {
          needs: { salesCents: true },
          compute: (row) => toNumber(row.salesCents),
        },
        inventoryChangeCents: {
          needs: { inventoryChangeCents: true },
          compute: (row) => toNumber(row.inventoryChangeCents),
        },
        ownUseCents: {
          needs: { ownUseCents: true },
          compute: (row) => toNumber(row.ownUseCents),
        },
        suppliesCents: {
          needs: { suppliesCents: true },
          compute: (row) => toNumber(row.suppliesCents),
        },
        otherOperatingIncomeCents: {
          needs: { otherOperatingIncomeCents: true },
          compute: (row) => toNumber(row.otherOperatingIncomeCents),
        },
        staffCostsCents: {
          needs: { staffCostsCents: true },
          compute: (row) => toNumber(row.staffCostsCents),
        },
        otherOperatingCostsCents: {
          needs: { otherOperatingCostsCents: true },
          compute: (row) => toNumber(row.otherOperatingCostsCents),
        },
        grantIncomeCents: {
          needs: { grantIncomeCents: true },
          compute: (row) => toNumber(row.grantIncomeCents),
        },
        provisionSurplusCents: {
          needs: { provisionSurplusCents: true },
          compute: (row) => toNumber(row.provisionSurplusCents),
        },
        assetImpairmentCents: {
          needs: { assetImpairmentCents: true },
          compute: (row) => toNumber(row.assetImpairmentCents),
        },
        subsidiaryControlLossCents: {
          needs: { subsidiaryControlLossCents: true },
          compute: (row) => toNumber(row.subsidiaryControlLossCents),
        },
        negativeDifferenceCents: {
          needs: { negativeDifferenceCents: true },
          compute: (row) => toNumber(row.negativeDifferenceCents),
        },
        otherResultsCents: {
          needs: { otherResultsCents: true },
          compute: (row) => toNumber(row.otherResultsCents),
        },
        amortizationCents: {
          needs: { amortizationCents: true },
          compute: (row) => toNumber(row.amortizationCents),
        },
        currentAssetsCents: {
          needs: { currentAssetsCents: true },
          compute: (row) => toNumber(row.currentAssetsCents),
        },
        cashCents: {
          needs: { cashCents: true },
          compute: (row) => toNumber(row.cashCents),
        },
        nonCurrentAssetsCents: {
          needs: { nonCurrentAssetsCents: true },
          compute: (row) => toNumber(row.nonCurrentAssetsCents),
        },
        currentLiabilitiesCents: {
          needs: { currentLiabilitiesCents: true },
          compute: (row) => toNumber(row.currentLiabilitiesCents),
        },
        longTermDebtCents: {
          needs: { longTermDebtCents: true },
          compute: (row) => toNumber(row.longTermDebtCents),
        },
        nonCurrentLiabilitiesCents: {
          needs: { nonCurrentLiabilitiesCents: true },
          compute: (row) => toNumber(row.nonCurrentLiabilitiesCents),
        },
        shortTermDebtCents: {
          needs: { shortTermDebtCents: true },
          compute: (row) => toNumber(row.shortTermDebtCents),
        },
        equityCents: {
          needs: { equityCents: true },
          compute: (row) => toNumber(row.equityCents),
        },
        financialResultCents: {
          needs: { financialResultCents: true },
          compute: (row) => toNumber(row.financialResultCents),
        },
        profitBeforeTaxCents: {
          needs: { profitBeforeTaxCents: true },
          compute: (row) => toNumber(row.profitBeforeTaxCents),
        },
        netResultCents: {
          needs: { netResultCents: true },
          compute: (row) => toNumber(row.netResultCents),
        },
        inventoryCents: {
          needs: { inventoryCents: true },
          compute: (row) => toNumber(row.inventoryCents),
        },
        receivablesCents: {
          needs: { receivablesCents: true },
          compute: (row) => toNumber(row.receivablesCents),
        },
        suppliersCents: {
          needs: { suppliersCents: true },
          compute: (row) => toNumber(row.suppliersCents),
        },
      },
    },
  });
}

export type AppPrismaClient = ReturnType<typeof withNumberCents>;
