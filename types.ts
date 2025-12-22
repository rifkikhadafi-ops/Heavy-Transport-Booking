
export enum EquipmentType {
  CRANE = 'Crane',
  FOCO_CRANE = 'Foco Crane',
  PRIMEMOVER = 'Primemover',
  PICKER = 'Picker'
}

export enum JobStatus {
  REQUESTED = 'Requested',
  ON_PROGRESS = 'On Progress',
  PENDING = 'Pending',
  CLOSE = 'Close'
}

export interface BookingRequest {
  id: string;
  unit: EquipmentType;
  details: string;
  date: string;
  startTime: string;
  endTime: string;
  status: JobStatus;
  requestedAt: number;
  waMessageId?: string;
}

export interface WhatsAppNotification {
  id: string;
  requestId: string;
  sender: string;
  content: string;
  timestamp: number;
  isSystem: boolean;
}
