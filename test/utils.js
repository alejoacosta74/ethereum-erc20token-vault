module.exports.printEvents = function (title, logs) {
	for (let i=0; i<logs.length; i++){
		console.log(`\n${title} event #${i+1}`);
		console.log(JSON.stringify(logs[i].event, null, 4));
		console.log(JSON.stringify(logs[i].args, null, 4));
	}
}

module.exports.toWei = function (n) {
	   return web3.utils.toWei(n, 'gwei');
	 }