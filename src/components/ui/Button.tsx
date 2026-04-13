"use client";

import React from "react";

interface ButtonProps {
  variant?: "primary" | "ghost" | "ghost-light";
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
  id?: string;
}

export default function Button({
  variant = "primary",
  children,
  href,
  onClick,
  className = "",
  type = "button",
  id,
}: ButtonProps) {
  const baseClass =
    variant === "primary"
      ? "btn-primary"
      : variant === "ghost-light"
        ? "btn-ghost-light"
        : "btn-ghost";

  if (href) {
    return (
      <a href={href} className={`${baseClass} ${className}`} id={id}>
        {children}
        {variant === "primary" && <span aria-hidden="true">↗</span>}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseClass} ${className}`}
      id={id}
    >
      {children}
      {variant === "primary" && <span aria-hidden="true">↗</span>}
    </button>
  );
}
