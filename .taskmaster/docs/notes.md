I need a theme editing application that makes it really easy to edit colors in a semi-visual way and automatically save them into json format, but allows me to also work in a more intuitive color model than hex, while saving json files in hex.

Think about the easiest way to put together a theme editor that allows me to open a json5 file for the Zed IDE with a bunch of colors in it (typically specified in hex, but other colors optional), display the json5 nicely formatted with a swatch of the original color inline, along with a swatch of a new color that can be specified using whatever color system the user wants (especially with support for oklch by default). The color inputs use user-friendly input fields that
allow arrow up/down to change and alt up/down to change by tenths and shift up/down to shift by tens

We need a few things to accomplish this. I think it might be easiest to build this using web technologies, likely React, which I'm somewhat familiar with.

We need:

1. json5 parsing
2. color conversion functions so we can convert from any color system to any other (especially back and forth
between hex, rgb, hsl, and oklch)
3. A nice input field component that supports int OR decimal values and allows cursor input with modifiers for /10
or *10)
4. syntax highlighting for json5 that looks good in both dark and light modes
5. Dark mode switching so we can see the colors in context of light and dark modes
6. Awareness of all (or most) of the colo variables that Zed can use (see my .json file for a very incomplete example, seek additional documentation online or at Zed Industries' website)

When the user clicks 'save' or presses ctrl+s or cmd+s, it should automatically write the changes to the original
file in hex (6 or 8 digit formats), which will cause the IDE to update immediately, usually.

This is primarily designed to work on a local file (for now) although I'm not sure if that preclude it from being a
public website (it's okay for now if I have to run this at localhost or in my browser) 

I think it'd be nice to use tailwindcss for the styling just because it's what I know.

Let's write a first draft plan for what a tool like this, and all the requirements it has. We can draft a prd.txt for taskmaster in .taskmaster/docs/prd.txt that we can use to scaffold out the necessary tasks to complete this mini project.

Ask me plenty of questions because we'll probably iterate on this plan quite a bit before we implement it.



Responses to your questions

## File Handling & Architecture
1. I think when the project opens, it can just show a 'drop zone' that either allows you to click and pick a file using the OS file picker, or drag and drop the file. At this point, I'm not planning to have much of a website around this, so it can be a pretty minimalist UI. I can live without Firefox/Safari support if that makes it easier - I'm usually a Chrome user and this is just for me, atm.

2. Yes, the themes folder has my custom but incomplete theme jdracula-zed.json, as well as a more complete theme called _default.json


## Color Editing UX
3. For the color editing interface, I don't want to block the view of the json and existing swatches, so maybe a pane on the right where a UI to edit the selected color shows makes sense. We can even have it show a few important color models at once (hex, rgb, hsl, and oklch, for instance) and allow the user to tweak one which automatically updates all the others, and updates the 'new' swatch beside the originally existing swatch in the json/colors view

4. It may not be necessary to remember which color format the user picked because we'll allow editing in other colors simultaneously. That said, it might be good to allow altering the display of the original swatches to whatever a user wants (a select/dropdown at the top could allow changing from rgb to oklch, for instance). Perhaps we can store this setting in localstorage so we don't have to pick it every time. Keep in mind that we still need to produce saved output in hex when we save to the original file.

5. A visual color picker makes sense to show - if we're making a whole 'color editing panel' on the right side, we can add a visual color picker UI that also updates along with the oklch and rgb inputs/values

6. Yes, it would be really important to be able to undo and redo, so we have to keep track of a history of changes and have some ability to roll them back.

7. Instead of a dot to show the color differs, I planned to show an 'old' swatch then a 'new' swatch beside it.

8. Hm, I think maybe using a decimal makes sense to me personally... what's more common and canonical? Just go with that, as long as it doesn't complicate implmentation.

9. I have no interest in color relationship tools yet. Maybe in the future.

10. Yes, I think Next.js is overkill for what is basically going to be a ball of js. We can probably scaffold out a project using vite and start from there. I want to use all the newest versions of everything where possible and also ensure that we establish a framework for unit testing very early since that helps vibe-coded projects like this go way more smoothly.

11. Let's save time and use the best existing library - I don't have a preference but it sounds like culori should work if you think it's the strongest best option.

12. Might as well do typescript unless you think that'll slow us down and complicate the project. It theoretically could make certian classes of errors easier for you to solve, right?

## Structure-Specific Questions
13. We should support multiple themes, we can have tabs for themes with multiple sub-themes
14. We are primarily focused on color. For non-color values, we could still allow editing just as text (I suppose the color editor pane becomes a simple text-edit pane)
15. Yes, we definitely need to be able to support alpha on all color models, that's a key feature. This also makes the dark/light switching mode even more important.
16. We should match the JSON structure, but it might be nice if we could implement nested code folding - only if it's trivial to do, this isn't important.
17. We can probably ignore empty arrays in v1.

## Workflow Questions

18. It's likely not necessary to support watching the file for changes, we can table that for a v1.2-ish release if it's easy to do, it sounds like it might be difficult.
19. We can store some metadata in local storage if it's straightforward, but we don't have to preserve anything - it'll just save all the new colors we've selected as the hex values in the json.

## Additional Features and Info

A nice feature to have would be for the editor itself to use the color theme that we're editing (even if only for the background and main text initially, since that should be pretty simple to implement)

We should have an awareness of what the schema looks like. We will likely want a feature to add a key for values we don't already have. Docs are here:
https://zed.dev/schema/themes/v0.2.0.json

That schema enumerates the style properties (the actual “variables” you care about), so your app can:
  - auto-complete keys
  - validate unknown keys
  - group keys by prefix (editor.*, terminal.*, element.*, etc.)
  - show descriptions/tooltips if present (schema has descriptions for many fields)


The UI should detect out-of-gamut and either:
  - clamp (fast, slightly “wrong”)
  - or gamut-map (if not too difficult, better appearance preservation)

We'll likely use CodeMirror 6 for code highlighting with inline widgets (swatches for colors) and the ability to theme


There should also be a preview area (perhaps at the bottom right if there's room) that allows us to preview the theme: Not a full Zed clone—just enough: editor background, foreground text, selection, gutter, a small terminal block. You want context, not perfection.


### Number spinner brain
Make a <NumberField> that:
  • Keeps raw text so partial edits are allowed (-, .)
  • On ArrowUp/ArrowDown:
  • normal: ±1
  • Alt: ±0.1
  • Shift: ±10
  • Alt+Shift: pick something consistent (I like ±1 as the “middle ground”)
  • Preserves decimal precision reasonably (don’t accumulate float garbage—round to e.g. 3–4 decimals for C and A)
  • Applies domain clamping:
  • L: 0–100 (if you present it as %)
  • C: 0–(reasonable max, or allow bigger but warn)
  • H: wrap 0–360
  • A: 0–1

This is one of those “20 lines of logic, 200 lines of edge cases” components—but once it’s solid, the whole app feels premium.

