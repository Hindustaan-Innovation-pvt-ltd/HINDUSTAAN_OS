const parseStandupCommand = (command) => {
  if (!command.trim().startsWith('/standup')) {
    return { isValid: false, yesterday: '', today: '', blockers: '' };
  }
  const body = command.trim().replace(/^\/standup\s*/, '');
  const parts = body.split('|').map(p => p.trim());
  return {
    yesterday: parts[0] || '',
    today: parts[1] || '',
    blockers: parts[2] || '',
    isValid: parts.length === 3
  };
};

const handleWhatsAppWebhook = async (req, res) => {
  try {
    const { from, body } = req.body; 
    
    if (!body) {
      return res.status(400).json({ success: false, message: 'Message body is required.' });
    }

    const parsed = parseStandupCommand(body);
    
    if (!parsed.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid command format. Please use: /standup [done] | [doing] | [blocked]' 
      });
    }

    // In a fully integrated app, this is where we would save to MongoDB.
    // For now, we simulate the successful parsing and response.
    console.log(`\n[WhatsApp Webhook] Received valid standup from ${from || 'Unknown'}`);
    console.log(`Yesterday: ${parsed.yesterday}`);
    console.log(`Today: ${parsed.today}`);
    console.log(`Blockers: ${parsed.blockers}\n`);

    res.status(200).json({
      success: true,
      message: 'Standup successfully parsed and recorded.',
      data: parsed
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  handleWhatsAppWebhook
};
