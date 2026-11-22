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
    'forecast.buffer_help': 'Minimum backup cash you want to keep in your box at all times.',
    'forecast.card_gap': 'Cash Gap Ahead',
    'forecast.card_safe': 'Cash Safe',
    'forecast.card_whatif_short':
      'If this happens, you will fall short by ₹{shortfall} on {date}. You will need ₹{extra} extra to pay your bills on time.',
    'forecast.card_whatif_ok': 'Even if this happens, you can pay all your bills on time. Your lowest cash will be ₹{lowest}.',
    'forecast.card_normal_short':
      'Your cash may fall short by ₹{shortfall} on {date}. Collect overdue bills early to cover your expenses.',
    'forecast.card_normal_ok': 'You can pay all your bills on time. Your lowest cash will be ₹{lowest}.',
    'forecast.card_pill': 'Normal: ₹{base} → What-If: ₹{sim}',
  },
  te: {
    'forecast.updating': 'నవీకరిస్తోంది…',
    'forecast.buffer_label': 'సురక్షిత నగదు నిల్వ',
    'forecast.buffer_custom': 'ఇతర సురక్షిత నగదు నిల్వ (₹)',
    'forecast.whatif_short':
      'ఈ దృశ్యంలో {date} నాడు ₹{shortfall} లోటు ఉంటుంది — రాబోయే బిల్లులు కవర్ చేయడానికి సాధారణం కంటే ₹{extra} ఎక్కువ అవసరం.',
    'forecast.whatif_ok':
      'ఈ దృశ్యంలో రాబోయే అన్ని బిల్లులను ఇంకా కవర్ చేయగలరు — మీ అత్యల్ప నగదు ₹{lowest} గా ఉంటుంది (సాధారణం కంటే ₹{diff} తక్కువ).',
    'forecast.buffer_help': 'మీ పెట్టెలో ఎల్లప్పుడూ ఉంచాలనుకునే కనీస బ్యాకప్ నగదు.',
    'forecast.card_gap': 'ముందు నగదు కొరత',
    'forecast.card_safe': 'నగదు సురక్షితం',
    'forecast.card_whatif_short':
      'ఇది జరిగితే, {date} నాడు ₹{shortfall} లోటు ఉంటుంది. మీ బిల్లులు సమయానికి చెల్లించడానికి ₹{extra} అదనంగా కావాలి.',
    'forecast.card_whatif_ok': 'ఇది జరిగినా, మీ బిల్లులన్నీ సమయానికి చెల్లించగలరు. మీ అత్యల్ప నగదు ₹{lowest} గా ఉంటుంది.',
    'forecast.card_normal_short':
      'మీ నగదు {date} నాడు ₹{shortfall} లోటుగా ఉండవచ్చు. మీ ఖర్చులు కవర్ చేయడానికి బకాయి బిల్లులను ముందుగా వసూలు చేయండి.',
    'forecast.card_normal_ok': 'మీ బిల్లులన్నీ సమయానికి చెల్లించగలరు. మీ అత్యల్ప నగదు ₹{lowest} గా ఉంటుంది.',
    'forecast.card_pill': 'సాధారణం: ₹{base} → ఏమైతే: ₹{sim}',
  },
  hi: {
    'forecast.updating': 'अपडेट हो रहा है…',
    'forecast.buffer_label': 'सुरक्षित नकद बफर',
    'forecast.buffer_custom': 'अन्य सुरक्षित नकद बफर (₹)',
    'forecast.whatif_short':
      'इस परिदृश्य में {date} को आपकी ₹{shortfall} की कमी होगी — आने वाले बिल चुकाने के लिए सामान्य से ₹{extra} अधिक चाहिए होगा।',
    'forecast.whatif_ok':
      'इस परिदृश्य में आप अब भी सभी आने वाले बिल चुका सकते हैं — आपका सबसे कम नकद ₹{lowest} रहेगा (सामान्य से ₹{diff} कम)।',
    'forecast.buffer_help': 'आप हर समय अपने पास रखना चाहते हैं वह न्यूनतम बैकअप नकद।',
    'forecast.card_gap': 'आगे नकद की कमी',
    'forecast.card_safe': 'नकद सुरक्षित',
    'forecast.card_whatif_short':
      'अगर ऐसा हुआ, तो {date} को आपकी ₹{shortfall} की कमी होगी। समय पर बिल चुकाने के लिए आपको ₹{extra} अतिरिक्त चाहिए होंगे।',
    'forecast.card_whatif_ok': 'अगर ऐसा हुआ, तब भी आप सभी बिल समय पर चुका सकते हैं। आपका सबसे कम नकद ₹{lowest} रहेगा।',
    'forecast.card_normal_short':
      'आपके नकद में {date} को ₹{shortfall} की कमी हो सकती है। अपने खर्च पूरे करने के लिए बकाया बिल जल्दी वसूलें।',
    'forecast.card_normal_ok': 'आप सभी बिल समय पर चुका सकते हैं। आपका सबसे कम नकद ₹{lowest} रहेगा।',
    'forecast.card_pill': 'सामान्य: ₹{base} → अगर-तो: ₹{sim}',
  },
} as const;
