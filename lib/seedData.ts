import { Guest, GuestSide, BudgetItem, WeddingDay, Payer, PayStatus, VillaRoom, VillaLocation } from './types';

let _id = 1;
function uid() { return String(_id++).padStart(4, '0'); }

function guest(
  firstName: string, lastName: string, email: string, side: GuestSide,
  rsvp: 'Confirmed' | 'Pending' | 'Declined' = 'Pending',
): Guest {
  return {
    id: uid(), firstName, lastName, email, side, rsvp,
    dietary: 'None', dietaryNotes: '',
    accommodation: 'Other', accommodationNotes: '',
    days: ['Aug 31 — Welcome Dinner', 'Sep 1 — Wedding Day', 'Sep 2 — Pool Party'],
    plusOne: '', notes: '', group: '',
  };
}

function budgetItem(
  category: string, description: string, day: WeddingDay,
  totalAmount: number, paidBy: Payer, status: PayStatus, notes?: string,
): BudgetItem {
  return { id: uid(), category, description, day, totalAmount, paidBy, status, notes };
}

function villaRoom(
  roomName: string, location: VillaLocation, roomType: string,
  guests: string, guestCount: number, costEUR: number,
  payStatus: PayStatus, includedInVenue: boolean, notes?: string,
): VillaRoom {
  return {
    id: uid(), roomName, location, roomType, guests, guestCount, costEUR,
    amountPaidEUR: includedInVenue ? costEUR : 0,
    payStatus, includedInVenue, notes,
  };
}

export const GUEST_SEED: Guest[] = [
  // The couple
  guest('Jeffrey', 'West', 'Jeff.West89@gmail.com', 'Both'),
  guest('Nathalie', 'Rahil', 'nathalierahil@gmail.com', 'Both'),

  // Jeff's side
  guest('Amanda', 'West', 'Amandaleighwest09@gmail.com', 'J'),
  guest('Trevor West & Ellis Wong', '', 'Tmwest29@gmail.com', 'J'),
  guest('Michael & Sue', 'West', 'sswest5964@gmail.com', 'J'),
  guest('Jessica West & David Slack', '', 'David.Jess.Slack@gmail.com', 'J'),
  guest('Nayan', 'Patel', 'nayanmpatel3@gmail.com', 'J'),
  guest('Ryan', 'Stanton', 'Ryanfrederickstanton@gmail.com', 'J'),
  guest('Troy Hilson & Heather DuMaresq', '', 'troyhilson94@gmail.com', 'J'),
  guest('Jonathan Agostino & Stephanie Ishoo', '', 'jonathan.agostino14@gmail.com', 'J'),
  guest('Max & Ryan', 'Yusipenko', 'max.yusipenko@gmail.com', 'J'),
  guest('Brian & Melissa', 'Clancy', 'brian.clancy@ca.ey.com', 'J'),
  guest('Ramzi Bou Hamdan, Tom Giantsopoulos & Rodrigo', '', 'ramzibouhamdan@gmail.com', 'J'),
  guest('Shawn Silva & Veronika Budney', '', 'Shawnsilva12@gmail.com', 'J'),
  guest('Austin Lee & Margo Macdonald', '', 'arlee@ualberta.ca', 'J'),
  guest('Sunny', 'Sara', 'Sunny.Sara2@gmail.com', 'J'),
  guest('Ashley Fill & Guest', '', 'Ashley.fill94@gmail.com', 'J'),
  guest('Alvin', 'Islam', 'Alvini91@hotmail.com', 'J'),
  guest('Andrew & Rochelle', 'Bragg', 'andrewbragg@ymail.com', 'J'),
  guest('Ian', 'Fisk', 'Ibfisk@yahoo.com', 'J'),
  guest('Bob & Joan', 'Howald', 'rahowald@gmail.com', 'J'),
  guest('Melisa', 'Perrier', '1mmp@queensu.ca', 'J'),
  guest('Anne West & Guest', '', 'awest@risd.edu', 'J'),
  guest('Bahareh', 'Tabar', 'Bahareh_3@hotmail.com', 'J'),
  guest('Minaz', '', 'Ontariogasheating@yahoo.ca', 'J'),
  guest('Bill', 'Kiss', 'williamkis@aol.com', 'J'),
  guest('Mark & Jennifer', 'Strauss', 'jennstrauss@hotmail.com', 'J'),
  guest('Aileen Kis & Husband', '', 'aileen_kis@hotmail.com', 'J'),
  guest('Joshua', 'Burtney', 'jtburtney@gmail.com', 'J'),
  guest('Geoff & Rachael', 'Williams', 'Geoff.williams88@gmail.com', 'J'),
  guest('Jas & Guest', '', '', 'J'),
  guest('Jim & Guest', '', '', 'J'),
  guest('Jon & Guest', '', '', 'J'),
  guest('Udai', 'Soni', 'Udai@strategybrix.com', 'J'),

  // Nat's side
  guest('Tony Rahil & Rena Sansur', '', 'Tony.Rahil@onx.com', 'N'),
  guest('Lily', 'Ghawi', 'Lilyghawi01@gmail.com', 'N'),
  guest('Richard Rahil & Emma Rose Bonnano', '', 'Richardrahil@gmail.com', 'N'),
  guest('Claudia Dabdoub & Alex Krstic', '', 'cocodabdoubb@gmail.com', 'N'),
  guest('Philipe & Lea', 'Dabdoub', 'philippedabdoub@outlook.com', 'N'),
  guest('Gabi & Ibtisam', 'Rahil', 'sam.rahil@bell.net', 'N'),
  guest('Francis Rahil & Elly Bobard', '', 'Francis.rahil@gmail.com', 'N'),
  guest('Bassel & Kirsten', 'Rahil', 'bassel.rahil@gmail.com', 'N'),
  guest('Kara & Daniel', 'Delgado', 'Karaagabriel@gmail.com', 'N'),
  guest('Melissa & Adam', 'Chow', 'Melissapychen@gmail.com', 'N'),
  guest('Michael Alousis & Steph Nanos', '', 'michaelalousis@gmail.com', 'N'),
  guest('Lia & Andrew', 'Oliveira', 'liabarresi@gmail.com', 'N'),
  guest('Katerina', 'Tsirtsimpis', 'ktsirtsimpis@gmail.com', 'N'),
  guest('Gabriella', 'Gobbatto', 'Gabriella.Gobbatto@gmail.com', 'N'),
  guest('Lisa & Sven', 'Arapovic', 'Lisadeangelis08@gmail.com', 'N'),
  guest('Miranda & Paul', 'Klas', 'Mirandagdilorenzo@gmail.com', 'N'),
  guest('Giselle Aways & Jaq Beaulieu', '', 'Gisele.aways@gmail.com', 'N'),
  guest('Flavia', 'Jaber', 'jaberflavia01@gmail.com', 'N'),
  guest('Fadi & Cass', 'Kamar', 'fkamar4@hotmail.com', 'N'),
  guest('Rajai Rahil & Family', '', 'rahilr@un.org', 'N'),
  guest('Sam & Christine', 'Kamar', 'samkamar@hotmail.com', 'N'),
  guest('Rowena & Noel', 'Gabriel', 'rowena.gabriel1@gmail.com', 'N'),
  guest('Rhonda & Lou', 'Barresi', 'Rhondabarresi@gmail.com', 'N'),
  guest('Samir, Houda, Christine & Nadine', 'Ghawi', 'samir1720@hotmail.com', 'N'),
  guest('Sami Ghawi & Carly Dargatz', '', 'ep@fusionpresents.com', 'N'),
  guest('Carol, Khamees, Malda & Manal', 'Abu Said', 'carolabusaid@gmail.com', 'N'),
  guest('Fadia', 'Daniel', 'fdaniel@sutton.com', 'N'),
  guest('John & Andrea', 'Daniel', 'john-daniel@live.com', 'N'),
  guest('Patrick & Sandra', 'Daniel', 'sandra@danielca.com', 'N'),
  guest('Mike Daniel & Audrey Paiement', '', 'mrmdaniel11@gmail.com', 'N'),
  guest('Hani & Samia', 'Daniel', 'alkhazensamia@gmail.com', 'N'),
  guest('Jordan & Natania', 'Obey', 'j.edward.obey@gmail.com', 'N'),
  guest('Mark & Dina', 'Obey', 'deedeeobey@yahoo.com', 'N'),
  guest('Kareem Obey & Ryan DiRisio', '', 'kareemobey1@gmail.com', 'N'),
  guest('Frank & Marianne', 'Chen', 'fmchen21@gmail.com', 'N'),
  guest('Ramzi & Rama', 'Fanous', 'ramzi.fanous@gmail.com', 'N'),
  guest('Jihan & Tony', 'Fanous', 'Jihan.fanous@hotmail.com', 'N'),
  guest('Nicole Durante & Darren Self', '', 'nicole.durante@onx.com', 'N'),
  guest('Paul & Darla', 'Kawaja', 'paul.khawaja@onx.com', 'N'),
  guest('Gaby & Sanaa', 'Abou Chedid', 'sanaabouchedid@hotmail.com', 'N'),
  guest('Raja', 'El Khazen', 'relkhazen@yahoo.co.uk', 'N'),
  guest('Nathalie & Tony', 'El Khazen', 'elkhazennat@gmail.com', 'N'),
  guest('Peter & Mona', 'Gruetter', 'monagruetter@gmail.com', 'N'),
  guest('Ramzi', 'El Khazen', 'ramkazen@gmail.com', 'N'),
  guest('Danielle Aways & Benjamin Christie', '', 'd.l.aways@gmail.com', 'N'),
  guest('Raymond & Ghada', 'Sadaka', 'sadakaghara@gmail.com', 'N'),
  guest('Abdo & Huda', 'Sadaka', 'houdasadaka@hotmail.com', 'N'),
  guest('Munir & Diana', 'Samara', 'dianakanaan14@gmail.com', 'N'),
  guest('Marisa', 'Barresi', 'Marisadanielabarresi@gmail.com', 'N'),
  guest('Nithin A & Michelle', 'Fusco', 'nithinmathew@hotmail.com', 'N'),
  guest('Rodi & Suzy', 'Aoun', 'Suzy.aoun@gmail.com', 'N'),
  guest('Hania & Bassam', 'Salameh', 'Hania.salameh01@gmail.com', 'N'),
  guest('Marlene & Rob', 'Grossi', 'Grossimarlene0@gmail.com', 'N'),
  guest('Cristina', 'Selva', 'cpselva@rogers.com', 'N'),
  guest('Joe & Maria', 'Dow', 'Jdaou@stema.ca', 'N'),
  guest('Jason & Kennie', 'Chidiak', 'Jason@ecsengineering.com', 'N'),
  guest('Jing', 'Huang', 'Huangjing0201@gmail.com', 'N'),
  guest('Imran', 'Abdullah', 'Imran02@gmail.com', 'N'),
  guest('Michael & Jo', 'Van', 'Joanne.li324@gmail.com', 'N'),
  guest('Melissa Wang & Ahmed', '', 'Melhwang09@gmail.com', 'N'),
  guest('Fadi & Rohana', '', 'fadi.rouhana@gmail.com', 'N'),
  guest('Marty & Lory', 'Blake', 'marty.blake@onx.com', 'N'),
  guest('Michael', 'Hubert', 'michaelhubert4@gmail.com', 'N'),
  guest('Mimi Daniel & Elias Ghattas', '', 'mimidaniel11@yahoo.com', 'N'),
  guest('Dom & Lisa', 'Sinopoli', 'dsinop01@gmail.com', 'N'),
  guest('Anthony', 'Barresi', '', 'N'),
  guest('Luca', 'Barresi', '', 'N'),
  guest('Reina', 'Rahil', 'reinarahil2@gmail.com', 'N'),
  guest('Taleen', 'Rahil', 'taleen.rahil@gmail.com', 'N'),
  guest('Robert & Karen', 'Johnson', 'robert.johnson@torontopolice.on.ca', 'N'),
  guest('Mario & Zoe', 'Di Tommaso', 'marioditommaso@yahoo.ca', 'N'),
];

export const BUDGET_SEED: BudgetItem[] = [
  // Day 1 — Welcome Dinner
  budgetItem('Catering & Bar', 'Welcome Party (Pizza, Pasta & Wine)', 'Aug 31 — Welcome Dinner', 15400, 'Nat/Jeff', 'Pending', 'Pizza, Pasta & Wine for 100 guests'),
  budgetItem('Catering & Bar', 'Aperol & Hugo Spritz Corner', 'Aug 31 — Welcome Dinner', 1760, 'Nat/Jeff', 'Pending', '3 drinks per person × 100 guests'),
  budgetItem('Catering & Bar', 'Wine', 'Aug 31 — Welcome Dinner', 845, 'Nat/Jeff', 'Pending', '24 bottles — 8 @ €30.80 prosecco, 8 @ €30.80 wine, 8 @ €44.40 wine'),
  budgetItem('Catering & Bar', 'Beer', 'Aug 31 — Welcome Dinner', 915, 'Nat/Jeff', 'Pending', '150 beers'),
  budgetItem('Music & DJ', 'DJ — Welcome Party (DJ Matthew)', 'Aug 31 — Welcome Dinner', 2196, 'Tony', 'Deposit Paid', 'Deposit of €1,098 paid by Tony'),

  // Day 2 — Wedding Day
  budgetItem('Venue', 'Wedding Venue (Villa Valentini Bonaparte)', 'Sep 1 — Wedding Day', 46090, 'Tony', 'Deposit Paid', 'Accommodation for 40 guests × 3 nights incl. breakfast. Deposit of €23,045 paid by Tony'),
  budgetItem('Catering & Bar', 'Wedding Meal', 'Sep 1 — Wedding Day', 27500, 'Nat/Jeff', 'Deposit Paid', 'Deposit of €12,000 paid'),
  budgetItem('Catering & Bar', 'Dessert (Tiramisu)', 'Sep 1 — Wedding Day', 605, 'Nat/Jeff', 'Pending'),
  budgetItem('Catering & Bar', 'Cocktail Bar', 'Sep 1 — Wedding Day', 6600, 'Nat/Jeff', 'Pending'),
  budgetItem('Catering & Bar', 'Water (Pre-Ceremony)', 'Sep 1 — Wedding Day', 550, 'Nat/Jeff', 'Pending'),
  budgetItem('Flowers & Decor', 'Florals + Stationery', 'Sep 1 — Wedding Day', 14344, 'Tony', 'Deposit Paid', 'Deposit of €1,100 paid by Tony'),
  budgetItem('Transportation', 'Wedding + Welcome Transport', 'Sep 1 — Wedding Day', 4840, 'Nat/Jeff', 'Pending'),
  budgetItem('Music & DJ', 'DJ + Sax + Singer + String Trio (Ceremony & Cocktail)', 'Sep 1 — Wedding Day', 9150, 'Tony', 'Deposit Paid', 'DJ set with equipment until 01am. Deposit of €2,250 paid by Tony'),
  budgetItem('Flowers & Decor', 'Ceremony Cushions', 'Sep 1 — Wedding Day', 244, 'Nat/Jeff', 'Pending'),
  budgetItem('Venue', 'Dinner Location (Second Food Station)', 'Sep 1 — Wedding Day', 1650, 'Nat/Jeff', 'Pending'),
  budgetItem('Catering & Bar', 'Vendor Meals', 'Sep 1 — Wedding Day', 1375, 'Nat/Jeff', 'Pending'),
  budgetItem('Entertainment', 'Arabic Drummers / Zaffa (La Rose Arabe)', 'Sep 1 — Wedding Day', 3000, 'Tony', 'Deposit Paid', '60 min, 3–5 drummers. Deposit of €300 paid by Tony'),
  budgetItem('Photography', 'Photographer', 'Sep 1 — Wedding Day', 9500, 'Tony', 'Deposit Paid', 'Deposit of €1,500 paid by Tony'),
  budgetItem('Photography', 'Videographer', 'Sep 1 — Wedding Day', 2500, 'Nat/Jeff', 'Pending'),
  budgetItem('Catering & Bar', 'Late Night Food', 'Sep 1 — Wedding Day', 1320, 'Nat/Jeff', 'Pending'),

  // Day 3 — Pool Party
  budgetItem('Catering & Bar', 'Pool Day Food (€80/person)', 'Sep 2 — Pool Party', 5280, 'Nat/Jeff', 'Pending'),

  // All Days
  budgetItem('Hair & Makeup', 'Make-Up & Hair (Tailor Beauty Design — Iryna)', 'All Days', 1970, 'Tony', 'Deposit Paid', 'Deposit of €590 paid by Tony'),
  budgetItem('Other', 'Wedding Planner Rossana — Nat & Jeff portion', 'All Days', 2000, 'Nat/Jeff', 'Paid', 'Paid in full. Remaining balance of €3,500 still outstanding'),
  budgetItem('Other', 'Wedding Planner Rossana — Tony portion', 'All Days', 2000, 'Tony', 'Paid', 'Paid in full by Tony'),
  budgetItem('Other', 'Wedding Planner Rossana — Remaining balance', 'All Days', 1500, 'Nat/Jeff', 'Pending'),
  budgetItem('Music & DJ', 'Music Permits (Days 1 & 2)', 'All Days', 0, 'Nat/Jeff', 'Pending', 'Amount TBD'),
];

export const VILLA_SEED: VillaRoom[] = [
  // Main Villa (Villa Valentini Bonaparte) — 10 named suites
  villaRoom('Canova Suite', 'Main Villa', '1 Bedroom', 'Flavia Jaber', 1, 1560.55, 'Pending', false, 'Ground floor, 29 sqm, smallest room'),
  villaRoom('Visconti Suite', 'Main Villa', '1 Bedroom', 'Nayan & Ryan', 2, 1560.55, 'Pending', false, 'First floor, 38 sqm, terrace'),
  villaRoom('Louise Colet Suite', 'Main Villa', '1 Bedroom', 'Fadia', 1, 1560.55, 'Pending', false, 'First level, 51 sqm, terrace'),
  villaRoom('Margherita Suite', 'Main Villa', '1 Bedroom', 'Mel & Adam', 2, 1560.55, 'Pending', false, '29 sqm, terrace, first level'),
  villaRoom('Bonaparte Suite', 'Main Villa', '1 Bedroom', 'Jonathan & Steph', 2, 1560.55, 'Pending', false, '41 sqm, no terrace, first floor'),
  villaRoom('Charlotte Junior Suite', 'Main Villa', '1 Bedroom', 'Richard & Emma Rose', 2, 1560.55, 'Paid', true, '38 sqm, second level — included in venue cost'),
  villaRoom('Contea Suite', 'Main Villa', '1 Bedroom', 'Tony & Rena', 2, 1560.55, 'Paid', true, '68 sqm, second level, balcony — included in venue cost'),
  villaRoom('Ritratti Junior Suite', 'Main Villa', '1 Bedroom', 'Lily', 1, 1560.55, 'Paid', true, '38 sqm, second level — included in venue cost'),
  villaRoom('Maria Alessandrina Suite', 'Main Villa', '1 Bedroom', 'Nat & Jeff (Bridal Suite)', 2, 1560.55, 'Paid', true, '54 sqm, large terrace, second level — bridal prep room, included in venue cost'),
  villaRoom('Torretta Suite', 'Main Villa', '1 Bedroom', 'Kara & Daniel', 2, 1560.55, 'Pending', false, '25 sqm, hot tub in room, third level'),

  // Second Villa (La Scuderia)
  villaRoom('One Bedroom Suite A', 'Second Villa', '1 Bedroom', 'Jessica + David', 2, 1560.55, 'Pending', false, 'Ground floor, private patio with sunset view'),
  villaRoom('One Bedroom Suite B', 'Second Villa', '1 Bedroom', 'Sunny', 1, 1560.55, 'Pending', false, 'First floor, private patio'),
  villaRoom('2 Bedroom Suite', 'Second Villa', '2 Bedroom Suite', 'Carol & Malda | Taleen & Joseph', 4, 2496.88, 'Paid', true, 'Upper floor, 2 king beds, living room w/ fireplace, kitchenette — included in venue cost'),
  villaRoom('3 Bedroom Suite A', 'Second Villa', '3 Bedroom Suite', 'Mike, Sue, Amanda, Trevor, Ellis', 5, 2745.42, 'Pending', false, 'Ground floor, 3 bedrooms, living room, private patio'),
  villaRoom('3 Bedroom Suite B', 'Second Villa', '3 Bedroom Suite', 'Gabi, Sam, Reina, Francis, Elly, Bassel, Kirsten', 7, 3745.42, 'Pending', false, 'Ground floor, 3 bedrooms, living room, private patio'),
];
