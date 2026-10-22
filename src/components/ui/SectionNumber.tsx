"use client";

import React from "react";

interface SectionNumberProps {
  number: string;
  label?: string;
  className?: string;
}

export default function SectionNumber({
  number,
  label,
  className = "",
}: SectionNumberProps) {
  return (
    <span className={`section-number ${className}`} aria-hidden="true">
      {number}
      {label && <> · {label}</>}
    </span>
  );
}
