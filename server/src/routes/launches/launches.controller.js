const {
	getAllLaunches,
	abortLaunchById,
	scheduleNewLaunch
} = require('../../models/launches.model');
const {getPagination} = require('../../services/query');

async function httpGetAllLaunches(req, res) {
	const {limit, skip} = getPagination(req.query)
	const launches = await getAllLaunches(skip, limit);
	return res.status(200).json(launches);
}

async function httpAddNewLaunch(req, res) {
	const launch = req.body;
	launch.launchDate = new Date(launch.launchDate);
	await scheduleNewLaunch(launch);
	return res.status(201).json(launch);
}

async function httpAbortLaunch(req, res) {
	const launchId = Number(req.params.id);

	const aborted = await abortLaunchById(launchId);
	if (!aborted) {
		return res.status(400).json({
			error: 'Launch not aborted',
		});
	}
	return res.status(200).json({
		ok: true
	});
}

module.exports = {
	httpGetAllLaunches,
	httpAddNewLaunch,
	httpAbortLaunch
}