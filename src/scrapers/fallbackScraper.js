import puppeteer from 'puppeteer';

class FallbackScraper {
    constructor() {
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
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

            // Try to find company information from the website
            const companyInfo = await this.scrapeWebsite(page, url);

            // Try LinkedIn if available
            const linkedInUrl = companyInfo?.social_links?.linkedin;
            const linkedInInfo = await this.scrapeLinkedIn(page, linkedInUrl);

            return {
                ...companyInfo,
                ...linkedInInfo
            };
        } catch (error) {
            console.error(`Error in fallback scraping: ${error.message}`);
            return null;
        } finally {
            await browser.close();
        }
    }

    async scrapeWebsite(page, url) {
        try {
            await page.goto(url, {
                waitUntil: ['load', 'networkidle0'],
                timeout: 30000
            });

            // Extract common company information
            return await page.evaluate(() => {
                const socialLinks = {
                    linkedin: Array.from(document.querySelectorAll('a[href*="linkedin.com"]')).map(a => a.href)[0],
                    twitter: Array.from(document.querySelectorAll('a[href*="twitter.com"]')).map(a => a.href)[0],
                    facebook: Array.from(document.querySelectorAll('a[href*="facebook.com"]')).map(a => a.href)[0]
                };

                // Try to find employee count or company size from about/team pages
                const aboutText = document.body.innerText.toLowerCase();
                let employeeSize = null;

                // Simple pattern matching for employee count
                const employeePatterns = [
                    /(\d+)\+?\s+employees/i,
                    /team of (\d+)/i,
                    /(\d+)\s+people/i
                ];

                for (const pattern of employeePatterns) {
                    const match = aboutText.match(pattern);
                    if (match) {
                        employeeSize = match[1];
                        break;
                    }
                }

                return {
                    social_links: socialLinks,
                    employee_size: employeeSize,
                    source: 'website'
                };
            });
        } catch (error) {
            console.error(`Error scraping website: ${error.message}`);
            return {};
        }
    }

    async scrapeLinkedIn(page, linkedInUrl) {
        // Only proceed if we have a LinkedIn URL
        if (!linkedInUrl || !linkedInUrl.includes('linkedin.com')) {
            return {};
        }

        try {
            await page.goto(linkedInUrl, {
                waitUntil: ['load', 'networkidle0'],
                timeout: 30000
            });

            // Extract basic public LinkedIn information
            return await page.evaluate(() => {
                // Helper function to get text content from data-test-id
                const getTextByTestId = (testId) => {
                    const element = document.querySelector(`[data-test-id="about-us__${testId}"]`);
                    return (element?.innerText?.trim() || '').split('\n')[1] || null;
                };

                // Try to get exact employee count first
                const exactCountElement = document.querySelector('.face-pile__text')?.innerText
                    || document.querySelector('a[data-tracking-control-name="face-pile-cta"]')?.innerText
                    || document.querySelector('a[data-tracking-will-navigate="true"]')?.innerText;

                let employeeCount = null;
                if (exactCountElement) {
                    const matches = exactCountElement.match(/(\d+,?\d*)/);
                    if (matches) {
                        employeeCount = matches[1].replace(',', '');
                    }
                }

                // Get company website
                const websiteElement = document.querySelector('a[data-test-id="about-us__website"]');
                const website = websiteElement?.href || websiteElement?.innerText || null;

                // Get all other properties
                const companySize = getTextByTestId('size');
                const industry = getTextByTestId('industry');
                const headquarters = getTextByTestId('headquarters');
                const organizationType = getTextByTestId('organizationType');
                const foundedYear = getTextByTestId('foundedOn');

                // Get specialties (might be multiple items)
                const specialtiesElement = document.querySelector('[data-test-id="about-us__specialties"]');
                const specialties = specialtiesElement ?
                    specialtiesElement.innerText.split(',').map(s => s.trim()).filter(Boolean) :
                    null;

                return {
                    linkedin_company_size: companySize || null,
                    linkedin_exact_employee_count: employeeCount,
                    linkedin_website: website,
                    linkedin_industry: industry,
                    linkedin_headquarters: headquarters,
                    linkedin_company_type: organizationType,
                    linkedin_founded_year: foundedYear ? parseInt(foundedYear) : null,
                    linkedin_specialties: specialties,
                    source: 'linkedin'
                };
            });
        } catch (error) {
            console.error(`Error scraping LinkedIn: ${error.message}`);
            return {};
        }
    }
}

export { FallbackScraper }; 