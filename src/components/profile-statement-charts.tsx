"use client";

import { FinanceCharts, GroupedYearBars } from "@/components/seller-finance-charts";
import { balanceLabels, companyCopy, incomeLabels } from "@/lib/company-copy";
import type { InvestorProjectProfile } from "@/lib/investor-project";
import { compactEur } from "@/lib/report-format";

const costKeys = ["supplies", "staffCosts", "otherOperatingCosts", "amortization"] as const;

export function ProfileIncomeChart({
  years,
  rows,
}: {
  years: InvestorProjectProfile["incomeYears"];
  rows: InvestorProjectProfile["incomeRows"];
}) {
  const sales = rows.find((row) => row.key === "sales");
  const ebitda = rows.find((row) => row.key === "ebitda");

  if (!sales || years.length === 0 || sales.values.every((value) => value === null)) {
    return null;
  }

  const points = years.map((year, index) => {
    const salesCents = sales.values[index] ?? null;
    const ebitdaCents = ebitda?.values[index] ?? null;
    return {
      year: year.year,
      forecast: year.forecast,
      salesCents,
      ebitdaCents,
      salesLabel: salesCents === null ? "—" : compactEur(salesCents),
      ebitdaLabel: ebitdaCents === null ? null : compactEur(ebitdaCents),
    };
  });
  const costYears = years.flatMap((year, index) => {
    if (year.forecast) {
      return [];
    }

    const slices = costKeys.flatMap((key) => {
      const cents = rows.find((row) => row.key === key)?.values[index] ?? null;
      if (cents === null || cents === 0) {
        return [];
      }

      const amount = Math.abs(cents);
      return [{ label: incomeLabels[key], cents: amount, amountLabel: compactEur(amount) }];
    });

    return slices.length === 0 ? [] : [{ year: year.year, slices }];
  });

  return <FinanceCharts points={points} mixes={[]} costYears={costYears} />;
}

export function ProfileBalanceChart({
  years,
  rows,
}: {
  years: InvestorProjectProfile["balanceYears"];
  rows: InvestorProjectProfile["balanceRows"];
}) {
  const assets = (
    [
      { key: "currentAssets", color: "#465ab4" },
      { key: "nonCurrentAssets", color: "#8aa0e0" },
    ] as const
  ).map((item) => ({
    label: balanceLabels[item.key],
    color: item.color,
    values: rows.find((row) => row.key === item.key)?.values ?? [],
  }));
  const funding = (
    [
      { key: "equity", color: "#17663a" },
      { key: "currentLiabilities", color: "#e07a3d" },
      { key: "nonCurrentLiabilities", color: "#7c5cbf" },
    ] as const
  ).map((item) => ({
    label: balanceLabels[item.key],
    color: item.color,
    values: rows.find((row) => row.key === item.key)?.values ?? [],
  }));

  return (
    <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
      <GroupedYearBars title={companyCopy.balanceAssetsChart} years={years} series={assets} paired />
      <GroupedYearBars title={companyCopy.balanceFundingChart} years={years} series={funding} paired />
    </div>
  );
}
