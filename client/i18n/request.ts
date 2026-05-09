import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ requestLocale }) => {
    // requestLocale is a promise in Next 15 / next-intl v4
    let locale = await requestLocale;
    
    // Ensure that a valid locale is used
    if (!locale || !["en", "ar"].includes(locale)) {
        locale = "en";
    }

    return {
        locale,
        messages: (await import(`../messages/${locale}.json`)).default
    };
});
