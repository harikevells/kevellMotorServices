const d = new Date("2026-05-18");
console.log(d.toISOString().split('T')[0]);
d.setDate(d.getDate() + 1);
console.log(d.toISOString().split('T')[0]);
