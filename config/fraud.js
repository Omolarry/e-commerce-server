const SendEmail = require("./email.js");
const geoip = require("geoip-lite");
// Check transaction amount
exports.transactionCheck = async (amount, userId, transactionId) => {
    if (amount > 200) {
        // Flag the transaction and send an email notification to admin
        await SendEmail({
            email: "admin@example.com",
            subject: "Transaction Alert",
            message: `A transaction of $${amount} from user "${userId}" with transaction id "${transactionId}" has been flagged.\nPlease check the system for review.`
        });
        return false;
    } else {
        return true;
    }
};

// Helper function to normalize IP addresses
function normalizeIP(ip) {
    if (!ip) {
        return '';
    }
    if (ip.startsWith('::ffff:')) {
        return ip.substring(7);
    }
    return ip;
}

// Helper function to check if an IP is a loopback address
function isLoopback(ip) {
    return ip === '127.0.0.1' || ip === '::1';
}

// Helper function to check if two IPs are in the same country
function isSameCountry(ip1, ip2) {
    ip1 = normalizeIP(ip1);
    ip2 = normalizeIP(ip2);

    // Check for loopback addresses
    if (isLoopback(ip1) && isLoopback(ip2)) {
        return true;
    }

    const geo1 = geoip.lookup(ip1);
    const geo2 = geoip.lookup(ip2);

    if (geo1 && geo2) {
        return geo1.country === geo2.country;
    } else {
        console.log('Failed to lookup country for one or both IPs:', ip1, ip2);
        return false;
    }
}


// Check login device and IP address
exports.loginCheck = async (signupIP, loginIP, uId) => {
    let ipFlag = false;
    // Check if the login IP is in the same country as the signup IP
    if (!isSameCountry(signupIP, loginIP)) {
        ipFlag = true;
    }

    // Send email if any flag is raised
    if (ipFlag) {
        await SendEmail({
            email: "admin@example.com",
            subject: "Login Alert",
            message: `A login attempt from user with ID: ${uId} has been flagged.\nPlease check the system for review.`
        });
    }

    return !(ipFlag);
};
