
export interface Person {
  id: string;
  name: string;
  designation: string;
  mobile: string;
}

export interface EmergencyContact {
  name: string;
  mobile: string;
}

export interface VotingCenter {
  id: string;
  centerNumber: string;
  name: string;
  boothCount: string;
  voterCount: string;
  roomLocation: string;
  locationLink: string;
  importantPersons: Person[];
}

export type ViewState = 'HOME' | 'CENTER_DETAILS' | 'PERSONS' | 'CENTER_INFO' | 'ADMIN' | 'ADMIN_LOGIN' | 'EDIT_CENTER' | 'SETTINGS';
