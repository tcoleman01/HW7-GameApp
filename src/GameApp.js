const mysql = require('mysql2/promise');
const readline = require('readline-sync');

async function main() {
    let connection = null;

    // 10 & 11. Connection handling with re-prompting
    console.log("--- MySQL Database Login ---");
    while (!connection) {
        const user = readline.question('Enter MySQL Username: ');
        const password = readline.question('Enter MySQL Password: ', { hideEchoBack: true });

        try {
            connection = await mysql.createConnection({
                host: 'localhost',
                user: user,
                password: password,
                database: 'gamedb_colemant'
            });
            console.log('\n[SUCCESS] Connected to gamedb_colemant.');
        } catch (err) {
            console.log(`\n[ERROR] Connection failed: ${err.message}`);
            console.log("Please try again.\n");
        }
    }

    // 12. Main Menu
    let running = true;
    while (running) {
        console.log('\n==============================');
        console.log('MAIN MENU');
        console.log('1: Display all platform names');
        console.log('2: Disconnect and Exit');
        console.log('==============================');
        
        const choice = readline.question('Selection: ');

        if (choice === '2') {
            // 18. Close connection and end
            await connection.end();
            console.log('Connection closed. Application terminated.');
            running = false;
        } else if (choice === '1') {
            await handlePlatformFlow(connection);
        } else {
            console.log('Invalid selection. Please enter 1 or 2.');
        }
    }
}

async function handlePlatformFlow(connection) {
    try {
        // 13 & 14. Retrieve and display platforms for data validation
        const [platforms] = await connection.execute('SELECT name FROM platform ORDER BY name ASC');
        const validList = platforms.map(p => p.name.toLowerCase());

        console.log('\nAVAILABLE PLATFORMS:');
        platforms.forEach(p => console.log(` - ${p.name}`));

        // 14 & 15. User Input and Validation (Case-Insensitive)
        let userInput = '';
        while (true) {
            userInput = readline.question('\nEnter a platform name from the list: ');
            if (validList.includes(userInput.toLowerCase())) {
                // Find the exact casing from the database to pass to the procedure
                const exactMatch = platforms.find(p => p.name.toLowerCase() === userInput.toLowerCase());
                userInput = exactMatch.name;
                break;
            }
            console.log(`\n[VALIDATION ERROR] "${userInput}" is not a valid platform.`);
            console.log("Please refer to the list above and try again.");
        }

        // 16 & 17. Call get_platform_details and print results
        try {
            // Note: results[0] contains the row data for the first result set
            const [results] = await connection.query('CALL get_platform_details(?)', [userInput]);
            const rows = results[0];

            if (!rows || rows.length === 0) {
                console.log(`\nNo games found for ${userInput}.`);
            } else {
                console.log(`\nRESULTS FOR ${userInput.toUpperCase()}:`);
                // Format output as a readable table
                console.table(rows.map(row => ({
                    'Game ID': row.game_id,
                    'Game Name': row.game_name,
                    'Publisher': row.publisher_name
                })));
            }
        } catch (dbErr) {
            // 15 & 16. Handling database-side SIGNAL 45000
            console.log(`\n[DATABASE SIGNAL] ${dbErr.message}`);
        }

    } catch (err) {
        console.log(`\n[APP ERROR] ${err.message}`);
    }
}

main();