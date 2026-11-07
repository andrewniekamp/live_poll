import { ConflictException, NotFoundException } from '@nestjs/common';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { Poll, PollSchema } from './poll.schema.js';
import { PollsService } from './polls.service.js';

// Needs the Docker Mongo running (`docker compose up -d`); uses a separate test database.
const TEST_DB = 'mongodb://localhost:27017/live_poll_test';

describe('PollsService', () => {
  let moduleRef: TestingModule;
  let service: PollsService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(TEST_DB),
        MongooseModule.forFeature([{ name: 'Poll', schema: PollSchema }]),
      ],
      providers: [PollsService],
    }).compile();
    service = moduleRef.get(PollsService);
  });

  beforeEach(async () => {
    await moduleRef.get<Model<Poll>>(getModelToken('Poll')).deleteMany({});
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('creates an open poll with zero votes', async () => {
    const poll = await service.create('Question?', ['A', 'B']);

    expect(poll.question).toBe('Question?');
    expect(poll.closed).toBe(false);
    expect(poll.totalVotes).toBe(0);
    expect(poll.options.map((o) => o.votes)).toEqual([0, 0]);
  });

  it('fetches results for an existing poll', async () => {
    const created = await service.create('Question?', ['A', 'B']);

    const results = await service.getResults(created.id);

    expect(results).toEqual(created);
  });

  it('rejects an unknown poll id', async () => {
    await expect(service.getResults('unknown')).rejects.toThrow(
      NotFoundException,
    );
  });

  describe('vote', () => {
    it('counts a vote', async () => {
      const poll = await service.create('Question?', ['A', 'B']);
      const [a] = poll.options;

      const results = await service.vote(poll.id, 'p1', a.id);

      expect(results.options.map((o) => o.votes)).toEqual([1, 0]);
      expect(results.totalVotes).toBe(1);
    });

    it('adds up votes from different participants', async () => {
      const poll = await service.create('Question?', ['A', 'B']);
      const [a] = poll.options;

      await service.vote(poll.id, 'p1', a.id);
      const results = await service.vote(poll.id, 'p2', a.id);

      expect(results.options.map((o) => o.votes)).toEqual([2, 0]);
    });

    it('moves a changed vote instead of adding another', async () => {
      const poll = await service.create('Question?', ['A', 'B']);
      const [a, b] = poll.options;

      await service.vote(poll.id, 'p1', a.id);
      const results = await service.vote(poll.id, 'p1', b.id);

      expect(results.options.map((o) => o.votes)).toEqual([0, 1]);
      expect(results.totalVotes).toBe(1);
    });
  });

  describe('close', () => {
    it('closes a poll', async () => {
      const poll = await service.create('Question?', ['A', 'B']);

      const results = await service.close(poll.id);

      expect(results.closed).toBe(true);
    });

    it('rejects votes on a closed poll and keeps the results', async () => {
      const poll = await service.create('Question?', ['A', 'B']);
      const [a, b] = poll.options;
      await service.vote(poll.id, 'p1', a.id);
      await service.close(poll.id);

      await expect(service.vote(poll.id, 'p1', b.id)).rejects.toThrow(
        ConflictException,
      );
      expect(
        (await service.getResults(poll.id)).options.map((o) => o.votes),
      ).toEqual([1, 0]);
    });
  });
});
