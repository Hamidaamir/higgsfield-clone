# R8 — Archive / History

R8 changes are left in the working tree for manual review. R9 was inspected only; no R9 implementation was started.

## 1. Archive design

`/history` is now Archive: a restrained serif heading, a search/filter rule and a chronological editorial index. Each generation has a compact prompt/metadata column beside its media. Hairlines separate records and date sections. Images, video, audio and edits share this structure without becoming identical square cards. Both approved design reference PNGs were inspected before implementation.

The toolbar is deliberately **not sticky**. The existing global header remains the only sticky layer, avoiding overlaps at desktop, tablet and phone sizes.

## 2. Existing functionality preserved

The existing `useInfiniteGenerations`, `useActiveGenerationPolling`, `useRegenerate`, model registry, `reuseHref`, `generatorHref`, `dayLabel` and shared detail dialog remain in use. No API hook, API client, query key, pagination contract, retry request or reuse serialization was changed by R8. Detail data still follows polled updates.

## 3. Search

Search still trims input after **300 ms** and sends `q` to `GET /api/generations`, combined with `type` when selected and `limit=24`. It does not filter the loaded list in the client. Empty search omits `q`; clearing the input restores the unsearched feed after the same debounce. The existing query-key isolation remains intact.

The placeholder and explicit accessible label say **Search prompts and models**. The backend's case-insensitive prompt/model-ID matching and escaped SQL wildcard behavior are unchanged. Both real API and browser fixtures exercised special characters including `&`, `?`, quotes, Unicode, `%` and `_`. Separate loading, no-match, empty-filter and empty-Archive states remain.

## 4. Filters and URL state

All removes `type`; Images, Videos and Audio use `?type=image`, `?type=video` and `?type=audio`. Clicks retain the existing `router.replace(..., { scroll: false })` behavior. Selection now reads `useSearchParams`, so browser URL changes do not leave a stale local selection. Direct links, refresh, switching, All, back/forward and keyboard arrow selection were tested. Edits remain in Images; no unsupported Edits filter was added. Search text remains local state, as before.

## 5. Date grouping

The unchanged `dayLabel` groups the API's newest-first results into Today, Yesterday and localized dated sections. Load more appends through the existing cursor and merges records into their date sections. Headings are small editorial labels; records stay in API order within each date.

## 6. Images

A single image uses a readable print width. Multiple assets use a two-column contact sheet within one generation. Width/height determine aspect ratio when supplied; persisted aspect is the fallback. Images use `thumbnail_url` where available, lazy Next Image loading and `object-contain`, preserving the image instead of forcing a square crop. Each output exposes Details, Download and Original. Pending and failed records remain visible and actionable.

## 7. Video

Archive renders a poster button using the asset dimensions or stored aspect. It does not mount a video player or fetch a video stream while browsing. Opening Details uses the existing native, non-autoplay player with metadata preload. Duration, aspect, model and prompt stay visible alongside generation actions.

If the API has no poster URL, the surface honestly says **Poster unavailable · Open to play**. This occurs with local fake storage; production Cloudinary storage already supplies video poster URLs. No backend change or fabricated poster was introduced. Both supplied-poster and missing-poster paths were tested.

## 8. Audio

Each generation contains compact native-player take rows, a decorative deterministic waveform, take number, duration and output actions. There is no image or album-art placeholder. Voice/language resolve through the registry with persisted IDs as fallbacks; a persisted style excerpt is shown. Audio uses `preload="metadata"` and never autoplays. The decorative waveform is hidden from assistive technology and is not presented as measured audio.

## 9. Image edits

Image generations with `settings.reference_asset_id` are labeled **Image edit**. Their Before and After labels are explicit text, with the comparison side by side above the mobile breakpoint and stacked Before then After at 390 px. The Before asset uses the existing ownership-enforcing `useAsset` / `/api/assets/{id}` path and cache. Shared reference IDs deduplicate to one request. Loading, missing reference and failed image-preview states are honest; After remains usable when Before cannot be fetched.

## 10. Multi-asset grouping

The `article` is the generation, never an individual asset. One prompt, model, timestamp and generation action set govern every plate/take in that record. Output-specific actions preserve their own index. Requested batch count remains visible while pending; completed records use actual output count.

## 11. Active generations

The original two-second active-ID polling hook is unchanged. Queued and processing records patch in place; completed and failed records do not poll. No second polling loop was added. Image/video/edit use `PendingPlate`; audio uses `PendingRow`. Real status and elapsed time are shown, without invented progress percentages or ETAs. Tests observed completion in place and cessation of polling.

## 12. Retry

Retry still sends the original generation ID through `useRegenerate` and the existing retry endpoint, then routes to the returned child's studio. Failed records show the normalized API message through `FailedAnnotation`. Real fake-provider History retry and fixture-based image/video/audio retry routing were checked. No provider calls are reconstructed in the view.

## 13. Reuse

The R7 `reuseHref` implementation was not edited. Registry-supported values continue to round-trip:

- Image: prompt, model, aspect, batch and negative prompt.
- Video: prompt, model, aspect, duration and negative prompt.
- Audio: script, model, voice, language, batch and style.
- Edit: existing image-studio reuse, without introducing `reference_asset_id` into the URL. Reuse does not claim to restore the reference.

The dedicated Reuse suite exercised exact negative/style strings, special characters, batch values, unsupported fields, defaults and resubmission payloads.

## 14. Detail dialog

Archive now passes the selected `initialAssetIndex` to the shared dialog. Plate 3 of an image batch and take 2 of an audio batch were explicitly verified. Previous/next output navigation and existing actions remain in the shared component.

Visual QA exposed a pre-existing light-theme contrast defect in its black empty/failed preview area. The shared component received only two presentation changes: white foreground on that black media surface and white/70 explanatory text. Its state, layout, media, actions and routing logic were not rewritten. Dialog consumers were rerun after this correction.

## 15. Empty states

The whole Archive says **Nothing here yet** and links to the four real studios. A media filter names the missing kind and links to the corresponding studio. Search no-match copy includes the actual debounced query and provides Clear search. No example generation, fabricated count, storage indicator or fake action is shown.

## 16. Light and dark

Archive uses the existing warm ivory / warm near-black semantic tokens, orange accent, hairlines and Instrument Serif heading. Small metadata and media labels use the stronger muted foreground because the existing subtle token was below 4.5:1 on ivory. Browser checks confirm the new metadata color meets 4.5:1 in both themes. Placeholder contrast was strengthened locally too. This is targeted contrast verification, not a claim of a full application accessibility certification.

## 17. Responsive

- **1440 px:** prompt/metadata column alongside media, generous record spacing, horizontal toolbar.
- **768 px:** narrower two-column record layout, constrained media and side-by-side edit comparison.
- **390 px:** single-column records, search above compact wrapping-capable filters, Before above After, reachable actions and full-width audio controls.

All checked sizes have no document-level horizontal overflow. Long scripts/prompts wrap or truncate deliberately and remain available through the detail dialog/title.

## 18. Accessibility

Archive has one h1, dated h2 sections and per-generation h3 prompts. Generations are labeled articles; dates are labeled sections. Search has a label, tabs expose selected state and support keyboard navigation, and actions have output-specific accessible names. Images have meaningful alt text. Before/After labels survive stacking and screen readers. Pending/failure announcements use the shared status/alert primitives. Native audio/video controls, visible focus and the existing reduced-motion rules remain. Modal keyboard closing and mobile fit were checked.

## 19. Performance

The 24-item keyset/cursor feed and Load more remain. Nothing fetches all generations. Model queries and reference assets retain their existing caches. Reference fetching is limited to actual edit records; shared references deduplicate. Images prefer thumbnails and lazy loading; Archive video loads posters only; audio preloads metadata. Only active generations poll. Search remains debounced and server-backed.

## 20. Shared component impact

Only `src/components/generation/generation-detail-dialog.tsx` changed, for the black preview area's text contrast. Image, Video, Audio, Edit, History/Archive, Reuse and Create consumers were regression-tested; Auth was also run. Navigation had already passed and no navigation component changed.

`PendingPlate`, `PendingRow`, `FailedAnnotation`, `Waveform`, `Button`, `EmptyState`, `Tabs`, `useAsset`, `aspectRatioStyle`, `ratioToStyle` and `downloadUrl` are reused without source changes. `GenerationGroupFrame` was inspected; Archive uses a small dedicated shell because its metadata column differs from the studio frame's horizontal header. The old `GenerationTile` was not rewritten or deleted.

## 21. Exact R8 files

| File (relative to repository root) | Reason |
| --- | --- |
| `frontend/src/app/(app)/history/page.tsx` | Archive browser title; route unchanged |
| `frontend/src/features/history/history-view.tsx` | Editorial header/toolbar/date index, URL-driven selection, indexed detail opening and empty states |
| `frontend/src/features/history/archive-generation.tsx` | New generation shell, metadata/actions and media/state dispatch |
| `frontend/src/features/history/archive-media.tsx` | New image, video, audio and edit bodies with per-output actions |
| `frontend/src/components/generation/generation-detail-dialog.tsx` | Two text-color fixes on black preview surface |
| `frontend/e2e/archive-e2e.mjs` | Dedicated R8 API/fixture/browser/responsive/accessibility coverage and screenshots |
| `frontend/e2e/history-e2e.mjs` | Updated copy/search selectors; fail exit status; existing behavioral assertions retained |
| `frontend/e2e/video-e2e.mjs` | API-derived poster/fallback assertion and fail exit status; detail playback checks retained |
| `frontend/e2e/reuse-e2e.mjs` | Wait for the registry-backed `2/2` take control before its existing strict batch assertion; preserves the pre-existing R7 test |
| `docs/design/R8-archive-report.md` | This report |

Other files already modified/untracked at the start of R8 were preserved, including R7 reuse/edit work and the older Claude log modification.

## 22. Test results

Testing used a separate local Next production server on port 3001 and backend on port 8001 with `USE_FAKE_PROVIDERS=1`. Upload suites used `public/textures/grain.png`. The dedicated Archive suite additionally asserts that the fake-only dev-assets router is mounted before seeding anything.

| Check | Result |
| --- | --- |
| TypeScript | Passed (`tsc --noEmit` and Next build typecheck) |
| ESLint | Passed, no warnings/errors |
| Production build | Passed, all 76 static pages generated |
| Archive | Passed, 64 assertions |
| History | Passed, 20 assertions |
| Reuse | Passed, 41 assertions |
| Image | Passed, 27 assertions |
| Video | Passed, 38 assertions |
| Audio | Passed, 73 assertions |
| Edit | Passed, 66 assertions |
| Nav | Passed, 50 assertions |
| Create | Passed, 28 assertions |
| Auth | Passed, 28 reported checks; full Google consent round-trip skipped because local real OAuth credentials are configured |

Results and screenshots are under `frontend/test-results/r8/` (ignored artifacts). The final result files use `<suite>-results.txt`; Archive writes `archive-results.txt` itself. Some legacy suites report assertions without setting failure exit codes, so their output was checked for `FAIL` as well as process exit status.

Initial test/setup issues were resolved: sandbox restrictions on browser/build worker spawning required escalation; Video/Edit initially lacked their required upload-fixture argument; one waveform assertion assumed SVG instead of the shared bar DOM; fake storage lacks poster URLs, requiring an API-derived fallback assertion. An attempted fake-mode guard based on the OAuth flag was replaced with the fake-only dev-assets route check, because OAuth credentials take precedence independently of generation fake mode. No assertions were weakened to conceal an implementation regression.

The final concurrent regression pass also exposed a Reuse-test timing issue: the audio script field was mounted while the model registry was still loading, so its take group briefly read only `TAKES`. Both URL and resubmitted payload retained `batch=2`. The test now waits for the exact expected `2/2` group value before the unchanged strict assertion, and was rerun separately.

## 23. Visual QA

Inspected light 1440, dark 1440, light 390, dark 390 and light 768. Evidence includes `archive-<theme>-<width>.png`, per-record `entry-*.png`, filter views, search/no-results, empty Archive/filter and the History detail screenshots. Media sheets were assembled for inspection from those screenshots, not used as product content.

Reviewed single/batch images, poster and no-poster video, single/batch audio, edit reference/loading/missing states, queued/processing/failed records, long scripts, multiple dates, the long paginated Archive, actions, heading rhythm, filters, native-player width, mobile stacking and detail dialogs. QA found and led to fixes for shell-corrupted punctuation, low-contrast metadata and the shared failed-dialog preview text.

## 24. Provider call count

| Real provider | Calls made for R8 |
| --- | ---: |
| Cloudflare | 0 |
| Hugging Face | 0 |
| Gemini | 0 |

All generation tests used explicitly enabled in-process fake providers or browser fixtures. No provider smoke tests were run.

## 25. Backend status

No backend source, schema, migration, provider integration, search semantics, pagination, ownership or auth backend change. Local test accounts/generations were created through existing APIs. No environment file was printed or edited. `git status --ignored --short -- backend/.env` confirms `!! backend/.env`.

## 26. Agent capture

Existing automatic Codex capture was allowed to run normally. It was not reinstalled or reconfigured. The read-only verification reported a live watcher and matching original Claude log/configuration hashes. No manual edits, normalization, cleanup, renaming or deletion of any log occurred. Current-session capture appends and metadata updates are produced by the already-installed watcher, not by R8 implementation scripts. `CAPTURE-TEST.md` was not changed during R8.

## 27. Git status

No staging, commit, push, stash, checkout, restore, reset, clean, merge or rebase was performed for R8. Only read-only Git inspection was used. R8 files above remain modified or untracked for manual review. Pre-existing R7 changes remain. Automatic log changes/new sessions can also appear in status; these were not touched manually. No backend or capture configuration diff was introduced.

## 28. R9 recommendation — audit only

| Surface | What exists now | Dependencies | Recommended presentation and scope |
| --- | --- | --- | --- |
| Explore / Community (`/community`) | Curated static `COMMUNITY_POSTS`, local showcase media and deterministic preview art, working All/Image/Video filtering and Recreate deep links | Config modules; no live community feed API. Recreate goes to existing authenticated generators | A curated editorial showcase with visible prompt/model captions and an honest distinction between shipped output and previews. Preserve real Recreate links. Do not imply user publishing, likes, follows, ranking or a community database |
| Explore catalogs (`/image`, `/video`, `/audio`, model/tool pages) | Static catalogs distinguish real `registryId`/available tools from preview routes and fallbacks | `catalog-models.ts`, `tools.ts`, `explore.ts`, existing generator destinations | Treat as a related discovery family beside Community: restrained type/category rules, photographic spreads and clear availability captions. Keep preview functionality labeled; do not turn decorative product surfaces into purported provider integrations |
| Projects (`/projects`) | Honest roadmap/empty page and working link to `/history`; no project creation, folders, sharing or persistence | No Projects API | Visually pair with Archive using its heading, rules and quiet empty state. Update terminology to Archive in R9. Do not add fake project cards, counters, New Project, invitations or storage controls |
| Settings (`/settings`) | Real name/email/sign-in type/member date and logout; static Free-plan text/link; explicitly no profile editing | `useAuth` → `GET /api/auth/me`; `useLogout` → `POST /api/auth/logout` and cache clearing. Theme preference already lives in the shared shell/local browser storage | A compact account folio with aligned definition rows, restrained plan disclosure and a separate session/logout rule. Keep static plan status honest. Do not add pretend billing, editable profile, password changes, avatar upload or session-device management without APIs |

Explore and its catalog/model/tool routes belong together as public discovery. Projects belongs visually with the private Archive. Settings is an account surface rather than another media gallery. Reuse R0–R8 typography/tokens, `PrintFrame`, contact-sheet spacing, hairlines, button/focus treatments, labeled empty states and existing media primitives where appropriate. Keep data dependencies and availability boundaries explicit. **No R9 code was implemented.**
