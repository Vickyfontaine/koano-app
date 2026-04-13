"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function PromiseSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <section
      id="promise-section"
      ref={ref}
      style={{
        background: "var(--white)",
        padding: "120px 32px",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <motion.blockquote
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as unknown as [number, number, number, number] }}
          style={{
            fontSize: "clamp(24px, 3.5vw, 40px)",
            fontWeight: 500,
            color: "var(--ink-primary)",
            textAlign: "center",
            maxWidth: "800px",
            lineHeight: 1.4,
            margin: 0,
            padding: 0,
            border: "none",
          }}
        >
          &ldquo;The same intelligence that helps a REIT make a $50M acquisition
          also tells a renter in Crown Heights if their building is safe.&rdquo;
        </motion.blockquote>
      </div>
    </section>
  );
}
