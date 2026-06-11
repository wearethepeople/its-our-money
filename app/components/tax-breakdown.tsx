import { Fragment, useState, type ReactNode } from "react";
import { cn } from "@/utils/misc.tsx";
import { PUBLIC_DOMAIN_SCHEME, type ViewSchemeId } from "@/constants/grouping-schemes.ts";
import { Card } from "#app/components/ui/card.tsx";
import { formatCurrency } from "@/utils/numbers.ts";
import { DeltaCurrencyBadge, type PairedItem } from "@/components/comparison.tsx";

export function TaxBreakdown({
  pairedData,
  netInterestBps,
  viewScheme,
  subject = "you",
  stickyHeaderClassName,
  extraControls,
  belowTable,
}: {
  /** Items in the order rows should render. */
  pairedData: PairedItem[];
  netInterestBps: number;
  viewScheme: ViewSchemeId;
  subject?: "you" | "they";
  stickyHeaderClassName?: string;
  /** Renders next to the tax input; receives a setter for the amount. */
  extraControls?: (setTaxAmount: (amount: number | "") => void) => ReactNode;
  /** Renders beneath the table once an amount is entered. */
  belowTable?: ReactNode;
}) {
  const [taxAmount, setTaxAmount] = useState<number | "">("");

  const netInterestFraction = netInterestBps / 10000;
  const allocatableFraction = 1 - netInterestFraction;

  return (
    <div className="mt-6">
      <Card className="py-3 px-4">
        <p>
          Enter your total federal tax payment to see how the government spent it versus how{" "}
          {subject} would have.
        </p>
        <p className="text-ink-faint">
          The figure you enter here is used only for this in-page calculation and is never stored or
          transmitted. No personal financial information is collected or retained — the math happens
          entirely in your browser.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="tax-amount" className="text-sm font-medium text-ink-muted">
            Federal taxes paid:
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-sm text-ink-muted">$</span>
            <input
              id="tax-amount"
              type="number"
              min="0"
              className="w-36 rounded border border-line-2 py-1.5 pr-3 pl-7 text-sm font-mono"
              value={taxAmount}
              onChange={(e) => setTaxAmount(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="0"
            />
          </div>
          {extraControls?.(setTaxAmount)}
        </div>
      </Card>
      {taxAmount !== "" && taxAmount > 0 && (
        <>
          <table className="mt-4 w-full text-sm">
            <thead className={cn("bg-background", stickyHeaderClassName)}>
              <tr className="border-b border-ink">
                <th className="pb-2 text-left tax-breakdown-header">Budget Function</th>
                <th className="pb-2 text-right tax-breakdown-header">
                  {subject === "you" ? "You" : "Theirs"}
                </th>
                <th className="pb-2 text-right tax-breakdown-header">Actual</th>
                <th className="pb-2 text-right tax-breakdown-header">Difference</th>
              </tr>
            </thead>
            <tbody>
              {viewScheme === "flat" ? (
                <>
                  {pairedData.map((item) => {
                    const yourDollars = Math.round(
                      (item.participantPercent / 100) * allocatableFraction * taxAmount,
                    );
                    const actualDollars = Math.round(
                      (item.budgetPercent / 100) * allocatableFraction * taxAmount,
                    );
                    const difference = yourDollars - actualDollars;
                    return (
                      <tr key={item.code} className="border-b border-b-line">
                        <td className="py-1.5">{item.category}</td>
                        <td className="py-1.5 text-right numeric text-you">
                          {formatCurrency(yourDollars)}
                        </td>
                        <td className="py-1.5 text-right numeric text-them">
                          {formatCurrency(actualDollars)}
                        </td>
                        <td className="py-1.5 text-right numeric">
                          <DeltaCurrencyBadge value={difference} />
                        </td>
                      </tr>
                    );
                  })}
                  {netInterestBps > 0 && (
                    <tr className="border-b border-b-line text-locked">
                      <td className="py-1.5">Net Interest (mandatory)</td>
                      <td className="py-1.5 text-right numeric text-you">
                        {formatCurrency(netInterestFraction * taxAmount)}
                      </td>
                      <td className="py-1.5 text-right numeric text-them">
                        {formatCurrency(netInterestFraction * taxAmount)}
                      </td>
                      <td className="py-1.5 text-right numeric">
                        <DeltaCurrencyBadge value={0} />
                      </td>
                    </tr>
                  )}
                </>
              ) : (
                <>
                  {PUBLIC_DOMAIN_SCHEME.groups.map((group) => {
                    const groupItems = pairedData.filter((item) =>
                      group.functionIds.includes(String(item.id)),
                    );
                    if (!groupItems.length) return null;
                    const groupYours = groupItems.reduce(
                      (sum, item) =>
                        sum +
                        Math.round(
                          (item.participantPercent / 100) * allocatableFraction * taxAmount,
                        ),
                      0,
                    );
                    const groupActual = groupItems.reduce(
                      (sum, item) =>
                        sum +
                        Math.round((item.budgetPercent / 100) * allocatableFraction * taxAmount),
                      0,
                    );
                    const groupDiff = groupYours - groupActual;
                    return (
                      <Fragment key={group.id}>
                        <tr>
                          <td
                            colSpan={4}
                            className="border-b border-ink-muted pt-4 pb-1 text-xs font-semibold tracking-wide uppercase"
                          >
                            {group.label}
                          </td>
                        </tr>
                        {groupItems.map((item) => {
                          const yourDollars = Math.round(
                            (item.participantPercent / 100) * allocatableFraction * taxAmount,
                          );
                          const actualDollars = Math.round(
                            (item.budgetPercent / 100) * allocatableFraction * taxAmount,
                          );
                          const difference = yourDollars - actualDollars;
                          return (
                            <tr key={item.code} className="border-b border-line">
                              <td className="py-1.5 pl-3">{item.category}</td>
                              <td className="py-1.5 text-right numeric text-you">
                                {formatCurrency(yourDollars)}
                              </td>
                              <td className="py-1.5 text-right numeric text-them">
                                {formatCurrency(actualDollars)}
                              </td>
                              <td className="py-1.5 text-right numeric">
                                <DeltaCurrencyBadge value={difference} />
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="border-b border-line">
                          <td className="py-1.5 pl-3 text-xs font-semibold">Subtotal</td>
                          <td className="py-1.5 text-right font-semibold numeric text-you">
                            {formatCurrency(groupYours)}
                          </td>
                          <td className="py-1.5 text-right font-semibold numeric text-them">
                            {formatCurrency(groupActual)}
                          </td>
                          <td className="py-1.5 text-right font-semibold numeric">
                            <DeltaCurrencyBadge value={groupDiff} />
                          </td>
                        </tr>
                      </Fragment>
                    );
                  })}
                  {netInterestBps > 0 && (
                    <tr className="border-b border-line text-locked">
                      <td className="py-1.5">Net Interest (mandatory)</td>
                      <td className="py-1.5 text-right text-you">
                        {formatCurrency(netInterestFraction * taxAmount)}
                      </td>
                      <td className="py-1.5 text-right text-them">
                        {formatCurrency(netInterestFraction * taxAmount)}
                      </td>
                      <td className="py-1.5 text-right">
                        <DeltaCurrencyBadge value={0} />
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t border-line font-semibold">
                <td className="pt-2">Total</td>
                <td className="pt-2 text-right numeric text-you">{formatCurrency(taxAmount)}</td>
                <td className="pt-2 text-right numeric text-them">{formatCurrency(taxAmount)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
          {belowTable}
        </>
      )}
    </div>
  );
}
