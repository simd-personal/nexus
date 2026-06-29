import {
  Calendar,
  FileSpreadsheet,
  FileText,
  Mail,
  Mic,
  Presentation,
  StickyNote,
  Table,
} from 'lucide-react';

const ITEMS = [
  { icon: Presentation, label: 'Decks' },
  { icon: Mail, label: 'Emails' },
  { icon: Mic, label: 'Call recordings' },
  { icon: FileText, label: 'PDFs' },
  { icon: StickyNote, label: 'Meeting notes' },
  { icon: FileSpreadsheet, label: 'Spreadsheets' },
  { icon: Table, label: 'Transcripts' },
  { icon: Calendar, label: 'Agendas' },
];

export function LogoMarquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div className="mq-wrap">
      <div className="mq-fade mq-fade-l" />
      <div className="mq-fade mq-fade-r" />
      <div className="mq-track">
        {row.map((item, i) => (
          <div key={`${item.label}-${i}`} className="mq-item">
            <item.icon className="h-4 w-4" strokeWidth={1.75} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
