# Higgsfield AI Clone --- Product Requirements & 24-Hour Build Plan

**Assignment:** 8x Software Engineer practical assessment\
**Reference product:** Higgsfield AI\
**Document purpose:** Single source of truth for the coding agent and
implementation team\
**Prepared:** 16 September 2026\
**Primary reference:** User-captured screenshots + direct exploration of
the live Higgsfield product\
**Implementation target:** High-fidelity product shell + genuinely
functional core AI workflows within the 24-hour window

------------------------------------------------------------------------

# 1. Executive Summary

The goal is to rebuild a convincing, working version of Higgsfield AI
rather than merely creating a static visual mockup.

The implementation strategy is:

1.  Reconstruct the **full visible product shell and information
    architecture**.
2.  Reproduce the **main navigation, landing/home experience,
    authentication, generation screens, settings, history, and
    supporting UI states**.
3.  Make the highest-value workflows genuinely functional:
    -   image generation
    -   video generation
    -   audio/text-to-speech
    -   generation history/results
    -   uploads/references where required
4.  Build the UI for the broader Higgsfield surface even when some
    underlying ecosystems cannot be fully reproduced in 24 hours.
5.  Prioritize product judgment: build the core creation loop first and
    explicitly leave low-value infrastructure or large external
    ecosystems simplified.
6.  Use the supplied screenshots as the visual reference. When a
    screenshot exists, do not invent a materially different layout
    without a reason.
7.  Use real AI APIs/models where practical. Do not fake the core
    generation workflows with hard-coded demo outputs.

The assignment is judged on **speed, product judgment, and UX/UI**.
Therefore, breadth alone is not the objective. The objective is to make
the most important parts feel like a coherent, polished product and to
demonstrate that the core creation loop actually works.

------------------------------------------------------------------------

# 2. Important Scope Principle

This is a **24-hour reconstruction**, not an attempt to reproduce
Higgsfield's entire production infrastructure.

Higgsfield is a large AI creative platform containing many products,
models, integrations, studios, community surfaces, and supporting
systems. Reproducing its proprietary models, internal orchestration,
production-scale queues, billing infrastructure, social graph,
enterprise controls, and external integrations in one day is not
realistic.

Therefore every feature must be classified using two independent
dimensions:

### UI coverage

Does the clone contain the screen/navigation/component?

### Functional depth

Does the feature actually perform its underlying job?

A feature can therefore be:

-   **UI + Fully functional**
-   **UI + Minimal functional implementation**
-   **UI + Representative/demo implementation**
-   **Not implemented because it is outside the useful 24-hour scope**

The core image/video/audio creation journey should be in the first
category whenever technically feasible.

------------------------------------------------------------------------

# 3. Evidence and Reference Material

## 3.1 Supplied screenshot set

The supplied ZIP contains 19 PNG screenshots captured from the
live/reference product.

Observed screenshot files:

-   `Screenshot 2026-09-16 211457.png`
-   `Screenshot 2026-09-16 211554.png`
-   `Screenshot 2026-09-16 211712.png`
-   `Screenshot 2026-09-16 211759.png`
-   `Screenshot 2026-09-16 211834.png`
-   `Screenshot 2026-09-16 211903.png`
-   `Screenshot 2026-09-16 211927.png`
-   `Screenshot 2026-09-16 211951.png`
-   `Screenshot 2026-09-16 212010.png`
-   `Screenshot 2026-09-16 212024.png`
-   `Screenshot 2026-09-16 212045.png`
-   `Screenshot 2026-09-16 212104.png`
-   `Screenshot 2026-09-16 212229.png`
-   `Screenshot 2026-09-16 212310.png`
-   `Screenshot 2026-09-16 212329.png`
-   `Screenshot 2026-09-16 212424.png`
-   `Screenshot 2026-09-16 212453.png`
-   `Screenshot 2026-09-16 212513.png`
-   `signup.png`

## 3.2 What the screenshots establish

The screenshots show a dark, media-heavy AI creative product with:

-   neon/lime accent color
-   dark near-black application surfaces
-   large visual cards
-   dense top navigation
-   model/tool discovery
-   image, video, and audio generation surfaces
-   authentication
-   feature/product landing sections
-   model selection
-   generation controls
-   references/uploads
-   history/how-it-works areas
-   community/project discovery
-   Cinema Studio
-   Marketing Studio
-   Supercomputer
-   Genjutsu
-   3D Jutsu
-   Edit
-   Academy
-   Community
-   MCP / ChatGPT Plugin
-   pricing/enterprise
-   extensive AI model/tool catalog

The screenshots should be copied into a repository reference directory
so the coding agent can inspect them locally.

Recommended repository structure:

``` text
/reference/
  /auth/
  /home/
  /image/
  /video/
  /audio/
  /studios/
  /features/
  /community/
  /footer/
```

If the screenshots are not already organized, preserve the original
filenames and optionally create a mapping file.

------------------------------------------------------------------------

# 4. Current Product Surface Observed / Verified

The current Higgsfield product surface is much larger than the three
core generators.

The screenshot set visibly includes or references:

## Primary creation categories

-   Image
-   Video
-   Audio
-   Edit
-   Mixed Media
-   Canvas

## AI / creative tools

-   Genjutsu
-   Effects
-   3D Jutsu
-   Face Swap
-   Character Swap
-   Inpaint
-   Relight
-   Image Upscale
-   Reframe
-   Motion Control
-   Soul ID
-   AI Influencer
-   Photodump
-   Click to Ad
-   Change Color Palette

## Studios

-   Cinema Studio
-   Marketing Studio
-   Supercomputer
-   Faceless Studio
-   Shorts Studio
-   Higgsfield Explainer

## Learning / community

-   Academy
-   Community
-   Contests
-   Creator Hub / guides
-   Prompt / model guidance

## Integrations / agent surfaces

-   MCP
-   CLI / Skills
-   ChatGPT Plugin

## Model catalog

The reference screenshots show Higgsfield exposing many first-party and
third-party models. The exact model list changes frequently, so the
clone should not hard-code the entire production catalog into the
architecture.

The implementation should instead support a configurable model registry:

``` text
Model
- id
- name
- provider
- type: image | video | audio | edit
- description
- thumbnail
- capabilities
- supported inputs
- supported aspect ratios
- supported durations
- status
- priority
```

This allows the UI to display a representative catalog while the actual
functional integrations remain focused on the selected models.

------------------------------------------------------------------------

# 5. Product Information Architecture

## Global top navigation

The reference product exposes a broad navigation structure similar to:

``` text
Explore
Image
Video
Audio
MCP
ChatGPT Plugin
Genjutsu
Effects
Cinema Studio
Marketing Studio
Supercomputer
3D Jutsu
Edit
Academy
Community
Pricing
Enterprise
Login / Account
```

Some items are marked as:

-   New
-   Free
-   Premium
-   Promotional
-   Tool-specific

The clone should reproduce the visual hierarchy and navigation density
without needing every destination to have a complete production backend.

## Navigation rule

All visible primary navigation items should be clickable.

If a feature is not fully implemented:

-   route to its intended screen
-   preserve the product shell
-   show the appropriate UI
-   clearly keep the experience coherent
-   avoid dead links
-   optionally show an intentional "coming soon / limited demo" state
    only where necessary

Do not leave obviously broken navigation.

------------------------------------------------------------------------

# 6. Authentication Requirements --- P0

Authentication is important and must not be treated as optional.

## Sign-up

The reference signup screen shows:

-   Welcome to Higgsfield
-   Sign up and generate for free
-   business email option
-   Google
-   Apple
-   Microsoft
-   email signup
-   free credits
-   age confirmation
-   marketing/premium offer messaging
-   product/model promotional artwork

### Clone requirements

Implement:

-   signup form
-   email validation
-   password validation
-   account creation
-   session persistence
-   redirect to application
-   login
-   logout
-   protected routes

Social login can be represented in the UI if external OAuth setup would
consume disproportionate time, but email authentication should be real.

## Login

Implement:

-   email
-   password
-   validation
-   login state
-   loading state
-   invalid credentials state
-   redirect
-   logout

## Authentication architecture

Recommended:

``` text
Frontend
   |
   | HTTPS
   v
Auth/API
   |
   +-- Users
   +-- Sessions / JWT
   +-- User preferences
   +-- Credits
```

Never place API secrets in frontend code.

------------------------------------------------------------------------

# 7. Global Application Shell --- P0

The shell is one of the highest-value areas because every other screen
depends on it.

## Required elements

-   persistent navigation
-   logo/brand
-   active route state
-   top promotional banner where applicable
-   user/account area
-   credits/usage indicator
-   notifications placeholder
-   responsive navigation
-   main content container
-   consistent page background
-   modal system
-   toast/notification system
-   loading states

## Visual language

The screenshots indicate:

-   near-black background
-   dark gray cards/panels
-   high-contrast white text
-   lime/neon green accent
-   large editorial imagery
-   rounded controls
-   compact controls around generators
-   large headings on marketing sections
-   bright CTA buttons
-   media-first cards

The clone should establish design tokens:

``` text
--background
--surface
--surface-elevated
--surface-muted
--border
--text-primary
--text-secondary
--accent
--accent-hover
--danger
--success
```

Do not scatter raw colors throughout the codebase.

------------------------------------------------------------------------

# 8. Home / Explore --- P0/P1

The reference home/explore experience is heavily visual.

Observed sections include:

-   promotional hero
-   current/highlighted models
-   featured tools
-   image/video/audio discovery
-   community/project previews
-   feature cards
-   Cinema Studio promotion
-   Marketing Studio promotion
-   Supercomputer promotion
-   Genjutsu promotion
-   model cards
-   use-case sections
-   footer feature directory

## Functional expectation

The home page does not need a real social recommendation engine.

It should have:

-   real navigation
-   real CTA routing
-   representative content
-   polished media cards
-   responsive layout

Prioritize visual fidelity over backend complexity.

------------------------------------------------------------------------

# 9. Image Generation --- P0 / CORE FUNCTION

This is one of the primary functional features.

The reference image generation surface contains a model/tool selection
experience and a generator workspace.

Observed/required concepts:

-   prompt
-   model
-   image references
-   generation
-   aspect ratio
-   resolution/quality
-   batch size
-   generation history
-   result gallery
-   download/open result
-   retry
-   reuse prompt
-   model information
-   credits/cost indicator
-   loading state

The current product also exposes multiple image models, including
proprietary and partner models. The clone should use a model abstraction
rather than implementing every model.

## Minimum functional workflow

``` text
Login
  ↓
Image
  ↓
Enter prompt
  ↓
Choose model
  ↓
Choose aspect ratio
  ↓
Generate
  ↓
Loading/progress
  ↓
Real AI API
  ↓
Image result
  ↓
Save to history
  ↓
Download / reuse
```

## Reference image workflow

Support at least one uploaded reference image if the chosen provider
supports it.

The UI should allow:

-   drag/drop
-   file picker
-   preview
-   remove
-   generate with reference

## Result state

A result card should support:

-   preview
-   open larger
-   download
-   regenerate
-   use as reference
-   delete/remove
-   prompt/model metadata where practical

------------------------------------------------------------------------

# 10. Video Generation --- P0 / CORE FUNCTION

The video screen shown in the supplied screenshots contains:

-   Create Video
-   Edit Video
-   Motion Control
-   History
-   How it works
-   preset/general modes
-   references
-   image/video/audio input
-   prompt
-   model
-   duration
-   aspect ratio
-   quality/settings
-   generation button
-   generation progress/result

## Minimum functional workflow

``` text
Image or prompt
     ↓
Optional references
     ↓
Choose video model
     ↓
Prompt
     ↓
Duration / aspect ratio
     ↓
Generate
     ↓
Async job
     ↓
Poll job status
     ↓
Completed video
     ↓
Preview
     ↓
Download / save history
```

## Important implementation detail

Video generation must be treated as an asynchronous job.

Do not block the HTTP request until the video is finished.

Recommended:

``` text
POST /api/generations/video
        |
        v
Create generation record
        |
        v
Call provider
        |
        v
Return job ID
        |
        v
Frontend polls / subscribes
        |
        v
pending -> processing -> completed/failed
```

Generation state:

``` text
queued
processing
completed
failed
cancelled
```

## If provider supports webhooks

Use:

``` text
provider webhook
      ↓
backend
      ↓
generation status
      ↓
frontend
```

Otherwise polling is acceptable for the assessment.

------------------------------------------------------------------------

# 11. Audio / Text-to-Speech --- P0/P1

The supplied screenshot shows an Audio page with:

-   Text to Speech
-   Voice Change
-   Translate
-   media upload
-   script field
-   voice selection
-   model
-   voice details
-   speed
-   pitch
-   volume
-   batch size
-   advanced settings
-   generation
-   history
-   how it works

## Minimum functional workflow

``` text
Audio
 ↓
Text to Speech
 ↓
Enter script
 ↓
Choose voice/model
 ↓
Generate
 ↓
Audio result
 ↓
Play
 ↓
Download
 ↓
History
```

If the selected provider supports it, implement:

-   voice preset selection
-   speed
-   pitch
-   audio preview

Voice Change and Translate should initially be P1/P2 unless a suitable
API can be integrated quickly.

------------------------------------------------------------------------

# 12. Generation History --- P0

Every real generation should create a history record.

Minimum schema:

``` text
Generation
- id
- userId
- type
- prompt
- model
- status
- inputAssets
- outputAssets
- settings
- providerJobId
- error
- createdAt
- completedAt
```

History UI:

-   Images
-   Videos
-   Audio
-   All
-   status
-   thumbnail
-   prompt
-   model
-   date
-   open
-   download
-   regenerate

This makes the product feel like a real application rather than isolated
API demos.

------------------------------------------------------------------------

# 13. Assets / Storage --- P0/P1

Generated media needs persistent URLs.

Recommended architecture:

``` text
User
 ↓
Generation
 ↓
Object storage
 ↓
Public/signed asset URL
```

Options may include:

-   S3-compatible storage
-   Supabase Storage
-   Cloudinary
-   another practical object-storage provider

Do not store large video/image binaries directly in PostgreSQL.

------------------------------------------------------------------------

# 14. Model Selection System

The reference UI exposes many models.

The clone should implement a generic model picker:

``` text
Model Picker
├── Search
├── Recommended
├── Image
├── Video
├── Audio
├── Premium
├── New
└── Recently used
```

Each model entry should contain:

-   name
-   icon/logo
-   description
-   type
-   supported inputs
-   supported outputs
-   supported settings
-   cost
-   availability

The frontend should render this from configuration.

Do not hard-code model-specific UI into every generator page.

------------------------------------------------------------------------

# 15. Image Editing --- P1

The current product surface includes image editing capabilities such as:

-   Inpaint
-   Relight
-   Upscale
-   Face Swap
-   Character Swap
-   image-to-image/reference blending
-   background/object changes

Official product material describes image editing around model
switching, references, inpainting, object/pose edits, and image-to-image
workflows.

For the assessment:

### P1 minimum

Build the UI and one real editing path if an API is readily available.

Example:

``` text
Upload image
 ↓
Describe change
 ↓
Choose model
 ↓
Generate edit
 ↓
Compare original/result
 ↓
Save/download
```

### Other tools

Represent in the UI and route correctly, but do not let them consume the
time required for core image/video/audio generation.

------------------------------------------------------------------------

# 16. Video Editing --- P1/P2

The current product exposes video editing and model-based editing.

Potential capabilities include:

-   text-based video edits
-   motion control
-   object changes
-   restyling
-   background changes
-   color adjustments
-   reframing
-   enhancement
-   captions/localization

A full timeline editor is **not** required for the 24-hour clone.

A good minimum is:

``` text
Upload video
 ↓
Choose edit
 ↓
Prompt
 ↓
Provider/API
 ↓
Result
```

------------------------------------------------------------------------

# 17. Genjutsu --- P1/P2

Reference screenshots prominently show Genjutsu.

Current Higgsfield material describes Genjutsu as a way to rebuild part
of an existing clip without a full reshoot, including motion transfer
and object swapping.

Minimum UI:

-   upload video
-   reference images
-   choose operation
-   prompt/preset
-   generate
-   progress
-   result comparison
-   download

If a practical provider/API is unavailable, implement the complete UI
and a clearly scoped representative flow rather than spending the
majority of the 24-hour window reproducing a proprietary pipeline.

------------------------------------------------------------------------

# 18. Cinema Studio --- P1/P2

Cinema Studio is a major Higgsfield product surface.

The current official material describes it as a cinematic filmmaking
environment with:

-   camera control
-   lens/optics
-   lighting
-   multi-shot scenes
-   reusable characters/locations/props
-   color grading
-   AI Director
-   references
-   different Cinema Studio versions

The supplied screenshots also show Cinema Studio promotional/creation
surfaces.

## Clone objective

Build the visual workspace, not the entire filmmaking infrastructure.

UI should include:

-   scene/project area
-   prompt
-   references/elements
-   camera controls
-   lens
-   movement
-   lighting
-   style/color
-   generation
-   shot/result cards
-   scene/project navigation

If time permits, connect Cinema Studio's core generation button to the
same video generation abstraction used elsewhere.

------------------------------------------------------------------------

# 19. Marketing Studio --- P1/P2

The reference screenshots show Marketing Studio as a major product area.

Current Higgsfield material describes it as a workspace for:

-   UGC
-   product shots
-   ads
-   marketplace imagery
-   posters
-   motion graphics
-   templates
-   product URL/image input

The current product also uses template-driven workflows.

## Clone

Build:

``` text
Marketing Studio
├── Template gallery
├── Product input
├── Upload product
├── Product URL
├── Brand/creative settings
├── Generate
└── Results
```

A small representative template catalog is sufficient.

Do not build a 1,500-template backend for this assessment.

------------------------------------------------------------------------

# 20. Supercomputer --- P2

The screenshot shows Supercomputer as an agent-powered creative
workspace.

Current official material describes Supercomputer as a chat-driven
system that can build, generate, market, and automate projects using
skills/connectors.

Clone:

-   chat interface
-   prompt
-   project/task history
-   skill/tool cards
-   generation/action result
-   basic conversation persistence

A true autonomous agent ecosystem is not necessary for the core
assessment.

If implemented, connect the chat to a controlled set of application
actions:

``` text
"Create an image"
       ↓
tool call
       ↓
image generation
       ↓
result in chat
```

------------------------------------------------------------------------

# 21. 3D Jutsu --- P2

Reference screenshots identify 3D Jutsu as a feature.

UI:

-   3D/project workspace
-   upload/reference
-   scene preview
-   generation controls
-   result/export

Full 3D generation infrastructure is outside P0.

------------------------------------------------------------------------

# 22. Canvas --- P1/P2

Current Higgsfield material describes Canvas as a workflow surface for
chaining models and collaborating on generations.

The screenshot shows a "one canvas, every workflow" positioning.

Clone minimum:

-   canvas area
-   nodes/cards
-   input
-   model/generation nodes
-   connect nodes
-   execute
-   output
-   save workflow

A basic node editor is enough to demonstrate the concept.

------------------------------------------------------------------------

# 23. Effects --- P2

Effects is a discovery/library surface containing one-click
transformations.

The reference screenshots show visual effects and collections.

Clone:

-   searchable effect grid
-   categories
-   preview cards
-   effect detail
-   use effect CTA

Representative/static effect catalog is acceptable.

------------------------------------------------------------------------

# 24. Community --- P2/P3

The screenshots show community/project discovery.

Current product material describes community/project exploration.

Clone:

-   project gallery
-   cards
-   creator name/avatar
-   prompt/details
-   model
-   preview
-   open/recreate CTA

Do not build:

-   complex social graph
-   moderation
-   recommendation engine
-   full creator monetization

unless time remains.

------------------------------------------------------------------------

# 25. Academy --- P3

Academy should exist as a polished destination.

UI:

-   learning cards
-   categories
-   course/detail pages
-   progress indicator
-   article/tutorial cards

Functional learning management is not required.

------------------------------------------------------------------------

# 26. Contests --- P3

Build the visible discovery UI:

-   contest cards
-   deadlines
-   submissions
-   leaderboard placeholder
-   contest detail

Full contest infrastructure is outside the 24-hour scope.

------------------------------------------------------------------------

# 27. MCP / CLI / ChatGPT Plugin --- P2/P3

These are important differentiators but are external integration
ecosystems.

The screenshots show MCP and ChatGPT Plugin as prominent product
concepts.

The clone should provide:

-   integration landing page
-   explanation
-   install/connect CTA
-   example workflows
-   code/config snippets if appropriate
-   status/connected state

If implementing MCP is practical, expose one useful generation tool:

``` text
generate_image
generate_video
generate_audio
```

Do not spend the core build window implementing every integration.

------------------------------------------------------------------------

# 28. Pricing / Credits --- P1/P2

The reference product prominently uses:

-   credits
-   premium plans
-   discounts
-   free generation
-   usage limits

Clone:

-   credits indicator
-   generation cost
-   pricing page
-   plan cards
-   upgrade CTA

For the assessment, actual payment processing is not required.

A simple internal credit ledger is useful:

``` text
UserCredits
- userId
- balance
- updatedAt

CreditTransaction
- id
- userId
- amount
- type
- generationId
- createdAt
```

Real billing can remain outside scope.

------------------------------------------------------------------------

# 29. Settings --- P1

Build:

-   account
-   profile
-   preferences
-   appearance if relevant
-   notifications
-   connected accounts
-   credits/subscription
-   logout
-   delete/account actions where safe to represent

------------------------------------------------------------------------

# 30. Error / Loading / Empty States --- P0

This is essential for perceived product quality.

Every major workflow needs:

### Loading

-   skeletons
-   spinner/progress
-   generation status
-   disabled generate button where appropriate

### Empty

Examples:

-   no history
-   no projects
-   no community results
-   no assets

### Error

Examples:

-   invalid prompt
-   provider failure
-   upload failure
-   generation timeout
-   insufficient credits
-   authentication failure

### Retry

Every recoverable generation error should offer retry.

------------------------------------------------------------------------

# 31. Responsive Design --- P1

The reference is primarily desktop-oriented, but the clone should not
break at smaller widths.

Minimum:

-   desktop
-   tablet-ish width
-   mobile navigation
-   generator controls stack appropriately
-   media cards reflow
-   no horizontal overflow

Do not spend hours perfecting every mobile screen before desktop core
flows work.

------------------------------------------------------------------------

# 32. Technical Architecture

A practical architecture for a 24-hour build:

``` text
                 ┌───────────────────────┐
                 │       Next.js         │
                 │  App Router / React   │
                 └───────────┬───────────┘
                             │
                    HTTPS / API
                             │
                 ┌───────────▼───────────┐
                 │       Backend         │
                 │ API / server routes   │
                 └──────┬───────┬────────┘
                        │       │
             ┌──────────┘       └──────────┐
             ▼                             ▼
      PostgreSQL                     AI Providers
      Users                          Image
      Generations                    Video
      Assets                         Audio
      Credits
             │
             ▼
       Object Storage
```

A separate .NET backend is possible because of the engineer's
background, but for a 24-hour visual/product assessment, a single
Next.js application with server-side API routes can reduce integration
and deployment overhead.

The architecture should still maintain clear boundaries so the AI
provider layer can be swapped.

------------------------------------------------------------------------

# 33. AI Provider Abstraction

Never couple the entire UI directly to one provider.

Use:

``` text
AIProvider
├── generateImage()
├── generateVideo()
├── generateAudio()
├── editImage()
└── editVideo()
```

Then:

``` text
ImageProvider
VideoProvider
AudioProvider
```

Example conceptual interface:

``` typescript
interface ImageGenerationProvider {
  generate(input: ImageGenerationInput): Promise<GenerationJob>;
  getStatus(jobId: string): Promise<GenerationStatus>;
}
```

This makes it possible to replace a provider without rewriting the UI.

------------------------------------------------------------------------

# 34. Generation Job Architecture

All expensive AI operations should follow the same conceptual model.

``` text
POST /api/generations
        ↓
validate
        ↓
create DB record
        ↓
call provider
        ↓
provider job ID
        ↓
return local generation ID
        ↓
poll/webhook
        ↓
update DB
        ↓
store output
        ↓
frontend displays result
```

Use a common status model:

``` text
queued
processing
completed
failed
cancelled
```

------------------------------------------------------------------------

# 35. Suggested Data Model

Minimum:

``` text
User
- id
- email
- passwordHash
- name
- avatarUrl
- createdAt

Session
- id
- userId
- expiresAt

Generation
- id
- userId
- type
- model
- prompt
- status
- settingsJson
- providerJobId
- error
- createdAt
- completedAt

Asset
- id
- userId
- generationId
- type
- url
- thumbnailUrl
- metadataJson
- createdAt

CreditBalance
- userId
- balance

CreditTransaction
- id
- userId
- amount
- reason
- generationId
- createdAt
```

Optional:

``` text
Project
Workflow
WorkflowNode
SavedPrompt
Favorite
CommunityPost
Notification
```

Do not add tables without a product reason.

------------------------------------------------------------------------

# 36. API Surface

Suggested routes:

``` text
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/models
GET    /api/models/:id

POST   /api/generations/image
POST   /api/generations/video
POST   /api/generations/audio

GET    /api/generations
GET    /api/generations/:id
POST   /api/generations/:id/retry
DELETE /api/generations/:id

POST   /api/assets/upload
GET    /api/assets

GET    /api/credits
GET    /api/credits/transactions

GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
```

For provider callbacks:

``` text
POST /api/webhooks/<provider>
```

Protect authenticated routes.

------------------------------------------------------------------------

# 37. Frontend Route Map

Suggested:

``` text
/
 /login
 /signup

 /explore

 /generate
 /generate/image
 /generate/video
 /generate/audio

 /edit
 /edit/image
 /edit/video

 /genjutsu
 /effects
 /cinema-studio
 /marketing-studio
 /supercomputer
 /3d-jutsu
 /canvas

 /community
 /academy
 /contests

 /integrations
 /integrations/mcp
 /integrations/chatgpt

 /history
 /projects
 /settings
 /pricing
 /enterprise
```

Routes can share a common shell.

------------------------------------------------------------------------

# 38. Priority Matrix

## P0 --- Build first, fully functional

  Feature                   UI        Functional   Priority
  ---------------------- ----- ----------------- ----------
  Signup                   Yes               Yes         P0
  Login                    Yes               Yes         P0
  Logout/session           Yes               Yes         P0
  Global shell             Yes               Yes         P0
  Explore/Home             Yes   Core navigation         P0
  Image generation         Yes               Yes         P0
  Video generation         Yes               Yes         P0
  Audio generation         Yes               Yes         P0
  Generation status        Yes               Yes         P0
  Results                  Yes               Yes         P0
  History                  Yes               Yes         P0
  Asset persistence        Yes               Yes         P0
  Loading/error states     Yes               Yes         P0

## P1 --- Important polish and secondary functionality

  Feature                 UI Functional depth
  -------------------- ----- -------------------------------
  Image editing          Yes One real path
  Video editing          Yes Minimal real path
  Model picker           Yes Yes
  References/uploads     Yes Yes for core generators
  Projects               Yes Basic
  Settings               Yes Basic
  Credits                Yes Basic
  Search                 Yes Basic
  Canvas                 Yes Minimal
  Cinema Studio          Yes Minimal/connected if possible
  Marketing Studio       Yes Minimal

## P2 --- Implement if core is stable

  Feature               UI Functional depth
  ------------------ ----- ------------------------------------
  Genjutsu             Yes Minimal/real if provider available
  Supercomputer        Yes Minimal
  3D Jutsu             Yes Representative
  MCP                  Yes One useful tool if feasible
  ChatGPT Plugin       Yes Integration UI
  Effects              Yes Representative
  Community            Yes Static/seeded data
  Advanced editing     Yes Limited

## P3 --- UI / representative implementation

  Feature                                  UI
  ------------------------------------- -----
  Academy                                 Yes
  Contests                                Yes
  Full community backend                   No
  Full billing                             No
  Enterprise administration                No
  Full external integration ecosystem      No
  Proprietary model infrastructure         No

------------------------------------------------------------------------

# 39. Feature Implementation Order

This order is deliberate.

## Phase 0 --- Assignment setup

Before implementation:

-   install/verify Claude Code
-   configure agent capture
-   run both canary tests
-   create `CAPTURE-TEST.md`
-   create public Git repository
-   commit capture configuration/logs

Do not begin coding until the capture test passes.

## Phase 1 --- Recon

Inspect:

-   screenshots
-   live product
-   authentication
-   navigation
-   image flow
-   video flow
-   audio flow
-   history
-   settings
-   important feature pages

Record:

-   screen
-   purpose
-   controls
-   inputs
-   outputs
-   state changes
-   important visual details

## Phase 2 --- Foundation

Build:

1.  project setup
2.  design tokens
3.  layout
4.  navigation
5.  auth
6.  database
7.  storage
8.  API layer
9.  model registry
10. generation abstraction

## Phase 3 --- Core image flow

Build completely:

``` text
Image page
→ prompt
→ model
→ settings
→ generate
→ API
→ job
→ result
→ history
→ download
```

Do not move on until this works.

## Phase 4 --- Video

Build:

``` text
Video page
→ reference/image
→ prompt
→ model
→ settings
→ async generation
→ progress
→ result
→ history
```

## Phase 5 --- Audio

Build:

``` text
Audio
→ script
→ voice/model
→ settings
→ generation
→ playback
→ download
→ history
```

## Phase 6 --- UI fidelity pass

Improve:

-   typography
-   spacing
-   navigation
-   cards
-   borders
-   buttons
-   hover states
-   modals
-   loaders
-   empty states
-   responsive layout
-   screenshots comparison

## Phase 7 --- Secondary features

Add the highest-value secondary screens:

-   Edit
-   Cinema Studio
-   Marketing Studio
-   Genjutsu
-   Canvas
-   Supercomputer
-   Effects

## Phase 8 --- Polish

Fix:

-   broken routes
-   console errors
-   failed API states
-   mobile overflow
-   loading states
-   missing assets
-   authentication redirects
-   deployment issues

## Phase 9 --- Deployment

Verify:

``` text
public URL
anonymous access
signup
login
image generation
video generation
audio generation
history
downloads
navigation
```

## Phase 10 --- Walkthrough

Keep walkthrough \<= 5 minutes.

Show:

1.  quick introduction
2.  authentication
3.  product shell
4.  image generation
5.  video generation
6.  audio generation
7.  history/results
8.  one or two secondary features
9.  explain product decisions briefly

------------------------------------------------------------------------

# 40. 24-Hour Time Allocation

Suggested maximum budget:

``` text
0:00–1:00   Setup + capture verification
1:00–2:30   Product recon + screenshots
2:30–3:00   Architecture/scope decision
3:00–6:00   App shell + auth + database
6:00–10:00  Image generation
10:00–14:00 Video generation
14:00–16:00 Audio generation
16:00–19:00 UI fidelity + history/assets
19:00–21:00 Secondary features
21:00–22:30 Testing + deployment
22:30–23:30 Polish
23:30–24:00 Walkthrough/repository verification
```

The exact schedule can change based on provider/API friction.

If an external AI provider becomes blocked, do not allow one integration
problem to consume the entire assignment. Move to the next highest-value
feature while preserving a clear functional core.

------------------------------------------------------------------------

# 41. Definition of Done

The clone is ready for submission when:

## Repository

-   repository is public
-   `.agent-logs/` is committed
-   capture logs are present throughout development
-   README exists
-   setup instructions exist
-   environment variables are documented
-   no secrets are committed

## Live product

-   URL is public
-   page loads without authentication
-   signup works
-   login works
-   logout works
-   core navigation works
-   image generation works
-   video generation works
-   audio generation works or has a clearly documented provider
    limitation
-   results are visible
-   history works
-   downloads work
-   errors are handled
-   loading states are polished

## UI

-   desktop layout is polished
-   major screenshots visually resemble reference
-   navigation feels coherent
-   cards/buttons/forms are consistent
-   no obviously broken routes
-   no placeholder lorem ipsum
-   no browser console spam/errors that indicate broken functionality

------------------------------------------------------------------------

# 42. Deliberately Out of Scope

The following should not consume core development time:

-   training proprietary AI models
-   recreating Higgsfield's internal model orchestration
-   reproducing production-scale GPU infrastructure
-   implementing full billing/payment processing
-   implementing enterprise SSO/compliance
-   building a complete social network
-   building a full creator economy
-   building every model integration
-   building every effect individually
-   recreating every Academy course
-   reproducing all 1,000+ templates
-   reproducing proprietary Cinema Studio reasoning systems
-   building a full timeline video editor
-   implementing every MCP/CLI/ChatGPT capability
-   implementing every mobile-native feature

These can be represented through polished UI where appropriate.

------------------------------------------------------------------------

# 43. Product Judgment Rules

The implementation should repeatedly ask:

### Is this a core creation workflow?

If yes → prioritize functionality.

### Is this a supporting navigation/discovery surface?

If yes → prioritize UI and navigation.

### Is this a huge external ecosystem?

If yes → create a coherent minimal integration or representative
experience.

### Does this feature improve the reviewer experience?

If yes → consider it.

### Will this consume multiple hours without improving the primary user journey?

If yes → defer it.

The goal is not feature count.

The goal is a product that makes the reviewer think:

> "This is a real AI creative application, the core workflow works, and
> the engineer made deliberate choices about what to build."

------------------------------------------------------------------------

# 44. Agent Instructions

The coding agent must read this document before modifying application
code.

The coding agent must also inspect `/reference/` screenshots before
implementing a screen.

## Do not:

-   blindly generate a generic AI SaaS dashboard
-   invent a completely different navigation system
-   build every feature shallowly before making one workflow work
-   fake image/video/audio generation when a real provider can
    reasonably be used
-   hard-code secrets
-   delete `.agent-logs/`
-   modify or summarize agent logs
-   bypass capture hooks
-   claim a feature is functional when it is only visual

## Do:

-   use screenshots as visual reference
-   use reusable components
-   use a model/provider abstraction
-   build core flows end to end
-   commit regularly
-   keep the app deployable
-   test after each major workflow
-   prioritize UX polish after functionality
-   record scope decisions in commits/README where useful

------------------------------------------------------------------------

# 45. Recommended Initial Claude Code Instruction

After the capture setup has been verified, the first implementation
instruction should be conceptually:

> Read `HIGGSFIELD_CLONE_REQUIREMENTS.md` completely and inspect every
> file under `/reference`. Do not start coding yet. First analyze the
> current repository, map the reference screenshots to the requirements,
> identify the existing stack and deployment setup, and produce a
> concrete implementation plan for the 24-hour assessment. Separate P0,
> P1, P2, and P3 work. Identify the smallest architecture that can
> deliver real image, video, and audio generation while maintaining high
> visual fidelity. Do not implement anything until the plan is complete.

Then the next instruction should start the P0 foundation.

------------------------------------------------------------------------

# 46. Screenshot-to-Requirement Mapping

The following mapping is based on the supplied screenshot set.

  Screenshot   Main observed area                 Requirement
  ------------ ---------------------------------- ---------------------------
  `211457`     Explore/home + feature discovery   Home/explore
  `211554`     MCP / GPT-6 Astra promotion        MCP/agent surface
  `211712`     Genjutsu / visual effects          Genjutsu
  `211759`     Seedance/video feature             Video
  `211834`     Community/project exploration      Community
  `211903`     Marketing / Supercomputer          Marketing + Supercomputer
  `211927`     Canvas + Marketing Studio          Canvas + Marketing
  `211951`     Seedance/community                 Video + Community
  `212010`     Photodump + Soul Cinema            Image/tools
  `212024`     Soul 2.0 / Soul Cinema             Image
  `212045`     Feature/model directory            Feature catalog
  `212104`     Full footer sitemap                Information architecture
  `212229`     Image feature/model catalog        Image
  `212310`     Video feature/model catalog        Video
  `212329`     Audio feature/model catalog        Audio
  `212424`     Image generator                    Image generation
  `212453`     Video generator                    Video generation
  `212513`     Text-to-speech generator           Audio generation
  `signup`     Authentication                     Signup

------------------------------------------------------------------------

# 47. Visual QA Checklist

Before submission, compare the clone against the reference screenshots.

## Layout

-   [ ] same major regions
-   [ ] similar proportions
-   [ ] correct navigation hierarchy
-   [ ] correct card density
-   [ ] correct media aspect ratios

## Typography

-   [ ] heading hierarchy
-   [ ] readable body text
-   [ ] button labels
-   [ ] metadata sizing
-   [ ] consistent font weights

## Color

-   [ ] dark base
-   [ ] lime/neon accent
-   [ ] appropriate contrast
-   [ ] muted secondary text
-   [ ] correct button states

## Components

-   [ ] cards
-   [ ] dropdowns
-   [ ] model picker
-   [ ] upload control
-   [ ] prompt box
-   [ ] generation button
-   [ ] tabs
-   [ ] modal
-   [ ] toast
-   [ ] progress state

## Responsive

-   [ ] no horizontal overflow
-   [ ] navigation remains usable
-   [ ] controls stack
-   [ ] cards resize
-   [ ] generation results remain accessible

------------------------------------------------------------------------

# 48. Final Product Strategy

The final clone should feel like one coherent product, not a collection
of disconnected demos.

The core experience should be:

``` text
DISCOVER
   ↓
CHOOSE TOOL
   ↓
CREATE
   ↓
GENERATE
   ↓
WAIT / PROCESS
   ↓
RESULT
   ↓
EDIT / REUSE
   ↓
SAVE
   ↓
HISTORY / PROJECT
```

Image, video, and audio should all follow this mental model.

Secondary products should feel like extensions of the same system.

The strongest implementation strategy is therefore:

**Full shell → Authentication → Image → Video → Audio → History/Assets →
Visual polish → Secondary products.**

Do not reverse this order.

------------------------------------------------------------------------

# 49. Sources / Current Product Verification

The screenshot set is the primary visual source for this assessment.

Current official Higgsfield material was also checked while preparing
this document to validate the broader product surface and current
terminology:

-   Higgsfield AI --- About / platform overview
-   Higgsfield AI --- AI Image
-   Higgsfield AI --- AI Video
-   Higgsfield AI --- AI Image Editor
-   Higgsfield AI --- AI Video Editor
-   Higgsfield AI --- Marketing Studio
-   Higgsfield AI --- Supercomputer
-   Higgsfield AI --- Genjutsu
-   Higgsfield AI --- Cinema Studio
-   Higgsfield AI --- Creator Hub / Which Higgsfield Tool Should You Use

Because Higgsfield is actively changing its product and model catalog,
the live product and supplied screenshots should take precedence over
this document when a UI detail has changed.

------------------------------------------------------------------------

# 50. Final Rule

**Build the product, not the checklist.**

The reviewer should be able to open the deployed application,
authenticate, navigate through a recognizable Higgsfield-like product,
generate real media, see generation progress, receive results, revisit
those results, and understand the broader product surface.

Every hour should either:

1.  make the core workflow more functional,
2.  make the product more visually faithful,
3.  make the UX more polished, or
4.  add a high-value supporting feature.

If a feature does not satisfy one of those four goals, defer it.

---

# 51. Zero-Cost Infrastructure and AI Cost Guardrails

This assessment must be designed to run without requiring the candidate to pay for hosting, databases, storage, authentication, AI APIs, or other infrastructure.

## Hard cost rule

- Prefer genuinely usable free tiers and open/free options.
- Do not add a paid service, paid model, paid API, subscription, or infrastructure plan without explicit approval.
- Do not add a service that requires a credit card or billing setup without explicitly flagging that requirement first.
- Do not assume a service is free based on old knowledge; verify its current pricing and quota before integration.
- Never enable automatic paid overages for an assessment project.
- Keep all provider choices configurable through environment variables so a provider can be swapped if a free quota disappears.

## Deployment strategy

The preferred deployment shape is:

```text
Next.js frontend -> free static/serverless-friendly host
FastAPI backend -> free Python web-service host
PostgreSQL -> free managed PostgreSQL tier
Generated media -> free object/media storage tier
AI generation -> free credits/free inference where realistically available
```

Free tiers change frequently. Provider selection must therefore be verified immediately before implementation rather than permanently hard-coded into this requirements document.

Current examples worth evaluating include a $0 Vercel Hobby frontend plan, free Render web services for Python, Supabase Free for PostgreSQL/storage, and Cloudinary Free for media storage/delivery. Their current limits and account/payment requirements must still be checked before choosing them.

## AI generation cost strategy

Image, video, and audio generation have different cost/risk profiles.

### Image generation

Target: real generation on a free quota/free-credit option if practical.

Fallback order:
1. Free hosted inference/API that can support the assessment traffic.
2. Free promotional/assessment credits that do not require payment.
3. A lightweight open model that can reasonably run on available free compute.
4. If none is viable, stop and request a scope/provider decision rather than silently choosing a paid API or faking the feature.

### Video generation

This is the highest cost and availability risk.

Before implementation, verify:
- free quota/credits
- whether billing details are required
- generation latency
- output quality
- API availability
- concurrency/rate limits
- whether generated files remain accessible long enough for the walkthrough

Do not let one blocked video provider consume several hours. Use a time-boxed provider spike and switch to the documented fallback if it fails.

### Audio / TTS

Prefer a genuinely free TTS/API option or an open model that can be used within the deployment constraints.

## Hugging Face warning

Do not assume Hugging Face gives enough free inference for this assessment. Its current free Inference Providers credit can be very small and dedicated Inference Endpoints require paid compute/payment setup. Treat Hugging Face as an option to evaluate, not an automatically free solution.

## Media storage

Generated media should not be stored as large binary values in PostgreSQL. Use a free storage/media service within quota.

For a 24-hour assessment, optimize generated output sizes and avoid storing unnecessary duplicates. Clean up temporary/reference uploads where practical.

## Free-tier operational risks

Free hosting can have:
- cold starts
- sleeping services
- limited CPU/RAM
- bandwidth caps
- build limits
- database/storage caps
- short-lived databases on some providers
- rate limits

The final architecture must tolerate these limitations well enough for a reviewer to open the public link and complete the main demo flows.

Before submission, warm/check the deployed application and verify the complete anonymous-to-authenticated workflow from a clean browser session.

---

# 52. Quality Standard: Production-Quality Code, Not Production-Scale Infrastructure

The code should demonstrate professional engineering quality while remaining appropriate for a 24-hour assessment.

Required qualities:

- clean and readable structure
- strong TypeScript/Python typing
- Pydantic/backend validation
- frontend validation for user experience
- server-side authorization
- safe password handling
- environment-based secrets
- consistent API errors
- provider error handling and timeouts
- reusable UI components where patterns repeat
- clear separation between routes, business logic, persistence, and AI-provider integrations
- database constraints and migrations
- accessible form controls and keyboard/focus behavior
- loading, empty, success, and error states
- no dead code/debug artifacts

Do not interpret "production-quality" as a requirement for Kubernetes, microservices, Kafka, complex queues, enterprise observability, elaborate CI/CD, or excessive design-pattern abstractions. Add infrastructure only when the product actually needs it.

Frontend validation improves UX; backend validation remains authoritative. Never trust client input.

---

# 53. Provider Selection Gate

Before coding any external-service integration, record a small decision table containing:

| Concern | Required check |
|---|---|
| Cost | $0 for expected assessment usage |
| Payment | Whether card/billing setup is required |
| Quota | Enough for development + reviewer demo |
| API | Programmatic API actually available |
| Latency | Acceptable for interactive demo |
| Deployment | Works from chosen backend host |
| Terms | Suitable for an assessment/demo |
| Fallback | Alternative provider/path identified |

Do not select providers from marketing claims alone. Verify current official pricing/docs before implementation.

---

# 54. Final Pre-Implementation Gate

No application implementation should begin until all of the following are true:

- 8x agent capture is configured and both canary sessions passed.
- `CAPTURE-TEST.md` exists.
- Requirements document has been read.
- Every reference screenshot has been inspected.
- P0/P1/P2/P3 scope is understood.
- Next.js + FastAPI + PostgreSQL architecture has been reviewed.
- Deployment choices have been checked for current free-tier viability.
- Image/video/audio provider candidates have been checked for current cost and API availability.
- Video-generation fallback is defined.
- No service requiring payment has been silently selected.
- P0 has been divided into incremental, testable milestones.

Only then begin implementation.
