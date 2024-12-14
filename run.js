import readline from 'readline';
import { main } from './index.js';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function askForUrl() {
    return new Promise((resolve) => {
        rl.question('Please enter a website URL (or type "exit" to quit): ', (url) => {
            resolve(url.trim());
        });
    });
}

async function run() {
    try {
        while (true) {
            const url = await askForUrl();

            if (url.toLowerCase() === 'exit') {
                console.log('Goodbye!');
                break;
            }

            if (!url) {
                console.log('Please enter a valid URL');
                continue;
            }

            console.log(`\nProcessing ${url}...\n`);

            const results = await main([url]);
            console.log('\nResults:');
            console.log(JSON.stringify(results, null, 2));
            console.log('\n-------------------\n');
        }
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        rl.close();
    }
}

run(); 