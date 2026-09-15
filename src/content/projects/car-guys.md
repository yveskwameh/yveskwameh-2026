---
title: "The Car Guys"
client: "The Car Guys Inc"
year: 2026
summary: "A waitlist up on day one, then the whole site, three services on one shape, and an application half the length."
role: "Design and build"
stack: ["Figma", "Webflow"]
url: "https://thecarguysinc.com/"
cover: "/images/projects/car-guys.avif"
banner: "/images/projects/car-guys-1@720.avif"
bannerSrcset: "/images/projects/car-guys-1@720.avif 720w, /images/projects/car-guys-1@1440.avif 1440w, /images/projects/car-guys-1@2880.avif 2880w"
filename: "car-guys.webflow"
featured: true
---

## The problem

The Car Guys had just bought the domain. There was no site, no pages, and nothing anyone
could fill in.

The business does three different things, and they are not variations of each other.
Someone can buy or lease a new car, sell the car they already have, or hand back a lease
early, and all of it happens without a dealership visit. Each one needs different
information from a different kind of person, and each one ends in an application that a
human being has to read. So the site could not be a brochure with a contact form at the
bottom. It had to carry three separate services and be ready to take real applications the
day it went up.

## The waitlist, first

A domain with nothing on it is a month of people arriving and leaving. Rather than wait for
the real site, I built them a coming soon page and put it up straight away.

It asks five things: first name, last name, email, phone, and a message. The message box
matters more than it looks. Someone who is mid-lease and wants out will say so there, and
that is a warmer lead than a name on a list. Three chips above it name what the business
actually does, lease buyouts, auto brokering, no dealer markup, so a visitor knows whether
they are in the right place before they type anything.

<img src="/images/projects/car-guys-2.avif" alt="The coming soon page on desktop, with the waitlist form beside the headline" width="720" height="450" loading="lazy" decoding="async" />

Drawn at 1920, 1440 and 425, so it was responsive before the site it was standing in for.

<img class="tall" src="/images/projects/car-guys-3.avif" alt="The same coming soon page on a phone, the form stacked under the headline" width="480" height="924" loading="lazy" decoding="async" />

## Drawn before it was built

Every page was wireframed in Figma first, in grey, with no photography and no brand colour.
That is deliberate. A dark hero with a car in it will sell almost any layout to almost
anyone, and the point of this stage was to argue about the order of the sections and the
length of the forms while those were still cheap to change.

<img src="/images/projects/car-guys-4.avif" alt="The home page wireframe in grey, sections blocked out with no photography" width="720" height="450" loading="lazy" decoding="async" />

Eleven layouts came out of it, seven for desktop and four for phones. The application was
drawn at this stage too, which is how the length of it became a design question rather than
something discovered at the end.

<img src="/images/projects/car-guys-5.avif" alt="The application wireframe, with the form blocked out field by field" width="720" height="450" loading="lazy" decoding="async" />

## The site

Built in Webflow off those wireframes. Four page types: the home page, and one for each
service.

Every service page is the same shape. A headline that says what you can do, one button,
then How It Works as three steps, then the form. Someone who lands on Sell Your Car from a
search reads the same structure as someone who came through the home page, so the site only
has to be learned once.

<img src="/images/projects/car-guys-6@720.avif" alt="Buy or lease a new car, the first of the three service pages" width="720" height="450" loading="lazy" decoding="async" srcset="/images/projects/car-guys-6@720.avif 720w, /images/projects/car-guys-6@1440.avif 1440w, /images/projects/car-guys-6@2880.avif 2880w" sizes="(max-width: 640px) 100vw, min(100vw, 1440px)" />

<img src="/images/projects/car-guys-7@720.avif" alt="Sell your car, the same shape with its own three steps" width="720" height="450" loading="lazy" decoding="async" srcset="/images/projects/car-guys-7@720.avif 720w, /images/projects/car-guys-7@1440.avif 1440w, /images/projects/car-guys-7@2880.avif 2880w" sizes="(max-width: 640px) 100vw, min(100vw, 1440px)" />

<img src="/images/projects/car-guys-8@720.avif" alt="Exit your lease or finance, the third page on the same pattern" width="720" height="450" loading="lazy" decoding="async" srcset="/images/projects/car-guys-8@720.avif 720w, /images/projects/car-guys-8@1440.avif 1440w, /images/projects/car-guys-8@2880.avif 2880w" sizes="(max-width: 640px) 100vw, min(100vw, 1440px)" />

The FAQ answers were written from the service copy rather than invented, so the page
answers its own questions instead of contradicting itself further down.

## It holds at every width

Responsive the whole way down, not just below one breakpoint.

<img class="tall-lg" src="/images/projects/car-guys-9@560.avif" alt="The home page at tablet width, the navigation collapsed to a menu" width="560" height="746" loading="lazy" decoding="async" srcset="/images/projects/car-guys-9@560.avif 560w, /images/projects/car-guys-9@1120.avif 1120w" sizes="(max-width: 640px) 100vw, 560px" />

The navigation collapses to a menu at tablet width. On a phone the three step rows stack,
and the two column form fields become one column rather than shrinking to something nobody
can tap.

<img class="tall" src="/images/projects/car-guys-10@420.avif" alt="The home page on a phone, the rows stacked into one column" width="420" height="840" loading="lazy" decoding="async" srcset="/images/projects/car-guys-10@420.avif 420w, /images/projects/car-guys-10@840.avif 840w" sizes="(max-width: 640px) 100vw, 420px" />

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

<img src="/images/projects/car-guys-11.avif" alt="The shipped application, individual and business as two tabs with the co-signer folded away" width="720" height="450" loading="lazy" decoding="async" />

## Result

A business now fills 22 fields instead of 43, and a person fills 29 without ever seeing a
question about a guarantor they do not have. The site is live and covers all three, and the
waitlist was up taking messages the whole time it was being built.
