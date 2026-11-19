# Interaction design

The interface responds immediately to input, then settles with small movements and mint highlights. Data values update directly; they never count through invented intermediate readings.

| Interaction | Response | Timing |
| --- | --- | --- |
| Buttons and links | Colour/border feedback, small press compression; keyboard activation gets a short brightness cue | 70ms press, 140ms release |
| Desktop cards | Pointer hover lifts 2px with a restrained glow; touch layouts do not retain hover previews | 140–180ms |
| Selectors and toggles | Focus ring and short selection glow; affected results fade into place | 140–240ms |
| Navigation | Active state, mint indicator and a small icon lift | 180–220ms |
| Desktop pop-ups | Fade and lift 12px; backdrop fades with the panel | 240ms in, 180ms out |
| Mobile sheets | Slide 32px from below, with the same backdrop treatment | 260ms in, 180ms out |
| Tool and tab changes | Short content fade/lift without remounting forms to animate them | 180ms |
| Generation source | Selected arc/row emphasis; icon and explanation settle into place | 180ms |
| Disclosures | Indicator rotates; content expands/collapses using native details semantics | 220ms |
| Charts and result messages | New content fades in; current observations retain exact values | 180–240ms |

Desktop source explanations reserve space to avoid moving the ring under a hovering pointer. Dialogs translate without scaling so map canvas dimensions remain stable. MapLibre retains its existing pan, zoom and focus transitions.

Dialogs keep their last committed view and native modal behaviour through exit, then unmount tool content, release scrolling and restore opener focus. Reopening cancels a pending dismissal. A safety completion path prevents a failed animation from leaving the page locked. Inputs are never intercepted to produce decorative effects. Native menus, file selection, links and form validation retain browser behaviour.

Reduced-motion preferences remove interface transitions, decorative animations and JS feedback; dismissal is immediate. Active JavaScript feedback is cancelled when the page is hidden. No animation library, provider, account or persistence was added.
