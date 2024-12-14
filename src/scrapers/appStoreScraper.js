class AppStoreScraper {
    constructor() {
        this.store = null;
    }

    async initialize() {
        if (!this.store) {
            this.store = await import('app-store-scraper');
        }
    }

    async scrape(url) {
        try {
            await this.initialize();

            // Extract app ID from URL
            const appId = this.extractAppId(url);
            if (!appId) {
                throw new Error('Invalid App Store URL');
            }

            // Fetch app details
            const appDetails = await this.store.default.app({ id: appId });

            return {
                link: url,
                last_updated: appDetails.updated,
                developer_email: null, // App Store doesn't provide developer email
                developer_website: appDetails.developerWebsite || null,
                developer_name: appDetails.developer,
                app_name: appDetails.title
            };
        } catch (error) {
            console.error(`Error scraping App Store: ${error.message}`);
            return null;
        }
    }

    extractAppId(url) {
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname.includes('apps.apple.com')) {
                // Extract ID from URL path
                const matches = url.match(/id(\d+)/);
                if (matches && matches[1]) {
                    return matches[1];
                }
            }
            return null;
        } catch (error) {
            return null;
        }
    }
}

export { AppStoreScraper }; 