export const agents = [
  { id: 1, name: 'Rahul Sharma', role: 'agent', active: true },
  { id: 2, name: 'Priya Singh', role: 'agent', active: true },
  { id: 3, name: 'Amit Verma', role: 'agent', active: false },
  { id: 4, name: 'Neha Gupta', role: 'agent', active: true },
]

export const workers = [
  { id: 11, name: 'Suresh Kumar', phone: '9876500001' },
  { id: 12, name: 'Mohit Yadav', phone: '9876500002' },
]

export const LEAD_SOURCES = ['Facebook', 'Meta Ads', 'WhatsApp', 'Website', 'CSV']
export const LEAD_STATUSES = ['New', 'Interested', 'Busy', 'Not Picked', 'Not Interested', 'Converted']
export const CALL_OUTCOMES = ['Interested', 'Busy', 'Not Picked', 'Not Interested', 'Converted']
export const ATTENDANCE_STATUSES = ['Present', 'Half-day', 'Absent', 'On-field']

export const leads = [
  { id: 1, name: 'Ramesh Patel', phone: '9810000001', source: 'Meta Ads', status: 'New', agentId: 1, date: '2026-10-14', followUp: '2026-10-17T11:00' },
  { id: 2, name: 'Sunita Devi', phone: '9810000002', source: 'WhatsApp', status: 'Interested', agentId: 2, date: '2026-10-13', followUp: '2026-10-18T15:30' },
  { id: 3, name: 'Vikas Jain', phone: '9810000003', source: 'Website', status: 'Busy', agentId: 1, date: '2026-10-12', followUp: '' },
  { id: 4, name: 'Anita Rao', phone: '9810000004', source: 'CSV', status: 'New', agentId: 3, date: '2026-10-10', followUp: '' },
  { id: 5, name: 'Deepak Mishra', phone: '9810000005', source: 'Meta Ads', status: 'Converted', agentId: 4, date: '2026-10-09', followUp: '' },
  { id: 7, name: 'Nikhil Chauhan', phone: '9810000007', source: 'Facebook', status: 'New', agentId: 4, date: '2026-10-16', followUp: '' },
  { id: 6, name: 'Kavita Soni', phone: '9810000006', source: 'Website', status: 'Not Picked', agentId: 2, date: '2026-10-15', followUp: '2026-10-16T17:00' },
]

export const attendance = [
  { id: 1, employee: 'Rahul Sharma', date: '2026-10-16', checkIn: '09:42', checkOut: '', status: 'Present' },
  { id: 2, employee: 'Priya Singh', date: '2026-10-16', checkIn: '10:05', checkOut: '', status: 'Present' },
  { id: 3, employee: 'Amit Verma', date: '2026-10-16', checkIn: '', checkOut: '', status: 'Absent' },
  { id: 4, employee: 'Neha Gupta', date: '2026-10-16', checkIn: '09:55', checkOut: '14:00', status: 'Half-day' },
  { id: 5, employee: 'Suresh Kumar', date: '2026-10-16', checkIn: '08:30', checkOut: '', status: 'On-field' },
]

export const installations = [
  { id: 1, customer: 'Mahesh Agarwal', phone: '9820000001', address: 'Sector 21, Noida', installDate: '2025-10-20', status: 'Active' },
  { id: 2, customer: 'Geeta Kapoor', phone: '9820000002', address: 'Indirapuram, Ghaziabad', installDate: '2026-01-05', status: 'Active' },
  { id: 3, customer: 'Rohit Saini', phone: '9820000003', address: 'Vaishali, Ghaziabad', installDate: '2026-07-18', status: 'Active' },
]

export const maintenance = [
  { id: 1, installationId: 1, dueDate: '2026-10-19', workerId: 11, status: 'Pending' },
  { id: 2, installationId: 2, dueDate: '2026-07-05', workerId: 12, status: 'Completed' },
  { id: 3, installationId: 3, dueDate: '2026-10-18', workerId: 12, status: 'Pending' },
  { id: 4, installationId: 2, dueDate: '2026-10-05', workerId: 11, status: 'Pending' },
]
