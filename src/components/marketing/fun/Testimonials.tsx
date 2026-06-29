const QUOTES = [
  {
    quote:
      'Between steering committee prep and the working sessions, I was living in old decks. Sunny pulls the thread across emails and slides so I walk in with the story straight.',
    name: 'Engagement manager',
    tag: 'McKinsey & Company',
  },
  {
    quote:
      'We had a launch date in one thread and a different milestone in a planning doc. Sunny flagged it before the exec review, with both sources linked.',
    name: 'Technical program manager',
    tag: 'NVIDIA',
  },
  {
    quote:
      'When a new CSA joined a six-figure rollout, I used to block a week for context transfer. They read the Sunny brief on day one and were useful in the customer call.',
    name: 'Customer success lead',
    tag: 'Microsoft',
  },
  {
    quote:
      'Cross-functional reviews move fast here. I need to trust what I am presenting, and Sunny only surfaces claims it can point back to an actual file.',
    name: 'Strategy & operations',
    tag: 'Meta',
  },
  {
    quote:
      'I was juggling ChatGPT, Claude, and notes in three tabs for partner briefs. Sunny keeps the latest models in one place with the campaign context already loaded.',
    name: 'Partnerships manager',
    tag: 'Instagram',
  },
  {
    quote:
      'Before a readiness review, I need everyone aligned on what changed since the last sync. Sunny reads the pile so the room can focus on decisions, not catch-up.',
    name: 'Mission integration engineer',
    tag: 'SpaceX',
  },
];

export function Testimonials() {
  return (
    <div className="tw-grid">
      {QUOTES.map((q) => (
        <figure key={q.quote} className="tw-card">
          <blockquote className="tw-quote">“{q.quote}”</blockquote>
          <figcaption className="tw-cap">
            <span className="tw-name">{q.name}</span>
            <span className="tw-tag">{q.tag}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
