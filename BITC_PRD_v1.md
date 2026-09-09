**PRODUCT REQUIREMENTS DOCUMENT**

**BITC**

A community, opportunity and skills platform for creative professionals

**Version**  1.0 — Draft for review

**Date**  3 September 2026

**Platform**  Native mobile (iOS first, Android parity)

**Design source**  Figma — “BITC”, pages: Design, Icons

**Status**  Reverse-engineered from design; pending stakeholder confirmation

*This document was written by reading the BITC Figma file frame by frame. Every requirement below is traceable to a designed screen or to an explicitly flagged gap. Where the design is silent, the requirement is marked as an assumption or listed in Section 13, Open Questions — those items need a decision before build starts.*

# **Contents**

# **1\. Product Overview**

## **1.1 Summary**

BITC is a mobile application for the creative economy. It brings four things a working creative currently juggles across separate products — a professional social feed, a jobs and gigs board, a live events listing, and a learning/AI toolset — into one dark-themed native app, on top of a shared identity: a public creative profile with portfolio, services and reviews.

The designed experience anchors on a five-tab shell — Home, Events, Jobs, Community, Profile — with a fifth surface, the Skills Vault, reached from within the product and running its own three-tab sub-navigation (Dashboard, Tools, Learn).

## **1.2 Problem statement**

* Creative professionals discover work, events and peers across fragmented channels (Instagram, WhatsApp groups, Eventbrite, LinkedIn, freelance marketplaces), with no single credible profile tying it together.

* Hiring businesses struggle to assess creative capability from a CV; portfolios live off-platform and are inconsistently presented.

* Early-career creatives lack structured feedback on their work and lack pricing confidence, and paid mentorship is hard to access.

* Community happens in closed chat groups that are invisible to newcomers and impossible to search.

## **1.3 Product vision**

One place where a creative can be discovered, hired, paid, taught and connected — where the profile that wins the job is the same profile that joins the room, buys the ticket and finishes the course.

## **1.4 Goals**

| ID | Requirement | Pri. |
| :---- | :---- | :---- |
| G1 | Give every creative a single credible identity: verified profile, portfolio case studies, services, and peer reviews. | P0 |
| G2 | Make opportunity discovery — jobs, gigs and events — fast, filterable and local. | P0 |
| G3 | Make community real-time and public-by-default through topic Rooms with text and voice. | P0 |
| G4 | Accelerate skill growth with structured courses and AI tools that produce actionable output (portfolio scoring, rate guidance, brief interpretation). | P1 |
| G5 | Create a monetisable core: event ticketing, paid services, and premium AI/learning access. | P1 |

## **1.5 Non-goals for v1**

* A desktop or responsive web application. The design is mobile-only (430 × 932 pt artboards).

* A full freelance-marketplace escrow/contracting system. Services are advertised on profiles; contracting happens off-platform in v1.

* Long-form video hosting or live video streaming. Voice-only rooms are designed; video controls appear in the voice room but are not specified.

* An advertising or sponsored-placement product beyond the single promotional banner slot on Home.

## **1.6 Success metrics**

| Metric | Definition | Target (90 days post-launch) |
| :---- | :---- | :---- |
| Activation | % of signups that complete role selection, Skills & Goals and profile setup | ≥ 65% |
| Profile completeness | % of Creative accounts with ≥ 1 portfolio project published | ≥ 40% |
| Opportunity engagement | % of weekly active users who apply to a job or buy an event ticket | ≥ 25% |
| Community retention | % of users who join ≥ 1 Room and post/react in week 2 | ≥ 30% |
| Learning | Course start → first-lesson completion rate | ≥ 55% |
| AI tool value | % of AI Portfolio Reviews where the user edits their portfolio within 7 days | ≥ 20% |
| Retention | D30 retention of activated users | ≥ 25% |

*Targets are proposed, not derived from existing data. They should be reset once baseline analytics exist.*

# **2\. Users and Personas**

The onboarding flow forces a single explicit choice — “Tell us who you are” — between three roles. That choice is the primary personalisation lever in the product and should drive feed ranking, default tab, and which creation affordances appear.

| Role (as designed) | Persona | Primary jobs to be done | Success looks like |
| :---- | :---- | :---- | :---- |
| Creative | Independent designer, writer, photographer, musician, videographer — early to mid career | Showcase work, find paid gigs, learn, price myself correctly, meet peers | Books work; portfolio score improves |
| Business | Studio, agency or brand hiring creative talent | Post roles, discover and vet talent, host events, build an audience | Fills roles; fills events |
| User | Enthusiast / attendee — not selling creative services | Attend events, follow creators, join rooms, learn | Attends events; stays in rooms |

**Design gap:** only the Creative role's screens are designed. Home, Profile and the Skills Vault currently show a Creative's view. Business and User variants of these surfaces are undefined and must be specified before build (see Section 13).

## **2.1 Secondary segmentation captured at onboarding**

The Skills & Goals step collects four attributes that should be stored as first-class profile fields and used for recommendation, not just displayed:

| Attribute | Designed options | Selection |
| :---- | :---- | :---- |
| Main skill | Design, Writing, Finance, UI/UX, Photography, Music, Videography | Multi-select (assumed) |
| Goal | Find Clients, Learn New Skills, Network, Collaborate, Mentor | Multi-select (assumed) |
| Preferred work style | Freelancer, Full-time, Part-time | Single-select (assumed) |
| Experience level | Beginner, Intermediate, Expert, Advanced | Single-select |

**Note:** the Experience Level list in onboarding (Beginner / Intermediate / Expert / Advanced) does not match the Jobs filter list (Internship / Junior / Mid-level / Senior). One canonical taxonomy is required — see OQ-07.

# **3\. Scope**

## **3.1 In scope — v1 (designed)**

| Module | What ships |
| :---- | :---- |
| Onboarding & auth | 3 value screens, role selection, Skills & Goals questionnaire, profile setup, email/password login, social sign-in (Google, Facebook, LinkedIn) |
| Home | Greeting header, global search, promotional countdown banner, featured events carousel, community highlights |
| Events | Search, promoted event, upcoming events list with tags, top events, ticket CTA |
| Jobs | Search, featured jobs carousel, recent jobs list with category chips, bookmarking, apply CTA, full filter sheet |
| Community | Post/Mentorship tabs, feed, post detail with threaded replies, reactions, compose FAB |
| Rooms | Room directory with categories, room detail (Chat / Media / Members / Events / About), pinned messages, image messages, reactions, voice chat with participant grid |
| Create Room | Six-step guided creation: basics, branding, privacy & permissions, moderators, guidelines, review & publish, success |
| Profile | Cover, avatar, verification badge, headline, bio, stats, Posts / Portfolio / Reviews tabs, portfolio case-study view |
| Skills Vault | Dashboard with streak and stats, AI tool catalogue, AI Portfolio Review end-to-end, course catalogue, course detail |
| Notifications | Grouped notification list, mark-all-as-read, notification detail view |

## **3.2 In scope — v1 (required but not designed)**

These are unavoidable for a shippable product even though no frame exists. They must be designed before the relevant module is built.

* Password reset / forgot-password flow (the entry point exists on Login; the flow does not).

* Ticket purchase, payment and ticket wallet (Buy Ticket and Get Ticket CTAs exist; nothing behind them).

* Job application submission and application status tracking (the Notification screen already announces “Your application was viewed”).

* Search results screen for the global search field.

* Settings: account, privacy, notification preferences, blocked users, sign out, account deletion.

* Report / block / moderation actions for posts, messages, rooms and users.

* Empty, loading, error and offline states across all lists.

## **3.3 Out of scope for v1**

* Web app, tablet layouts, and light theme.

* Direct 1:1 messaging between users (only group Rooms are designed).

* Video streaming, screen sharing beyond the icon shown in the voice room, and recording.

* In-app contracting, invoicing, escrow or payouts to creatives.

* Course authoring tools for third-party instructors.

* Localisation beyond English (UK).

# **4\. Information Architecture and Navigation**

## **4.1 Primary navigation**

A persistent five-item bottom tab bar, present on Home, Events, Jobs, Community and Profile. The active tab is indicated by the accent colour and a filled icon.

| \# | Tab | Landing screen | Notes |
| :---- | :---- | :---- | :---- |
| 1 | Home | Personalised dashboard | Default tab after login |
| 2 | Events | Event discovery | Search scoped to events, vibes and hosts |
| 3 | Jobs | Job and gig board | Filter sheet accessible from the search row |
| 4 | Community | Community Hub feed | Segmented into Post and Mentorship; Rooms reached from here |
| 5 | Profile | Own profile | Posts / Portfolio / Reviews tabs |

## **4.2 Secondary navigation — Skills Vault**

The Skills Vault replaces the primary tab bar with its own three-item bar: Dashboard, Tools, Learn. Requirement: exiting the Skills Vault must return the user to the tab they entered from; the primary tab bar is never visible simultaneously with the Skills Vault bar.

## **4.3 Screen map**

| Area | Screens (Figma frame names) |
| :---- | :---- |
| Onboarding | Onboarding 1 → Onboarding 2 → Onboarding 3 → Onboarding 4 (role selection) → Onboarding 5 (Skills & Goals) → Profile Setup → Login |
| Home | Home |
| Events | Events |
| Jobs | Jobs → Filter |
| Community | Community (Hub) → Post view; Rooms → Chat room → start chat (voice modal) → Chat room (voice live) → End (end confirmation) |
| Create Room | Create Room steps 1–6 → Room created successfully |
| Profile | profile (Posts) → Portfolio → Reviews → Portfolio View (case study) |
| Skills Vault | Skils vault (dashboard) → Tools → Learn → Course view / Course view 1 / Course view 2 (tab states) → Portfolio 1–4 (AI Portfolio Review flow) |
| Notifications | Notification → Notification View |

**Naming note:** the frame “Skils vault” is misspelled in the design file, and one job card reads “Project Manger”. These must not reach production copy — see Section 13\.

# **5\. Key User Flows**

## **5.1 First-run and activation**

1. Cold start → Onboarding 1\. User swipes through three value screens (pagination dots, Skip persistent in the top-right).

2. On screen 3 the primary CTA changes from NEXT to Get Started.

3. Role selection: “Tell us who you are”. Single choice of Creative, Business or User. Progress bar shows step 1 of 2\. Continue is disabled until a role is chosen.

4. Skills & Goals: four questions answered with chip selection. Progress bar advances to step 2 of 2\. Continue is enabled once the mandatory questions are answered.

5. Profile Setup: avatar upload, full name, email, password, confirm password, bio → Signup.

6. Account created → Home (the Creative variant).

7. Skip at any onboarding screen routes to Login. Returning users land on Login directly.

## **5.2 Find and apply for a job**

8. Jobs tab → search by title, company or skill, or tap the filter icon.

9. Filter sheet: price range, job type, category, experience level, location → Apply Filter (or Reset).

10. Browse Featured Jobs (carousel) or Recent Jobs (list, filtered by category chips).

11. Bookmark to save, or tap Apply on the card.

12. Application submitted → confirmation → progress surfaces later as a notification (“Your application was viewed”) → Notification View explains next steps.

**Gap:** steps 4b (the application form itself) and 5 (a “my applications” view) have no designed screens.

## **5.3 Discover and attend an event**

13. Home featured carousel → View, or Events tab → Upcoming / Top Events.

14. Event card shows host, title, venue and city, date and time window, and vibe tags (e.g. Networking, Free Drinks, DJ Set).

15. Get Ticket / Buy Ticket → payment → ticket issued.

**Gap:** no event detail screen, no checkout, no ticket wallet, and no free-vs-paid distinction is designed.

## **5.4 Create and run a Room**

16. Community → Rooms → “+” → Create Room step 1 of 6\.

17. Step 1 Basics: room name (40-character limit with live counter), category, description.

18. Step 2 Branding: cover image (recommended 1080 × 1080), room icon, accent colour.

19. Step 3 Privacy & Access: room type (Public / Private / Invite Only) and member permissions.

20. Step 4 Moderators: search users, add from suggestions, selected moderators shown as removable chips.

21. Step 5 Guidelines: five default rules pre-checked, plus one optional custom rule (100-character limit).

22. Step 6 Review & publish: summary card, permissions count, rules count, members → publish.

23. Success screen: “Room created successfully\!” → Enter Room.

## **5.5 Start a voice chat**

24. Inside a Room, open the voice affordance → “Start a voice chat” sheet.

25. Choose notification audience: Everyone (all members notified) or Online Members (only online members notified).

26. Start voice chat → live room: header shows “Voice chat · 23 listening”, participants render in a grid, the local user is labelled “You” with a speaking ring.

27. Controls: microphone, video, reactions, screen, participants.

28. End → “End voice chat” confirmation → End for Everyone or Cancel.

## **5.6 AI Portfolio Review**

29. Skills Vault → Tools → AI Portfolio Review → Open.

30. Tool intro: what the tool does, what it helps with, upload options, what you'll receive.

31. Upload: Browse files, or drag/paste a document (PDF, JPG, PNG, max 50 MB), or paste a portfolio URL (Behance, Dribbble, personal site) → Start Review.

32. Analysing: progress percentage plus five named stages — checking layout and structure, reviewing visual hierarchy, evaluating project descriptions, scoring consistency and branding, generating recommendations. File name, uploader and timestamp are shown. Cancel is available throughout.

33. Results: overall score out of 100 with a qualitative line, four detailed sub-scores each with a one-line explanation, and a Top Recommendations list.

# **6\. Functional Requirements**

Requirements are grouped by module and numbered FR-\<MODULE\>-\<n\>. Priority: P0 \= required for launch, P1 \= required for the first post-launch release, P2 \= desirable. Every P0 below maps to a designed frame unless the row says otherwise.

## **6.1 Onboarding and Account**

| ID | Requirement | Pri. |
| :---- | :---- | :---- |
| FR-ONB-01 | Present three horizontally swipeable value screens with pagination dots and a persistent Skip control. Screen copy is fixed: (1) “Discover Opportunities, All in One Place / Find events, jobs, and creative gigs tailored to you.” (2) “Build Skills, Level Up Your Career / Access mentorship, AI-powered tools, and learning resources.” (3) “Showcase Your Talent, Get Rewarded / Build your portfolio, sell your services, and grow your brand.” | P0 |
| FR-ONB-02 | The primary CTA reads NEXT on screens 1–2 and Get Started on screen 3\. | P0 |
| FR-ONB-03 | Skip dismisses onboarding permanently for that install and routes to Login. | P0 |
| FR-ONB-04 | Role selection screen offers exactly one of Creative, Business or User, each with an icon, label and one-line explainer. Selection is single-choice and visually indicated by an accent border. Continue is disabled until a role is selected. | P0 |
| FR-ONB-05 | A two-segment progress bar is shown above role selection and Skills & Goals. | P0 |
| FR-ONB-06 | Skills & Goals collects four answers via chip selection: main skill, desired outcome, preferred work style, experience level. Options are as listed in Section 2.1. | P0 |
| FR-ONB-07 | Answers from FR-ONB-04 and FR-ONB-06 are persisted to the user profile and used as inputs to feed, job and course ranking. | P0 |
| FR-ONB-08 | Profile Setup captures avatar (with camera overlay affordance), full name, email, password, confirm password and bio, then creates the account via Signup. | P0 |
| FR-ONB-09 | Password fields have a show/hide toggle. Password and Confirm Password must match before Signup is enabled. | P0 |
| FR-ONB-10 | Login accepts email and password, offers Forgot password?, and provides third-party sign-in via Google, Facebook and LinkedIn. | P0 |
| FR-ONB-11 | Login greets a recognised returning user by name with their avatar (“Welcome back, {First Last}”); for an unrecognised device, show a neutral variant. | P1 |
| FR-ONB-12 | Provide a “Don't have an account? Sign Up” link from Login into Profile Setup. | P0 |
| FR-ONB-13 | Not designed — define and build: field-level validation messages, duplicate-email handling, password strength rules, email verification, and the forgot-password flow. | P0 |

## **6.2 Home**

| ID | Requirement | Pri. |
| :---- | :---- | :---- |
| FR-HOME-01 | Header shows the user's avatar, a time-aware greeting (“Good day,”) and the user's full name, plus a share/upload action and a notifications bell. | P0 |
| FR-HOME-02 | The bell displays an unread-count indicator and opens the Notification screen. | P0 |
| FR-HOME-03 | A global search field with placeholder “Search events, jobs, mentors...” searches across events, jobs and people. | P0 |
| FR-HOME-04 | A promotional banner slot renders a campaign image plus a live countdown timer in days : hours : minutes : seconds. | P1 |
| FR-HOME-05 | Featured Events renders a horizontal carousel with a “More” link to the Events tab. Each card shows cover image, host name, event title, city, date and a View CTA. | P0 |
| FR-HOME-06 | Community highlights renders recent posts with an “Explore” link into the Community tab. Each row shows author avatar, name, role, relative time, body text and hashtags, plus an overflow menu. | P0 |
| FR-HOME-07 | Home content must be personalised by the role and Skills & Goals answers captured at onboarding. | P1 |
| FR-HOME-08 | Not designed — define Home variants for the Business and User roles. | P1 |

## **6.3 Events**

| ID | Requirement | Pri. |
| :---- | :---- | :---- |
| FR-EVT-01 | Search field scoped to events with placeholder “Search events, vibes, or hosts...”. | P0 |
| FR-EVT-02 | A promoted/hero event card with title, teaser copy and a Get Ticket CTA. | P1 |
| FR-EVT-03 | Upcoming Events section with a See all link. Each card shows title, venue and city, day/date, time window, and vibe tags, with a Buy Ticket CTA. | P0 |
| FR-EVT-04 | Top Events section presenting events ranked by popularity. | P1 |
| FR-EVT-05 | Vibe tags (e.g. Networking, Free Drinks, DJ Set) are a controlled vocabulary and are filterable. | P1 |
| FR-EVT-06 | Not designed — event detail screen, ticket types and pricing, checkout, order confirmation, ticket wallet with entry code, and free-event RSVP. | P0 |
| FR-EVT-07 | Not designed — event creation and management for Business accounts. | P1 |

## **6.4 Jobs**

| ID | Requirement | Pri. |
| :---- | :---- | :---- |
| FR-JOB-01 | Search field with placeholder “Search by title, company, or skill...” and an adjacent filter button that opens the Filter screen. | P0 |
| FR-JOB-02 | Featured Jobs horizontal carousel with See all. Card shows thumbnail, role title, company, work model (e.g. Hybrid), compensation range with period, posting age, and an Apply CTA. | P0 |
| FR-JOB-03 | Recent Jobs list with See all and a horizontally scrolling category chip row (All, UIUX, Design, Writing, Photography, …). “All” is selected by default. | P0 |
| FR-JOB-04 | Job list card shows company logo and name, location, role title, truncated description, attribute chips (work model, experience range), posting age, compensation, a bookmark toggle and an Apply CTA. | P0 |
| FR-JOB-05 | Bookmarking persists per user and is retrievable from the profile. | P0 |
| FR-JOB-06 | Filter screen provides: price/compensation range slider with a live value bubble; Job Type (Full-time, Part-time, Remote, Hybrid, Freelance); Category (Design, Writing, Photography, Marketing, Development, Events); Experience Level (Internship, Junior, Mid-level, Senior); Location. | P0 |
| FR-JOB-07 | Filter provides Reset (clears all) and Apply Filter (commits and returns to the list). The active filter count must be indicated on the Jobs screen. | P0 |
| FR-JOB-08 | Resolve the control semantics in the Filter design: the options are drawn as radio buttons but the categories are logically multi-select. Multi-select with checkboxes is recommended. | P0 |
| FR-JOB-09 | Currency must be consistent. The Filter slider shows £ while job cards show $. Pick one presentation currency per market and render compensation in the user's locale. | P0 |
| FR-JOB-10 | Not designed — job detail screen, application form, CV/portfolio attachment, and an application status list. | P0 |

## **6.5 Community feed**

| ID | Requirement | Pri. |
| :---- | :---- | :---- |
| FR-COM-01 | Community Hub header: title, strapline “Share what matters to you”, search, share and notification actions. | P0 |
| FR-COM-02 | Two segmented tabs: Post and Mentorship. Post is default. | P0 |
| FR-COM-03 | Feed card shows author avatar, name, role/headline, relative time, body copy, hashtags, optional media attachment, and an overflow menu. | P0 |
| FR-COM-04 | Engagement row exposes five actions with counts: comment, like, repost, views, bookmark, plus share. Counts render abbreviated (960, 1m, 1.8k, 3.5m). | P0 |
| FR-COM-05 | A floating compose button creates a new post. | P0 |
| FR-COM-06 | Post View shows the full post with an absolute timestamp line (“1:34 PM · Oct 9, 2025 · 3.5M Views”) followed by threaded replies. Each reply carries its own author block, engagement row and overflow menu. | P0 |
| FR-COM-07 | Replies support nesting at least one level (reply-to-reply), as shown in the design. | P0 |
| FR-COM-08 | Not designed — the compose screen itself, media picker, hashtag autocomplete, and the Mentorship tab's content and mechanics. | P0 |
| FR-COM-09 | Not designed — report, mute, block and delete actions behind the overflow menu. | P0 |

## **6.6 Rooms, chat and voice**

| ID | Requirement | Pri. |
| :---- | :---- | :---- |
| FR-ROOM-01 | Rooms directory: title, strapline “Join conversations, connect, and share ideas in real time”, search with placeholder “Search rooms, topics or communities...”, and a create-room action. | P0 |
| FR-ROOM-02 | Category chip row (All Rooms, Design, Photography, Tech, …) filters the directory. | P0 |
| FR-ROOM-03 | Room card shows icon, name, description, topic tags (\#Figma, \#UX, \#ProductDesign), member count, live online count, an unread-message badge, and a contextual CTA — Enter Room when a member, Join Room when not. | P0 |
| FR-ROOM-04 | Room detail header shows room name, member count and online count, with overflow and secondary actions. | P0 |
| FR-ROOM-05 | Room detail exposes five tabs: Chat, Media, Members, Events, About. | P0 |
| FR-ROOM-06 | A dismissible pinned message appears above the message list; moderators can set and clear it. | P0 |
| FR-ROOM-07 | Chat supports text, image attachments with inline preview, day dividers, per-message timestamps and emoji reactions with counts. | P0 |
| FR-ROOM-08 | Composer supports text entry, attachment, emoji picker and voice note. | P0 |
| FR-ROOM-09 | Voice chat start sheet lets the initiator choose who is notified — Everyone (all members notified) or Online Members — before starting. | P0 |
| FR-ROOM-10 | Live voice room shows the room name, “Voice chat · N listening”, a participant grid with names, the local user labelled “You”, and an active-speaker indicator. | P0 |
| FR-ROOM-11 | Voice controls: microphone mute, video, reactions, screen and participants. Any control that is out of scope for v1 must be removed rather than shipped inert. | P0 |
| FR-ROOM-12 | Ending a voice chat requires confirmation: “End voice chat — The voice chat will end for everyone in this room” with End for Everyone (destructive) and Cancel. | P0 |
| FR-ROOM-13 | Not designed — member list management, promote/demote moderator, remove member, leave room, and room settings after creation. | P1 |

## **6.7 Create Room wizard**

A six-step linear wizard with a persistent step indicator (dots plus “Step n of 6”), a back control, and a single Continue CTA per step.

| ID | Requirement | Pri. |
| :---- | :---- | :---- |
| FR-CR-01 | Step 1 — Basics: room name (required, 40-character limit with live counter), category (required, single-select from a controlled list), description (required, free text with guidance tip). | P0 |
| FR-CR-02 | Step 2 — Customise: cover image upload (recommended 1080 × 1080), room icon selection from a preset set, and accent colour selection from a preset palette. | P0 |
| FR-CR-03 | Step 3 — Privacy & Access: room type is exactly one of Public Room (anyone can discover and join), Private Room (users need approval before joining) or Invite Only (only invited members can access). Plus per-member permission toggles including Send Messages and Share Media. | P0 |
| FR-CR-04 | Step 4 — Moderators: search users by name, add from a suggested list showing avatar, name and follower count, and remove. Selected moderators render as dismissible chips with a live count. | P0 |
| FR-CR-05 | Step 5 — Guidelines: five default rules pre-selected and individually deselectable (Be respectful and kind to everyone; No harassment or hate speech; No spam or self-promotion; Stay on topic; Respect everyone's privacy). One optional custom rule, 100-character limit with counter. | P0 |
| FR-CR-06 | Step 6 — Review & publish: a preview of the room card exactly as it will appear in the directory, plus navigable summary rows for Permissions (“n enabled”), Rules (“n rules set”) and Members. | P0 |
| FR-CR-07 | On publish, show a success screen (“Room created successfully\! Your room is now live and ready for members.”) with an Enter Room CTA. | P0 |
| FR-CR-08 | Wizard progress must survive backgrounding; a partially completed room is retained as a draft. | P1 |

## **6.8 Profile, portfolio, services and reviews**

| ID | Requirement | Pri. |
| :---- | :---- | :---- |
| FR-PRO-01 | Profile header: cover image, avatar, display name with a verification badge where applicable, headline (e.g. “Senior Product Designer”), bio, and an edit action. | P0 |
| FR-PRO-02 | Three stat tiles: Projects, Followers, Ratings (average, one decimal). The Followers tile is visually emphasised. | P0 |
| FR-PRO-03 | Three content tabs: Posts, Portfolio, Reviews. The design also names a Services surface; confirm whether Services is a fourth tab or a section of Portfolio (see OQ-09). | P0 |
| FR-PRO-04 | Posts tab lists the user's own posts using the same card as the Community feed. | P0 |
| FR-PRO-05 | Portfolio tab presents projects as full-width cover cards, each opening a case-study view. | P0 |
| FR-PRO-06 | Portfolio View (case study) supports a hero image, project title, and structured sections — Project Summary, Objectives, Design Approach — rendered as headed paragraphs and bullet lists. | P0 |
| FR-PRO-07 | Reviews tab lists reviews with reviewer name and avatar, a five-star rating, date, and review text. | P0 |
| FR-PRO-08 | Verification badge criteria must be defined and enforced server-side. | P1 |
| FR-PRO-09 | Not designed — profile editing, portfolio project creation/editing, service listing creation, and the follower/following lists. | P0 |

## **6.9 Skills Vault — dashboard, AI tools and learning**

### **6.9.1 Dashboard**

| ID | Requirement | Pri. |
| :---- | :---- | :---- |
| FR-SV-01 | Header carries the greeting block plus globe, search and notification actions, followed by the title “Skills Vaults” and the strapline “AI-powered tools and learning resources to elevate your creative career faster.” | P0 |
| FR-SV-02 | Three stat tiles with distinct accent colours: Learning Streak (days), Courses Completed (count), AI Tools Used This Week (count). | P0 |
| FR-SV-03 | Progress Status carousel with See all: each course card shows thumbnail, title, lesson count, duration, and a progress bar with percentage. | P0 |
| FR-SV-04 | Quick Launch – AI Tools section with a View all link. | P0 |
| FR-SV-05 | Sub-navigation bar with Dashboard, Tools and Learn. | P0 |
| FR-SV-06 | Learning streak logic (what counts as activity, timezone, grace period) must be defined. | P0 |

### **6.9.2 Tools**

| ID | Requirement | Pri. |
| :---- | :---- | :---- |
| FR-SV-10 | Tools screen shows the title “AI Tools”, the strapline “Smart tools designed to accelerate your creative career.” and a filter chip row: All, Career, Design, Business. | P0 |
| FR-SV-11 | Tool cards show an icon, name, an optional status badge (e.g. Popular, Free, AI), a description and an Open CTA. | P0 |
| FR-SV-12 | v1 catalogue: AI Portfolio Review, AI Rate Calculator, Brief Interpreter. | P0 |
| FR-SV-13 | Not designed — the AI Rate Calculator and Brief Interpreter flows. Only AI Portfolio Review is specified end-to-end. | P1 |
| FR-SV-14 | Tool usage must be metered per user per week to power the “AI Tools Used This Week” tile and any future entitlement limits. | P0 |

### **6.9.3 AI Portfolio Review**

| ID | Requirement | Pri. |
| :---- | :---- | :---- |
| FR-AIP-01 | Intro screen states what the tool does, a “What This Tool Helps You With” list, Upload Options, and a “What You'll Receive” list including an overall portfolio score (0–100) and sub-scores. | P0 |
| FR-AIP-02 | Upload screen accepts a file via Browse files or drag/paste. Accepted types: PDF, JPG, PNG. Maximum size 50 MB. These constraints must be enforced client- and server-side with clear rejection messaging. | P0 |
| FR-AIP-03 | Alternatively the user may submit a Portfolio URL (Behance, Dribbble or a personal website). | P0 |
| FR-AIP-04 | The screen states “Your data is secure and never stored permanently.” A retention policy must back this claim and be reflected in the privacy notice. | P0 |
| FR-AIP-05 | Start Review is enabled once a file or a valid URL is present. | P0 |
| FR-AIP-06 | Analysis screen shows a determinate progress bar with percentage and five named stages, the file name, uploader and timestamp, and an expectation-setting line (“Sit tight — this usually takes less than 20 seconds.”). | P0 |
| FR-AIP-07 | Cancel is available during analysis and aborts the job. | P0 |
| FR-AIP-08 | Results screen renders an overall score out of 100 with a qualitative sentence, four sub-scores each with a one-line rationale (Visual Composition, Storytelling Quality, Consistency & Branding, Professionalism), and a Top Recommendations list of concrete actions. | P0 |
| FR-AIP-09 | Not designed — failure states (unreadable file, unreachable URL, model timeout), result history, and sharing or exporting a review. | P0 |

### **6.9.4 Learn and courses**

| ID | Requirement | Pri. |
| :---- | :---- | :---- |
| FR-LRN-01 | Learn screen shows Progress Status (in-progress courses with See all) and Recommended Courses (with View all). | P0 |
| FR-LRN-02 | Recommended course card shows cover, title, lesson count, duration, difficulty level, and two CTAs: View and Start. | P0 |
| FR-LRN-03 | Course View shows cover, title, and a metadata row: lesson count, duration range, difficulty, and average rating. | P0 |
| FR-LRN-04 | Course View shows a progress bar with percentage (0% for an unstarted course), a description, and a “You'll learn how to:” outcome list. | P0 |
| FR-LRN-05 | Course View exposes three tabs — Lessons, Requirements, Reviews — with a persistent Start Course CTA. | P0 |
| FR-LRN-06 | Not designed — the content of the three course tabs, the lesson player, progress persistence, quizzes and completion certificates. | P0 |

## **6.10 Notifications**

| ID | Requirement | Pri. |
| :---- | :---- | :---- |
| FR-NOT-01 | Notifications are grouped by relative day (TODAY, YESTERDAY, …) with a Mark all as read action. | P0 |
| FR-NOT-02 | Each row shows an unread indicator dot, a title, supporting copy, a timestamp and a View More affordance opening the detail view. | P0 |
| FR-NOT-03 | Notification types evidenced in the design: application viewed, course/masterclass starting soon, interview scheduled, profile strength increased. | P0 |
| FR-NOT-04 | Notification View renders a full explanation with a “What happens next?” list. | P0 |
| FR-NOT-05 | Notifications must be delivered as push as well as in-app, with per-category preferences (not designed). | P1 |

# **7\. Data Model**

Entities implied by the design. Attributes listed are those visible in the UI; each entity also carries id, createdAt, updatedAt and soft-delete metadata.

| Entity | Key attributes | Relationships |
| :---- | :---- | :---- |
| User | email, passwordHash, authProvider, role (Creative|Business|User), verified | 1–1 Profile; n Posts, Applications, Enrolments |
| Profile | displayName, headline, bio, avatar, cover, projectCount, followerCount, ratingAvg | n Skills, Goals, PortfolioProjects, Services, Reviews |
| Skill / Goal | label, taxonomyId | n–n with Profile |
| PortfolioProject | title, coverImage, summary, objectives\[\], approach\[\] | belongs to Profile |
| Service | title, description, price, deliveryTime | belongs to Profile |
| Review | authorId, targetProfileId, stars (1–5), body, date | belongs to Profile |
| Post | authorId, body, hashtags\[\], media\[\], commentCount, likeCount, repostCount, viewCount | n Comments, Reactions |
| Comment | postId, parentCommentId, authorId, body, counts | self-referencing for threads |
| Event | title, hostId, coverImage, venue, city, startsAt, endsAt, tags\[\], ticketTypes\[\] | n Tickets |
| Ticket | eventId, userId, price, status, code | belongs to Event and User |
| Job | title, companyId, workModel, category, experienceRange, compensationMin/Max, period, location, description, postedAt | n Applications, n Bookmarks |
| Application | jobId, userId, status, submittedAt, viewedAt | belongs to Job and User |
| Room | name, category, description, coverImage, icon, accentColour, type (Public|Private|InviteOnly), permissions{}, rules\[\], memberCount, onlineCount | n RoomMembers, Messages, VoiceSessions |
| RoomMember | roomId, userId, role (owner|moderator|member), joinedAt | join table |
| Message | roomId, authorId, body, media\[\], reactions\[\], pinned, sentAt | belongs to Room |
| VoiceSession | roomId, startedBy, notifyScope (everyone|online), participants\[\], startedAt, endedAt | belongs to Room |
| Course | title, cover, lessonCount, durationRange, difficulty, ratingAvg, description, outcomes\[\] | n Lessons, Enrolments |
| Enrolment | courseId, userId, progressPct, lastLessonId, completedAt | join table |
| AiTool / AiToolRun | toolKey, category, badge; run: inputType (file|url), fileMeta, status, scores{}, recommendations\[\] | run belongs to User and AiTool |
| Notification | userId, type, title, body, deeplink, read, createdAt | belongs to User |

# **8\. Non-Functional Requirements**

| ID | Requirement | Pri. |
| :---- | :---- | :---- |
| NFR-01 | Cold start to interactive Home in under 2.5 seconds on a mid-range device over 4G. Feed and list screens paginate at 20 items. | P0 |
| NFR-02 | Room chat message delivery latency under 500 ms p95; voice join under 3 seconds; presence (online counts) accurate within 30 seconds. | P0 |
| NFR-03 | AI Portfolio Review completes in under 20 seconds p50 and under 60 seconds p95, with a determinate progress indicator throughout, matching the copy shown in the design. | P0 |
| NFR-04 | Accessibility: minimum 4.5:1 text contrast on the dark theme; minimum 44 × 44 pt touch targets; full VoiceOver/TalkBack labelling; support for OS dynamic type up to 200% without truncation. Several designed elements — 10–12 pt secondary greys on near-black, and the chip rows — need contrast and target-size verification before build. | P0 |
| NFR-05 | Offline: cached feed, job and event lists render read-only when offline with a clear indicator; composed posts and messages queue and retry. | P1 |
| NFR-06 | Privacy and data handling: uploaded portfolio files must be deleted within a defined retention window to substantiate the in-product claim “never stored permanently”. Document retention, processing location, and whether uploads are used for model training. | P0 |
| NFR-07 | Security: passwords hashed with a modern KDF, transport over TLS 1.2+, tokens rotated, third-party sign-in via OAuth 2.0/OIDC with no password storage for social accounts. | P0 |
| NFR-08 | Moderation: reporting on posts, comments, messages, rooms and users; moderator tooling for pinned messages, message removal and member removal; automated detection of the categories named in the default room rules. | P0 |
| NFR-09 | Localisation-ready: no hard-coded strings, locale-aware dates, times and currency. The design mixes £ and $ and uses D/M/YYYY dates — settle both. | P0 |
| NFR-10 | Analytics and crash reporting instrumented from first release (see Section 10). | P0 |
| NFR-11 | Scalability: real-time infrastructure sized for rooms of at least 10,000 members with 500 concurrent voice listeners. | P1 |
| NFR-12 | Compliance: age gate, terms and privacy acceptance at signup, GDPR/UK-GDPR data export and deletion. | P0 |

# **9\. Design System and UI Specification**

## **9.1 Foundations**

| Token | Value / description |
| :---- | :---- |
| Artboard | 430 × 932 pt (iPhone Pro Max class). All layouts must reflow for 375 pt width. |
| Theme | Dark only. Near-black page background with elevated surfaces for cards and sheets. |
| Primary accent | Gold/amber — used for primary CTAs, active tab state, section links and highlights. |
| Secondary accent | Green — used for course/learning CTAs, success states and the voice-chat start action. |
| Destructive | Red — used for End voice chat and other irreversible actions. |
| Surfaces | Three levels: page background, card surface, and raised sheet/modal surface. |
| Text | Two levels: high-emphasis white and low-emphasis grey for supporting copy. |
| Corner radius | Approximately 12–16 pt for cards and inputs; fully rounded (pill) for chips and primary buttons. |
| Iconography | Single-weight line icons; the file contains a dedicated Icons page. |

**Action required:** the values above are read from rendered frames, not from Figma variables. Before implementation, export the exact colour, type and spacing tokens from the file and replace this table with the canonical set.

## **9.2 Component inventory**

Components defined in the Figma file, with the states each must support:

| Component | States / variants | Used in |
| :---- | :---- | :---- |
| Role selection card | Default, selected (accent border \+ filled icon) — for each of Creative, Business, User | Onboarding role selection |
| Chip / Select button | Default, selected | Skills & Goals, Jobs categories, Rooms categories, Tools filter |
| Button | Default (neutral), primary (gold), success (green), destructive (red), disabled | Global |
| Like | Inactive, active — heart and thumb variants | Feed, post detail, messages |
| Bookmark | Inactive, active | Job cards, feed |
| Slider | Track, fill, handle with value bubble | Jobs filter price range |
| Reviews | Star rating row with reviewer block | Profile reviews tab |
| Reply | Quoted-message composer with dismiss | Room chat, post detail |
| Bottom navigation | Five items, active/inactive | Primary shell |
| Sub navigation | Three items, active/inactive | Skills Vault |
| Progress bar | Determinate with percentage label | Onboarding, courses, AI analysis |
| Step indicator | n of 6 dots with completed/current/upcoming | Create Room wizard |

## **9.3 States that must be added**

The file contains happy-path frames almost exclusively. Every list and form needs the following before it can be built:

* Empty state — no jobs match, no events nearby, no rooms joined, no portfolio projects, no notifications.

* Loading state — skeletons for feed, job, event, room and course lists.

* Error state — request failed, with retry.

* Offline state — cached content banner.

* Form validation — inline field errors on all onboarding, login and create-room inputs.

* Permission prompts — camera and photo library for avatar and cover upload, microphone for voice chat, notifications on first launch.

# **10\. Analytics**

Minimum event set required to measure the goals in Section 1.6. All events carry userId, role, sessionId, platform and appVersion.

| Event | Properties | Measures |
| :---- | :---- | :---- |
| onboarding\_screen\_viewed | index (1–3), skipped | Funnel drop-off |
| role\_selected | role | Segment mix |
| skills\_goals\_submitted | skills\[\], goals\[\], workStyle, experience | Personalisation coverage |
| signup\_completed | method (email|google|facebook|linkedin) | Activation (G1) |
| search\_performed | surface, query length, resultCount | Discovery quality |
| job\_filter\_applied | filters{}, resultCount | Filter usage (G2) |
| job\_applied | jobId, source (featured|recent|search) | Opportunity engagement |
| job\_bookmarked | jobId | Intent signal |
| event\_ticket\_started / completed | eventId, price, ticketType | Monetisation (G5) |
| post\_created / post\_engaged | postId, action (like|comment|repost|bookmark|share) | Community health (G3) |
| room\_joined / room\_message\_sent | roomId, roomType | Community retention |
| voice\_session\_started / joined / ended | roomId, notifyScope, durationSec, peakListeners | Voice adoption |
| room\_created | stepReached, type, moderatorCount, ruleCount | Wizard completion |
| ai\_tool\_opened / ai\_run\_completed | toolKey, inputType, durationMs, overallScore | AI value (G4) |
| course\_started / lesson\_completed | courseId, lessonId, progressPct | Learning funnel |
| portfolio\_project\_published | projectId | Profile completeness |

# **11\. Sample Acceptance Criteria**

Illustrative Given/When/Then criteria for the highest-risk requirements. The delivery team should extend this pattern to every P0.

### **FR-ONB-04 — Role selection**

* Given I am on the role selection screen and have selected nothing, when I look at the Continue button, then it is visibly disabled and does not respond to taps.

* Given I tap Creative, when the selection registers, then the Creative card shows the selected treatment, any previously selected card is deselected, and Continue becomes enabled.

* Given I select Business and continue, when I later reach Home, then the Home content and available actions correspond to the Business role.

### **FR-JOB-06/07 — Job filters**

* Given I set Job Type to Remote and Category to Design, when I tap Apply Filter, then I return to Jobs, the list contains only remote design roles, and the filter icon shows an active-filter indicator with the count 2\.

* Given filters are active, when I tap Reset, then all controls clear, the indicator disappears, and the unfiltered list is restored.

* Given no jobs match my filters, when the result set is empty, then an empty state explains this and offers a one-tap Reset.

### **FR-ROOM-09/12 — Voice chat**

* Given I am a room member, when I start a voice chat and choose Online Members, then only members currently online receive a notification and the session becomes visible in the room header.

* Given a voice chat is live and I am the host, when I tap End, then a confirmation sheet appears; choosing End for Everyone terminates the session for all participants; choosing Cancel returns me to the live room with no change.

* Given I am a participant and not the host, when I leave, then the session continues for the remaining participants and the listening count decrements.

### **FR-AIP-02/06/08 — AI Portfolio Review**

* Given I select a 62 MB PDF, when I attempt to upload, then the file is rejected before upload begins with a message stating the 50 MB limit.

* Given a valid upload, when analysis runs, then the progress bar advances monotonically and the current stage label matches the stage actually executing.

* Given analysis completes, when the results render, then the overall score, all four sub-scores and at least three recommendations are present, and each sub-score is accompanied by its explanatory line.

* Given I tap Cancel during analysis, when the job aborts, then no result is stored and the uploaded file is deleted.

# **12\. Suggested Release Plan**

The designed surface is large for a single release. A three-phase sequence delivers a coherent product at each step; each phase is independently launchable.

| Phase | Scope | Rationale |
| :---- | :---- | :---- |
| Phase 1 — Identity & opportunity | Onboarding, auth, Profile with portfolio and reviews, Jobs with filters and applications, Home, Notifications | Establishes the profile that everything else depends on, and ships the clearest immediate value |
| Phase 2 — Community | Community feed, post detail and compose, Rooms directory and chat, Create Room wizard, moderation and reporting | Retention layer; requires real-time infrastructure and a moderation function to be in place |
| Phase 3 — Events & Skills Vault | Events with ticketing and checkout, Skills Vault dashboard, Tools with AI Portfolio Review, Learn with course player | Monetisation and differentiation; depends on payments and an AI/content pipeline |

*Voice chat is the single most expensive item in Phase 2 and should be validated as a separate spike before it is committed to a release.*

# **13\. Open Questions and Design Gaps**

Each item needs an owner and a decision. Items marked Blocking prevent the associated module from being built.

| ID | Question / gap | Impact |
| :---- | :---- | :---- |
| OQ-01 | What is BITC? The name is never expanded anywhere in the design. Confirm the full name, the positioning statement and the tone of voice. | Blocking — copy |
| OQ-02 | Which market ships first? Content shows Birmingham and Shoreditch (UK) and a £ price slider, while job cards quote $. Settle market, currency and date format (the design uses 31/8/2025). | Blocking — Jobs, Events |
| OQ-03 | Ticketing is undesigned. Are events free, paid, or both? Who is the merchant of record? What does a purchased ticket look like and how is entry validated? | Blocking — Events |
| OQ-04 | Job application is undesigned. Does Apply submit a stored profile, or open a form with attachments? Where does a user see application status? | Blocking — Jobs |
| OQ-05 | Business and User role variants of Home, Profile and the Skills Vault do not exist. What changes per role? | Blocking — Home, Profile |
| OQ-06 | The Mentorship tab in Community has no content. Is mentorship a directory, a booking flow, or a feed filter? Is it paid? | Blocking — Community |
| OQ-07 | Two conflicting experience-level taxonomies: onboarding uses Beginner/Intermediate/Expert/Advanced; the Jobs filter uses Internship/Junior/Mid-level/Senior. One canonical list is needed. | Blocking — data model |
| OQ-08 | The Jobs filter uses radio controls for lists that read as multi-select (Category, Job Type). Confirm single vs multi-select per group. | High — Jobs |
| OQ-09 | Is Services a fourth profile tab, a section within Portfolio, or a separate surface? The frame named “Services” shows the Reviews tab selected. | High — Profile |
| OQ-10 | Is there any 1:1 direct messaging? Only group Rooms are designed, yet hiring and mentorship both imply private conversation. | High — scope |
| OQ-11 | Course tab contents (Lessons, Requirements, Reviews) and the lesson player are undesigned. Who authors courses, and is content licensed or produced in-house? | High — Skills Vault |
| OQ-12 | AI Rate Calculator and Brief Interpreter appear in the catalogue with no flows. Are they v1 or placeholders? | High — Skills Vault |
| OQ-13 | What is the retention period for portfolio uploads, and are they used for model training? The UI promises they are “never stored permanently”. | Blocking — legal |
| OQ-14 | What earns the verification badge shown on the profile? | Medium — Profile |
| OQ-15 | Moderation model: who reviews reports, what is the SLA, and what tooling do room moderators get? Default room rules exist but no enforcement flow does. | Blocking — Community |
| OQ-16 | The voice room shows video and screen-share controls. Are these in scope, or should they be removed from the design? | High — Rooms |
| OQ-17 | No settings area exists (notification preferences, privacy, blocked users, sign out, delete account). Required for store approval. | Blocking — release |
| OQ-18 | Copy defects in the design must not ship: the frame “Skils vault”, the job title “Project Manger”, and the timestamp “1:34 OM” (should read PM). | Low — copy |
| OQ-19 | Is a light theme or any dynamic-type/large-text mode required? The design is dark-only with dense small type. | Medium — accessibility |
| OQ-20 | What is the monetisation model at launch — ticket commission, job posting fees, subscription for AI tools, or none? | High — business |

# **Appendix A — Frame Inventory**

Every top-level frame and component in the Figma file, page “Design”, as read on 3 September 2026\.

| Group | Frames |
| :---- | :---- |
| Onboarding (section “Creative”) | Onboarding 1, Onboarding 2, Onboarding 3, Onboarding 4 (role selection), Onboarding 5 (Skills & Goals), Profile Setup, Login |
| Core shell (section “Section 1”) | Home, Jobs, Events, Community, Rooms |
| Content | Post view, Filter (×2), Notification, Notification View, profile, Portfolio, Services, Portfolio View |
| Rooms & voice | Chat room, start chat, End |
| Create Room | Six wizard steps plus the success screen |
| Skills Vault | Skils vault, Learn, Course view, Course view 1, Course view 2, Tools |
| AI Portfolio Review | Portfolio 1 (intro), Portfolio 2 (upload), Portfolio 3 (analysing), Portfolio 4 (results) |
| Components | Role selection, Like (×2), Bookmark, Button, Slider, Select button, Reviews, reply, Component 1–6 |
| Second page | Icons |

*Note on method: this inventory and every requirement above were derived by reading the Figma file directly at 50% zoom, frame by frame. No prototype links, developer-mode specs or design tokens were available without edit access, so measurements, colours and interaction wiring are inferred from rendered output and must be confirmed against the source file before implementation.*