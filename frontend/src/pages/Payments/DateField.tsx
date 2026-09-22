import { DatePicker } from '@/components/DatePicker';
import './DateField.css';

interface DateFieldProps {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
}

export function DateField({ label, value, onChange }: DateFieldProps) {
  return (
    <div className="date-field">
      <span className="date-field-label">{label}</span>
      <DatePicker value={value} onChange={onChange} />
    </div>
  );
}