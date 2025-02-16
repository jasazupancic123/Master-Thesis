export interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
}

export interface CalendarDayModalProps {
  data: any;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}
