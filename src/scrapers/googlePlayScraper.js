import gplay from 'google-play-scraper';

class GooglePlayScraper {
    async scrape(url) {
        try {
            // Extract app ID from URL
            const appId = this.extractAppId(url);
            if (!appId) {
                throw new Error('Invalid Google Play Store URL');
            }

            // Fetch app details
            const appDetails = await gplay.app({ appId: appId });

            return {
                link: url,
                downloads: appDetails.installs,
                last_updated: new Date(appDetails.updated).toISOString(),
                developer_email: appDetails.developerEmail || null,
                developer_website: appDetails.developerWebsite || null,
                developer_name: appDetails.developer,
                app_name: appDetails.title
            };
        } catch (error) {
            console.error(`Error scraping Google Play Store: ${error.message}`);
            return null;
        }
    }

    extractAppId(url) {
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname === 'play.google.com') {
                const id = urlObj.searchParams.get('id');
                if (id) return id;
            }
            return null;
        } catch (error) {
            return null;
        }
    }
}

export { GooglePlayScraper }; 