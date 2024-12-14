import puppeteer from 'puppeteer';

class WebsiteScraper {
    constructor() {
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
        ];
    }

    getRandomUserAgent() {
        return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    }

    async scrape(url) {
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        try {
            const page = await browser.newPage();
            await page.setUserAgent(this.getRandomUserAgent());
            await page.setViewport({ width: 1920, height: 1080 });

            // Navigate to the URL with timeout and waitUntil conditions
            await page.goto(url, {
                waitUntil: ['load', 'networkidle0'],
                timeout: 30000
            });

            // Extract app store links
            const links = await page.evaluate(() => {
                const allLinks = Array.from(document.querySelectorAll('a[href]'));
                return allLinks.map(link => link.href);
            });

            // Find app store links
            const googlePlayLink = links.find(link =>
                link.includes('play.google.com/store/apps'));
            const appStoreLink = links.find(link =>
                link.includes('apps.apple.com'));

            // Extract company name from meta tags or title
            const companyName = await page.evaluate(() => {
                // Try meta tags first
                const metaName = document.querySelector('meta[property="og:site_name"]')?.content
                    || document.querySelector('meta[name="application-name"]')?.content;

                if (metaName) return metaName;

                // Fall back to title
                const title = document.title;
                return title.split('|')[0].split('-')[0].trim();
            });

            return {
                companyName,
                googlePlayLink,
                appStoreLink,
                url
            };
        } catch (error) {
            console.error(`Error scraping ${url}:`, error);
            throw error;
        } finally {
            await browser.close();
        }
    }
}

export { WebsiteScraper }; 