export type ChecklistChoice = 'Yes' | 'No' | null;

export interface ChecklistItemState {
  status: ChecklistChoice;
  remarks: string;
}

export interface CheckStandardItem {
  id: number; // 1-based overall index (1 to 22)
  stageNum: number; // 1, 2, or 3
  stage: 'Before service' | 'During service' | 'After service';
  item: string;
  standard: string;
}

export interface ChecklistData {
  ticketNo: string;
  customerName: string;
  maintenanceTime: string;
  serverSn: string;
  signatureName: string;
  items: Record<number, ChecklistItemState>; // keyed by CheckStandardItem.id
}

export const CHECKLIST_ITEMS: CheckStandardItem[] = [
  // Before service (Stage 1)
  {
    id: 1,
    stageNum: 1,
    stage: 'Before service',
    item: 'Ticket information',
    standard: 'Study and understand the fault description and suggested onsite operation in portal before proceed with the maintanance activity'
  },
  {
    id: 2,
    stageNum: 1,
    stage: 'Before service',
    item: 'Device information',
    standard: 'Check that the server SN is consistent with the ticket'
  },
  {
    id: 3,
    stageNum: 1,
    stage: 'Before service',
    item: 'Marking information',
    standard: 'Turn on UID to confirm server to be repaired; (Five elements of machine positioning: machine rack position, U position, SN, maintenance label, UID light)'
  },
  // During service (Stage 2)
  {
    id: 4,
    stageNum: 2,
    stage: 'During service',
    item: 'Shut down and restart',
    standard: 'Double check the marks and SN before shutdown and restart after getting permission'
  },
  {
    id: 5,
    stageNum: 2,
    stage: 'During service',
    item: 'Shut down and restart',
    standard: "Take extra cautions on window ticket. If the server doesn't shutdown during the window maintanance time,please do not proceed with the repair acitivty and escalate immediately."
  },
  {
    id: 6,
    stageNum: 2,
    stage: 'During service',
    item: 'Aware on surrounding and peripheral',
    standard: 'Take extra cautious on server status, rack status, railkit status and etc'
  },
  {
    id: 7,
    stageNum: 2,
    stage: 'During service',
    item: 'Aware on surrounding and peripheral',
    standard: 'When server have to be unmounted, be very careful in unmounting the server.'
  },
  {
    id: 8,
    stageNum: 2,
    stage: 'During service',
    item: 'Updating Firmware',
    standard: 'Record the firmware version and FRU before perform any activities, make sure these information are flashed accordingly after service.'
  },
  {
    id: 9,
    stageNum: 2,
    stage: 'During service',
    item: 'Updating Firmware',
    standard: 'Confirm the device is general or customized, confirm the BIOS, BMC, FRU, SAS card, network card and other refresh requirements, then refresh as required'
  },
  {
    id: 10,
    stageNum: 2,
    stage: 'During service',
    item: 'Updating Firmware',
    standard: 'If server are power off during repair, collect necessary logs and keep for at least 3 months.'
  },
  {
    id: 11,
    stageNum: 2,
    stage: 'During service',
    item: 'Updating Firmware',
    standard: 'Check the FW version and customized information , ensure they are consistent with requirements after firmware refresh'
  },
  {
    id: 12,
    stageNum: 2,
    stage: 'During service',
    item: 'Replacement of spare parts',
    standard: 'Make sure the accurate fault slot information and SN (especially Bad Hard Disk SN) before replacing spare part, if onsite found unmatch error with error provided in ticket, escalate immediately.'
  },
  {
    id: 13,
    stageNum: 2,
    stage: 'During service',
    item: 'Replacement of spare parts',
    standard: 'Confirm the spare part is physically good and don\'t have any external damage'
  },
  {
    id: 14,
    stageNum: 2,
    stage: 'During service',
    item: 'Replacement of spare parts',
    standard: 'Before replacing the spare parts, it is necessary to have the spare parts PN information and spare parts capacity verified by the service manager or the designated person, and for different PN spare parts, the compatibility needs to be confirmed before the replacement operation can be carried out.'
  },
  {
    id: 15,
    stageNum: 2,
    stage: 'During service',
    item: 'Replacement of spare parts',
    standard: 'For non-multibrand spare parts, the good and bad parts must labelled with sticker.'
  },
  {
    id: 16,
    stageNum: 2,
    stage: 'During service',
    item: 'Replacement of spare parts',
    standard: 'All the parts are being dismantle and revert accordingly.'
  },
  // After service (Stage 3)
  {
    id: 17,
    stageNum: 3,
    stage: 'After service',
    item: 'Maintenance checks',
    standard: 'Confirm all the parts of the equipment are identified normally and the server indicator light is normal'
  },
  {
    id: 18,
    stageNum: 3,
    stage: 'After service',
    item: 'Maintenance checks',
    standard: 'Confirm that the external cables such as network cable and optical fiber are installed correctly and the network cable indicator is normal'
  },
  {
    id: 19,
    stageNum: 3,
    stage: 'After service',
    item: 'Maintenance checks',
    standard: 'Confirm the specification configuration provided by customer is completed.'
  },
  {
    id: 20,
    stageNum: 3,
    stage: 'After service',
    item: 'Maintenance checks',
    standard: 'Confirm that the server is mounted properly and securely. Make sure that the server is mounted to the rail kit. If there is no railkit, please escalate to the team.'
  },
  {
    id: 21,
    stageNum: 3,
    stage: 'After service',
    item: 'Customer confirmation',
    standard: 'Confirm the customer feedback that the server is working normal and boot to OS normally'
  },
  {
    id: 22,
    stageNum: 3,
    stage: 'After service',
    item: 'Customer confirmation',
    standard: 'Confirm to return all non-returnable parts/access card to customer accordingly.'
  }
];
