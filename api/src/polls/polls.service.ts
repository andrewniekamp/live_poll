import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isObjectIdOrHexString, Model, Types } from 'mongoose';
import type { Poll } from './poll.schema.js';

// What the API returns for a poll.
export interface PollResults {
  id: string;
  question: string;
  closed: boolean;
  totalVotes: number;
  options: { id: string; text: string; votes: number }[];
}

@Injectable()
export class PollsService {
  constructor(@InjectModel('Poll') private readonly pollModel: Model<Poll>) {}

  async create(question: string, options: string[]): Promise<PollResults> {
    const poll = await this.pollModel.create({
      question,
      options: options.map((text) => ({ text })),
    });
    return this.getResults(poll.id);
  }

  async getResults(pollId: string): Promise<PollResults> {
    if (!isObjectIdOrHexString(pollId)) throw new NotFoundException('Poll not found');
    const id = new Types.ObjectId(pollId);

    // The poll without voter ids.
    const poll = await this.pollModel.findById(id, { votes: 0 }).lean();
    if (!poll) throw new NotFoundException('Poll not found');

    // Count votes per option in the database to group.
    const counts = await this.pollModel.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { _id: id } },
      { $unwind: '$votes' },
      { $group: { _id: '$votes.optionId', count: { $sum: 1 } } },
    ]);
    const countByOption = new Map(counts.map((c) => [String(c._id), c.count]));

    // Start from the poll's options so options with zero votes are included.
    const options = poll.options.map((o) => ({
      id: String(o._id),
      text: o.text,
      votes: countByOption.get(String(o._id)) ?? 0,
    }));

    return {
      id: String(poll._id),
      question: poll.question,
      closed: poll.closed,
      totalVotes: options.reduce((sum, o) => sum + o.votes, 0),
      options,
    };
  }
}
