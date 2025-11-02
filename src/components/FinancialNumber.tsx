import React from "react";

interface FinancialNumberProps {
  value: number | null;
  showNumbers: boolean;
  formatValue?: (value: number) => string;
}

export const FinancialNumber = ({
  value,
  showNumbers,
  formatValue = (val) => `${(Number(val) * 100).toFixed(2)}%`,
}: FinancialNumberProps) => {
  if (value === null) return null;

  return <>{showNumbers ? formatValue(value) : "******"}</>;
};
