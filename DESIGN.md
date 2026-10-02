# Graticule

A mobile-first design system for dashboards and data-heavy web apps.

The graticule is the measurement grid etched over an oscilloscope screen. It names the idea: the interface is a calibrated surface, and everything on it exists to help someone read a value correctly.

Every rule comes with its reason. If the reason doesn't apply, the rule doesn't either.

---

## 1. Position

**Ink on chart paper, designed for a thumb first.** The look is a strip-chart recorder: pale, cool, slightly green paper; graphite ink for structure; coloured pens for data. There is no brand colour.

The base design target is a **360 × 640 px touch screen**. Every larger layout is built by adding to it. Light is the default theme, with a dark one in section 3.6.

### Principles

1. **Start at 360, then add.** Base styles describe the phone. Wider screens add columns, context, and density, using `min-width` queries only. *Why:* a layout shrunk down from a desktop carries hidden assumptions (hover, precision, width) that never fully go away. A layout grown up from a phone has none to remove.

2. **Wide screens add context. They don't add capability.** Anything a user can do on a desktop, they can do on a phone. One exception: resizing and arranging the dashboard grid is wide-only (section 5.5). *Why:* the person paged at 3 a.m. is on a phone, and they need to acknowledge, silence, and drill down, not be told to find a laptop.

3. **Colour is data.** Chrome is ink, paper, and hairlines. Colour appears only in chart series and in state. *Why:* with thirty numbers on screen, decorative colour reads as a signal and someone wastes time investigating it.

4. **State has a shape.** Healthy, warning, failing, and informational each have their own glyph, with colour as the second channel. *Why:* red/green is the worst pairing for the roughly one in twelve men with colour-vision deficiency, and phones in sunlight wash out colour for everyone.

5. **Nothing depends on hover or precision.** Every action has a tap path, and every gesture has a visible equivalent. *Why:* hover doesn't exist on touch, and hidden gestures can't be found.

6. **Numbers can't be misread.** One legibility-focused family in proportional and mono cuts. *Why:* IDs, hashes, and hex values are where `0` versus `O` and `1` versus `l` become bugs, and phone screens make them smaller.

7. **Say why.** Errors, empty states, and confirmations give the reason and the next step. *Why:* on a phone, the user can't ask the person next to them.

---

## 2. Layout

### 2.1 Narrow shell (base, 0 to 599)

```
┌──────────────────────────────────┐
│ ‹  Checkout                ⌕  ⋯ │  Top bar: 48px
│ Last 6 hours ▾      ⟳  2 min ago │  Context bar: 44px, sticky
├──────────────────────────────────┤
│                                  │
│  Content: one column,            │
│  16px side margins               │
│                                  │
├──────────────────────────────────┤
│ Boards  Explore  Alerts  Docs  ⋯ │  Bottom bar: 56px
└──────────────────────────────────┘
   (all of it inside safe-area insets)
```

- **Bottom bar** holds up to four destinations plus **More**. *Why:* the bottom third of a phone is the only area reachable one-handed. Navigation goes where thumbs already are.
- **Top bar** holds back, title, search, and an overflow menu. Titles truncate with an ellipsis at the end.
- **Context bar** shows the time range, refresh, and "last updated" on any view with time-based data. It stays pinned while content scrolls. *Why:* the question "how fresh is this?" must never require scrolling to answer.
- **Primary action** lives in the top bar (icon plus label) on read views. On create and edit flows it moves to a **sticky action bar** above the bottom bar: a full-width primary button, with secondary actions as an overflow. *Why:* the commit action belongs under the thumb.
- Respect `env(safe-area-inset-*)` on every fixed edge. Use `viewport-fit=cover` and `dvh` units, never `vh`. *Why:* mobile browser toolbars change the viewport height as you scroll, and `vh` leaves content hidden behind them.

### 2.2 Breakpoints (min-width only)

| Name | From | Grid | Navigation | What this size adds |
|---|---|---|---|---|
| base | 0 | 4 columns, 16px margins, 12px gutters | Bottom bar | Nothing. This is the product. |
| tablet | 600 | 8 columns, 24px margins | 52px side rail replaces the bottom bar | Two-up panels. Tables show priority 2 columns. |
| desktop | 900 | 12 columns, 24px margins | Rail plus a secondary tree column in the page | Variables inline. Hover affordances. Layout editing. Compact density. |
| wide | 1280 | 12 columns | Same | Docs gain a right-hand "on this page" column. Canvas stops at 1800px. |

Breakpoints are set where content breaks, not at device sizes. If a panel is unreadable at 700, move the breakpoint for that panel, not the whole page.

### 2.3 Thumb zones

```
┌────────────────┐
│ hard to reach  │  Titles, state, read-only context
│                │
│  reachable     │  Scrolling content
│                │
│ easy to reach  │  Navigation, commit actions, time range sheet
└────────────────┘
```

Destructive actions are deliberately kept out of the easy zone. They live in overflow menus and confirmation sheets.

### 2.4 Spacing and targets

4px base: 4, 8, 12, 16, 24, 32, 48, 64.

- **Touch targets are 44 × 44 px minimum**, including icon buttons, checkboxes, and row actions. A 24px icon gets a 44px hit area.
- **Adjacent targets are at least 8px apart.** *Why:* thumbs are about 10mm wide. Smaller gaps cause mis-taps in exactly the situations (incident response, in a vehicle) where they cost the most.
- On `pointer: fine` devices at desktop width, targets may shrink to 36 (default) or 28 (compact).

---

## 3. Foundations

### 3.1 Colour

**Paper and ink (light)**

| Token | Hex | Used for |
|---|---|---|
| `--paper` | `#E3E8E2` | App background. Cool grey-green, deliberately not cream. |
| `--sheet` | `#F7F9F6` | Panels, cards, sheets |
| `--sheet-2` | `#FFFFFF` | Menus, popovers, inputs |
| `--hair` | `#C3CCC2` | 1px borders and dividers |
| `--hair-strong` | `#9BA89E` | Input borders, table header rule |
| `--grid` | `#D3DAD2` | Graticule lines |
| `--ink` | `#16201B` | Text, primary buttons, selected nav |
| `--ink-2` | `#4E5C53` | Secondary text, axis labels |
| `--ink-3` | `#68756D` | Placeholders, disabled (4.5:1 on sheet) |

A faint green cast keeps all data hues distinguishable from the surface. Neutral greys look dead next to saturated series, and blue-greys swallow blue ones.

**Focus** is the one exception to "colour is data": `--focus: #2B50B5`, a 2px ring with a 2px gap. Focus is a different job from selection, so it never reuses a series or state hue. On touch it appears whenever an external keyboard is attached.

**State**

| State | Glyph | Colour | Text variant |
|---|---|---|---|
| Healthy | ● filled circle | `#2E7D4F` | `#1F5E39` |
| Info / in progress | ○ ring | `#2B6CB0` | `#1F5288` |
| Warning | ▲ triangle | `#B7791F` | `#7A4F08` |
| Failing | ◆ diamond | `#C62F2F` | `#9B2020` |

Use the colour for glyphs and fills, and the text variant for words. Raw amber fails 4.5:1 as text.

**Series (data pens)**

| # | Name | Hex |
|---|---|---|
| 1 | Blue pen | `#2B50B5` |
| 2 | Violet | `#6C4BB0` |
| 3 | Teal | `#1F7F86` |
| 4 | Magenta | `#A8386F` |
| 5 | Ochre | `#A06A12` |
| 6 | Graphite | `#4E5C53` |
| 7 | Green | `#2E7D4F` |
| 8 | Red | `#C62F2F` |

Series 1 to 6 avoid red and green so state colours keep their meaning. Use 7 and 8 only when the chart is itself about good and bad. On narrow screens, show at most **4 series** by default. The rest are one tap away in the legend sheet. *Why:* five distinguishable lines in 330px of width is the practical limit.

**Sequential** (heatmaps): `#EEF2F8 → #B7C6E8 → #6F8AD1 → #2B50B5 → #14286B`.
**Diverging** (change vs. baseline): `#C62F2F ← #E3E8E2 → #1F7F86`. Teal on the positive side so it doesn't read as "healthy".

### 3.2 State in use

The glyph always travels with a label. The one exception is dense table cells at desktop width, where a tooltip carries it.

```
● Healthy     ○ Deploying     ▲ Degraded     ◆ Failing
```

Rows and panels with state show the glyph in the header or first cell. They are never tinted. A tinted row hides the data under it.

### 3.3 Typography

One family, two cuts: **Atkinson Hyperlegible Next** for interface and prose, **Atkinson Hyperlegible Mono** for numbers, code, and identifiers. Both were designed to tell look-alike characters apart. Fallbacks: `system-ui, sans-serif` and `ui-monospace, Menlo, monospace`.

Sizes below are base (phone) values. Where a size changes at 900 and up, the second value follows an arrow.

| Token | Size / line | Weight | Notes |
|---|---|---|---|
| title | 24 / 30 → 28 / 34 | 700 | Page titles |
| heading | 18 / 24 → 20 / 26 | 700 | Section headings |
| subhead | 15 / 20 | 700 | Panel titles |
| body | 16 / 24 → 15 / 24 | 400 | Prose. 16 on touch for reading distance. |
| ui | 15 / 20 → 14 / 20 | 500 | Buttons, nav, table cells |
| input | 16 / 24 | 500 | Never smaller (see below) |
| small | 13 / 18 | 400 | Helper text, captions |
| micro | 12 / 16 | 500 | Axis labels, timestamps. The smallest size allowed. |
| figure | 32 / 36 → 40 / 44 | 500 (Mono) | Single-stat values |
| code | 13 / 20 | 400 (Mono) | Code and queries |

Rules:
- **Inputs are 16px or larger.** *Why:* iOS Safari zooms into any focused field under 16px and doesn't zoom back.
- **Sentence case** everywhere, including buttons, tabs, and column headers. No all-caps labels.
- Tabular figures on every number in a table, stat, or axis.
- Prose max width is 68 characters, which happens naturally on phones. Dashboards are exempt at wider sizes.
- Truncate IDs in the middle (`a3f9…c21e`). Tap shows a sheet with the full value and a **Copy** button. On pointer devices, hover shows it and click copies.
- Button labels are 20 characters or fewer at base, so they stay on one line at 360.

### 3.4 Surfaces and borders

Depth comes from hairlines and the step between `--paper` and `--sheet`. Shadows are for things that float.

| Level | Fill | Edge | Shadow |
|---|---|---|---|
| Paper | `--paper` | none | none |
| Sheet (panels, cards) | `--sheet` | 1px `--hair` | none |
| Float (menus, popovers) | `--sheet-2` | 1px `--hair-strong` | `0 6px 20px rgba(22,32,27,.16)` |
| Overlay (sheets, modals) | `--sheet-2` | 1px `--hair-strong` | `0 -8px 32px rgba(22,32,27,.24)` over a 40% ink scrim |

On narrow screens, panels span the full content width with 12px between them. **Radius encodes size:** controls 3px, panels 6px, sheets 14px on the exposed top corners, pills and dots fully round.

### 3.5 The graticule

A hairline grid in `--grid`, used in two places:

1. **Behind chart plots.** Major lines at axis ticks, 1px. Minor subdivisions as a dotted 1px line at 50% opacity, dropped below 600px so the plot stays quiet at small size. Vertical lines appear only on time axes.
2. **Behind the canvas in layout-edit mode**, at 900 and up only. It shows the 12 × 40px snap grid so people can see where a panel will land. It disappears when editing ends.

It appears nowhere else. As a page background it would be decoration, and it would compete with the data it frames.

### 3.6 Dark theme ("night recorder")

Follows `prefers-color-scheme` by default, with a manual override. Built for dim rooms, with a graphite-green cast rather than near-black.

| Token | Hex |
|---|---|
| `--paper` | `#141A16` |
| `--sheet` | `#1B231E` |
| `--sheet-2` | `#232C27` |
| `--hair` | `#33403A` |
| `--hair-strong` | `#52625A` |
| `--grid` | `#27312B` |
| `--ink` | `#E6ECE5` |
| `--ink-2` | `#A6B3AA` |
| `--ink-3` | `#8A978F` |
| `--focus` | `#8FB0FF` |

State and series colours lift about 25% in lightness to hold 3:1 on `--sheet`. Primary buttons are light fill with dark text.

### 3.7 Motion

Motion answers an action or shows data arriving. Nothing animates on page load.

| Use | Duration |
|---|---|
| Press feedback | 80ms |
| Menus, tab changes | 140ms |
| Sheet open and close | 240ms, following the finger when dragged |
| Page-to-page slide | 220ms, direction matches the back or forward gesture |

Live data scrolls in from the right, with a 1px "now" marker. Under `prefers-reduced-motion`, all of it becomes an instant swap and live charts update in place.

### 3.8 Data and battery

- Live refresh pauses when the tab is hidden (`visibilitychange`) and when the device is in Save-Data mode. A "paused" badge appears in the context bar with a **Resume** button.
- Charts draw on canvas and are downsampled to about one point per two CSS pixels. A 330px plot never renders more than around 165 points per series.
- Budget: the first screen of a dashboard is readable within 2 seconds on a mid-range phone over 4G. Stats and the first chart load first. Everything below the fold loads on approach.

---

## 4. Components

Mobile behaviour first, then what changes on wide screens.

### 4.1 Buttons

- **Primary:** solid ink, paper text. One per region. Weight, not colour, marks importance.
- **Secondary:** `--sheet-2`, 1px `--hair-strong` border.
- **Ghost:** no fill. Toolbar and header actions. Icon plus label, or icon with a long-press label.
- **Destructive:** outlined with `--fail` and `--fail-text` label. It turns solid red only inside the confirmation sheet, so red is the last thing someone sees before an irreversible act.

Height is 44px at base. Full-width inside sheets, forms, and the sticky action bar. Links are always underlined and inherit ink, since chrome has no hue to carry that signal.

Name buttons for the result: "Save dashboard", "Add panel", "Delete 3 rules". Never "OK", "Submit", or "Yes".

### 4.2 Sheets, menus, and dialogs

On narrow screens, anything that opens over the page is a **bottom sheet**.

- **Action sheet:** replaces dropdown menus. Rows are 52px tall. Destructive items sit at the bottom, separated by a rule.
- **Content sheet:** time range, filters, series legend, row details. It has three snap heights (peek 40%, half, full) and a drag handle.
- **Confirm sheet:** replaces modal dialogs. States the consequence, then offers two full-width buttons.

Every sheet has a visible **Close** button, because swiping down is a gesture and gestures aren't discoverable. Focus is trapped, and the page behind is inert. At 600 and up, action sheets become popovers anchored to their trigger, and content and confirm sheets become centred modals 480px wide.

### 4.3 Choosing a message type

| Type | Use when | Don't use when |
|---|---|---|
| **Inline notice** | The message belongs to the content beside it and stays until the cause is fixed | It confirms something the user just did |
| **Banner** | The whole workspace is affected (outage, read-only mode). One at a time, pinned below the top bar. | It could be an inline notice |
| **Toast** | Confirming a finished action. Appears above the bottom bar and dismisses after 5s. | The user must act on it, or it's an error they need to read |
| **Confirm sheet** | The action is irreversible or needs a decision first | You just want attention |

Messages carry a state glyph, a title, one or two sentences, and at most one action. Messages with an action never auto-dismiss.

### 4.4 Panel

The unit of a dashboard: a header, a body, and an optional legend.

```
┌────────────────────────────────┐
│ ▲ Request latency, p95    ms ⤢ │  header: 44px
│────────────────────────────────│
│ 240 ┤ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄     │
│     │ ───╲╱─────╱╲───          │  plot: 200px tall at base
│ 120 ┤ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄     │
│     └──────────────────── time │
│ ── gateway  ┄┄ auth  +2 more › │  legend, opens a sheet
└────────────────────────────────┘
```

- Title left, unit right in Mono. The **expand** control is always visible. The overflow menu (⋯) goes in the header on tablet and up, and in the expanded view on phones.
- **Expand** opens the panel full screen and allows rotation to landscape. *Why:* a time series at 330px shows trend. At 800px landscape it shows detail.
- The state glyph sits before the title when the panel has a threshold state.
- **Loading:** a skeleton matching the final layout, including the graticule. No spinners over charts.
- **Error:** the panel keeps its size and shows ◆ with the reason and a **Retry** button.
- **No data:** say so and give the likely cause: "No data in this time range. The last sample was 3 days ago."
- Descriptions live in an info sheet, not under the title.

### 4.5 Single stat

```
Error rate
0.42 %
▲ 0.08 pts vs. previous hour
▁▂▃▂▂▅▃▂▃▄▃▂
```

At base, stats sit **2-up** in a grid, each 1 column wide of the 4-column grid pair. Value in Mono at `figure` size, with the unit at 60% size in `--ink-2`. The delta states its comparison basis, and its colour follows meaning (error rate rising is bad), not direction. The sparkline is single-series with no axes, 24px tall. Tapping a stat opens that metric's panel.

### 4.6 Tables and lists

On narrow screens, a table becomes a **card list**. Each column has a priority (1 to 3) set by the author.

```
┌────────────────────────────────┐
│ /checkout                  ◆   │  priority 1: title + state
│ p95 1.2 s · 4.1 % errors       │  priority 2: up to 2 key values
│ Updated 2 min ago           ›  │  priority 3: footer, then drill-in
└────────────────────────────────┘
```

- Cards are at least 64px tall and are one tap target. Row actions live in the detail view, not on the card.
- Selecting several rows is an explicit **Select** mode (checkboxes appear), and the toolbar becomes "3 selected" with an action sheet. *Why:* long-press and swipe-to-select aren't discoverable.
- A **Compare** toggle switches to a true table with horizontal scroll and a sticky first column. Use it when the user needs to read across columns.
- **600:** a real table with priority 1 and 2 columns. **900:** all columns, sticky header, 36px rows (28 compact).
- No zebra stripes. 1px `--hair` rules between rows. Numeric columns right-aligned, tabular figures, units in the header only. Selected rows get a 2px ink bar on the left and a bold first cell, and are never tinted.
- Sorting is a button in the header cell. On cards, sort lives in a **Sort** action sheet in the toolbar.

### 4.7 Time range

The most-used control in the app, so it's built for one hand.

- The trigger in the context bar reads in plain language: "Last 6 hours". Beneath the label in the sheet, the absolute range and time zone.
- On phones it opens a **content sheet** at half height: relative presets as 52px rows, then a "Custom range" row that opens native date-time inputs (`<input type="datetime-local">`).
- Plots support **pinch** to zoom the time range, plus **press-and-hold then drag** to select a range. Both have a visible alternative: the sheet, or a "Zoom out ×2" button that appears whenever the range has been narrowed.
- At 900 and up the sheet becomes a popover with presets left and absolute fields right. Keyboard shortcuts `t ←`, `t →`, and `t z` shift and zoom the window.
- Within 24 hours, show relative times ("12 minutes ago"). Beyond that, absolute with the zone (`2026-10-02 14:03 UTC`).

### 4.8 Inputs and filters

- 44px tall at base, `--sheet-2` fill, 1px `--hair-strong` border, 3px radius, 16px text.
- Label above, helper text below. An error replaces the helper text, adds ◆, and sets a `--fail` border. The error scrolls into view and receives focus.
- Use the right keyboard: `inputmode`, `autocomplete`, and `type` are required on every field.
- **Filters:** variables and filter chips collapse into a single **Filters (2)** button that opens a sheet. At 900 and up they show inline.
- Query editors use Mono with line numbers. On phones, add a helper row above the keyboard for symbols that are hard to reach (`{ } [ ] ( ) " | =`).
- Forms are one column at every size. Save and Cancel are sticky at the bottom.

### 4.9 Navigation

- **Bottom bar (base):** 56px, 4 destinations plus More. Each is icon above label. The selected item is inverted (ink fill, paper icon) and is the strongest mark in the chrome. Only one is selected at a time.
- **Side rail (600 and up):** 52px wide, same items in the same order, same inversion.
- **Tabs:** text only, 44px tall, a 2px ink underline on the selected tab, and weight 700. They scroll horizontally and the selected tab is scrolled into view. More than 5 tabs become a **select** in the context bar.
- **Search:** the ⌕ icon opens a full-screen search view with recent items and groups for Dashboards, Actions, and Docs. At 900 and up the same content appears as a ⌘K palette, 620px wide. Search supports verbs, so "create alert" shows the action directly.
- **Back** goes to the previous view, not the parent. Deep links open with a sensible back target.
- **Pull to refresh** re-queries the visible dashboard. The refresh button in the context bar does the same thing and is always present.

### 4.10 Empty states

Centred, 320px maximum width: what belongs here, how to start, one primary action, one docs link.

> **No alert rules yet**
> Alert rules notify you when a query crosses a threshold.
> [Create alert rule] Read the alerting guide

---

## 5. Page templates

The same page type gets the same layout every time. Phone layout first, then what wider screens add.

### 5.1 Dashboard

**Base (360)**

```
Context bar: Last 6 hours ▾ ⟳ 2 min ago
Title                       [Filters (2)]
┌────────────┬────────────┐
│ Error rate │ p95        │  stats, 2-up
└────────────┴────────────┘
┌──────────────────────────┐
│ main time series         │  full width, 200px
└──────────────────────────┘
┌──────────────────────────┐
│ breakdown (bars)         │
└──────────────────────────┘
┌──────────────────────────┐
│ slowest endpoints (cards)│  first 5, then "View all 24 ›"
└──────────────────────────┘
```

Order is: what's the state now, how did it change, what's underneath. The author sets a **mobile order** that can differ from the desktop layout, so the most important panel is first on a phone.

**Tablet (600):** stats 4-up, panels pair up on the 8-column grid.
**Desktop (900):** variables inline, the 12-column layout, and a table or logs panel full width at the bottom.

### 5.2 List

**Base**

```
Title                       [+ Create]
Search ___________  Filters (1)  Sort ▾
┌──────────────────────────┐
│ card · card · card …     │
└──────────────────────────┘
Load 25 more
```

**Wide:** the same content as a real table with a sticky header, bulk actions, and numbered pagination. Search, filters, sort, and page live in the URL so a filtered list can be shared.

### 5.3 Explore (query then result)

**Base:** a segmented switch at the top: **Query** and **Result**. **Run** is pinned to the sticky action bar and shows elapsed time and series count after each run. Running a query switches to Result.
**Desktop:** the editor above the result, both visible. The query is read first and the answer second.

### 5.4 Settings and forms

One column, 560px at most, grouped under headings with a short description each. Save and Cancel are sticky at the bottom. Settings are never auto-saved. Unsaved changes show a banner and trigger a confirm sheet on leaving.

### 5.5 Editing a dashboard

- **Phone and tablet:** edit *content*. Rename, change a query, change a panel's type, reorder panels (move up and down controls with a drag handle), delete, and set the mobile order.
- **Desktop only:** edit *layout*. Drag and resize panels on the 12-column grid, with the graticule visible. On smaller screens, this action reads "Open on a larger screen to arrange panels" with a link to copy.

This is the single place where capability differs, and it's stated to the user in the interface.

---

## 6. Charts on touch

- **Axes and labels:** `micro` size, `--ink-2`, tabular figures. No axis lines or tick marks. On narrow plots, label every other tick.
- **Lines:** 2px at base, 3px when pinned or isolated. Points show only on press.
- **Areas:** 14% opacity. Stacked areas get a 1px solid top edge.
- **Thresholds:** dashed 1px line in the state colour, with the label on the right edge.
- **Annotations:** a vertical dashed line with a small diamond at the top. Tapping the diamond opens the note.
- **Scrubbing:** plots set `touch-action: pan-y`, so vertical swipes scroll the page and horizontal drags move a crosshair. A fixed readout above the plot (not under the finger) lists values at the crosshair, sorted descending. Tap to pin.
- **Selecting a range:** press-and-hold 300ms, then drag. A "Zoom to selection" button appears.
- **Legend:** one line below the plot, showing up to 3 entries then "+N more ›", which opens a **legend sheet** with min, max, average, and last values. Tapping a row isolates that series, and a **Reset** button restores them all.
- **Gaps stay gaps.** Missing data is never zero-filled or silently interpolated.
- **Pie and donut:** only for 2 to 4 categories that make up a whole. Otherwise a sorted horizontal bar chart. Bars win on phones, since long labels fit beside them.
- Every chart has a "view as table" action and an accessible text summary of the trend.

| The question | The chart |
|---|---|
| How has it changed? | Time series |
| What is it now? | Stat |
| How do the parts compare? | Sorted horizontal bars |
| Where are the outliers in two dimensions? | Heatmap (wide only. Show a ranked list on phones.) |
| What exactly happened? | Card list or log view |

---

## 7. Writing

Plain verbs, sentence case, no filler. Name things by what the user does. Keep one name for an action across the whole flow: "Save dashboard" leads to "Dashboard saved". On a phone every word costs space, so each element does one job.

**Errors state what happened and what to do next.**
- Not: "Oops! Something went wrong."
- Use: "Query timed out after 30 s. Narrow the time range or add a label filter."

**Confirmations name the consequence.**
- Not: "Are you sure?" with **Yes** and **No**.
- Use: "Delete 'Checkout latency'? Its 14 panels and 3 alert rules are deleted with it." with **Delete dashboard** and **Cancel**.

**Titles fit.** Page and panel titles are written to read in full at 360px, around 28 characters. Longer names truncate at the end, and the full name is in the details sheet.

**Numbers are exact.** "1,204 series", not "lots of series". Always show units and the time zone.

**Docs lead with the task**, then the concept. Every page ends by linking to the next page by its title. Code samples run as written, and wrap in a horizontally scrolling block with a **Copy** button.

---

## 8. Accessibility baseline

- WCAG 2.2 AA. Body text on `--sheet` is 7:1 or better. Non-text UI (borders, chart lines) is 3:1 or better. Targets are 44px at base (WCAG's AA minimum is 24px, and we exceed it on purpose).
- All functions work with a screen reader (VoiceOver and TalkBack) and with an external keyboard. Panels are focusable regions: `Enter` opens the menu, `e` edits, `v` expands, `Esc` returns.
- Text scales with the system. Layouts are tested at 200% font size without clipping, and nothing is set in fixed-height containers.
- Support portrait and landscape. Lock orientation nowhere except, optionally, an expanded chart.
- State is never colour alone (principle 4).
- Honour `prefers-reduced-motion`, `prefers-color-scheme`, `prefers-contrast: more`, and `prefers-reduced-data`.

---

## 9. Tokens (mobile-first CSS)

```css
/* Base = phone. Wider rules only add. */
:root {
  --paper: #E3E8E2;  --sheet: #F7F9F6;  --sheet-2: #FFFFFF;
  --hair: #C3CCC2;   --hair-strong: #9BA89E;  --grid: #D3DAD2;
  --ink: #16201B;    --ink-2: #4E5C53;  --ink-3: #68756D;
  --focus: #2B50B5;

  --ok: #2E7D4F;   --ok-text: #1F5E39;
  --info: #2B6CB0; --info-text: #1F5288;
  --warn: #B7791F; --warn-text: #7A4F08;
  --fail: #C62F2F; --fail-text: #9B2020;

  --s1: #2B50B5; --s2: #6C4BB0; --s3: #1F7F86; --s4: #A8386F;
  --s5: #A06A12; --s6: #4E5C53; --s7: #2E7D4F; --s8: #C62F2F;

  --font-ui: "Atkinson Hyperlegible Next", system-ui, sans-serif;
  --font-mono: "Atkinson Hyperlegible Mono", ui-monospace, Menlo, monospace;

  /* Touch-sized by default */
  --control: 44px;
  --gutter: 12px;
  --margin: 16px;
  --pad: 16px;
  --row: 64px;
  --text-ui: 15px;
  --text-body: 16px;

  --r-control: 3px; --r-panel: 6px; --r-sheet: 14px;
  --ease: cubic-bezier(.2, 0, 0, 1);

  --safe-t: env(safe-area-inset-top, 0px);
  --safe-b: env(safe-area-inset-bottom, 0px);
  --safe-l: env(safe-area-inset-left, 0px);
  --safe-r: env(safe-area-inset-right, 0px);
}

/* Follow the system, with a manual override */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --paper: #141A16;  --sheet: #1B231E;  --sheet-2: #232C27;
    --hair: #33403A;   --hair-strong: #52625A;  --grid: #27312B;
    --ink: #E6ECE5;    --ink-2: #A6B3AA;  --ink-3: #8A978F;
    --focus: #8FB0FF;
  }
}
:root[data-theme="night"] {
  --paper: #141A16;  --sheet: #1B231E;  --sheet-2: #232C27;
  --hair: #33403A;   --hair-strong: #52625A;  --grid: #27312B;
  --ink: #E6ECE5;    --ink-2: #A6B3AA;  --ink-3: #8A978F;
  --focus: #8FB0FF;
}

html { -webkit-text-size-adjust: 100%; }
body {
  background: var(--paper); color: var(--ink);
  font: 500 var(--text-ui)/20px var(--font-ui);
  min-height: 100dvh;
  padding: var(--safe-t) var(--safe-r) 0 var(--safe-l);
}

.bottom-bar { position: fixed; inset: auto 0 0 0; height: calc(56px + var(--safe-b)); padding-bottom: var(--safe-b); }
.page { padding: 0 var(--margin) calc(56px + var(--safe-b) + var(--margin)); }
.sticky-actions { position: sticky; bottom: calc(56px + var(--safe-b)); }

.btn, .input { min-height: var(--control); }
.input { font-size: 16px; }

.num { font-family: var(--font-mono); font-variant-numeric: tabular-nums; text-align: right; }
a { color: inherit; text-decoration: underline; text-underline-offset: 2px; }
:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }

.panel { background: var(--sheet); border: 1px solid var(--hair); border-radius: var(--r-panel); padding: var(--pad); }
.plot { touch-action: pan-y; height: 200px; }
.btn-primary { background: var(--ink); color: var(--paper); border-radius: var(--r-control); }

.grid { display: grid; gap: var(--gutter); grid-template-columns: repeat(4, 1fr); }
.stat { grid-column: span 2; }
.panel-wide { grid-column: 1 / -1; }

.graticule {
  background-image: linear-gradient(var(--grid) 1px, transparent 1px);
  background-size: 100% 40px;
}

/* Tablet: add */
@media (min-width: 600px) {
  :root { --margin: 24px; --text-body: 16px; }
  .bottom-bar { display: none; }
  .page { padding-bottom: var(--margin); padding-left: calc(52px + var(--margin)); }
  .grid { grid-template-columns: repeat(8, 1fr); }
  .stat { grid-column: span 2; }
  .panel-wide { grid-column: span 4; }
  .plot { height: 240px; }
}

/* Desktop: add. Fine-pointer sizing applies only where a precise pointer exists */
@media (min-width: 900px) {
  :root { --text-ui: 14px; --text-body: 15px; }
  .grid { grid-template-columns: repeat(12, 1fr); }
  .stat { grid-column: span 3; }
  .panel-wide { grid-column: span 6; }
  .plot { height: 280px; }
  .editing .grid {                     /* layout-edit mode, desktop only */
    background-image:
      linear-gradient(var(--grid) 1px, transparent 1px),
      linear-gradient(90deg, var(--grid) 1px, transparent 1px);
    background-size: 100% 40px, calc(100% / 12) 100%;
  }
}
@media (min-width: 900px) and (pointer: fine) {
  :root { --control: 36px; --pad: 14px; --row: 36px; }
  [data-density="compact"] { --control: 28px; --pad: 10px; --row: 28px; --gutter: 8px; }
}

@media (min-width: 1280px) {
  .page { max-width: 1800px; margin-inline: auto; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition-duration: 0ms !important; }
}
@media (prefers-contrast: more) {
  :root { --hair: var(--hair-strong); }
  :focus-visible { outline-width: 3px; }
}
```

Required in `<head>`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
```
