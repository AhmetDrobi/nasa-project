const DEFAULT_PAGE_LIMIT = 0;
const DEFAULT_PAGE_NUMBER = 1;

function getPagination(query) {
	const limit = Math.abs(query.limit) || DEFAULT_PAGE_NUMBER;
	const page = Math.abs(query.page) || DEFAULT_PAGE_LIMIT;
	let skip = (page - 1) * limit;
	skip = skip < 0 ? 0 : skip;

	return {
		limit,
		skip
	};
}

module.exports = {
	getPagination
}