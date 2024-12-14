import fs from 'fs';
import { createObjectCsvWriter } from 'csv-writer';
import path from 'path';

class CsvHandler {
    constructor(filename = 'results.csv') {
        this.filename = filename;
        this.headers = [
            { id: 'url', title: 'URL' },
            { id: 'company', title: 'Company Name' },
            { id: 'app_present', title: 'Has App' },
            // Google Play Data
            { id: 'google_play_data.link', title: 'Google Play Link' },
            { id: 'google_play_data.downloads', title: 'Google Play Downloads' },
            { id: 'google_play_data.last_updated', title: 'Google Play Last Updated' },
            { id: 'google_play_data.developer_email', title: 'Google Play Developer Email' },
            { id: 'google_play_data.developer_name', title: 'Google Play Developer Name' },
            // App Store Data
            { id: 'app_store_data.link', title: 'App Store Link' },
            { id: 'app_store_data.last_updated', title: 'App Store Last Updated' },
            { id: 'app_store_data.developer_name', title: 'App Store Developer Name' },
            // LinkedIn Data
            { id: 'fallback_data.linkedin_company_size', title: 'LinkedIn Company Size' },
            { id: 'fallback_data.linkedin_exact_employee_count', title: 'LinkedIn Exact Employee Count' },
            { id: 'fallback_data.linkedin_industry', title: 'LinkedIn Industry' },
            { id: 'fallback_data.linkedin_headquarters', title: 'LinkedIn Headquarters' },
            { id: 'fallback_data.linkedin_company_type', title: 'LinkedIn Company Type' },
            { id: 'fallback_data.linkedin_founded_year', title: 'LinkedIn Founded Year' },
            { id: 'fallback_data.linkedin_specialties', title: 'LinkedIn Specialties' }
        ];
    }

    async appendResults(results) {
        const csvWriter = createObjectCsvWriter({
            path: this.filename,
            header: this.headers,
            append: fs.existsSync(this.filename)
        });

        // Flatten nested objects for CSV
        const flattenedResults = results.map(result => {
            const flatResult = {};
            this.headers.forEach(header => {
                const path = header.id.split('.');
                let value = result;
                for (const key of path) {
                    value = value?.[key];
                }
                // Convert arrays to comma-separated strings
                flatResult[header.id] = Array.isArray(value) ? value.join(', ') : value;
            });
            return flatResult;
        });

        try {
            await csvWriter.writeRecords(flattenedResults);
            console.log(`Results appended to ${this.filename}`);
        } catch (error) {
            console.error('Error writing to CSV:', error);
        }
    }
}

export { CsvHandler }; 