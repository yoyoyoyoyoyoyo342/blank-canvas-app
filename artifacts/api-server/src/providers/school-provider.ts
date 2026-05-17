export interface SchoolMessage {
  id: string;
  subject: string;
  sender: string;
  preview: string;
  receivedAt: string;
}

export interface SchoolScheduleItem {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  childName: string;
}

export interface SchoolChild {
  id: string;
  name: string;
}

export interface SchoolProvider {
  auth(credentials: Record<string, string>): Promise<boolean>;
  getMessages(): Promise<SchoolMessage[]>;
  getCalendar(): Promise<SchoolScheduleItem[]>;
  getChildren(): Promise<SchoolChild[]>;
  getSchedule(childId?: string): Promise<SchoolScheduleItem[]>;
}
