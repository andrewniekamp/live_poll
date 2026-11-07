import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreatePollDto {
  @IsString()
  @IsNotEmpty()
  question: string;
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  options: string[];
}

export class VoteDto {
  @IsUUID()
  participantId: string;

  @IsString()
  optionId: string;
}
