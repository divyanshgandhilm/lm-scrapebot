import dotenv from 'dotenv';
import { validateUrls } from './src/utils/validators.js';
import { WebsiteScraper } from './src/scrapers/websiteScraper.js';
import { AppStoreScraper } from './src/scrapers/appStoreScraper.js';
import { GooglePlayScraper } from './src/scrapers/googlePlayScraper.js';
import { FallbackScraper } from './src/scrapers/fallbackScraper.js';
import { CsvHandler } from './src/utils/csvHandler.js';

dotenv.config();

const csvHandler = new CsvHandler();

async function processUrl(url) {
    try {
        // Initialize scrapers
        const websiteScraper = new WebsiteScraper();
        const appStoreScraper = new AppStoreScraper();
        const googlePlayScraper = new GooglePlayScraper();
        const fallbackScraper = new FallbackScraper();

        // Initial website scan
        const websiteData = await websiteScraper.scrape(url);

        const result = {
            company: websiteData.companyName,
            url: url,
            app_present: false,
            google_play_data: null,
            app_store_data: null,
            fallback_data: null
        };

        // Check for app presence
        if (websiteData.googlePlayLink) {
            try {
                const playData = await googlePlayScraper.scrape(websiteData.googlePlayLink);
                if (playData) {
                    result.app_present = true;
                    result.google_play_data = playData;
                }
            } catch (error) {
                console.error(`Error scraping Google Play: ${error.message}`);
            }
        }

        if (websiteData.appStoreLink) {
            try {
                const appStoreData = await appStoreScraper.scrape(websiteData.appStoreLink);
                if (appStoreData) {
                    result.app_present = true;
                    result.app_store_data = appStoreData;
                }
            } catch (error) {
                console.error(`Error scraping App Store: ${error.message}`);
            }
        }

        // If no apps found or all scraping failed, get fallback data
        result.fallback_data = await fallbackScraper.scrape(url);

        return result;
    } catch (error) {
        console.error(`Error processing ${url}:`, error);
        return {
            url,
            error: error.message,
            status: 'failed',
            app_present: false
        };
    }
}

async function main(urls) {
    try {
        // Validate URLs
        const validUrls = validateUrls(urls);

        // Process URLs with controlled concurrency
        const results = [];
        const concurrencyLimit = 3; // Process 3 URLs at a time

        for (let i = 0; i < validUrls.length; i += concurrencyLimit) {
            const batch = validUrls.slice(i, i + concurrencyLimit);
            const batchResults = await Promise.all(batch.map(url => processUrl(url)));
            results.push(...batchResults);

            // Append batch results to CSV
            await csvHandler.appendResults(batchResults);

            // Add delay between batches to avoid rate limiting
            if (i + concurrencyLimit < validUrls.length) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        return results;
    } catch (error) {
        console.error('Main execution error:', error);
        throw error;
    }
}

export { main, processUrl };

// If running directly from command line
if (process.argv[1] === new URL(import.meta.url).pathname) {
    const urls = process.argv.slice(2);
    if (urls.length === 0) {
        console.error('Please provide at least one URL to process');
        process.exit(1);
    }

    main(urls)
        .then(results => {
            console.log(JSON.stringify(results, null, 2));
        })
        .catch(error => {
            console.error('Error:', error);
            process.exit(1);
        });
} 