miniLock.templates = {}

miniLock.templates.keyStrengthMoreInfo = 'The key you have entered is too weak.'
	+ '<p>Having a long, unique key is very important for using miniLock. '
	+ 'Try using a <strong>phrase</strong> that makes sense only to you.<br /><br />'
	+ 'We strongly recommend allowing miniLock to generate a key for you:<br />'
	+ '<input type="text" value="{{phrase}}" spellcheck="false" readonly="readonly" />'
	+ '<input type="button" value="Get another phrase" /></p>'

miniLock.templates.recipient = '<input type="text" val="" placeholder="Recipient\'s miniLock ID" />'
