function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (error) {
        return false;
    }
}

function validateUrls(urls) {
    const validUrls = urls
        .map(url => {
            // Add https if protocol is missing
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            return url.trim();
        })
        .filter(url => {
            const isValid = isValidUrl(url);
            if (!isValid) {
                console.warn(`Invalid URL skipped: ${url}`);
            }
            return isValid;
        });

    if (validUrls.length === 0) {
        throw new Error('No valid URLs provided');
    }

    return validUrls;
}

export { validateUrls, isValidUrl }; 