// Voice-to-bill mic and inline new-customer strings, per language.
export const invoiceQuick = {
  en: {
    'voice.start': 'Speak item',
    'voice.stop': 'Stop',
    'voice.listening': 'Listening… say "Rice 5 400"',
    'voice.notUnderstood': 'Could not understand. Try "Rice 5 400".',
    'voice.error': 'Voice input failed. Try again.',
    'customers.quickAdd': '+ New Customer',
  },
  te: {
    'voice.start': 'వస్తువును చెప్పండి',
    'voice.stop': 'ఆపు',
    'voice.listening': 'వింటున్నాను… "Rice 5 400" అని చెప్పండి',
    'voice.notUnderstood': 'అర్థం కాలేదు. "Rice 5 400" అని ప్రయత్నించండి.',
    'voice.error': 'వాయిస్ ఇన్‌పుట్ విఫలమైంది. మళ్లీ ప్రయత్నించండి.',
    'customers.quickAdd': '+ కొత్త కస్టమర్',
  },
  hi: {
    'voice.start': 'सामान बोलें',
    'voice.stop': 'रोकें',
    'voice.listening': 'सुन रहे हैं… "Rice 5 400" बोलें',
    'voice.notUnderstood': 'समझ नहीं आया। "Rice 5 400" कहकर देखें।',
    'voice.error': 'आवाज़ से इनपुट विफल। फिर से कोशिश करें।',
    'customers.quickAdd': '+ नया ग्राहक',
  },
} as const;
