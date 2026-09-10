---
name: uiux-progressive-disclosure
description: Principles, design heuristics, decision matrices, and code patterns for decluttering complex web UI/UX into clean, minimalist interfaces using progressive disclosure. Use whenever auditing cluttered interfaces, refactoring dense forms/modals/dashboards, deciding what elements to keep vs hide vs delete, or creating software that feels simple on the surface yet deep and powerful underneath.
---

# Minimalist UI/UX & Progressive Disclosure Framework

A practical guide and reference for transforming crowded, overwhelming web applications and modals into clean, intuitive, and high-converting user experiences.

> **The Golden Rule**: An interface should immediately show only what 80% of users need on 80% of visits. Power options, edge-case configurations, and deep settings must be tucked neatly behind intuitive secondary disclosure layers (collapsible sections, dropdowns, contextual drawers, or popovers).

---

## 1. The Triad Decision Matrix: What to Keep, What to Hide, What to Delete

When auditing any page, screen, modal, or form, evaluate every single visual component against this matrix:

```
+-------------------------------------------------------------------------------+
|                                UI ELEMENT AUDIT                               |
+------------------------------------+------------------------------------------+
|  FREQUENCY & CRITICALITY           |  ACTION                                  |
+------------------------------------+------------------------------------------+
|  Used by >70% of users on every    |  KEEP (Tier 1: Always Visible)           |
|  visit to complete the core job.   |  High clarity, prominent visual anchor.  |
+------------------------------------+------------------------------------------+
|  Needed for specific edge cases,   |  HIDE (Tier 2 & 3: Progressive)          |
|  power options, or deep tuning.    |  Behind tabs, accordions, "More...",     |
|                                    |  subtle settings gear, or popovers.      |
+------------------------------------+------------------------------------------+
|  Helper paragraphs explaining the  |  DELETE / REPLACE                        |
|  obvious, redundant labels,        |  Replace with smart defaults, tooltips,  |
|  duplicate buttons, tech jargon.   |  clean placeholders, or remove entirely. |
+------------------------------------+------------------------------------------+
```

### 1.1 What to KEEP (Tier 1 — Always Visible)
Only keep elements that are essential for completing the immediate, primary job to be done:
- **Single Primary CTA**: Exactly one dominant action button (e.g., `Send Email`, `Create Project`, `Save Changes`).
- **Core Input Fields**: Only the mandatory inputs needed for 80% of submissions (e.g., `To`, `Subject`, `Message`).
- **Clear Status/Identity**: Knowing who is logged in or current draft state (e.g., `Draft saved`).
- **High-Scannability Preview**: The direct outcome of the user's action (e.g., real-time letter/email preview).

### 1.2 What to HIDE (Tier 2 & Tier 3 — Progressive Disclosure)
Never dump advanced configuration into the initial viewport. Reveal these only on demand:
- **AI Tone & Style Selectors**: Place inside a subtle `✦ Polish & Tone ▾` dropdown or small badge popover instead of taking up 6 permanent button pills.
- **Advanced Role & Interview Details**: Place inside a collapsible accordion (`▶ More Options` or `Customize Role & Details`).
- **Secondary Refinements**: Chips like *Add NDA Clause*, *Make Formal*, *Shorten* belong in a secondary dropdown or contextual floating toolbar.
- **Bulk / Import Features**: Keep as an icon action or overflow menu item (`•••`), not a prominent header button competing with the modal's primary flow.
- **SMTP / Server / Technical Settings**: Move to user workspace settings or a discreet gear icon `⚙️` in the corner.

### 1.3 What to DELETE (Visual Pollution Kill List)
Aggressively eliminate these patterns:
- **Instructional Banners**: Long paragraphs like *"Drafting as Clean Plain Text. Blank Canvas active. Describe what you need in the prompt box below!"* — if the placeholder is good, the banner is pure noise.
- **Redundant Status Labels**: Showing `Format: TEXT` + `Text Email Badge` + `Live Plain Text Preview` all in the same 200px space. Choose one clean badge.
- **Empty State Clutter**: Long messages like *"No recipient added yet. Type email below..."* right next to an input with the placeholder *"Search workspace member or type address..."*. The placeholder is already enough.
- **Multiple High-Contrast Buttons**: If every button has orange gradients, glow effects, and borders, nothing stands out. Use **1 Primary** (Solid), **Secondary** (Ghost/Outline), and **Tertiary** (Subtle text link).

---

## 2. Progressive Disclosure Architecture (The 3 Levels)

```
Level 1: The Zen Surface (Default View)
 ┌──────────────────────────────────────────────────────────┐
 │  To: [ hr@company.com ]                                  │
 │  Subject: [ Meeting Discussion                         ] │
 │  Message: [ Write your message here...                 ] │
 │                                                          │
 │  [▶ Advanced Options]          [✦ AI Polish ▾]  [ Send ] │
 └──────────────────────────────────────────────────────────┘

Level 2: Contextual Expansion (Clicked "Advanced Options" or "AI Polish")
 ┌──────────────────────────────────────────────────────────┐
 │  ▼ Advanced Options (Collapse)                           │
 │  ├── Meeting Link: [ meet.google.com/xxx-yyy-zzz       ] │
 │  ├── Schedule Date & Time: [ Tomorrow, 3:30 PM         ] │
 │  └── Attachments: [ + Add File ]                         │
 └──────────────────────────────────────────────────────────┘

Level 3: Deep Settings / Modal (Clicked "⚙️ Settings" or "Manage Presets")
 ┌──────────────────────────────────────────────────────────┐
 │  Full-page or dedicated dialog for SMTP servers,         │
 │  role template builders, dispatch audit logs.            │
 └──────────────────────────────────────────────────────────┘
```

---

## 3. Step-by-Step UI/UX Refactoring Workflow

When assigned to clean up any messy webpage or modal:

### Step 1: Element Inventory & Count
Count all interactive elements on the screen. If a modal has more than **10 distinct buttons/switches visible simultaneously**, cognitive load is dangerously high (Hick's Law). Aim to bring initial visible controls down to **4 to 6**.

### Step 2: Establish the 60-30-10 Visual Weight Rule
- **60% Dominant Canvas**: Clean background space and the content being created/previewed.
- **30% Secondary Elements**: Input fields, borders, readable labels with muted slate colors (`text-slate-400`, `border-slate-800`).
- **10% Accent / Focal Point**: The primary CTA button and active status indicators.

### Step 3: Implement Modern Disclosure Patterns
1. **Collapsible Accordion**:
   - Use for optional categories, role parameters, compensation fields, or interview details.
   - Show a subtle count indicator when collapsed (e.g., `▶ Role Details (3 fields configured)`).
2. **Contextual Action Menus (Popover/Dropdown)**:
   - Combine multiple AI actions (`More Formal`, `Add Google Meet`, `Shorten`, `Add NDA`) into a single `AI Actions ▾` or `Refine ▾` menu.
3. **Tabbed Segments with High Contrast**:
   - Instead of showing both AI Prompt inputs AND manual form inputs on one tall scrolling column, use clean segmented tabs: `[ Quick Prompt ] | [ Form Fields ]`.
4. **Click-to-Reveal / Inline Editing**:
   - Subject lines and titles should look like clean headings that turn into inputs upon clicking, rather than heavy input boxes permanently boxed with borders.

---

## 4. Practical Implementation Rules (CSS & Tailwind)

### 4.1 Typography & Sizing Hierarchy
- **Avoid All-Caps Everywhere**: Limit uppercase text to very small category badges (`text-[10px] uppercase tracking-wider`). Never uppercase entire labels or buttons.
- **Font Weight Discipline**:
  - `font-bold` (700): Reserved for page titles and Primary CTA.
  - `font-semibold` (600): For section headers and active tab names.
  - `font-normal` (400) / `font-medium` (500): For all body text, placeholders, and standard inputs.

### 4.2 Spacing & Breathing Room
- Eliminate `margin-bottom: 24px` on every stacked element. Group related controls inside `space-y-1.5` or `gap-2` with an enclosing card having `p-3` or `p-4`.
- Use `border-slate-200/60 dark:border-slate-800/60` for subtle dividers rather than thick, distracting lines.

### 4.3 Input Micro-Copy
- Don't write redundant labels if the placeholder is self-evident:
  - ❌ Label: `Email Subject Line` -> Placeholder: `e.g. Discussion on New Version Release`
  - ✅ Combined/Clean: Placeholder `Subject: e.g. Quarterly Team Sync...` with an inline prefix icon `✉️`.

---

## 5. UI/UX Audit Checklist (Run before finishing any UI task)

- [ ] **First 3 Seconds Test**: Can a user immediately identify what this screen does and where to click first?
- [ ] **Single Primary Action**: Is there only ONE visually dominant button?
- [ ] **Zero Redundancies**: Are there any duplicate labels, repetitive badges, or unnecessary helper notes?
- [ ] **Progressive Disclosure**: Are advanced settings (like SMTP configuration, deep parameters, niche chips) tucked away until asked for?
- [ ] **Mobile & Laptop Fit**: Does the modal fit on a standard 13" laptop screen (768px height) without awkward double scrollbars?
- [ ] **Dark Mode Elegance**: Are dark mode backgrounds rich deep slate (`bg-slate-950` / `bg-slate-900`) instead of flat harsh pitch-black, with soft border contrast (`border-slate-800/80`)?

---

## 6. Real Example: Email Composer Redesign Spec

### Before (Cluttered — As in Current Implementation)
- 12 visible chips (tones + refinements)
- 2 helper alert boxes explaining plain text & recipient counts
- 4 buttons in the header (`SMTP Config`, `Bulk Send`, `New Template`, `Manage Presets`)
- 2 tabs (`AI Assistant`, `Manual Customizer`) + 4 stacked inputs + collapsible section all expanded at once
- Result: Severe cognitive fatigue before typing a single word.

### After (Minimalist & Progressive)
1. **Header**: Clean title + close `✕`. Technical items (`SMTP`, `Presets`) tucked into an overflow `⚙️` icon.
2. **Left Panel (3 Core Blocks)**:
   - **Recipients Field**: Clean chip input. Quick groups (`+ Team`, `+ Interns`) appear only when focusing the input.
   - **Template & Mode Bar**: A compact pill toggle `[ Freeform / AI ]  [ Template ]`.
   - **Content Generator Box**: Single prompt textarea with a clean `[ ✦ Generate ]` action button.
3. **Disclosure Layer**:
   - An expandable row: `▶ Add Meeting Link, Role & Options` (Hidden by default).
   - A single dropdown: `✦ Refine Text ▾` (Contains Formal, NDA, Shorter, Meet invite).
4. **Right Panel (Letter Preview)**:
   - Clean preview canvas with direct inline editing.
   - Sticky bottom bar with **[ Send Email ]** as the undisputed primary CTA.
