
export enum EquipmentType {
  CRANE = 'Crane',
  FOCO_CRANE = 'Foco Crane',
  PRIMEMOVER = 'Primemover',
  PICKER = 'Picker',
  TSO = 'TSO'
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
  // Field added to match Omit requirements in RequestForm.tsx
  waMessageId?: string;
}

// Interface for WhatsApp notifications used by WAWebHookSimulator and LogisticsGroupChat components
export interface WhatsAppNotification {
  id: string;
  requestId: string;
  content: string;
  timestamp: number;
  isSystem: boolean;
}
