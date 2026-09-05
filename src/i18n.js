// Zikriyon Fyber Connect — minimal i18n
// Villagers reading this may be more comfortable in Hindi than English.
// Kept small and flat on purpose — only the user-facing strings that
// matter for reading the instrument panel, not the whole admin console
// (admin operators are assumed comfortable with English/technical terms).

export const STRINGS = {
  en: {
    selectStation: "Select your village station",
    temperature: "Temperature",
    humidity: "Humidity",
    pressure: "Pressure",
    battery: "Battery",
    soilMoisture: "Soil moisture",
    rainStatus: "Rain",
    rainDetected: "Detected",
    rainNotDetected: "Not detected",
    lastUpdated: "Last updated",
    noData: "No data received yet from this station",
    allClear: "All clear — station operating normally",
    pressureTrend: "Pressure trend (last 20 min)",
    noAlerts: "No active alerts",
    activeAlerts: "Active alerts",
    sensorFault: "sensor fault",
    justNow: "just now",
    minutesAgo: "min ago",
    hoursAgo: "hr ago",
    stationOffline: "This station hasn't reported in a while — data below may be old",
  },
  hi: {
    selectStation: "अपना गाँव का स्टेशन चुनें",
    temperature: "तापमान",
    humidity: "नमी",
    pressure: "दबाव",
    battery: "बैटरी",
    soilMoisture: "मिट्टी की नमी",
    rainStatus: "बारिश",
    rainDetected: "पता चला",
    rainNotDetected: "नहीं",
    lastUpdated: "आखिरी अपडेट",
    noData: "इस स्टेशन से अभी तक कोई डेटा नहीं मिला",
    allClear: "सब ठीक है — स्टेशन सामान्य रूप से काम कर रहा है",
    pressureTrend: "दबाव का रुझान (पिछले 20 मिनट)",
    noAlerts: "कोई सक्रिय चेतावनी नहीं",
    activeAlerts: "सक्रिय चेतावनियाँ",
    sensorFault: "सेंसर में खराबी",
    justNow: "अभी",
    minutesAgo: "मिनट पहले",
    hoursAgo: "घंटे पहले",
    stationOffline: "इस स्टेशन से कुछ समय से कोई रिपोर्ट नहीं आई — नीचे का डेटा पुराना हो सकता है",
  },
};

export function t(lang, key) {
  return (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key;
}
