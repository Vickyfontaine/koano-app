"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import SectionNumber from "@/components/ui/SectionNumber";
import Button from "@/components/ui/Button";

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

export default function CommunityContent() {
  const heroRef = useRef<HTMLElement>(null);
  const missionRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  const heroInView = useInView(heroRef, { once: true, amount: 0.15 });
  const missionInView = useInView(missionRef, { once: true, amount: 0.1 });
  const ctaInView = useInView(ctaRef, { once: true, amount: 0.15 });

  return (
    <>
      {/* Hero */}
      <section
        ref={heroRef}
        style={{
          background: "var(--white)",
          padding: "160px 32px 120px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <motion.div
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={0}
          >
            <SectionNumber number="01" label="Community" />
          </motion.div>

          <motion.h1
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={1}
            className="text-h2"
            style={{
              color: "var(--ink-primary)",
              marginTop: "24px",
              marginBottom: "24px",
            }}
          >
            KOANO&apos;s conscience.
          </motion.h1>

          <motion.p
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={2}
            className="text-body-lg"
            style={{
              color: "var(--ink-secondary)",
              maxWidth: "640px",
              margin: "0 auto 40px",
            }}
          >
            The intent is that the same engine that serves institutional
            investors serves tenant advocacy organizations and community
            groups. This is not charity. It is the founding principle that
            separates KOANO from every other proptech company in existence.
          </motion.p>

          <motion.div
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={3}
            className="flex flex-wrap items-center justify-center"
            style={{ gap: "16px" }}
          >
            <Button
              variant="ghost"
              href="/about"
              id="community-hero-about"
            >
              Our founding principles
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Mission statement — approved copy verbatim */}
      <section
        ref={missionRef}
        style={{ background: "var(--pale-wash)", padding: "120px 32px" }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <motion.div
            initial="hidden"
            animate={missionInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={0}
            style={{ marginBottom: "64px" }}
          >
            <SectionNumber number="02" label="The principle" />
            <h2
              className="text-h2"
              style={{
                color: "var(--ink-primary)",
                marginTop: "16px",
                maxWidth: "640px",
              }}
            >
              Not a tool for gentrification.
            </h2>
          </motion.div>

          <div
            className="community-mission-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "40px",
              alignItems: "start",
            }}
          >
            <motion.div
              initial="hidden"
              animate={missionInView ? "visible" : "hidden"}
              variants={fadeUp}
              custom={1}
            >
              <p
                style={{
                  fontSize: "18px",
                  fontWeight: 400,
                  color: "var(--ink-primary)",
                  lineHeight: 1.7,
                  marginBottom: "24px",
                }}
              >
                KOANO is not positioned as a tool for gentrification. The
                intent is that the same engine that serves institutional
                investors serves tenant advocacy organizations and community
                groups.
              </p>
              <p
                style={{
                  fontSize: "18px",
                  fontWeight: 400,
                  color: "var(--ink-primary)",
                  lineHeight: 1.7,
                }}
              >
                This is not charity. It is the founding principle that separates
                KOANO from every other proptech company in existence.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Where this stands */}
      <section
        ref={ctaRef}
        style={{ background: "var(--pale-wash)", padding: "120px 32px" }}
      >
        <div
          style={{
            maxWidth: "640px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <motion.div
            initial="hidden"
            animate={ctaInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={0}
          >
            <SectionNumber number="03" label="Where this stands" />

            {/* Where this stands — approved copy (KOANO_COPY.md). The former
                partner-program paragraph and "Apply to become a partner" CTA
                described a program that does not exist (CLAUDE.md Section 03)
                and contradicted this copy; removed with it. */}
            <h2
              className="text-h2"
              style={{
                color: "var(--ink-primary)",
                marginTop: "16px",
                marginBottom: "24px",
              }}
            >
              Where this stands
            </h2>

            <p
              style={{
                fontSize: "16px",
                color: "var(--ink-secondary)",
                lineHeight: 1.7,
                marginBottom: "16px",
                textAlign: "left",
              }}
            >
              KOANO has no nonprofit partnerships. It is being deployed for the
              first time and there is nothing yet that would be useful to hand
              a housing organization.
            </p>
            <p
              style={{
                fontSize: "16px",
                color: "var(--ink-secondary)",
                lineHeight: 1.7,
                marginBottom: "16px",
                textAlign: "left",
              }}
            >
              The intent is real and it is specific. Building violation
              histories, landlord records, and displacement risk indicators are
              the same public data the paid product already reads. Turning that
              into something a tenant advocate can actually use is a build, and
              it is one that will happen when KOANO is out of demo and can
              support it.
            </p>
            <p
              style={{
                fontSize: "16px",
                color: "var(--ink-secondary)",
                lineHeight: 1.7,
                marginBottom: "40px",
                textAlign: "left",
              }}
            >
              If you work in that world and want to be told when that is real,
              say so. We will keep the list short and we will not pretend it is
              a program until it is one.
            </p>

            <div
              className="flex flex-wrap items-center justify-center"
              style={{ gap: "16px" }}
            >
              <Button
                variant="primary"
                href="/early-access"
                id="community-bottom-cta"
              >
                Get early access
              </Button>
              <Button variant="ghost" href="/about" id="community-bottom-about">
                Our founding story
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <style jsx>{`
        @media (max-width: 900px) {
          .community-mission-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
