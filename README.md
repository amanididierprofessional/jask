# Jask

make it minimal and creative social app for this niche
Go with 2 · Campus Creative Feed
yeah finish it now so that i can eevn test it now and add teh real database

Locked:
- Product name: Jask (Tagline: "Just Ask. Find the people. Find the answers.")
- Visual direction: Campus Creative
- Brand & UI Tokens:
  - Primary Brand Blue: #1877F2 (buttons, active pills, links, brand header, live indicator card)
  - Secondary Accent Green: #58CC02 with depth #46A302 (accepted answers, verified check badges, positive milestones)
  - Ink text: #14213D
  - Muted secondary text: #6B7590
  - Ground background: #F3F5FA
  - Card surfaces: #FFFFFF with rounded-[28px] corners and subtle shadow (0 2px 12px rgba(20,33,61,0.06))
- Typography:
  - Display / Headlines: Nunito (font-weights 700, 800, 900)
  - Body & Metadata: Inter (font-weights 400, 500, 600)
- Designed screens to build from the attached mockups:
  1. Campus Feed (feed-take-creative): Jask wordmark header with campus switcher ("Trinity College • 14 peers active"), live study banner ("14 classmates studying CS 204 right now" with avatar facepile and "Need Help?" button), question cards showing author avatar, major/year, course module pill (e.g. Linear Algebra, Algorithms), problem title, "Tag a helper" action, verified answers pill (green #58CC02), inline helper recommendation ("Sarah Vance has completed this module • Invite to answer"), and bottom floating "Just Ask a Question +" CTA.
  2. Question Discussion & Answer View (question-detail): Back navigation with module tag ("CS 204 • Linear Algebra"), author card with study status ("Midterm Prep"), detailed academic problem prompt, accepted answer card with bright green ring and badge ("Accepted Solution • Verified by Sarah Vance"), upvotes/helpful counter, replies, community answers, and sticky bottom composer.
- Specifications from attached Jask master document:
  - Lovable Cloud PostgreSQL backend with full schema: institutions, departments, courses/modules, user profiles, questions, answers, votes, bookmarks, notifications.
  - Auth: student registration, sign in, profile setup (university, major, graduation year, enrolled courses).
  - Academic Relevance: filter feed by student's enrolled courses or all campus discussions.
  - Question Publishing: composer with title, academic details, module selection, and helper tagging.
  - Accepted Solution: question author can mark the verified answer.
  - Peer Discovery: browse classmates who have completed or excel in specific modules.

Open:
- Complete database schema creation and initial seeding with authentic academic questions and answers (Discrete Math, Linear Algebra, Algorithms, Distributed Systems) so the app can be immediately tested end-to-end.
- Responsive scaling for tablet and desktop with side navigation and study rooms panel.
- Live interactive voting, bookmarking, and instant answer posting.
- Course module filter bar with search.

build a real working app, not a clickable prototype; the screen and kit files show layout, content and look (a wireframe's, structure only) and are never code to copy. The screens are the moments the user designed, not the whole product. Before building, walk through each flow as its user would and design what the pictures leave out, as a product designer would for this product: the steps a flow needs to finish and how the app responds to what the user does, including the moments its users will actually run into, like waiting on something or finding nothing yet. Add nothing a user of this product would never meet, and keep an app the user wants simple, simple. Never leave a step the product's core flows need as "coming soon", unless the brief says the user chose to. Where such a step needs an outside service, build every part up to it and say in your reply what's left to connect. Fill product gaps only, never a look the design set: an added step reuses the UI kit's tokens, chrome and parts and the nearest designed screen's layout, with no new visual direction. Look at every screen's picture before writing code; design.md says which picture or sheet holds each screen. Open the UI kit's shells and parts HTML for the header, tab bar, composer and components, not only its tokens. Use each finished screen's copy exactly as design.md lists it; never invent copy for one. A wireframe under design.md's Wireframes gives structure only: build it in the design's look, as design.md says. The screens' photos are placeholders for the mockups only: replace every photo design.md lists with the user's own upload for it, else as design.md says (a photo without people re-composed with imagegen--edit_image from it as a reference, a photo of people generated from its brief and never from the photo), and ship no set photo or its URL. For a design that came with no design.md, every photo on assets.lovable.dev or images.unsplash.com is a set photo: replace it with the user's own upload for it, else a new image generated for its slot, any person in it one who doesn't exist, never from the photo or a picture showing it. Build and check each screen at the canvas it was drawn at: phone 393×764, tablet landscape 1133×744, tablet portrait 744×1133, desktop 1280×832. After building, screenshot the app at those sizes and states, compare each finished screen with its picture, and fix every visual difference you didn't choose; check a wireframe's screen against its structure, never its grey look. End your reply with "Changed from the mockups": each deliberate change and why, and "Added beyond the mockups": each step, state or interaction you built that no screen shows.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://jask.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e449314a-9df7-4ee9-aad5-3a4740e5fa4d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
