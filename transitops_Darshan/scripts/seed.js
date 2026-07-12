// Rich demo data with planted demo moments:
//  - "Alex Fernandes": EXPIRED license  → license-block demo
//  - "Vikram Joshi": expires in ~12 days → notification demo
//  - "Deepak Rana": Suspended           → suspension-block demo
//  - Van-05 (500 kg) matches the spec's own example workflow
//  - one Draft trip ready to dispatch on camera, one Dispatched ready to complete
import path from "path";
import fs from "fs";
import crypto from "crypto";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

const DB_PATH = path.join(process.cwd(), "data", "transitops.db");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// ensure schema exists (same DDL as lib/db.js)
db.exec(fs.readFileSync(new URL("./schema.sql", import.meta.url), "utf8"));

const uid = () => crypto.randomUUID();
const day = 24 * 3600 * 1000;
const ago = (d) => new Date(Date.now() - d * day).toISOString();
const ahead = (d) => new Date(Date.now() + d * day).toISOString();

for (const t of ["trips", "fuel_logs", "maintenance_logs", "expenses", "vehicles", "drivers", "users"])
  db.prepare(`DELETE FROM ${t}`).run();

const hash = bcrypt.hashSync("demo1234", 10);
const insUser = db.prepare(`INSERT INTO users (id,name,email,passwordHash,role) VALUES (?,?,?,?,?)`);
insUser.run(uid(), "Hirva (Admin)", "admin@transitops.com", hash, "ADMIN");
insUser.run(uid(), "Meera Kapadia", "manager@transitops.com", hash, "FLEET_MANAGER");
insUser.run(uid(), "Ravi Patel", "driver@transitops.com", hash, "DRIVER");
insUser.run(uid(), "Sana Shaikh", "safety@transitops.com", hash, "SAFETY_OFFICER");
insUser.run(uid(), "Kunal Desai", "finance@transitops.com", hash, "FINANCIAL_ANALYST");

const insV = db.prepare(`INSERT INTO vehicles (id,registrationNumber,name,model,type,maxLoadKg,odometerKm,acquisitionCost,status)
VALUES (@id,@reg,@name,@model,@type,@cap,@odo,@cost,@status)`);
const V = (reg, name, model, type, cap, odo, cost, status = "Available") => {
  const id = uid(); insV.run({ id, reg, name, model, type, cap, odo, cost, status }); return id;
};
const van05 = V("GJ-06-AB-1234", "Van-05", "Tata Ace Gold", "Van", 500, 42180, 450000);
const truck02 = V("GJ-06-XY-8890", "Truck-02", "Eicher Pro 2049", "Truck", 2000, 88420, 1250000);
const van11 = V("GJ-01-KL-4521", "Van-11", "Mahindra Supro", "Van", 700, 30250, 520000);
const truck07 = V("GJ-05-MN-7712", "Truck-07", "Ashok Leyland Dost+", "Truck", 1500, 64300, 980000);
const mini03 = V("GJ-06-PQ-3345", "Mini-03", "Tata Intra V30", "Mini Truck", 1000, 21900, 700000);
const van09 = V("GJ-18-RS-6678", "Van-09", "Maruti Super Carry", "Van", 600, 15400, 480000);
const trailer01 = V("GJ-06-TT-9001", "Trailer-01", "BharatBenz 2823R", "Trailer", 8000, 152800, 3200000);
const van02 = V("GJ-02-UV-2210", "Van-02", "Tata Ace EV", "Van", 550, 8800, 850000);
const truck12 = V("GJ-06-WA-5544", "Truck-12", "Eicher Pro 3015", "Truck", 2500, 47600, 1600000);
V("GJ-06-ZZ-0007", "Van-01", "Tata Ace (2014)", "Van", 450, 289500, 320000, "Retired");

const insD = db.prepare(`INSERT INTO drivers (id,name,licenseNumber,licenseCategory,licenseExpiry,contactNumber,safetyScore,status)
VALUES (@id,@name,@lic,@cat,@exp,@ph,@score,@status)`);
const D = (name, lic, cat, exp, ph, score, status = "Available") => {
  const id = uid(); insD.run({ id, name, lic, cat, exp, ph, score, status }); return id;
};
const ravi = D("Ravi Patel", "GJ06-2019-0011223", "LMV", ahead(400), "+91 98250 11111", 92);
D("Alex Fernandes", "GJ06-2015-0099887", "HMV", ago(10), "+91 98250 22222", 74);              // EXPIRED
D("Vikram Joshi", "GJ01-2020-0033445", "Transport", ahead(12), "+91 98250 33333", 85);        // expiring soon
const priya = D("Priya Nair", "GJ05-2021-0055667", "LMV", ahead(700), "+91 98250 44444", 96);
const imran = D("Imran Qureshi", "GJ06-2018-0077889", "HMV", ahead(250), "+91 98250 55555", 88);
D("Deepak Rana", "GJ02-2017-0022334", "HMV", ahead(300), "+91 98250 66666", 41, "Suspended"); // SUSPENDED
const kavita = D("Kavita Solanki", "GJ18-2022-0044556", "LMV", ahead(900), "+91 98250 77777", 90);
D("Mohan Yadav", "GJ06-2016-0066778", "Transport", ahead(150), "+91 98250 88888", 79, "Off Duty");

const insT = db.prepare(`INSERT INTO trips (id,source,destination,cargoWeightKg,plannedKm,status,revenue,startOdometerKm,endOdometerKm,dispatchedAt,completedAt,createdAt,vehicleId,driverId)
VALUES (@id,@from,@to,@cargo,@km,@status,@rev,@o1,@o2,@disp,@comp,@created,@vid,@did)`);
const insF = db.prepare(`INSERT INTO fuel_logs (id,vehicleId,liters,cost,date) VALUES (?,?,?,?,?)`);

const done = [
  { vid: van05, did: ravi, from: "Vadodara", to: "Surat", cargo: 420, km: 150, fuel: [14, 1430], rev: 9500, d: 9, o: [41880, 42032] },
  { vid: truck02, did: imran, from: "Vadodara", to: "Ahmedabad", cargo: 1800, km: 112, fuel: [30, 3060], rev: 18500, d: 8, o: [88080, 88195] },
  { vid: mini03, did: priya, from: "Anand", to: "Rajkot", cargo: 850, km: 230, fuel: [24, 2450], rev: 14200, d: 7, o: [21540, 21772] },
  { vid: van05, did: kavita, from: "Surat", to: "Vadodara", cargo: 380, km: 150, fuel: [13, 1330], rev: 8800, d: 6, o: [42032, 42180] },
  { vid: truck07, did: imran, from: "Vadodara", to: "Mumbai", cargo: 1350, km: 430, fuel: [62, 6330], rev: 31000, d: 5, o: [63820, 64258] },
  { vid: van09, did: ravi, from: "Vadodara", to: "Bharuch", cargo: 480, km: 85, fuel: [8, 815], rev: 5200, d: 4, o: [15300, 15388] },
  { vid: truck12, did: kavita, from: "Ahmedabad", to: "Vadodara", cargo: 2100, km: 112, fuel: [32, 3260], rev: 19800, d: 3, o: [47450, 47565] },
  { vid: van02, did: priya, from: "Vadodara", to: "Nadiad", cargo: 300, km: 60, fuel: [0, 0], rev: 4100, d: 2, o: [8720, 8785] },
];
for (const t of done) {
  insT.run({ id: uid(), from: t.from, to: t.to, cargo: t.cargo, km: t.km, status: "Completed", rev: t.rev,
    o1: t.o[0], o2: t.o[1], disp: ago(t.d), comp: ago(t.d - 0.5), created: ago(t.d + 0.2), vid: t.vid, did: t.did });
  if (t.fuel[0] > 0) insF.run(uid(), t.vid, t.fuel[0], t.fuel[1], ago(t.d - 0.4));
}

// live state: dispatched trip (Truck-02 + Imran On Trip)
db.prepare(`UPDATE vehicles SET status='On Trip' WHERE id=?`).run(truck02);
db.prepare(`UPDATE drivers SET status='On Trip' WHERE id=?`).run(imran);
insT.run({ id: uid(), from: "Vadodara", to: "Surat", cargo: 1750, km: 150, status: "Dispatched", rev: 0,
  o1: 88420, o2: null, disp: ago(0.2), comp: null, created: ago(0.3), vid: truck02, did: imran });

// Draft trip ready to dispatch on camera
insT.run({ id: uid(), from: "Vadodara", to: "Ankleshwar", cargo: 450, km: 95, status: "Draft", rev: 0,
  o1: null, o2: null, disp: null, comp: null, created: ago(0.1), vid: van09, did: priya });

// open maintenance: Van-11 In Shop
db.prepare(`UPDATE vehicles SET status='In Shop' WHERE id=?`).run(van11);
const insM = db.prepare(`INSERT INTO maintenance_logs (id,vehicleId,description,cost,status,openedAt,closedAt) VALUES (?,?,?,?,?,?,?)`);
insM.run(uid(), van11, "Oil change + brake pad replacement", 4800, "Open", ago(1), null);
insM.run(uid(), truck07, "Clutch overhaul", 18500, "Closed", ago(20), ago(18));
insM.run(uid(), van05, "Tyre replacement (x2)", 9200, "Closed", ago(35), ago(34));

insF.run(uid(), trailer01, 120, 12240, ago(2));
const insE = db.prepare(`INSERT INTO expenses (id,category,description,amount,vehicleId,date) VALUES (?,?,?,?,?,?)`);
insE.run(uid(), "Toll", "NH-48 Vadodara–Surat toll", 480, van05, ago(6));
insE.run(uid(), "Toll", "Ahmedabad expressway toll", 620, truck02, ago(8));
insE.run(uid(), "Insurance", "Annual premium — Truck-12", 38500, truck12, ago(15));
insE.run(uid(), "Repair", "Windshield chip fix", 1500, mini03, ago(10));
insE.run(uid(), "Other", "Fleet GPS subscription (monthly)", 4500, null, ago(3));

console.log("✅ Seeded: 5 users · 10 vehicles · 8 drivers · 10 trips · fuel · maintenance · expenses");
console.log("   Logins (password: demo1234): admin@ / manager@ / driver@ / safety@ / finance@ transitops.com");
