---
title: "The Car Guys"
client: "The Car Guys Inc"
year: 2026
summary: "A waitlist up on day one, then the whole site, and an application half the length."
role: "Design and build"
stack: ["Figma", "Webflow"]
url: "https://thecarguysinc.com/"
cover: "/images/projects/car-guys.avif"
banner: "/images/projects/car-guys-1.avif"
filename: "car-guys.webflow"
featured: true
---

## The problem

The Car Guys had just bought the domain. There was no site, no pages, and nothing anyone
could fill in.

The business does three different things, and they are not variations of each other. Someone can buy
or lease a new car, sell the car they already have, or hand back a lease early, and all of
it happens without a dealership visit. Each one needs different information from a
different kind of person, and each one ends in an application that a human being has to
read. So the site could not be a brochure with a contact form at the bottom. It had to
carry three separate services and be ready to take real applications the day it went up.

## The waitlist, first

A domain with nothing on it is a month of people arriving and leaving. Rather than wait
for the real site, I built them a coming soon page and put it up straight away.

It asks five things: first name, last name, email, phone, and a message. The message box
matters more than it looks. Someone who is mid-lease and wants out will say so there, and
that is a warmer lead than a name on a list. Three chips above it name what the business
actually does, lease buyouts, auto brokering, no dealer markup, so a visitor knows whether
they are in the right place before they type anything.

Drawn at 1920, 1440 and 425, so it was responsive before the site it was standing in for.

<img src="/images/projects/car-guys-2.avif" alt="The coming soon page at desktop and phone width, with the five field waitlist form" width="720" height="450" loading="lazy" decoding="async" />

## Drawn before it was built

Every page was wireframed in Figma first, in grey, with no photography and no brand
colour. That is deliberate. A dark hero with a car in it will sell almost any layout to
almost anyone, and the point of this stage was to argue about the order of the sections
and the length of the forms while those were still cheap to change.

Eleven layouts came out of it, seven for desktop and four for phones.

<img src="/images/projects/car-guys-3.avif" alt="Four of the page wireframes in grey: two application paths, sell your car, and exit your lease" width="720" height="450" loading="lazy" decoding="async" />

## The site

Built in Webflow off those wireframes. Four page types: the home page, and one for each
service.

Every service page is the same shape. A headline that says what you can do, one button,
then How It Works as three steps, then the form. Someone who lands on Sell Your Car from a
search reads the same structure as someone who came through the home page, so the site only
has to be learned once. The FAQ answers were written from the service copy rather than
invented, so the page answers its own questions instead of contradicting itself further
down.

<img src="/images/projects/car-guys-4.avif" alt="The three service pages, each with the same three step How It Works" width="720" height="450" loading="lazy" decoding="async" />

Responsive the whole way down, not just below one breakpoint. The navigation collapses to a
menu at tablet width, the three step rows stack on a phone, and the two column form fields
become one column rather than shrinking to something nobody can tap.

<img src="/images/projects/car-guys-5.avif" alt="The home page at desktop, tablet and phone width" width="720" height="450" loading="lazy" decoding="async" />

## The application

This is where most of the work went.

The form we were working from, an existing application from another company in the same
business, ran to 43 fields across three tabs. Eleven about the business, fifteen about the
personal guarantor, and seventeen more about that guarantor's employment, ending in a
signature. Everyone answered all of it. A sole trader with no guarantor still filled in
three tabs of guarantor questions, and a first tab that asks for a Tax ID is a strange
thing to show someone who just wants to lease a car.

So it became two applications, not one. A person gets asked what a person can answer. A
business gets asked about the business. Both sit on a single page instead of three tabs,
because three tabs hide how much is left and a page does not.

The co-signer moved behind a toggle. Off by default, twenty one fields that only exist for
the people who have one. That single decision is most of the difference between 43 and 22.

<img src="/images/projects/car-guys-6.avif" alt="The application on one page, with the co-signer section folded away behind its toggle" width="720" height="450" loading="lazy" decoding="async" />

## Result

A business now fills 22 fields instead of 43, and a person fills 29 without ever seeing a
question about a guarantor they do not have. The site is live and covers all three, and
the waitlist was up taking messages the whole time it was being built.
