"use client";

import React, { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import SectionNumber from "../ui/SectionNumber";

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.5,
      ease: EASE,
    },
  }),
};

export default function EarlyAccessSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });
  const [email, setEmail] = useState("");

  return (
    <section
      id="early-access-section"
      ref={ref}
      style={{
        background: "var(--white)",
        padding: "120px 32px",
      }}
    >
      <div
        style={{
          maxWidth: "640px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        {/* Section number */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeUp}
          custom={0}
        >
          <SectionNumber number="03" />
        </motion.div>

        {/* Headline + subhead — approved copy (KOANO_COPY.md) */}
        <motion.h2
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeUp}
          custom={1}
          className="text-h2"
          style={{
            color: "var(--ink-primary)",
            marginTop: "16px",
            marginBottom: "16px",
          }}
        >
          KOANO is in demo, and access is by request.
        </motion.h2>

        <motion.p
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeUp}
          custom={2}
          className="text-body-lg"
          style={{
            color: "var(--ink-secondary)",
            maxWidth: "560px",
            margin: "0 auto 40px",
          }}
        >
          Every analysis costs real money to run, so access is granted by
          request rather than open signup. Tell us who you are and what you
          would use it on, and we will let you in if we have room.
        </motion.p>

        {/* Email capture form */}
        <motion.form
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeUp}
          custom={3}
          onSubmit={(e) => {
            e.preventDefault();
            // Supabase email capture will be connected in Phase 2
          }}
          className="flex flex-col sm:flex-row items-center justify-center"
          style={{ gap: "12px" }}
        >
          <input
            type="email"
            id="early-access-email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              border: "1px solid var(--border)",
              borderRadius: "100px",
              padding: "13px 20px",
              fontSize: "16px",
              color: "var(--ink-primary)",
              background: "var(--white)",
              outline: "none",
              width: "100%",
              maxWidth: "360px",
              fontFamily: "inherit",
              transition: "border-color 0.2s ease",
            }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "var(--brand-blue)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "var(--border)")
            }
          />
          <button
            type="submit"
            id="early-access-submit"
            className="btn-primary"
          >
            Join waitlist
            <span aria-hidden="true">↗</span>
          </button>
        </motion.form>
      </div>
    </section>
  );
}
