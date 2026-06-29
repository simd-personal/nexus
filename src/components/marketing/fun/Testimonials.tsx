const QUOTES = [
  {
    quote:
      "I used to spend my Sunday nights re-reading client decks. Now Sunny hands me the brief and I just show up sharp.",
    name: 'Independent strategy consultant',
    tag: '3 active clients',
  },
  {
    quote:
      "It caught a timeline conflict between an email and a deck that I would've walked right into on a board call.",
    name: 'Fractional COO',
    tag: 'SaaS + healthcare',
  },
  {
    quote:
      "Onboarding a new project lead used to take a week. They read Sunny's brief and they're caught up in an hour.",
    name: 'Boutique agency founder',
    tag: '6-person team',
  },
  {
    quote:
      'The citations are the whole thing. I trust it because every line points back to a real file.',
    name: 'Management consultant',
    tag: 'Ex-Big 4',
  },
  {
    quote:
      "Having GPT and Claude included means I stopped paying for three subscriptions and pasting context all day.",
    name: 'Growth advisor',
    tag: 'Portfolio of startups',
  },
  {
    quote:
      "It feels less like a tool and more like a teammate who actually did the reading before the meeting.",
    name: 'Product consultant',
    tag: 'Fintech',
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
