/**
 *Neuroevolution and genetic algorithms.
 *
 * @param {options} 
 */
var Neuroevolution = function (options) {
	var trueSpriteBrain = this; 
	
	trueSpriteBrain.options = {
		
		activation: function (a) {
			ap = (-a) / 1;
			return (1 / (1 + Math.exp(ap)))
		},

		/**
		 * Returns a random value between -1 and 1.
		 *
		 * @return Random value.
		 */
		randomClamped: function () {
			return Math.random() * 2 - 1;
		},

		// various factors and parameters (along with default values).
		network: [1, [1], 1], // Perceptron network structure (1 hidden
		// layer).
		population: 50, // Population by generation.
		elitism: 0.2, // Best networks kepts unchanged for the next
		// generation (rate).
		randomBehaviour: 0.2, // New random networks for the next generation
		// (rate).
		mutationRate: 0.1, // Mutation rate on the weights of synapses.
		mutationRange: 0.5, // Interval of the mutation changes on the
		// synapse weight.
		historic: 0, // Latest generations saved.
		lowHistoric: false, // Only save score (not the network).
		scoreSort: -1, // Sort order (-1 = desc, 1 = asc).
		nbChild: 1 // Number of children by breeding.

	}

	/**
	 * Override default options.
	 *
	 * @param {options} An object of Neuroevolution options.
	 * @return void
	 */
	trueSpriteBrain.set = function (options) {
		for (var i in options) {
			if (this.options[i] != undefined) { // Only override if the passed in value
				// is actually defined.
				trueSpriteBrain.options[i] = options[i];
			}
		}
	}

	// Overriding default options with the pass in options
	trueSpriteBrain.set(options);


	
	
	var artificialNeuron = function () {
		this.value = 0;
		this.weights = [];
	}

	
	artificialNeuron.prototype.populate = function (genChild) {
		this.weights = [];
		for (var i = 0; i < genChild; i++) {
			this.weights.push(trueSpriteBrain.options.randomClamped());
		}
	}


	
	var neuralNetwork = function (index) {
		this.id = index || 0;
		this.artificialNeurons = [];
	}


	neuralNetwork.prototype.populate = function (nbartificialNeurons, nbInputs) {
		this.artificialNeurons = [];
		for (var i = 0; i < nbartificialNeurons; i++) {
			var n = new artificialNeuron();
			n.populate(nbInputs);
			this.artificialNeurons.push(n);
		}
	}


	
	var Network = function () {
		this.layers = [];
	}

	
	Network.prototype.perceptronGeneration = function (input, hiddens, output) {
		var index = 0;
		var previousartificialNeurons = 0;
		var layer = new neuralNetwork(index);
		layer.populate(input, previousartificialNeurons); // Number of Inputs will be set to
		// 0 since it is an input layer.
		previousartificialNeurons = input; // number of input is size of previous layer.
		this.layers.push(layer);
		index++;
		for (var i in hiddens) {
			// Repeat same process as first layer for each hidden layer.
			var layer = new neuralNetwork(index);
			layer.populate(hiddens[i], previousartificialNeurons);
			previousartificialNeurons = hiddens[i];
			this.layers.push(layer);
			index++;
		}
		var layer = new neuralNetwork(index);
		layer.populate(output, previousartificialNeurons); // Number of input is equal to
		// the size of the last hidden
		// layer.
		this.layers.push(layer);
	}

	
	Network.prototype.getSave = function () {
		var datas = {
			artificialNeurons: [], // Number of artificialNeurons per layer.
			weights: [] // Weights of each artificialNeuron's inputs.
		};

		for (var i in this.layers) {
			datas.artificialNeurons.push(this.layers[i].artificialNeurons.length);
			for (var j in this.layers[i].artificialNeurons) {
				for (var k in this.layers[i].artificialNeurons[j].weights) {
					// push all input weights of each artificialNeuron of each neuralNetwork into a flat
					// array.
					datas.weights.push(this.layers[i].artificialNeurons[j].weights[k]);
				}
			}
		}
		return datas;
	}

	
	Network.prototype.setSave = function (save) {
		var previousartificialNeurons = 0;
		var index = 0;
		var indexWeights = 0;
		this.layers = [];
		for (var i in save.artificialNeurons) {
			// Create and populate layers.
			var layer = new neuralNetwork(index);
			layer.populate(save.artificialNeurons[i], previousartificialNeurons);
			for (var j in layer.artificialNeurons) {
				for (var k in layer.artificialNeurons[j].weights) {
					// Apply artificialNeurons weights to each artificialNeuron.
					layer.artificialNeurons[j].weights[k] = save.weights[indexWeights];

					indexWeights++; // Increment index of flat array.
				}
			}
			previousartificialNeurons = save.artificialNeurons[i];
			index++;
			this.layers.push(layer);
		}
	}

	
	Network.prototype.compute = function (inputs) {
		// Set the value of each artificialNeuron in the input layer.
		for (var i in inputs) {
			if (this.layers[0] && this.layers[0].artificialNeurons[i]) {
				this.layers[0].artificialNeurons[i].value = inputs[i];
			}
		}

		var prevLayer = this.layers[0]; // Previous layer is input layer.
		for (var i = 1; i < this.layers.length; i++) {
			for (var j in this.layers[i].artificialNeurons) {
				// For each artificialNeuron in each layer.
				var sum = 0;
				for (var k in prevLayer.artificialNeurons) {
					// Every artificialNeuron in the previous layer is an input to each artificialNeuron in
					// the next layer.
					sum += prevLayer.artificialNeurons[k].value *
						this.layers[i].artificialNeurons[j].weights[k];
				}

				// Compute the activation of the artificialNeuron.
				this.layers[i].artificialNeurons[j].value = trueSpriteBrain.options.activation(sum);
			}
			prevLayer = this.layers[i];
		}

		// All outputs of the Network.
		var out = [];
		var lastLayer = this.layers[this.layers.length - 1];
		for (var i in lastLayer.artificialNeurons) {
			out.push(lastLayer.artificialNeurons[i].value);
		}
		return out;
	}


	
	var Genome = function (score, network) {
		this.score = score || 0;
		this.network = network || null;
	}


	
	var newGenNum = function () {
		this.genomes = [];
	}

	
	newGenNum.prototype.addGenome = function (genome) {
		// Locate position to insert Genome into.
		// The gnomes should remain sorted.
		for (var i = 0; i < this.genomes.length; i++) {
			// Sort in descending order.
			if (trueSpriteBrain.options.scoreSort < 0) {
				if (genome.score > this.genomes[i].score) {
					break;
				}
				// Sort in ascending order.
			} else {
				if (genome.score < this.genomes[i].score) {
					break;
				}
			}

		}

		// Insert genome into correct position.
		this.genomes.splice(i, 0, genome);
	}

	
	newGenNum.prototype.breed = function (g1, g2, nbChilds) {
		var datas = [];
		for (var genChild = 0; genChild < nbChilds; genChild++) {
			// Deep clone of genome 1.
			var data = JSON.parse(JSON.stringify(g1));
			for (var i in g2.network.weights) {
				// Genetic crossover
				// 0.5 is the crossover factor.
				// FIXME Really should be a predefined constant.
				if (Math.random() <= 0.5) {
					data.network.weights[i] = g2.network.weights[i];
				}
			}

			
			for (var i in data.network.weights) {
				if (Math.random() <= trueSpriteBrain.options.mutationRate) {
					data.network.weights[i] += Math.random() *
						trueSpriteBrain.options.mutationRange *
						2 -
						trueSpriteBrain.options.mutationRange;
				}
			}
			datas.push(data);
		}

		return datas;
	}

	
	newGenNum.prototype.generateNextGeneration = function () {
		var nexts = [];

		for (var i = 0; i < Math.round(trueSpriteBrain.options.elitism *
				trueSpriteBrain.options.population); i++) {
			if (nexts.length < trueSpriteBrain.options.population) {
				// Push a deep copy of ith Genome's Nethwork.
				nexts.push(JSON.parse(JSON.stringify(this.genomes[i].network)));
			}
		}

		for (var i = 0; i < Math.round(trueSpriteBrain.options.randomBehaviour *
				trueSpriteBrain.options.population); i++) {
			var n = JSON.parse(JSON.stringify(this.genomes[0].network));
			for (var k in n.weights) {
				n.weights[k] = trueSpriteBrain.options.randomClamped();
			}
			if (nexts.length < trueSpriteBrain.options.population) {
				nexts.push(n);
			}
		}

		var max = 0;
		while (true) {
			for (var i = 0; i < max; i++) {
				// Create the children and push them to the nexts array.
				var childs = this.breed(this.genomes[i], this.genomes[max],
					(trueSpriteBrain.options.nbChild > 0 ? trueSpriteBrain.options.nbChild : 1));
				for (var c in childs) {
					nexts.push(childs[c].network);
					if (nexts.length >= trueSpriteBrain.options.population) {
						// Return once number of children is equal to the
						// population by generatino value.
						return nexts;
					}
				}
			}
			max++;
			if (max >= this.genomes.length - 1) {
				max = 0;
			}
		}
	}


	
	var genNumberGen = function () {
		this.generations = [];
		var currentGeneration = new newGenNum();
	}

	genNumberGen.prototype.firstGeneration = function (input, hiddens, output) {
		// FIXME input, hiddens, output unused.

		var out = [];
		for (var i = 0; i < trueSpriteBrain.options.population; i++) {
			// Generate the Network and save it.
			var neuralNetv = new Network();
			neuralNetv.perceptronGeneration(trueSpriteBrain.options.network[0],
				trueSpriteBrain.options.network[1],
				trueSpriteBrain.options.network[2]);
			out.push(neuralNetv.getSave());
		}

		this.generations.push(new newGenNum());
		return out;
	}

	
	genNumberGen.prototype.nextGeneration = function () {
		if (this.generations.length == 0) {
			// Need to create first generation.
			return false;
		}

		var gen = this.generations[this.generations.length - 1]
			.generateNextGeneration();
		this.generations.push(new newGenNum());
		return gen;
	}

	
	genNumberGen.prototype.addGenome = function (genome) {
		// Can't add to a newGenNum if there are no genNumberGen.
		if (this.generations.length == 0) return false;

		// FIXME addGenome returns void.
		return this.generations[this.generations.length - 1].addGenome(genome);
	}


	
	trueSpriteBrain.generations = new genNumberGen();

	
	trueSpriteBrain.restart = function () {
		trueSpriteBrain.generations = new genNumberGen();
	}

	
	trueSpriteBrain.nextGeneration = function () {
		var networks = [];

		if (trueSpriteBrain.generations.generations.length == 0) {
			// If no genNumberGen, create first.
			networks = trueSpriteBrain.generations.firstGeneration();
		} else {
			// Otherwise, create next one.
			networks = trueSpriteBrain.generations.nextGeneration();
		}

		// Create Networks from the current newGenNum.
		var nns = [];
		for (var i in networks) {
			var neuralNetv = new Network();
			neuralNetv.setSave(networks[i]);
			nns.push(neuralNetv);
		}

		if (trueSpriteBrain.options.lowHistoric) {
			// Remove old Networks.
			if (trueSpriteBrain.generations.generations.length >= 2) {
				var genomes =
					trueSpriteBrain.generations
					.generations[trueSpriteBrain.generations.generations.length - 2]
					.genomes;
				for (var i in genomes) {
					delete genomes[i].network;
				}
			}
		}

		if (trueSpriteBrain.options.historic != -1) {
			// Remove older generations.
			if (trueSpriteBrain.generations.generations.length > trueSpriteBrain.options.historic + 1) {
				trueSpriteBrain.generations.generations.splice(0,
					trueSpriteBrain.generations.generations.length - (trueSpriteBrain.options.historic + 1));
			}
		}

		return nns;
	}

	
	trueSpriteBrain.networkScore = function (network, score) {
		trueSpriteBrain.generations.addGenome(new Genome(score, network.getSave()));
	}
}
