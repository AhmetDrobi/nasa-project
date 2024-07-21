const request = require('supertest');
const app = require('../../app');
const {
	mongoConnect,
	mongoDisconnect
} = require('../../services/mongo');

describe('Launches API', () => {
	beforeAll(async () => {
		await mongoConnect();
	});

	afterAll(async () => {
		await mongoDisconnect();
	})

	describe('GET /launches', () => {
		test('responds with 200 status', async () => {
			await request(app)
				.get('/v1/launches')
				.expect('Content-Type', /json/)
				.expect(200)
		})
	});


	describe('POST /launches', () => {
		const completeLaunchData = {
			mission: 'USS Enterprise',
			rocket: 'NCC 1701-D',
			target: 'Kepler-62 f',
			launchDate: '2022-11-25'
		};

		const launchDataWithoutDate = {
			mission: 'USS Enterprise',
			rocket: 'NCC 1701-D',
			target: 'Kepler-62 f'
		};

		test('responds with 201 status', async () => {
			const response = await request(app)
				.post('/v1/launches')
				.send(completeLaunchData)
				.expect('Content-Type', /json/)
				.expect(201);

			const requestDate = new Date(completeLaunchData.launchDate).valueOf();
			const responseDate = new Date(response.body.launchDate).valueOf();
			expect(responseDate).toBe(requestDate);

			expect(response.body).toMatchObject(launchDataWithoutDate);
		});

	});
})

