export interface AipInfo {
  carCyberRtVersion?: string;
  carId?: string;
  carMapVersion?: string;
  carOtherVersion?: string;
  createTime?: string;
  dateTime?: string;
  dvObjName?: string;
  id: number;
  jiraIssueKey: string;
  jiraIssueLink?: string;
  machineType?: string;
  mainQuestionId?: number;
  ossName?: string;
  remark?: string;
  reporter?: string;
  status?: number;
  subQuestionId?: number;
  subType?: string;
  title?: string;
  type?: string;
}

export interface LogFileInfo {
  cut: boolean;
  filesize: number;
  name: string;
  objName: string;
  updateTime: string;
  containErrorTime?: boolean;
}

export interface AipDataInfo {
  dvLinks: string[];
  logFiles: LogFileInfo[];
  ossName?: string;
  record3dayLinks: string[];
}