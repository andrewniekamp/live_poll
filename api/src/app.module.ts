import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PollsModule } from './polls/polls.module.js';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI ?? 'mongodb://localhost:27017/live_poll',
    ),
    PollsModule,
  ],
})
export class AppModule {}
