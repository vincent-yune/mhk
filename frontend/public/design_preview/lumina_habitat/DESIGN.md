# Design System Strategy: The Intelligent Sanctuary

## 1. Overview & Creative North Star
The North Star for this design system is **"The Digital Concierge."** 

Unlike standard "smart home" apps that feel like cold engineering dashboards, this system is built on the principles of **Soft Minimalism** and **Editorial Precision**. It moves away from the rigid, boxed-in "control panel" aesthetic in favor of a fluid, layered environment that feels as intentional and curated as a high-end architectural digest. 

We break the "template" look by utilizing **intentional asymmetry** and **tonal depth**. Rather than placing icons in a flat grid, we use expansive white space and overlapping surface containers to create a sense of physical space. The interface should feel like it is "breathing," conveying a sense of calm efficiency and quiet technological mastery.

---

## 2. Colors & Surface Architecture
This system utilizes a sophisticated palette of muted neutrals punctuated by high-authority accents. 

### The Palette
*   **Primary (#005b87):** Our "Home Blue." Used for high-priority actions and brand moments.
*   **Secondary (#006e1c):** Our "Smart Green." Reserved for "Active/Healthy" states (e.g., HVAC running, Security Armed).
*   **Tertiary (#923357):** A muted plum used for "Human" notifications or personalized alerts.
*   **Neutrals:** A range of `surface` tokens from `surface_container_lowest` (#ffffff) to `surface_dim` (#d8dadb).

### The "No-Line" Rule
**Prohibit 1px solid borders for sectioning.** Traditional lines create visual "noise" that disrupts the sense of calm. Instead, boundaries must be defined solely through background color shifts. A `surface_container_low` card sitting on a `surface` background provides all the definition needed.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of fine paper or frosted glass.
*   **Base:** `surface` (#f8fafb)
*   **The Grouping Layer:** `surface_container_low` (#f2f4f5)
*   **The Component Layer:** `surface_container_lowest` (#ffffff) for primary cards.
*   **The Focus Layer:** `surface_container_high` (#e6e8e9) for interactive elements like pressed states.

### The "Glass & Gradient" Rule
To elevate the "smart" feel, use **Glassmorphism** for floating elements (e.g., a bottom navigation bar or a floating climate control slider). Use semi-transparent surface colors with a `backdrop-blur` of 12px-20px. 
*   **Signature Textures:** Apply subtle linear gradients transitioning from `primary` (#005b87) to `primary_container` (#2374a5) on main CTA buttons to provide a "soulful" depth that flat hex codes cannot achieve.

---

## 3. Typography: The Editorial Voice
We use a dual-typeface system to balance technical authority with domestic warmth.

*   **Display & Headlines (Manrope):** We use Manrope for all headers (`display-lg` to `headline-sm`). Its geometric yet rounded terminals feel modern and professional. Use `headline-md` (1.75rem) for room names to give them an "editorial" presence.
*   **Body & Labels (Inter):** We use Inter for all functional text. It is the gold standard for legibility at small scales. 
*   **Hierarchy Note:** Use `on_surface_variant` (#40493d) for secondary body text to create a soft contrast that reduces eye strain, reserving `on_surface` (#191c1d) for primary headlines.

---

## 4. Elevation & Depth
In this system, elevation is a feeling, not a shadow.

*   **The Layering Principle:** Stacking is our primary tool. Place a `surface_container_lowest` white card on a `surface_container_low` gray background to create "natural lift."
*   **Ambient Shadows:** If a "floating" effect is required (e.g., for a critical alert or a floating action button), use an extra-diffused shadow:
    *   *Blur:* 24px - 40px
    *   *Opacity:* 4% - 6%
    *   *Color:* Use a tinted version of `on_surface` (#191c1d) rather than pure black.
*   **The "Ghost Border" Fallback:** If accessibility requires a border, use the `outline_variant` token at **20% opacity**. Never use 100% opaque borders.

---

## 5. Component Logic

### Buttons & Actions
*   **Primary CTA:** Rounded `xl` (1.5rem), using the Primary-to-Primary-Container gradient. 
*   **Secondary Action:** `surface_container_high` background with `on_primary_fixed_variant` text. No border.
*   **Tertiary:** Text-only, using `label-md` weight, placed with generous `spacing-4` (1rem) padding.

### Smart Cards & Lists
*   **The Card Rule:** All cards use `roundedness-lg` (1rem). 
*   **No Dividers:** Forbid the use of divider lines in lists. Use `spacing-3` (0.75rem) of vertical white space or a subtle background toggle between `surface_container_low` and `surface_container_lowest` to separate items.

### Context-Specific Components
*   **The "Status Glow" Chip:** For device status (e.g., "Online"), use a `secondary_container` chip with a 2px inner "glow" (a slightly lighter shade of the green) to indicate the device is "alive."
*   **Environmental Sliders:** Use thick, `rounded-full` tracks with a `surface_container_highest` color. The handle should be a `surface_container_lowest` circle with a subtle ambient shadow.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use asymmetrical layouts. For example, a hero "Welcome Home" header should be left-aligned with a large `display-sm` font, while the "Quick Actions" are tucked into a right-aligned scrollable row.
*   **Do** embrace the "breath." Use `spacing-12` (3rem) and `spacing-16` (4rem) to separate major functional sections.
*   **Do** use `roundedness-xl` (1.5rem) for large image containers or map views to soften the tech feel.

### Don't
*   **Don't** use pure black (#000000) for anything. It is too harsh for a "Home" environment. Use `on_surface`.
*   **Don't** use standard 1px borders. If you feel the need for a line, try using a background color shift first.
*   **Don't** overcrowd. If a screen feels busy, increase the spacing tokens rather than shrinking the typography.