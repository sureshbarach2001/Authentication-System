// test.js
const bcrypt = require('bcryptjs');
const loggedHash = "$2b$10$bEvoX2rrVeJyoNgdx3MT7uCsO/CGhSbVAaKfiZPv3JdBQqBcu.22m"; // From logs
const mongoHash = "$2b$10$bEvoX2rrVeJyoNgdx3MT7uCsO/CGhSbVAaKfiZPv3JdBQqBcu.22m"; // From MongoDB
const password = "Rai123$";

bcrypt.compare(password, loggedHash, (err, result) => {
    if (err) console.error('Error:', err);
    else console.log(`Password "${password}" matches logged hash: ${result} ==> Hash: ${loggedHash}`);
});

bcrypt.compare(password, mongoHash, (err, result) => {
    if (err) console.error('Error:', err);
    else console.log(`Password "${password}" matches MongoDB hash: ${result} ==> Hash: ${mongoHash}`);
});