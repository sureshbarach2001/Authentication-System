// test-hash.js
const bcrypt = require('bcryptjs');

const password = "Suresh123$";
bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
        console.error('Hashing error:', err);
    } else {
        console.log('Generated hash:', hash);
        bcrypt.compare(password, hash, (err, result) => {
            if (err) {
                console.error('Comparison error:', err);
            } else {
                console.log(`Password "${password}" matches hash: ${result}`); // Should be true
            }
        });
    }
});