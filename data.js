// Shared content for the immersive site. The same real data as V2; [brackets] are still to confirm.
export const STREAMS = {
  youtube: { href: 'https://www.youtube.com/@kingscourtparish/live', name: 'YouTube' },
  zoom: { href: 'https://us02web.zoom.us/j/7651648605?pwd=TlZCSC9QQzJEd1dtbWNxbHFDWjc5UT09', name: 'Zoom' },
};
export const MAPS = 'https://www.google.com/maps/search/?api=1&query=RCCG+King%27s+Court+Dublin+Unit+2+Damastown+Way+Damastown+Industrial+Estate';
export const ADDRESS = 'RCCG King’s Court Dublin, Unit 2, Damastown Way, Damastown Industrial Estate, Dublin 15';

// Times are Dublin local, as decimal hours. [Church to confirm] the schedule.
export const SCHEDULE = [
  { id: 'sunday', stream: 'youtube', title: 'Sunday Family Service', weekday: 0, start: 10, end: 12.5, every: 'Every Sunday', time: '10:00am – 12:30pm', img: 'assets/web/service-family.jpg', alt: 'Worship at the Sunday family service' },
  { id: 'digging', stream: 'zoom', title: 'Digging Deep · Bible study', weekday: 3, start: 18.5, end: 19.5, every: 'Every Wednesday', time: '6:30 – 7:30pm', img: 'assets/web/service-digging.jpg', alt: 'Members studying the Bible' },
  { id: 'youth', stream: 'zoom', title: 'Youth Service', weekday: 4, start: 18.5, end: 19.5, every: 'Every Thursday', time: '6:30 – 7:30pm', img: 'assets/web/service-youth.jpg', alt: 'Young people at the youth service' },
  { id: 'faith', stream: 'zoom', title: 'Faith Clinic · Prayer', weekday: 5, start: 18.5, end: 19.5, every: 'Every Friday', time: '6:30 – 7:30pm', img: 'assets/web/service-faith-clinic.jpg', alt: 'Faith Clinic prayer meeting' },
  { id: 'glory', stream: 'zoom', title: 'Morning Glory', firstFriday: { start: 5.5, end: 6.5 }, every: 'First Friday of the month', time: '5:30 – 6:30am', img: 'assets/v2/morning-glory.jpg', alt: 'A member praying at Morning Glory' },
  // from the province flyer (RCCG Province 2 Ireland): [church to confirm year and end time]
  { id: 'vigil', stream: 'youtube', title: 'Provincial Vigil', date: { start: '2026-11-13T21:00:00Z', end: '2026-11-14T01:00:00Z' }, every: 'Monthly · all provinces welcome', time: '9:00pm – 1:00am', img: 'assets/v2/vigil-stage.jpg', alt: 'A minister preaching from the stage during a vigil' },
];

export const PHOTOS = [
  { src: 'assets/web/family-4.jpg', title: 'The choir ministering', w: 3, h: 2 },
  { src: 'assets/web/about-pastor.jpg', title: 'Arms open in worship', w: 2, h: 3 },
  { src: 'assets/web/service-family.jpg', title: 'Sunday family service', w: 2, h: 3 },
  { src: 'assets/web/about-worship.jpg', title: 'Hands lifted in prayer', w: 2, h: 3 },
  { src: 'assets/web/family-2.jpg', title: 'Hugs after the service', w: 2, h: 3 },
  { src: 'assets/v2/vigil-stage.jpg', title: 'The Word from the stage', w: 3, h: 2 },
  { src: 'assets/web/family-3.jpg', title: 'Sunday colours', w: 2, h: 3 },
  { src: 'assets/web/service-youth.jpg', title: 'Youth service', w: 2, h: 3 },
  { src: 'assets/v2/morning-glory.jpg', title: 'Morning Glory prayer', w: 2, h: 3 },
  { src: 'assets/web/family-1.jpg', title: 'A family on stage', w: 2, h: 3 },
  { src: 'assets/web/service-faith-clinic.jpg', title: 'Faith Clinic', w: 4, h: 5 },
  { src: 'assets/web/service-digging.jpg', title: 'Digging Deep, Bible study', w: 2, h: 3 },
];

export const SERMONS = [
  { id: 'PMCBURcHvSE', title: 'Sunday Service', date: 'Sun 8 Nov', length: '1h 36m' },
  { id: 'eltJR2Sjcao', title: 'November Thanksgiving Service', date: 'Sun 1 Nov', length: '1h 55m' },
  { id: 'bsazduuln2Q', title: 'Overcomers · YAYA Week', date: 'Sat 31 Oct', length: '3h 7m' },
  { id: 'A-3Di9ttFnY', title: 'Sunday Service', date: 'Sun 25 Oct', length: '2h 0m' },
  { id: 'N_QbH4anhiE', title: 'Sunday Service', date: 'Sun 18 Oct', length: '2h 18m' },
  { id: 'JakUOcI7j6c', title: 'Sunday Service', date: 'Sun 11 Oct', length: '1h 41m' },
];

// what giving keeps going: the church's real gatherings (no invented numbers)
export const WINDOWS = [
  { title: 'Sunday Family Service', when: 'Every Sunday', img: 'assets/web/service-family.jpg' },
  { title: 'Children’s church', when: 'During the Sunday service', img: null },
  { title: 'Youth Service', when: 'Thursdays', img: 'assets/web/service-youth.jpg' },
  { title: 'Digging Deep', when: 'Wednesdays', img: 'assets/web/service-digging.jpg' },
  { title: 'Faith Clinic', when: 'Fridays', img: 'assets/web/service-faith-clinic.jpg' },
  { title: 'Morning Glory', when: 'First Friday of the month', img: 'assets/v2/morning-glory.jpg' },
  { title: 'Provincial Vigil', when: 'Monthly', img: 'assets/v2/vigil-stage.jpg' },
];

export const BANK = [
  { label: 'Account name', value: 'RCCG King’s Court' },
  { label: 'IBAN', value: '[IBAN to confirm]' },
  { label: 'Bank name', value: '[Bank name]' },
  { label: 'BIC / SWIFT', value: '[BIC to confirm]' },
];

export const FAQ = [
  ['What are your service times?', 'Our Sunday Family Service runs every Sunday, 10:00am – 12:30pm. Doors open at 9:40am. Midweek, we meet on Zoom from 6:30 – 7:30pm: Digging Deep on Wednesdays, the Youth Service on Thursdays and Faith Clinic on Fridays.'],
  ['Where is the church located?', 'Unit 2, Damastown Way, Damastown Industrial Estate, Dublin 15 [Eircode].'],
  ['Is there parking available?', '[Free on-site parking at the church. Overflow parking on X Road.]'],
  ['Do you offer programs for children and youth?', 'Yes. Children’s church runs during the Sunday service for ages [3–12]. Young people have their own Youth Service every Thursday, 6:30 – 7:30pm.'],
  ['Are there volunteer opportunities?', 'Yes. Behind every Sunday is a family that serves. Tap “Join us now” and we’ll help you find a team.'],
  ['Do you offer counselling or prayer support?', 'Yes. Send a prayer request and we’ll stand with you in prayer. Counselling, including marriage counselling, is also available [how to book].'],
];
