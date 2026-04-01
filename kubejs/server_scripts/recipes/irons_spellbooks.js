ServerEvents.recipes(event => {

	
	event.remove({output: 'irons_spellbooks:energized_core'})
	event.shaped(
	  Item.of('irons_spellbooks:energized_core'), 
	  [
	    'BBB',
		'BAB',
		'BBB'
	  ], 
	  {
		A: 'eternal_starlight:deepsilver_block',
		B: 'oritech:duratium_ingot'
	  }
	)
	
	
})