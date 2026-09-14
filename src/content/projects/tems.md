---
title: "Tem's"
client: "Tem's United"
year: 2025
summary: "One-tap logistics, designed as two apps in one: a sender who wants a price, a rider who wants work."
role: "Product design"
stack: ["Figma"]
cover: "/images/projects/tems.avif"
banner: "/images/projects/tems-1@720.avif"
bannerSrcset: "/images/projects/tems-1@720.avif 720w"
filename: "tems.fig"
featured: false
---

[//]: # (Yves to confirm: the year, the client's legal name, and whether there is a live app link to add as `url`. Everything else here is either his own words from the 2025 portfolio or visible in the recording the stills came from.)

## The problem

A logistics app has two people in it who want opposite things. A sender wants a price, a
pickup and to know where their parcel is. A rider wants work, a route, and to get paid for
it. Both of them were going into one product.

Built naively that becomes an app full of screens that half the users should never see, and
a navigation that has to apologise for itself on every tab.

## Pick a side first

The screen straight after the splash asks which one you are, because almost nothing past
that point is shared. Deciding it once, at the front, is what keeps the rest of the app from
asking again on every screen, and it means neither side ever has to be told a feature is
not for them.

<img src="/images/projects/tems-2@720.avif" alt="Choosing an account type, sender or rider, on the screen after the splash" width="720" height="450" loading="lazy" decoding="async" srcset="/images/projects/tems-2@720.avif 720w" sizes="(max-width: 640px) 100vw, min(100vw, 1440px)" />

## Booking, in three short steps

Sending something is the thing a sender came to do, so it is the shortest path in the app.
It is split into three screens rather than one long form: what you are sending, the details
of it, then the vehicle.

Three short screens beat one long one here for a specific reason. Somebody booking a
delivery is usually standing over the parcel with one hand free. A screen that asks four
things can be answered standing up. A form that asks twenty cannot.

<img src="/images/projects/tems-3@720.avif" alt="The send flow as three short screens: send package, package details, select vehicle" width="720" height="450" loading="lazy" decoding="async" srcset="/images/projects/tems-3@720.avif 720w" sizes="(max-width: 640px) 100vw, min(100vw, 1440px)" />

Each step ends in one button, always in the same place, so the flow can be finished without
reading the screen after the first time.

## Money is its own place

Payments live in a wallet rather than being attached to each delivery. A sender tops up
once and stops thinking about it, and a rider sees what has come in and when. The
transaction list is the same component for both, reading credits for one and earnings for
the other.

<img src="/images/projects/tems-4@720.avif" alt="The wallet, with a balance, a top up, and a list of recent transactions" width="720" height="450" loading="lazy" decoding="async" srcset="/images/projects/tems-4@720.avif 720w" sizes="(max-width: 640px) 100vw, min(100vw, 1440px)" />

## Two dashboards, one system

From the account choice onward it is effectively two products, but they are built from the
same parts: the same cards, the same list rows, the same buttons in the same positions.
That is the foundation the brief asked for, and it is what makes a third screen cheap rather
than a redesign.

<img src="/images/projects/tems-5@720.avif" alt="The sender dashboard, tracking and delivery in front" width="720" height="450" loading="lazy" decoding="async" srcset="/images/projects/tems-5@720.avif 720w" sizes="(max-width: 640px) 100vw, min(100vw, 1440px)" />

## Result

An end-to-end experience mapped for both sides, a booking flow short enough to finish
standing up, and a visual system underneath it built to be added to rather than redrawn
every time a screen is needed.
