import axios from 'axios';

/**
 * Utility function to send SMS notifications to users.
 * This is currently a stub that logs to the console.
 * To activate real SMS delivery, uncomment the axios request block and provide your API keys (e.g. Termii, Twilio, Africa's Talking) in your .env file.
 * 
 * @param phone Nigerian phone number (e.g. 08012345678 or +2348012345678)
 * @param message The text message to send
 */
export const sendSMS = async (phone: string, message: string) => {
    console.log(`\n================= SMS DISPATCH =================`);
    console.log(`TO: ${phone}`);
    console.log(`MESSAGE: ${message}`);
    console.log(`STATUS: [Simulated Success - Setup API keys to send real SMS]`);
    console.log(`================================================\n`);

    try {
        /*
        // Example integration using Termii (Popular in Nigeria)
        const TERMII_API_KEY = process.env.TERMII_API_KEY;
        if (!TERMII_API_KEY) {
            console.warn('SMS failed: TERMII_API_KEY is not defined in .env');
            return false;
        }

        // Clean phone number to standard international format without '+' for termii
        // e.g. 08012345678 -> 2348012345678
        let cleanPhone = phone.replace(/[^0-9]/g, '');
        if (cleanPhone.startsWith('0')) {
            cleanPhone = '234' + cleanPhone.substring(1);
        }

        const response = await axios.post('https://api.ng.termii.com/api/sms/send', {
            to: cleanPhone,
            from: "PRESTIGE", // Registered Sender ID
            sms: message,
            type: "plain",
            channel: "generic",
            api_key: TERMII_API_KEY,
        });

        console.log('SMS Sent Successfully via API', response.data);
        return true;
        */
        return true; // Stub return
    } catch (error: any) {
        console.error('Error dispatching SMS:', error?.response?.data || error.message);
        return false;
    }
};
