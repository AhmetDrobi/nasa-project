const axios = require('axios');

const launches = require('./launches.mongo');
const planets = require('./planets.mongo');

const DEFAULT_FLIGHT_NUMBER = 99;
const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query';

async function populateLaunches() {
	const response = await axios.post(SPACEX_API_URL, {
		query: {},
		options: {
			pagination: false,
			populate: [
				{
					path: 'rocket',
					select: {
						name: 1
					}
				},
				{
					path: 'payloads',
					select: {
						customers: 1
					}
				}
			]
		}
	});

	if (response.status !== 200) {
		console.log('Problem downloading launch data!');
		throw new Error('Launch data download failed');
	}

	const launchDocs = response.data.docs;

	for (const launch of launchDocs) {
		const payloads = launch['payloads'];
		const customers = payloads.flatMap((payload) => {
			return payload['customers'];
		});

		const launchData = {
			flightNumber: launch['flight_number'],
			mission: launch['name'],
			rocket: launch['rocket']['name'],
			launchDate: launch['date_local'],
			upcoming: launch['upcoming'],
			success: launch['success'],
			customers
		};

		console.log(`${launchData.flightNumber} ${launchData.mission}`);

		await saveLaunch(launchData);
	}
}

async function loadLaunchesData() {
	const firstLaunch = await findLaunch({
		flightNumber: 1,
		rocket: 'Falcon 1',
		mission: 'FalconSat',
	});
	if (firstLaunch) {
		console.log('Launch data already loaded');
		return;
	}
	await populateLaunches();
}

async function getLatestFlightNumber() {
	const latestLaunch = await launches
		.findOne()
		.sort('-flightNumber');

	if (!latestLaunch) {
		return DEFAULT_FLIGHT_NUMBER;
	}

	return latestLaunch.flightNumber;
}

async function findLaunch(filter) {
	return await launches.findOne(filter);
}

async function existsLaunchWithId(flightNumber) {
	return await findLaunch({
		flightNumber
	});
}

async function getAllLaunches(skip, limit) {
	return await launches
		.find({}, {
			_id: 0,
			__v: 0,
		})
		.sort({
			flightNumber: 1
		})
		.skip(skip)
		.limit(limit);
}

async function scheduleNewLaunch(launch) {
	const latestFlightNumber = await getLatestFlightNumber();
	const newLaunch = Object.assign(launch, {
		success: true,
		upcoming: true,
		flightNumber: latestFlightNumber + 1,
		customers: ['ZTM', 'NASA'],
	});
	await saveLaunch(newLaunch);
}

async function saveLaunch(launch) {
	const planet = await planets.findOne({
		keplerName: launch.target
	});

	// if (!planet) {
	// 	throw new Error('No matching planet found');
	// }

	await launches.findOneAndUpdate({
			flightNumber: launch.flightNumber
		},
		launch,
		{
			upsert: true
		});
}

async function abortLaunchById(flightNumber) {
	const launchExists = await existsLaunchWithId(flightNumber);
	if (!launchExists) {
		return false;
	}

	const aborted = await launches.updateOne({
		flightNumber
	}, {
		upcoming: false,
		success: false
	});

	return aborted.modifiedCount === 1;
}

module.exports = {
	getAllLaunches,
	scheduleNewLaunch,
	abortLaunchById,
	loadLaunchesData
}