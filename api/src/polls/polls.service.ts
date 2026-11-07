import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { HydratedDocument, isObjectIdOrHexString, Model } from 'mongoose';
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
    return toResults(poll);
  }

  async getResults(pollId: string): Promise<PollResults> {
    return toResults(await this.findPoll(pollId));
  }

  async vote(pollId: string, participantId: string, optionId: string): Promise<PollResults> {
    const poll = await this.findPoll(pollId);
    const option = poll.options.id(optionId);
    if (!option) throw new NotFoundException('Option not found');

    poll.votes.set(participantId, option._id); // one entry per participant; voting again overwrites
    await poll.save();
    return toResults(poll);
  }

  private async findPoll(pollId: string) {
    const poll = isObjectIdOrHexString(pollId) ? await this.pollModel.findById(pollId) : null;
    if (!poll) throw new NotFoundException('Poll not found');
    return poll;
  }
}

// Turns a poll document into what the API returns.
function toResults(poll: HydratedDocument<Poll>): PollResults {
  const votes = [...poll.votes.values()].map(String); // every vote's optionId
  return {
    id: String(poll._id),
    question: poll.question,
    closed: poll.closed,
    totalVotes: votes.length,
    options: poll.options.map((o) => ({
      id: String(o._id),
      text: o.text,
      votes: votes.filter((v) => v === String(o._id)).length,
    })),
  };
}
