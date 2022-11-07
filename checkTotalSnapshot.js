const snapshotSecrets = require("./snapshotSecrets.json");

let total = BigInt(0);

snapshotSecrets.forEach(s => {
  total += BigInt(s.balance);
});

console.log(total);
console.log(snapshotSecrets.length);