---
title: "Tem's"
client: "Tem's Limited"
year: 2025
summary: "A logistics app with two opposite users in it. I designed it as two products sharing one set of parts, a sender who wants a price and a rider who wants the work."
role: "Product design"
stack: ["Figma"]
cover: "/images/projects/tems.avif"
banner: "/images/projects/tems-1@720.avif"
bannerSrcset: "/images/projects/tems-1@720.avif 720w, /images/projects/tems-1@1440.avif 1440w, /images/projects/tems-1@2880.avif 2880w"
filename: "tems.fig"
featured: false
---

[//]: # (Client name settled by Yves: Tem's Limited. The splash screen badge reads "TOM'S 247 LIMITED", which is what raised the question, and he has confirmed the reading. Still open: whether there is a live app link to add as `url`.)

## What they had

A logistics app with two people in it who want opposite things. A sender wants a price, a
pickup, and to know where their parcel is. A rider wants work, a route, and to get paid for
it. Both were going into one product.

Build that the obvious way and you get an app full of screens half the users should never
see. They brought me in to design the product, both sides of it.

## Pick a side first

The screen straight after the splash asks which one you are, because almost nothing past
that point is shared. Deciding it once, at the front, keeps the rest of the app from asking
again on every screen, and it means neither side is ever told a feature is not for them.

<img class="tall-lg" src="/images/projects/tems-2@560.avif" alt="Choosing an account type, sender or rider, on the screen after the splash" width="560" height="996" loading="lazy" decoding="async" srcset="/images/projects/tems-2@560.avif 560w, /images/projects/tems-2@1120.avif 1120w" sizes="(max-width: 640px) 100vw, 560px" />

## Booking, in three short steps

Sending something is what a sender came to do, so it is the shortest path in the app. I split
it into three screens rather than one long form: what you are sending, the details of it,
then the vehicle.

Three short screens beat one long one here for a reason you can picture. Somebody booking a
delivery is usually standing over the parcel with one hand free. A screen that asks four
things can be answered standing up. A form that asks twenty cannot.

<img src="/images/projects/tems-3@720.avif" alt="The send flow as three short screens: send package, package details, select vehicle" width="720" height="472" loading="lazy" decoding="async" srcset="/images/projects/tems-3@720.avif 720w, /images/projects/tems-3@1440.avif 1440w, /images/projects/tems-3@2880.avif 2880w" sizes="(max-width: 640px) 100vw, min(100vw, 1440px)" />

Each step ends in one button in the same place, so after the first time you can finish the
flow without reading the screen.

## The wallet

Payments live in a wallet rather than being attached to each delivery. A sender tops up once
and stops thinking about it, and a rider sees what has come in and when. The transaction list
is the same component for both, reading credits for one and earnings for the other.

<img class="tall-lg" src="/images/projects/tems-4@560.avif" alt="The wallet, with a balance, a top up, and a list of recent transactions" width="560" height="996" loading="lazy" decoding="async" srcset="/images/projects/tems-4@560.avif 560w, /images/projects/tems-4@1120.avif 1120w" sizes="(max-width: 640px) 100vw, 560px" />

## Two dashboards, one system

From the account choice onward it is effectively two products, but they are built from the
same parts: the same cards, the same list rows, the same buttons in the same positions. That
is what makes a third screen an arrangement rather than a redesign.

<img class="tall-lg" src="/images/projects/tems-5@560.avif" alt="The sender dashboard, tracking and delivery in front" width="560" height="996" loading="lazy" decoding="async" srcset="/images/projects/tems-5@560.avif 560w, /images/projects/tems-5@1120.avif 1120w" sizes="(max-width: 640px) 100vw, 560px" />

The rider side is the same construction turned to a different job: work near you at the top,
what is already booked in underneath, and the same rows and cards doing it.

<img class="tall-lg" src="/images/projects/tems-6@560.avif" alt="The rider dashboard, work close to you and upcoming deliveries" width="560" height="996" loading="lazy" decoding="async" srcset="/images/projects/tems-6@560.avif 560w, /images/projects/tems-6@1120.avif 1120w" sizes="(max-width: 640px) 100vw, 560px" />

## Result

Both sides of the product designed end to end, a booking flow short enough to finish standing
up, and a set of components underneath that Tem's can add screens to without paying for a
redesign each time.
