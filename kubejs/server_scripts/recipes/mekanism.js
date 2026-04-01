ServerEvents.recipes(event => {

	
	event.remove({output: 'mekanism:teleportation_core'})
	event.shaped(
	  Item.of('mekanism:teleportation_core'), 
	  [
	    'DCD',
		'BAB',
		'DCD'
	  ], 
	  {
		A: 'aether:zanite_gemstone',
		B: 'aether:ambrosium_shard',
		C: 'mekanism:alloy_atomic',
		D: 'aether:enchanted_gravitite'
	  }
	)
	
	
})