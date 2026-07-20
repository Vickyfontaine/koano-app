# KOANO — Copy for the 24 Placeholders
## Voice: institutional, knowing, personable. No em dashes. No triads for their own sake. Honesty leads.

---

## 1. Cluster landing page H1s (4)

### /for/developers (Cluster 4)
**File:** `src/app/for/developers/page.tsx:84`

> # You already know the site. The question is what happens next to it.
>
> Five agents read the zoning, the permit history, and the public investment around a parcel. They converge on a single verdict, and the reasoning comes with it.

---

### /for/agents (Cluster 2, "For professionals")
**File:** `src/app/for/agents/page.tsx:74`

> # The MLS tells you what already happened.
>
> KOANO reads the signals that move first. Permit filings, price momentum, search interest, the things that show up in the data months before they show up in a comp.

---

### /for/institutions (Cluster 5)
**File:** `src/app/for/institutions/page.tsx:89`

> # A portfolio does not change on a reporting cycle.
>
> KOANO watches the assets and the markets you hold, and tells you what moved, what is at risk, and why. Every claim is traceable to a source.

---

### /for/homeowners (Cluster 1)
**File:** `src/app/for/homeowners/page.tsx:79`

> # Something is being built four blocks away. Nobody sent you a letter.
>
> KOANO reads the permits, the zoning, and the flood maps around your address, and tells you what they mean for the thing you own.

---

## 2. /intelligence page headline
**File:** `IntelligenceContent.tsx:260`

> # Five agents. One verdict. Every step on the record.
>
> KOANO is not a dashboard. It is a reasoning system. Each agent owns a domain, works from its own sources, and reaches its own conclusion. A synthesis agent reads all five, resolves what they disagree on, and issues one verdict. Nothing is hidden, including the disagreements.

---

## 3. /pricing page headline + framing
**File:** `PricingContent.tsx:143`

> # KOANO is in demo. Nobody is being charged.
>
> The prices below are what these tiers are worth once the paid data feeds are live. Today they are not. Three of the five agents run on representative data where the licensed sources have not been funded yet, and every figure that comes from one is labeled as such inside the product.
>
> So the demo is free, and it is by request rather than open signup. Every analysis KOANO runs costs real money to produce, which is why access is limited. If you want to see it work, ask, and we will let you in.

**Design note for the tier cards:** prices displayed with a strikethrough, with a small line beneath each reading `Free during demo`.

---

## 4. /pricing FAQ answers (6)
**File:** `PricingContent.tsx:415`

### Can I switch clusters?
> Yes. The engine is the same underneath. What changes is what gets put in front of you. A broker who also develops can flip between the transaction view and the site comparison view without a second account, and nothing about the analysis changes when they do.

### Is there a free trial?
> The whole thing is free right now, because the whole thing is a demo. There is nothing to trial and nothing to cancel. Ask for access and if we have room, you get it.

### Where does the data come from?
> Roughly a dozen sources today. The live ones are public and real: NYC zoning and permit records, Census demographics, FHFA price indices, FEMA flood data, IRS Opportunity Zone tracts, FBI crime statistics. The ones that cost money are not funded yet, so KOANO runs on representative stand-ins for MLS comps, foot traffic, and premium hazard data. Anywhere that happens, the product says so on the figure itself. The full catalog is on the data page.

### How often does it update?
> Every analysis pulls its sources at the moment you run it. There is no cached market report sitting behind the answer. What KOANO does not do yet is watch anything continuously. Alerts and the portfolio monitor are point in time, and they say so. Continuous monitoring is a funded capability, not a demo one.

### What is the difference between the $19 and $49 property tiers?
> The lower tier answers questions about a property you own. The higher one answers questions about a property you are deciding on, which means the return math, the rehab benchmarks, and the rental picture. Both are free right now, so the honest answer is that the difference is theoretical until someone is being charged.

### How does enterprise pricing work?
> It is a conversation, not a checkout. Institutional deployment involves data isolation, access controls, and compliance work that does not exist yet and will not exist until someone is paying for it to. If that is where you are, the enterprise tier is a description of what we would build with you, not a product you can buy today.

---

## 5. /about page (2)

### Hero block
**File:** `AboutContent.tsx:125`

> # Real estate has more data than almost any industry, and less intelligence.
>
> The information is public. The zoning is published. The permits are filed. The bonds are issued and the census is taken. And yet the work of turning any of it into a decision still happens the way it did thirty years ago, which is a person, a spreadsheet, and a week.

---

### Founding story and team body
**File:** `AboutContent.tsx:406`

> ## Why this exists
>
> The gap is not data. It is reasoning. Nobody is short of sources. What people are short of is the days it takes to read a zoning code, cross-reference a permit history, and figure out whether a community board is going to hand you a problem. That work is tedious, it is expensive, and it is exactly the kind of work a capable model can do now.
>
> KOANO is an attempt to do it honestly. Every figure in the product is labeled with where it came from. Every verdict is written to a record that cannot be edited afterward. When the engine disagrees with itself, it says so instead of averaging the disagreement away. That is not a feature. It is the reason the thing is worth trusting at all.
>
> ## The part that is harder to say
>
> A tool that makes development faster is a tool that makes development faster. That has a history in this city, and the people who lose in that history are usually the ones who were never in the room.
>
> KOANO is not going to claim it solves that. It has not earned the standing to. What it can say is that the same engine that reads a site for a developer can read a building for the person living in it, and that the intention is to build that second thing rather than talk about it. Not as a gesture. As a product, once there is a product to give.
>
> Today there is a demo, running on public data. That is the whole of it.
>
> **Victor Fontaine**
> Founder, KOANO

---

## 6. /community page CTA
**File:** `CommunityContent.tsx:389`

> ## 03 — Where this stands
>
> KOANO has no nonprofit partnerships. It is being deployed for the first time and there is nothing yet that would be useful to hand a housing organization.
>
> The intent is real and it is specific. Building violation histories, landlord records, and displacement risk indicators are the same public data the paid product already reads. Turning that into something a tenant advocate can actually use is a build, and it is one that will happen when KOANO is out of demo and can support it.
>
> If you work in that world and want to be told when that is real, say so. We will keep the list short and we will not pretend it is a program until it is one.

---

## 7. Early access (4 placeholders across 2 pages)

### Homepage early access section
**File:** `EarlyAccessSection.tsx:65, 79`

**Headline:**
> # KOANO is in demo, and access is by request.

**Subhead:**
> Every analysis costs real money to run, so access is granted by request rather than open signup. Tell us who you are and what you would use it on, and we will let you in if we have room.

---

### /early-access page
**File:** `EarlyAccessContent.tsx:103, 115`

**Headline:**
> # Ask for access.

**Subhead:**
> KOANO is in a limited demo, so access is granted by hand, which means we read what you send. Tell us what you work on and what you would point this at, and we will take it from there.

---

## 8. /onboarding welcome
**File:** `OnboardingClusters.tsx:79`

> ## Which of these is your work?
>
> The engine is the same for all four. What changes is what it puts in front of you. Pick the one closest to what you do, and you can switch later without losing anything.

---

## 9. Dashboard empty states (4)

### Cluster 1 — Property intelligence
**File:** `cluster1/Cluster1Dashboard.tsx:95`

> ### Start with an address.
>
> KOANO will read the zoning, the permit history, and the flood and risk data around it, then tell you what it means for the property. It takes about a minute and a half, because the agents are actually working.

---

### Cluster 2 — Transaction intelligence
**File:** `cluster2/Cluster2Dashboard.tsx:102`

> ### Start with an address or a neighborhood.
>
> You will get the market picture first, within a few seconds. The verdict and the reasoning arrive when the agents finish, which takes about a minute and a half.

---

### Cluster 4 — Development intelligence
**File:** `cluster4/SiteComparison.tsx:170`

> ### Enter up to three sites.
>
> Each one gets the full engine: zoning, permits, entitlement risk, and public investment in the catchment. KOANO ranks them by risk-adjusted opportunity and shows you exactly how it got there. Three sites take about two minutes.

---

### Fallback view
**File:** `VerdictWorkbench.tsx:26`

> ### Enter an address to begin.
>
> KOANO runs five agents against it and returns a single verdict with the reasoning attached.

---

## Notes on what I did and did not do

**On the about page.** You asked for a stance rather than a story, and for the responsible-deployment ethos to read as intent rather than virtue signaling. The only way I know to do that is to name the tension out loud. A tool that speeds up development speeds up development, and the people who lose when that happens are usually not the ones buying the software. The copy says that plainly, says KOANO has not earned the standing to claim otherwise, and states the intent as a build rather than a value. It is short because anything longer starts to sound like a company complimenting itself.

**On the community page.** No partnerships, no program, no CTA implying either. It says there is nothing to offer yet and describes what would be offered when there is. That is the only version that survives contact with someone who actually works in housing.

**On pricing.** The tiers stay as a statement of what the technology is worth. The page leads by saying nobody is being charged and why, including the fact that three of five agents run on representative data. The FAQ answers do the same work in detail, particularly the data sources and update frequency questions, which are where the honesty compounds.

**What I could not write.** Nothing here invents a founding narrative, a partnership, a customer, or a capability. If any of it overstates something you know to be false, that is a mistake and I want to hear about it rather than have it ship.
