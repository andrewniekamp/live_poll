import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Sse,
} from '@nestjs/common';
import { PollsService } from './polls.service.js';
import { CreatePollDto, VoteDto } from './polls.dto.js';
import { map, Observable } from 'rxjs';

// Controller should be kept light, business logic belongs in services
@Controller('polls')
export class PollsController {
  constructor(private readonly polls: PollsService) {}

  @Post()
  create(@Body() body: CreatePollDto) {
    return this.polls.create(body.question, body.options);
  }

  @Get(':id')
  getResults(@Param('id') id: string) {
    return this.polls.getResults(id);
  }

  @Post(':id/votes')
  vote(@Param('id') id: string, @Body() body: VoteDto) {
    return this.polls.vote(id, body.participantId, body.optionId);
  }

  @Post(':id/close')
  @HttpCode(200) // Since nothing new is created, return 200 instead of 201
  close(@Param('id') id: string) {
    return this.polls.close(id);
  }

  @Sse(':id/stream')
  stream(@Param('id') id: string): Observable<MessageEvent> {
    return this.polls
      .resultsStream(id)
      .pipe(map((data) => ({ data }) as MessageEvent));
  }
}
