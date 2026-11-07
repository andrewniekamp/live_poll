import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PollSchema } from './poll.schema.js';
import { PollsService } from './polls.service.js';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Poll', schema: PollSchema }])],
  providers: [PollsService],
})
export class PollsModule {}
