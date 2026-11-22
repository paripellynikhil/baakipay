// Future Cash page: safe cash buffer control, updating indicator and what-if scenario banner, per language.
export const forecastCash = {
  en: {
    'forecast.updating': 'Updating…',
    'forecast.buffer_label': 'Safe cash buffer',
    'forecast.buffer_custom': 'Custom safe cash buffer in rupees',
    'forecast.whatif_short':
      'In this scenario, you will be short by ₹{shortfall} on {date} — you will need ₹{extra} more than normal to cover your upcoming bills.',
    'forecast.whatif_ok':
      'In this scenario, you can still cover all upcoming bills — your lowest cash stays at ₹{lowest} (₹{diff} lower than normal).',
  },
  te: {
    'forecast.updating': 'నవీకరిస్తోంది…',
    'forecast.buffer_label': 'సురక్షిత నగదు నిల్వ',
    'forecast.buffer_custom': 'ఇతర సురక్షిత నగదు నిల్వ (₹)',
    'forecast.whatif_short':
      'ఈ దృశ్యంలో {date} నాడు ₹{shortfall} లోటు ఉంటుంది — రాబోయే బిల్లులు కవర్ చేయడానికి సాధారణం కంటే ₹{extra} ఎక్కువ అవసరం.',
    'forecast.whatif_ok':
      'ఈ దృశ్యంలో రాబోయే అన్ని బిల్లులను ఇంకా కవర్ చేయగలరు — మీ అత్యల్ప నగదు ₹{lowest} గా ఉంటుంది (సాధారణం కంటే ₹{diff} తక్కువ).',
  },
  hi: {
    'forecast.updating': 'अपडेट हो रहा है…',
    'forecast.buffer_label': 'सुरक्षित नकद बफर',
    'forecast.buffer_custom': 'अन्य सुरक्षित नकद बफर (₹)',
    'forecast.whatif_short':
      'इस परिदृश्य में {date} को आपकी ₹{shortfall} की कमी होगी — आने वाले बिल चुकाने के लिए सामान्य से ₹{extra} अधिक चाहिए होगा।',
    'forecast.whatif_ok':
      'इस परिदृश्य में आप अब भी सभी आने वाले बिल चुका सकते हैं — आपका सबसे कम नकद ₹{lowest} रहेगा (सामान्य से ₹{diff} कम)।',
  },
} as const;
