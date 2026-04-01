ServerEvents.recipes(event => {

	
	event.remove({output: 'draconicevolution:draconium_core'})
	event.shaped(
	  Item.of('draconicevolution:draconium_core'), 
	  [
	    'CBC',
		'BAB',
		'CBC'
	  ], 
	  {
		A: 'create:precision_mechanism',
		B: 'minecraft:end_stone',
		C: '#c:ender_pearls'
	  }
	)
	
	
})