// THE spacing scale. Every gap in the app comes from here — a screen that
// invents its own number is what makes the app look hand-assembled, which is
// exactly what we were fixing when this file appeared.
//
// The scale is the 8-point grid Material and Apple both build on, with a 4pt
// half-step where 8 is too airy and 16 too tight:
//   4 · 8 · 12 · 16 · 20 · 24 · 32
//
// Sources: Material 3 "Spacing" (8dp scale, 16dp content margins) and Apple's
// HIG layout guidance (multiples of 8, 16pt side margins on phones). We sit a
// notch wider at 20 because that is what the Figma file draws.
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// What each number MEANS, so a screen asks for the role and not the digit.
export const layout = {
  // Side padding of a page, and therefore the left edge of every card.
  screenGutter: space.xl, // 20
  // Padding inside a card. Card text therefore starts at 40 from the screen
  // edge, and section headings line up with it (see home screen).
  cardPadding: space.xl, // 20
  // The one gap between things in a list: card→card, header→first card,
  // above and below a section heading, control row→list.
  betweenCards: space.md, // 12
  // Gap between a screen's header and the first control under it.
  headerToContent: space.md, // 12
  // Gap between lines inside one card.
  insideCard: space.sm, // 8
  // Clearance under a scrolling list for the floating nav bar.
  listBottom: 140,
};

export default space;
