const os = require('os');

const macAddressCheck = async () => {
    const networkInterfaces = os.networkInterfaces();
    for (const [name, interfaces] of Object.entries(networkInterfaces)) {
        for (const iface of interfaces) {
            if (iface.mac && iface.mac !== '00:00:00:00:00:00') {
                //console.log(`Interface: ${name}, MAC Address: ${iface.mac}`);
                return iface.mac; // Correctly returning the MAC address
            }
        }
    }
};

module.exports = { macAddressCheck };
