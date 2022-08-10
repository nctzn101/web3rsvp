// import hardhat
	// by default, hardhat will call all functions from the deployer wallet address;
		// to call a function from another wallet: '.connect(address)'
const hre = require("hardhat");

// two async functions
const main = async() => {
	// use hardhat to deploy the contract locally
		// hardhat allows accessing different test wallets to simulate them interacting with the contract
	const rsvpContractFactory = await hre.ethers.getContractFactory("Web3RSVP");
	const rsvpContract = await rsvpContractFactory.deploy();
	await rsvpContract.deployed();
	console.log("Contract deployed to:", rsvpContract.address);

	// get deployer wallet address + two others
	const [deployer, address1, address2] = await hre.ethers.getSigners();

	// create new event
		// first, define the event using mock data
	let deposit = hre.ethers.utils.parseEther("1");
	let maxCapacity = 3;
	let timestamp = 1718926200;
	let eventDataCID = "bafybeibhwfzx6oo5rymsxmkdxpmkfwyvbjrrwcl7cekmbzlupmp5ypkyfi";

		// create the event using the data above
	let txn = await rsvpContract.createNewEvent(
		timestamp,
		deposit, 
		maxCapacity,
		eventDataCID
	);

	let wait = await txn.wait();
	console.log("NEW EVENT CREATED:", wait.events[0].event, wait.events[0].args);

	let eventID = wait.events[0].args.eventID;
	console.log("EVENT ID:", eventID);

	// get all accounts from getSigners to RSVP to the event created above
	txn = await rsvpContract.createNewRSVP(eventID, { value: deposit });
	wait = await txn.wait();
	console.log("NEW RSVP:", wait.events[0].event, wait.events[0].args);

	// RSVP second user
	txn = await rsvpContract.connect(address1).createNewRSVP(eventID, { value: deposit });
	wait = await txn.wait();
	console.log("NEW RSVP:", wait.events[0].event, wait.events[0].args);

	// RSVP third user
	txn = await rsvpContract.connect(address2).createNewRSVP(eventID, { value: deposit });
	wait = await txn.wait();
	console.log("NEW RSVP:", wait.events[0].event, wait.events[0].args);

	// confirm all attendees
	txn = await rsvpContract.confirmAllAttendees(eventID); // called from contract deployer
	wait = await txn.wait();
	wait.events.forEach((event) =>
		console.log("CONFIRMED", event.args.attendeeAddress)
	);

	// withdraw unclaimed deposits [wait for a while - or else it will fail (min 7 days past event to withdraw)]
	await hre.network.provider.send("evm_increaseTime", [15778800000000]);

	txn = await rsvpContract.withdrawUnclaimedDeposits(eventID);
	wait = await txn.wait();
	console.log("WITHDRAWN:", wait.events[0].event, wait.events[0].args);

};

const runMain = async() => {

	try {
		await main();
		process.exit(0);

	} catch (error) {
		console.log(error);
		process.exit(1);
	}

};

runMain();