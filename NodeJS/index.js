// @ts-check

const express = require('express');
const app = express();
const port = 3000;

/**
 * @typedef {object} Ride
 * @property {string} name 
 * @property {string} phoneNum
 * @property {string} origin
 * @property {string} destination
 * @property {string} date
 * @property {object} [reference]
 */

/** @enum {string} */
const riderTypes = {
	driver: '/drivers',
	passenger: '/passengers',
}

/** @typedef {string} uid */
/** @type {Map<uid, Ride>} */
let passengers = new Map();
/** @type {Map<uid, Ride>} */
let drivers = new Map();

app.use(express.json()) // for parsing application/json

app.get(riderTypes.driver, getHandler);

app.post(riderTypes.driver, postHandler);
app.post(riderTypes.passenger, postHandler);

app.delete(`${riderTypes.driver}`, deleteHandler);
app.delete(`${riderTypes.passenger}`, deleteHandler);

app.listen(port, function() {
  	console.log(`Server running on port ${port}`);
});

function postHandler(req, res) {
	
	const { name, phoneNum, origin, destination, date } = req.body;

	// TODO: check if all variables are set and respond w/ an error code otherswise
	
	const headers = {
	  'Content-Type': 'text/event-stream',
	  'Connection': 'keep-alive',
	  'Cache-Control': 'no-cache'
	};
	res.writeHead(200, headers);
  
	const uid = Date.now().toString();

	const newRide = {
		name: name,
		phoneNum: phoneNum,
		origin: origin,
		destination: destination,
		date: date,
		reference: res
	};
	
	if (req.path === riderTypes.driver) {
		drivers.set(uid, newRide);

		const data = `data: ${uid}\n\n`;
		res.write(data);
		
		for (const [key, ride] of passengers) {
			if (ride.origin !== origin) continue;
			if (ride.destination !== destination) continue;
			if (ride.date !== date) continue;
			const dataPassenger = `data: Found new match: ${name} - ${phoneNum}\n\n`;
			ride.reference.write(dataPassenger);
			const dataDriver = `data: Found new match: ${ride.name} - ${ride.phoneNum}\n\n`;
			res.write(dataDriver);
		}
	} else if (req.path === riderTypes.passenger) {
		passengers.set(uid, newRide);

		const data = `data: ${uid}\n\n`;
		res.write(data);
		
		for (const [key, ride] of drivers) {
			if (ride.origin !== origin) continue;
			if (ride.destination !== destination) continue;
			if (ride.date !== date) continue;
			const dataDriver = `data: Found new match: ${name} - ${phoneNum}\n\n`;
			ride.reference.write(dataDriver);
			const dataPassenger = `data: Found new match: ${ride.name} - ${ride.phoneNum}\n\n`;
			res.write(dataPassenger);
		}
	}
  
	req.on('close', () => {
		const _uid = uid;
		console.log(`Connection closed: ${_uid}`);
		const rideType = req.path;
		if (rideType === riderTypes.driver) {
			drivers.delete(_uid);
		} else if (rideType === riderTypes.passenger) {
			passengers.delete(_uid);
		}
	});
}

function deleteHandler(req, res) {
	const { uid } = req.query;

	console.log(`Deleting UID: ${uid}`)
	
	if (req.path === riderTypes.driver) {
		drivers.delete(uid);
		console.log(`Size after deleting: ${drivers.size}`)
	} else if (req.path === riderTypes.passenger) {
		passengers.delete(uid);
		console.log(`Size after deleting: ${passengers.size}`)
	}

	res.end();
	
}

function getHandler(req, res) {
	const {origin, destination, date} = req.query;

	// TODO: check if all variables are set and respond w/ an error code otherswise
	
	/** @type {Ride[]} */
	let ridesResponse = []

	for (const [uid, ride] of drivers) {
		if (ride.origin !== origin) continue;
		if (ride.destination !== destination) continue;
		if (ride.date !== date) continue;
		const response = {
			name: ride.name,
			phoneNum: ride.phoneNum,
			origin: ride.origin,
			destination: ride.destination,
			date: ride.date
		}
		ridesResponse.push(response);
	}

	res.json(ridesResponse);
}
  